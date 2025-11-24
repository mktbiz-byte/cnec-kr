/**
 * 영상 재제출 알림 발송
 * 크리에이터가 수정 완료 후 기업에게 알림톡 + 이메일 발송
 */

const { createClient } = require('@supabase/supabase-js')
const { sendNotification } = require('./send-notification-helper')

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
    const { submissionId } = JSON.parse(event.body)

    if (!submissionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'submissionId is required' })
      }
    }

    console.log('[INFO] Sending resubmit notification for submission:', submissionId)

    // 1. 영상 제출 정보 조회 (기업 정보 포함)
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('video_submissions')
      .select(`
        *,
        applications (
          applicant_name,
          campaigns (
            title,
            company_name,
            company_id,
            companies (
              contact_phone,
              contact_email
            )
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

    const creatorName = submission.applications?.applicant_name || '크리에이터'
    const campaignTitle = submission.applications?.campaigns?.title || '캠페인'
    const companyName = submission.applications?.campaigns?.company_name || '기업'
    const companyPhone = submission.applications?.campaigns?.companies?.contact_phone
    const companyEmail = submission.applications?.campaigns?.companies?.contact_email

    console.log('[INFO] Company info:', { companyName, companyPhone, companyEmail })

    // 2. 알림톡 + 이메일 발송
    const templateCode = '025100001008' // 영상 제출 템플릿
    
    const variables = {
      '회사명': companyName,
      '캠페인명': campaignTitle,
      '크리에이터명': creatorName
    }

    console.log('[INFO] Notification params:', { companyPhone, companyEmail, templateCode, variables })

    // 이메일 HTML 생성
    const emailSubject = `[CNEC] ${creatorName}님이 수정된 영상을 제출했습니다`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">CNEC</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">영상 재제출 알림</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">✅ ${companyName}님, 수정된 영상이 제출되었습니다</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            안녕하세요, ${companyName}님!<br><br>
            <strong>${campaignTitle}</strong> 캠페인의 크리에이터 <strong>${creatorName}</strong>님이 수정된 영상을 제출했습니다.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">📌 안내</h3>
            <p style="color: #4b5563; line-height: 1.6; margin: 0;">
              관리자 페이지에서 영상을 검토하시고, 수정 사항이 있으면 피드백을 남겨주세요.<br>
              검수 완료 후 SNS 업로드 될 예정입니다.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cnectotal.netlify.app/video-review/${submissionId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">영상 검토하기</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            문의사항이 있으시면 <a href="tel:1833-6025" style="color: #667eea; text-decoration: none;">1833-6025</a>로 연락주세요.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2025 CNEC. All rights reserved.</p>
        </div>
      </div>
    `

    // 알림 발송을 비동기로 처리 (타임아웃 방지)
    sendNotification({
      receiverNum: companyPhone,
      receiverEmail: companyEmail,
      receiverName: companyName,
      templateCode,
      variables,
      emailSubject,
      emailHtml
    }).then(result => {
      console.log('[SUCCESS] Notification sent:', result)
    }).catch(error => {
      console.error('[ERROR] Notification failed:', error)
    })

    // 4. 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('video_submissions')
      .update({ 
        status: 'resubmitted',
        resubmitted_at: new Date().toISOString()
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('[ERROR] Failed to update submission status:', updateError)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '수정 완료 알림이 전송되었습니다.'
      })
    }
  } catch (error) {
    console.error('[ERROR] Failed to send notification:', error)
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
