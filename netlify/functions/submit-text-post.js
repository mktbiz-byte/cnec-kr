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
      platform,
      post_url,
      post_text,
      screenshot_url,
      has_product_image,
      has_brand_tag,
      has_ad_disclosure,
      has_profile_link,
      posted_at
    } = body

    // 필수 필드 검증
    if (!campaign_id || !user_id || !post_url || !platform) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '필수 항목을 모두 입력해주세요.' })
      }
    }

    // 플랫폼 검증
    if (!['threads', 'x'].includes(platform)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '유효하지 않은 플랫폼입니다.' })
      }
    }

    // BIZ DB 접속
    const supabaseUrl = process.env.SUPABASE_BIZ_URL
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // 중복 제출 확인
    const { data: existing } = await supabaseBiz
      .from('text_submissions')
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
          error: '이미 포스트를 제출한 캠페인입니다.',
          submission: existing
        })
      }
    }

    // 제출물 INSERT
    const { data: submission, error: insertError } = await supabaseBiz
      .from('text_submissions')
      .insert([{
        campaign_id,
        creator_id: user_id,
        platform,
        post_url,
        post_text: post_text || null,
        screenshot_url: screenshot_url || null,
        has_product_image: has_product_image || false,
        has_brand_tag: has_brand_tag || false,
        has_ad_disclosure: has_ad_disclosure || false,
        has_profile_link: has_profile_link || false,
        status: 'pending',
        posted_at: posted_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) throw insertError

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '포스트가 제출되었습니다. 검수 후 승인됩니다.',
        submission
      })
    }

  } catch (error) {
    console.error('submit-text-post error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || '서버 오류가 발생했습니다.' })
    }
  }
}
