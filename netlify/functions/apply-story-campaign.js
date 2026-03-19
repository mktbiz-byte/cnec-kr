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
      campaign_id,
      user_id,
      creator_name,
      video_concept,
      tone_mood,
      description,
      secondary_use_agreed,
      no_edit_policy_agreed
    } = body

    // 필수 필드 검증
    if (!campaign_id || !user_id || !video_concept || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '필수 항목을 모두 입력해주세요.' })
      }
    }

    // 2차 활용 동의 필수 검증
    if (!secondary_use_agreed) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '2차 활용 동의가 필요합니다.' })
      }
    }

    // BIZ DB 접속
    const supabaseUrl = process.env.SUPABASE_BIZ_URL
      || process.env.VITE_SUPABASE_BIZ_URL
      || 'https://hbymozdhjseqebpomjsp.supabase.co'
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY
      || process.env.SUPABASE_BIZ_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhieW1vemRoanNlcWVicG9tanNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NzA5NTgsImV4cCI6MjA3NjI0Njk1OH0.7th9Tz7oyHKqp03M68k1G0WqLwCSYTnoY9ECgy3pSzE'

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // 중복 지원 확인
    const { data: existing } = await supabaseBiz
      .from('story_proposals')
      .select('id, status')
      .eq('campaign_id', campaign_id)
      .eq('creator_id', user_id)
      .single()

    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: '이미 기획안을 제출한 캠페인입니다.',
          proposal: existing
        })
      }
    }

    // 기획안 INSERT
    const { data: proposal, error: insertError } = await supabaseBiz
      .from('story_proposals')
      .insert([{
        campaign_id,
        creator_id: user_id,
        video_concept,
        tone_mood: tone_mood || null,
        description,
        secondary_use_agreed: true,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) throw insertError

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '기획안이 제출되었습니다. 승인 후 촬영을 진행해주세요.',
        proposal
      })
    }

  } catch (error) {
    console.error('apply-story-campaign error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || '서버 오류가 발생했습니다.' })
    }
  }
}
