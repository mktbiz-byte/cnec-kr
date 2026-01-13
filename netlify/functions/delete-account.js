/**
 * 회원 탈퇴 처리 Netlify Function
 * Service Role Key를 사용하여 사용자 계정 삭제
 */

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const { userId, reason, details } = JSON.parse(event.body)

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '사용자 ID가 필요합니다.' })
      }
    }

    // Authorization 헤더에서 토큰 확인
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '인증이 필요합니다.' })
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // 환경변수 확인 (VITE_ 접두사와 일반 변수 모두 지원)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Supabase 환경변수 누락:', {
        url: !!supabaseUrl,
        anon: !!supabaseAnonKey,
        service: !!supabaseServiceKey
      })
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '서버 설정 오류입니다.' })
      }
    }

    // 일반 클라이언트로 토큰 검증
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '유효하지 않은 인증입니다.' })
      }
    }

    // 요청한 사용자와 삭제 대상이 같은지 확인
    if (user.id !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: '다른 사용자의 계정은 삭제할 수 없습니다.' })
      }
    }

    // Service Role Key로 관리자 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 사용자 정보 미리 저장 (탈퇴 기록용)
    const userEmail = user.email
    const deletionReason = reason || '미선택'
    const deletionDetails = details || ''

    // 1. 포인트 확인
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (profile?.points > 0) {
      console.log(`주의: 사용자 ${userId}의 미출금 포인트: ${profile.points}`)
    }

    // 2. 개인정보만 삭제/익명화 - 비즈니스 데이터(영상, 지원서 등)는 보존
    // 기업이 구매한 영상 데이터는 삭제하면 안 됨
    console.log(`사용자 ${userId} 개인정보 처리 시작`)

    // 개인정보 관련 데이터만 삭제 (비즈니스 데이터는 보존)
    const tablesToDelete = [
      { name: 'notifications', column: 'user_id' },
      { name: 'ai_guide_requests', column: 'user_id' },
      { name: 'guide_feedbacks', column: 'user_id' },
    ]

    for (const table of tablesToDelete) {
      const { error } = await supabaseAdmin
        .from(table.name)
        .delete()
        .eq(table.column, userId)
      if (error) {
        console.log(`${table.name} 삭제 오류 (무시):`, error.message)
      } else {
        console.log(`${table.name} 삭제 완료`)
      }
    }

    // user_profiles 개인정보 익명화 (프로필은 삭제하지 않고 익명화)
    // 이렇게 하면 기존 applications, video_submissions 등의 FK 참조가 유지됨
    const { error: profileUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        name: '탈퇴한 사용자',
        phone: null,
        email: null,
        profile_image_url: null,
        bank_name: null,
        bank_account: null,
        bank_holder: null,
        address: null,
        detailed_address: null,
        zip_code: null,
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileUpdateError) {
      console.log('user_profiles 익명화 오류 (무시):', profileUpdateError.message)
    } else {
      console.log('user_profiles 익명화 완료')
    }

    console.log(`사용자 ${userId} 개인정보 처리 완료, Auth 사용자 삭제 시작`)

    // 비즈니스 데이터(applications, video_submissions, withdrawals 등)는 보존
    // 영상 파일도 삭제하지 않음 - 기업이 구매한 자산이므로

    // 4. Auth 사용자 삭제
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('사용자 삭제 오류:', deleteError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: '회원 탈퇴 처리 중 오류가 발생했습니다.',
          details: deleteError.message
        })
      }
    }

    // 5. 탈퇴 기록 저장 (Auth 삭제 후 - user_id 없이 저장)
    try {
      await supabaseAdmin.from('account_deletions').insert({
        email: userEmail,
        reason: deletionReason,
        details: deletionDetails,
        deleted_at: new Date().toISOString()
      })
      console.log('탈퇴 기록 저장 완료')
    } catch (logError) {
      // 테이블이 없어도 계속 진행
      console.log('탈퇴 기록 저장 실패 (무시):', logError.message)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '회원 탈퇴가 완료되었습니다.'
      })
    }

  } catch (error) {
    console.error('회원 탈퇴 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '회원 탈퇴 처리 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}
