const { createClient } = require('@supabase/supabase-js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    }
  }

  try {
    const { user_id, campaign_id } = event.queryStringParameters || {}

    if (!user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'user_id is required' })
      }
    }

    // BIZ DB 접속
    const supabaseUrl = process.env.VITE_SUPABASE_BIZ_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // 기획안 조회
    let proposalsQuery = supabaseBiz
      .from('story_proposals')
      .select('*')
      .eq('creator_id', user_id)
      .order('created_at', { ascending: false })

    if (campaign_id) {
      proposalsQuery = proposalsQuery.eq('campaign_id', campaign_id)
    }

    const { data: proposals, error: proposalsError } = await proposalsQuery

    if (proposalsError) throw proposalsError

    // 제출물 조회
    let submissionsQuery = supabaseBiz
      .from('story_submissions')
      .select('*')
      .eq('creator_id', user_id)
      .order('created_at', { ascending: false })

    if (campaign_id) {
      submissionsQuery = submissionsQuery.eq('campaign_id', campaign_id)
    }

    const { data: submissions, error: submissionsError } = await submissionsQuery

    if (submissionsError) throw submissionsError

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        proposals: proposals || [],
        submissions: submissions || []
      })
    }

  } catch (error) {
    console.error('get-my-story-status error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || '서버 오류가 발생했습니다.' })
    }
  }
}
