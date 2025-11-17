import { useState, useEffect } from 'react'
import { database, supabase } from '../lib/supabase'
import { emailTriggers } from '../lib/emailService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, Clock, CheckCircle, AlertCircle, Send, 
  Calendar, Users, FileText, DollarSign
} from 'lucide-react'

const EmailScheduler = () => {
  const [scheduledEmails, setScheduledEmails] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadEmailData()
    
    // 1분마다 스케줄된 이메일 확인
    const interval = setInterval(checkScheduledEmails, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const loadEmailData = async () => {
    try {
      setLoading(true)
      
      // 스케줄된 이메일 로드
      const { data: schedules, error: scheduleError } = await supabase
        .from('email_schedules')
        .select(`
          *,
          campaigns (
            title,
            brand,
            deadline
          )
        `)
        .order('scheduled_at', { ascending: true })

      if (scheduleError) {
        console.error('Load schedules error:', scheduleError)
      } else {
        setScheduledEmails(schedules || [])
      }

      // 이메일 로그 로드 (최근 100개)
      const { data: logs, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logError) {
        console.error('Load logs error:', logError)
      } else {
        setEmailLogs(logs || [])
      }

    } catch (error) {
      console.error('Load email data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkScheduledEmails = async () => {
    try {
      const now = new Date()
      
      // 현재 시간이 지난 스케줄된 이메일 찾기
      const { data: dueEmails, error } = await supabase
        .from('email_schedules')
        .select(`
          *,
          campaigns (
            id,
            title,
            brand,
            deadline,
            reward_amount
          )
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_at', now.toISOString())

      if (error) {
        console.error('Check scheduled emails error:', error)
        return
      }

      if (dueEmails && dueEmails.length > 0) {
        await processDueEmails(dueEmails)
      }

    } catch (error) {
      console.error('Check scheduled emails error:', error)
    }
  }

  const processDueEmails = async (dueEmails) => {
    setProcessing(true)

    for (const emailSchedule of dueEmails) {
      try {
        // 해당 캠페인의 승인된 신청자들 가져오기
        const { data: applications, error: appError } = await supabase
          .from('applications')
          .select(`
            *,
            user_profiles (
              name,
              email
            )
          `)
          .eq('campaign_id', emailSchedule.campaign_id)
          .eq('status', 'approved')

        if (appError) {
          console.error('Get applications error:', appError)
          continue
        }

        // 각 사용자에게 이메일 발송
        for (const application of applications || []) {
          const user = application.user_profiles
          const campaign = emailSchedule.campaigns

          if (user && user.email) {
            const emailData = {
              name: user.name || 'ユーザー',
              campaignTitle: campaign.title,
              deadline: new Date(campaign.deadline).toLocaleDateString('ko-KR'),
              rewardAmount: campaign.reward_amount
            }

            // 이메일 타입에 따라 발송
            switch (emailSchedule.email_type) {
              case 'DEADLINE_REMINDER_3DAYS':
                await emailTriggers.sendReminderEmail(user.email, 'DEADLINE_REMINDER_3DAYS', emailData)
                break
              case 'DEADLINE_REMINDER_1DAY':
                await emailTriggers.sendReminderEmail(user.email, 'DEADLINE_REMINDER_1DAY', emailData)
                break
              case 'DEADLINE_TODAY':
                await emailTriggers.sendReminderEmail(user.email, 'DEADLINE_TODAY', emailData)
                break
            }
          }
        }

        // 스케줄 상태를 완료로 업데이트
        await supabase
          .from('email_schedules')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', emailSchedule.id)

      } catch (error) {
        console.error('Process email error:', error)
        
        // 오류 상태로 업데이트
        await supabase
          .from('email_schedules')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', emailSchedule.id)
      }
    }

    setProcessing(false)
    await loadEmailData() // 데이터 새로고침
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { label: '予定', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '完了', color: 'bg-green-100 text-green-800' },
      failed: { label: '失敗', color: 'bg-red-100 text-red-800' },
      pending: { label: '送信中', color: 'bg-yellow-100 text-yellow-800' },
      sent: { label: '送信済み', color: 'bg-green-100 text-green-800' },
      error: { label: 'エラー', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getEmailTypeLabel = (type) => {
    const typeLabels = {
      SIGNUP_COMPLETE: '会員登録完了',
      APPLICATION_SUBMITTED: 'キャンペーン応募完了',
      APPLICATION_APPROVED: 'キャンペーン承認',
      GUIDE_DELIVERED: 'ガイド送付',
      DEADLINE_REMINDER_3DAYS: '締切3日前リマインダー',
      DEADLINE_REMINDER_1DAY: '締切1日前リマインダー',
      DEADLINE_TODAY: '締切当日リマインダー',
      POINT_REQUEST_SUBMITTED: 'ポイント申請完了',
      POINT_TRANSFER_COMPLETED: 'ポイント入金完了'
    }
    
    return typeLabels[type] || type
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const manualTriggerEmail = async (scheduleId) => {
    try {
      setProcessing(true)
      
      const schedule = scheduledEmails.find(s => s.id === scheduleId)
      if (schedule) {
        await processDueEmails([schedule])
      }
      
    } catch (error) {
      console.error('Manual trigger error:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Mail className="h-12 w-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">メールデータを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">メール管理システム</h2>
          <p className="text-gray-600">自動メール送信とスケジュール管理</p>
        </div>
        
        {processing && (
          <Alert className="w-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              メールを処理中です...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {scheduledEmails.filter(e => e.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-600">予定メール</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {emailLogs.filter(e => e.status === 'sent').length}
                </div>
                <div className="text-sm text-gray-600">送信済み</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {emailLogs.filter(e => e.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">エラー</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {emailLogs.length}
                </div>
                <div className="text-sm text-gray-600">総送信数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>スケジュール済みメール</span>
          </CardTitle>
          <CardDescription>
            自動送信予定のメール一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledEmails.length > 0 ? (
            <div className="space-y-4">
              {scheduledEmails.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{getEmailTypeLabel(schedule.email_type)}</h4>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>キャンペーン:</strong> {schedule.campaigns?.title}</p>
                      <p><strong>送信予定:</strong> {formatDateTime(schedule.scheduled_at)}</p>
                      {schedule.completed_at && (
                        <p><strong>完了日時:</strong> {formatDateTime(schedule.completed_at)}</p>
                      )}
                    </div>
                  </div>
                  
                  {schedule.status === 'scheduled' && (
                    <Button
                      size="sm"
                      onClick={() => manualTriggerEmail(schedule.id)}
                      disabled={processing}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      手動送信
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              スケジュール済みメールはありません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>メール送信履歴</span>
          </CardTitle>
          <CardDescription>
            最近送信されたメールの履歴
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs.length > 0 ? (
            <div className="space-y-3">
              {emailLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium">{getEmailTypeLabel(log.template_type)}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>宛先:</strong> {log.recipient_email}</p>
                      <p><strong>件名:</strong> {log.subject}</p>
                      <p><strong>送信日時:</strong> {formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              メール送信履歴はありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailScheduler
