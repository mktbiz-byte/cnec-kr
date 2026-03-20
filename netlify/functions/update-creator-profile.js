const { createClient } = require('@supabase/supabase-js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body)
    const {
      user_id,
      threads_username,
      x_username
    } = body

    if (!user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'user_id는 필수입니다.' })
      }
    }

    // BIZ DB 접속
    const supabaseUrl = process.env.VITE_SUPABASE_BIZ_URL
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_ROLE_KEY

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // featured_creators 테이블에 UPSERT
    const { data: existing } = await supabaseBiz
      .from('featured_creators')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      const { error: updateError } = await supabaseBiz
        .from('featured_creators')
        .update({
          threads_username: threads_username || null,
          x_username: x_username || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabaseBiz
        .from('featured_creators')
        .insert([{
          user_id,
          threads_username: threads_username || null,
          x_username: x_username || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (insertError) throw insertError
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '프로필이 업데이트되었습니다.'
      })
    }

  } catch (error) {
    console.error('update-creator-profile error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || '서버 오류가 발생했습니다.' })
    }
  }
}
