exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    // nodemailer 동적 import (Netlify Functions 환경에서 더 안전)
    let nodemailer
    try {
      nodemailer = require('nodemailer')
    } catch (requireError) {
      console.error('nodemailer require 오류:', requireError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'nodemailer 라이브러리를 로드할 수 없습니다.',
          details: requireError.message
        })
      }
    }

    const { to, subject, html, text, settings } = JSON.parse(event.body)

    // 필수 파라미터 검증
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '필수 파라미터가 누락되었습니다. (to, subject, html)' })
      }
    }

    // SMTP 설정: settings가 있으면 사용, 없으면 환경변수에서 읽음
    const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = settings?.smtpPort || process.env.SMTP_PORT || '587'
    const smtpUser = settings?.smtpUser || process.env.SMTP_USER
    const smtpPass = settings?.smtpPass || process.env.SMTP_PASS
    const smtpSecure = settings?.smtpSecure || process.env.SMTP_SECURE === 'true'
    const fromEmail = settings?.fromEmail || process.env.SMTP_FROM_EMAIL || smtpUser
    const fromName = settings?.fromName || process.env.SMTP_FROM_NAME || 'CNEC Korea'
    const replyToEmail = settings?.replyToEmail || process.env.SMTP_REPLY_TO || fromEmail

    if (!smtpUser || !smtpPass) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'SMTP 설정이 불완전합니다. settings를 전달하거나 환경변수를 설정해주세요.' })
      }
    }

    // nodemailer transporter 생성
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure || false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false // Gmail의 경우 필요할 수 있음
      }
    })

    // 이메일 옵션 설정
    const mailOptions = {
      from: `${fromName || 'CNEC Japan'} <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // HTML 태그 제거하여 텍스트 버전 생성
      replyTo: replyToEmail || fromEmail
    }

    // 이메일 발송
    const info = await transporter.sendMail(mailOptions)

    console.log('이메일 발송 성공:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: '이메일이 성공적으로 발송되었습니다.'
      })
    }

  } catch (error) {
    console.error('이메일 발송 오류:', error)

    // 에러 타입별 상세 메시지
    let errorMessage = '이메일 발송에 실패했습니다.'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP 인증에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'SMTP 서버에 연결할 수 없습니다. 호스트와 포트를 확인해주세요.'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'SMTP 서버 연결이 시간 초과되었습니다.'
    } else if (error.responseCode === 535) {
      errorMessage = 'SMTP 인증 실패: 앱 비밀번호를 사용하고 있는지 확인해주세요.'
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.message
      })
    }
  }
}
