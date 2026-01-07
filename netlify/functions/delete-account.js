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

    // 환경변수 확인
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase 환경변수 누락')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '서버 설정 오류입니다.' })
      }
    }

    // 일반 클라이언트로 토큰 검증
    const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
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

    // 탈퇴 기록 저장 (선택사항 - 테이블이 있는 경우)
    try {
      await supabaseAdmin.from('account_deletions').insert({
        user_id: userId,
        email: user.email,
        reason: reason || '미선택',
        details: details || '',
        deleted_at: new Date().toISOString()
      })
    } catch (logError) {
      // 테이블이 없어도 계속 진행
      console.log('탈퇴 기록 저장 실패 (테이블 없음 가능):', logError.message)
    }

    // 1. 관련 데이터 삭제 (user_profiles, applications 등은 CASCADE로 자동 삭제됨)
    // 포인트가 있는 경우 처리 (선택사항)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (profile?.points > 0) {
      console.log(`주의: 사용자 ${userId}의 미출금 포인트: ${profile.points}`)
    }

    // 2. Auth 사용자 삭제 (CASCADE로 user_profiles도 삭제됨)
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
