const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const { user_id, amount, reason, admin_id } = JSON.parse(event.body)

    if (!user_id || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'user_id와 amount가 필요합니다' })
      }
    }

    // 서비스 역할로 Supabase 클라이언트 생성 (RLS 우회)
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. 현재 포인트 조회
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('points, name, email')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('프로필 조회 오류:', profileError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: '사용자 정보를 찾을 수 없습니다' })
      }
    }

    const currentPoints = profileData?.points || 0
    const newPoints = currentPoints + amount

    // 2. 포인트 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ points: newPoints })
      .eq('id', user_id)

    if (updateError) {
      console.error('포인트 업데이트 오류:', updateError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: '포인트 업데이트에 실패했습니다' })
      }
    }

    // 3. 환불 기록 추가
    const { error: txError } = await supabaseAdmin
      .from('point_transactions')
      .insert({
        user_id: user_id,
        amount: amount,
        transaction_type: 'refund',
        description: `[출금거절] ${amount.toLocaleString()}원 환불 - ${reason || '관리자 거절'}`
      })

    if (txError) {
      console.error('거래 기록 오류:', txError)
      // 거래 기록 실패해도 환불은 성공으로 처리
    }

    console.log('포인트 환불 완료:', {
      user_id,
      userName: profileData.name,
      previousPoints: currentPoints,
      refundAmount: amount,
      newPoints,
      reason
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          user_id,
          previousPoints: currentPoints,
          refundAmount: amount,
          newPoints
        }
      })
    }

  } catch (error) {
    console.error('환불 처리 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
