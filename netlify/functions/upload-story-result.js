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
      proposal_id,
      campaign_id,
      user_id,
      screenshot_url,
      clean_video_url,
      screenshot_urls,
      media_urls,
      story_type,
      is_revision,
      revision_agreed,
      slide_count,
      has_interactive_sticker,
      interactive_type,
      sticker_screenshot_url,
      has_link_sticker,
      link_sticker_url
    } = body

    const isMultiStory = story_type === 'multi_story'

    // 필수 필드 검증
    if (!proposal_id || !campaign_id || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '필수 항목을 모두 입력해주세요.' })
      }
    }

    if (isMultiStory) {
      if (!screenshot_urls || !Array.isArray(screenshot_urls) || screenshot_urls.length < 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: '스크린샷을 2장 이상 업로드해주세요.' })
        }
      }
      if (!media_urls || !Array.isArray(media_urls) || media_urls.length < 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: '스토리 카드 이미지를 2장 이상 업로드해주세요.' })
        }
      }
    } else {
      if (!screenshot_url || !clean_video_url) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: '필수 항목을 모두 입력해주세요.' })
        }
      }
    }

    // 수정 제출인 경우 과금 동의 확인
    if (is_revision && !revision_agreed) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '수정 시 추가 과금 동의가 필요합니다.' })
      }
    }

    // BIZ DB 접속
    const supabaseUrl = process.env.SUPABASE_BIZ_URL
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // 기획안 상태 확인 (승인됨인지)
    const { data: proposal, error: proposalError } = await supabaseBiz
      .from('story_proposals')
      .select('id, status')
      .eq('id', proposal_id)
      .eq('creator_id', user_id)
      .single()

    if (proposalError || !proposal) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: '기획안을 찾을 수 없습니다.' })
      }
    }

    if (proposal.status !== 'approved' && proposal.status !== 'revision_requested') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '승인된 기획안만 제출할 수 있습니다.' })
      }
    }

    // 버전 계산
    const { data: existingSubmissions } = await supabaseBiz
      .from('story_submissions')
      .select('version')
      .eq('proposal_id', proposal_id)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existingSubmissions && existingSubmissions.length > 0
      ? (existingSubmissions[0].version || 0) + 1
      : 1

    // 제출물 INSERT
    const insertData = {
      proposal_id,
      campaign_id,
      creator_id: user_id,
      status: 'submitted',
      story_type: story_type || 'single_story',
      created_at: new Date().toISOString()
    }

    if (isMultiStory) {
      insertData.screenshot_urls = screenshot_urls
      insertData.media_urls = media_urls
    } else {
      insertData.screenshot_url = screenshot_url
      insertData.clean_video_url = clean_video_url
    }

    // 스토리 보강 필드
    if (slide_count !== undefined) insertData.slide_count = slide_count
    if (has_interactive_sticker !== undefined) insertData.has_interactive_sticker = has_interactive_sticker
    if (interactive_type) insertData.interactive_type = interactive_type
    if (sticker_screenshot_url) insertData.sticker_screenshot_url = sticker_screenshot_url
    if (has_link_sticker !== undefined) insertData.has_link_sticker = has_link_sticker
    if (link_sticker_url) insertData.link_sticker_url = link_sticker_url

    const { data: submission, error: insertError } = await supabaseBiz
      .from('story_submissions')
      .insert([insertData])
      .select()
      .single()

    if (insertError) throw insertError

    // 기획안 상태 업데이트
    await supabaseBiz
      .from('story_proposals')
      .update({ status: 'submitted' })
      .eq('id', proposal_id)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '스토리 업로드가 제출되었습니다.',
        submission
      })
    }

  } catch (error) {
    console.error('upload-story-result error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || '서버 오류가 발생했습니다.' })
    }
  }
}
