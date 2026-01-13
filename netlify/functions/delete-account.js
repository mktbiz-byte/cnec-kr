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

    // 2. 개인정보 익명화 - 비즈니스 데이터(영상, 지원서 등)는 보존
    // 스키마가 ON DELETE CASCADE로 설정되어 있어서 Auth 삭제 시 모든 데이터가 삭제됨
    // 따라서 소프트 삭제 방식 사용: Auth는 유지하되 로그인 불가 + 개인정보 익명화
    console.log(`사용자 ${userId} 개인정보 익명화 시작`)

    // user_profiles 개인정보 익명화 (실제 존재하는 컬럼만)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        name: '탈퇴한 사용자',
        phone: null,
        bio: null,
        bank_name: null,
        bank_account_number: null,
        bank_account_holder: null,
        resident_number_encrypted: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        other_sns_url: null
      })
      .eq('id', userId)

    if (profileUpdateError) {
      console.log('user_profiles 익명화 오류:', profileUpdateError.message)
    } else {
      console.log('user_profiles 익명화 완료')
    }

    // 3. Auth 사용자 비활성화 (이메일/비밀번호 변경으로 로그인 차단)
    // 완전 삭제 시 ON DELETE CASCADE로 비즈니스 데이터가 모두 삭제되므로 소프트 삭제 사용
    const deletedEmail = `deleted_${userId}@deleted.local`
    const randomPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: deletedEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { deleted: true, deleted_at: new Date().toISOString() }
    })

    if (updateAuthError) {
      console.error('Auth 사용자 비활성화 오류:', updateAuthError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: '회원 탈퇴 처리 중 오류가 발생했습니다.',
          details: updateAuthError.message
        })
      }
    }

    console.log('Auth 사용자 비활성화 완료 (로그인 차단)')

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
