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
      is_revision,
      revision_agreed
    } = body

    // 필수 필드 검증
    if (!proposal_id || !campaign_id || !user_id || !screenshot_url || !clean_video_url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '필수 항목을 모두 입력해주세요.' })
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
      || process.env.VITE_SUPABASE_BIZ_URL
      || 'https://hbymozdhjseqebpomjsp.supabase.co'
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY
      || process.env.SUPABASE_BIZ_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhieW1vemRoanNlcWVicG9tanNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NzA5NTgsImV4cCI6MjA3NjI0Njk1OH0.7th9Tz7oyHKqp03M68k1G0WqLwCSYTnoY9ECgy3pSzE'

    const supabaseBiz = createClient(supabaseUrl, supabaseKey)

    // 기획안 상태 확인 (승인됨인지)
    const { data: proposal, error: proposalError } = await supabaseBiz
      .from('story_proposals')
      .select('id, status')
      .eq('id', proposal_id)
      .eq('user_id', user_id)
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
    const { data: submission, error: insertError } = await supabaseBiz
      .from('story_submissions')
      .insert([{
        proposal_id,
        campaign_id,
        user_id,
        screenshot_url,
        clean_video_url,
        version: nextVersion,
        is_revision: is_revision || false,
        revision_agreed: revision_agreed || false,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
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
