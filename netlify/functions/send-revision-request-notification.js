/**
 * 영상 수정 요청 알림 발송 (크리에이터에게)
 * 템플릿: 025100001016
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase Admin 클라이언트 초기화
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_KOREA_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { submissionId, commentId } = JSON.parse(event.body)

    if (!submissionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'submissionId is required' })
      }
    }

    console.log('[INFO] Sending revision request notification for submission:', submissionId)

    // 1. 영상 제출 정보 조회
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .select(`
        *,
        applications (
          id,
          user_id,
          applicant_name,
          campaigns (
            title,
            company_name,
            content_submission_deadline
          )
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      console.error('[ERROR] Failed to fetch submission:', submissionError)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found' })
      }
    }

    const creatorUserId = submission.applications?.user_id
    const creatorName = submission.applications?.applicant_name || '크리에이터'
    const campaignTitle = submission.applications?.campaigns?.title || '캠페인'
    const deadline = submission.applications?.campaigns?.content_submission_deadline

    // 2. 크리에이터 전화번호 조회
    let creatorPhone = null
    if (creatorUserId) {
      const { data: creatorProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('phone, name')
        .eq('id', creatorUserId)
        .single()

      creatorPhone = creatorProfile?.phone
      if (creatorProfile?.name) {
        // DB에 이름이 있으면 사용
      }
    }

    if (!creatorPhone) {
      console.log('[SKIP] 크리에이터 전화번호 없음:', creatorUserId)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: '크리에이터 전화번호가 없어 알림톡을 발송하지 않습니다.',
          creatorUserId
        })
      }
    }

    // 3. 재제출 기한 계산 (요청일 + 3일)
    const requestDate = new Date()
    const resubmitDeadline = new Date(requestDate)
    resubmitDeadline.setDate(resubmitDeadline.getDate() + 3)

    const formatDate = (date) => {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    // 4. 알림톡 발송
    const templateCode = '025100001016'
    const variables = {
      '크리에이터명': creatorName,
      '캠페인명': campaignTitle,
      '요청일': formatDate(requestDate),
      '재제출기한': formatDate(resubmitDeadline)
    }

    console.log('[INFO] Sending alimtalk:', {
      creatorPhone,
      templateCode,
      variables
    })

    // send-alimtalk 호출
    const baseUrl = process.env.URL || 'https://cnec.co.kr'
    const axios = require('axios')

    try {
      const alimtalkResponse = await axios.post(
        `${baseUrl}/.netlify/functions/send-alimtalk`,
        {
          receiverNum: creatorPhone.replace(/-/g, ''),
          receiverName: creatorName,
          templateCode,
          variables
        },
        { timeout: 10000 }
      )

      console.log('[SUCCESS] Alimtalk sent:', alimtalkResponse.data)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '수정 요청 알림톡이 발송되었습니다.',
          alimtalkResult: alimtalkResponse.data
        })
      }
    } catch (alimtalkError) {
      console.error('[ERROR] Alimtalk failed:', alimtalkError.message)
      console.error('[ERROR] Alimtalk error details:', alimtalkError.response?.data || alimtalkError)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: '알림톡 발송 실패',
          error: alimtalkError.message,
          details: alimtalkError.response?.data
        })
      }
    }

  } catch (error) {
    console.error('[ERROR] Revision request notification error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to send notification',
        details: error.message
      })
    }
  }
}
