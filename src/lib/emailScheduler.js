import { database } from './supabase'

/**
 * 캠페인 마감일 알림 자동화 시스템
 * 영상을 제출한 사용자에게는 알림을 보내지 않음
 */
class EmailScheduler {
  constructor() {
    this.isRunning = false
  }

  /**
   * 스케줄러 시작
   */
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('이메일 스케줄러 시작됨')
    
    // 매일 오전 9시에 실행 (한국 시간 기준)
    this.scheduleDaily()
    
    // 즉시 한 번 실행
    this.checkAndSendReminders()
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.isRunning = false
    console.log('이메일 스케줄러 중지됨')
  }

  /**
   * 매일 실행 스케줄 설정
   */
  scheduleDaily() {
    // 24시간마다 실행 (86400000ms)
    this.interval = setInterval(() => {
      this.checkAndSendReminders()
    }, 24 * 60 * 60 * 1000)
  }

  /**
   * 마감일 알림 확인 및 발송
   */
  async checkAndSendReminders() {
    try {
      console.log('마감일 알림 확인 시작...')
      
      // 활성 캠페인 가져오기
      const campaigns = await database.campaigns.getAll()
      const activeCampaigns = campaigns.filter(c => c.status === 'active')
      
      for (const campaign of activeCampaigns) {
        await this.processCampaignReminders(campaign)
      }
      
      console.log('마감일 알림 확인 완료')
    } catch (error) {
      console.error('마감일 알림 확인 중 오류:', error)
    }
  }

  /**
   * 특정 캠페인의 알림 처리
   */
  async processCampaignReminders(campaign) {
    try {
      const deadline = new Date(campaign.end_date)
      const now = new Date()
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
      
      console.log(`캠페인 "${campaign.title}" 마감까지 ${daysUntilDeadline}일`)
      
      // 마감일에 따른 템플릿 ID 결정
      let templateId = null
      if (daysUntilDeadline === 3) {
        templateId = 'campaign_deadline_3days'
      } else if (daysUntilDeadline === 2) {
        templateId = 'campaign_deadline_2days'
      } else if (daysUntilDeadline === 1) {
        templateId = 'campaign_deadline_1day'
      } else if (daysUntilDeadline === 0) {
        templateId = 'campaign_deadline_today'
      }
      
      if (!templateId) return
      
      // 해당 캠페인의 승인된 신청자들 가져오기
      const applications = await database.applications.getByCampaignId(campaign.id)
      const approvedApplications = applications.filter(app => app.status === 'approved')
      
      for (const application of approvedApplications) {
        await this.sendReminderIfNeeded(campaign, application, templateId)
      }
      
    } catch (error) {
      console.error(`캠페인 ${campaign.id} 알림 처리 중 오류:`, error)
    }
  }

  /**
   * 필요한 경우에만 알림 발송
   */
  async sendReminderIfNeeded(campaign, application, templateId) {
    try {
      // 영상 제출 여부 확인
      const hasSubmittedVideo = await this.checkVideoSubmission(application)
      
      if (hasSubmittedVideo) {
        console.log(`사용자 ${application.user_id}는 이미 영상을 제출했으므로 알림을 보내지 않음`)
        return
      }
      
      // 이미 같은 날짜에 같은 템플릿으로 알림을 보냈는지 확인
      const alreadySent = await this.checkIfAlreadySent(application.user_id, campaign.id, templateId)
      
      if (alreadySent) {
        console.log(`사용자 ${application.user_id}에게 이미 ${templateId} 알림을 보냄`)
        return
      }
      
      // 사용자 정보 가져오기
      const user = await database.users.getById(application.user_id)
      if (!user) return
      
      // 이메일 발송
      await this.sendReminderEmail(user, campaign, application, templateId)
      
      // 발송 기록 저장
      await this.recordEmailSent(user.id, campaign.id, templateId)
      
    } catch (error) {
      console.error(`알림 발송 확인 중 오류:`, error)
    }
  }

  /**
   * 영상 제출 여부 확인
   */
  async checkVideoSubmission(application) {
    try {
      // 신청서의 video_url 또는 submission_status 확인
      if (application.video_url || application.submission_status === 'submitted') {
        return true
      }
      
      // 추가적으로 파일 업로드 테이블 확인 (있다면)
      // const uploads = await database.uploads.getByApplicationId(application.id)
      // return uploads && uploads.length > 0
      
      return false
    } catch (error) {
      console.error('영상 제출 확인 중 오류:', error)
      return false
    }
  }

  /**
   * 이미 알림을 보냈는지 확인
   */
  async checkIfAlreadySent(userId, campaignId, templateId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // email_logs 테이블에서 확인 (테이블이 있다면)
      const { data, error } = await database.supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', campaignId)
        .eq('template_id', templateId)
        .gte('sent_at', today)
        .limit(1)
      
      if (error && error.code !== 'PGRST116') { // 테이블이 없는 경우가 아닌 다른 오류
        console.error('이메일 로그 확인 중 오류:', error)
        return false
      }
      
      return data && data.length > 0
    } catch (error) {
      console.error('이메일 발송 기록 확인 중 오류:', error)
      return false
    }
  }

  /**
   * 알림 이메일 발송
   */
  async sendReminderEmail(user, campaign, application, templateId) {
    try {
      // 이메일 템플릿 가져오기
      const template = await this.getEmailTemplate(templateId)
      if (!template) {
        console.error(`템플릿 ${templateId}를 찾을 수 없음`)
        return
      }
      
      // 템플릿 변수 치환
      const emailContent = this.replaceTemplateVariables(template.content, {
        name: user.name || user.email,
        campaign_title: campaign.title,
        brand_name: campaign.brand,
        reward_amount: campaign.reward_amount,
        deadline: this.formatDate(campaign.end_date),
        requirements: campaign.requirements || '캠페인 가이드라인을 확인해주세요',
        upload_folder: campaign.upload_folder || 'Google Drive 폴더 링크',
        guidelines_url: campaign.guidelines_url || '#'
      })
      
      const emailSubject = this.replaceTemplateVariables(template.subject, {
        campaign_title: campaign.title
      })
      
      // 실제 이메일 발송 (이메일 서비스 연동 필요)
      await this.sendEmail({
        to: user.email,
        subject: emailSubject,
        content: emailContent
      })
      
      console.log(`${templateId} 알림 발송 완료`)
      
    } catch (error) {
      console.error('알림 이메일 발송 중 오류:', error)
    }
  }

  /**
   * 이메일 템플릿 가져오기
   */
  async getEmailTemplate(templateId) {
    try {
      const { data, error } = await database.supabase
        .from('email_templates')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (error) {
        console.error('템플릿 조회 오류:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('템플릿 가져오기 중 오류:', error)
      return null
    }
  }

  /**
   * 템플릿 변수 치환
   */
  replaceTemplateVariables(template, variables) {
    let result = template
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, variables[key] || '')
    })
    
    return result
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  /**
   * 실제 이메일 발송 (구현 필요)
   */
  async sendEmail({ to, subject, content }) {
    // 실제 이메일 서비스 (SendGrid, AWS SES 등) 연동 필요
    console.log('이메일 발송:', { to, subject })
    console.log('내용:', content)
    
    // 개발 환경에서는 콘솔에만 출력
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    
    // 실제 이메일 발송 로직 구현
    // await emailService.send({ to, subject, html: content })
  }

  /**
   * 이메일 발송 기록 저장
   */
  async recordEmailSent(userId, campaignId, templateId) {
    try {
      const { error } = await database.supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          template_id: templateId,
          sent_at: new Date().toISOString()
        })
      
      if (error && error.code !== 'PGRST116') { // 테이블이 없는 경우가 아닌 다른 오류
        console.error('이메일 로그 저장 오류:', error)
      }
    } catch (error) {
      console.error('이메일 발송 기록 저장 중 오류:', error)
    }
  }
}

// 싱글톤 인스턴스
const emailScheduler = new EmailScheduler()

export default emailScheduler
