import { useState, useEffect } from 'react'
import { database, supabase } from '../../lib/supabase'
import { emailTriggers, scheduleReminderEmails } from '../../lib/emailService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, Send, Clock, CheckCircle, AlertCircle, Users, 
  Calendar, FileText, Settings, Eye, Trash2, RefreshCw,
  Download, Filter, Search, Plus
} from 'lucide-react'

const AdminEmailManagement = () => {
  const [emailLogs, setEmailLogs] = useState([])
  const [scheduledEmails, setScheduledEmails] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedEmailType, setSelectedEmailType] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 이메일 타입 정의
  const EMAIL_TYPES = [
    { value: 'SIGNUP_COMPLETE', label: '회원가입 완료', description: '새 사용자 환영 메일' },
    { value: 'APPLICATION_SUBMITTED', label: '캠페인 신청 완료', description: '캠페인 신청 접수 확인' },
    { value: 'APPLICATION_APPROVED', label: '캠페인 승인', description: '캠페인 참가 확정 통지' },
    { value: 'GUIDE_DELIVERED', label: '가이드 전달', description: '캠페인 자료 및 가이드 제공' },
    { value: 'DEADLINE_REMINDER_3DAYS', label: '3일전 알림', description: '투고 마감 3일전 리마인더' },
    { value: 'DEADLINE_REMINDER_1DAY', label: '1일전 알림', description: '투고 마감 1일전 리마인더' },
    { value: 'DEADLINE_TODAY', label: '당일 알림', description: '투고 마감일 당일 알림' },
    { value: 'POINT_REQUEST_SUBMITTED', label: '포인트 신청 완료', description: '포인트 신청 접수 확인' },
    { value: 'POINT_TRANSFER_COMPLETED', label: '포인트 입금 완료', description: '포인트 입금 완료 통지' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 이메일 로그 로드
      const { data: logs, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (logError) {
        console.error('Load email logs error:', logError)
      } else {
        setEmailLogs(logs || [])
      }

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
        console.error('Load email schedules error:', scheduleError)
      } else {
        setScheduledEmails(schedules || [])
      }

      // 캠페인 목록 로드
      const campaignData = await database.campaigns.getAll()
      setCampaigns(campaignData || [])

      // 사용자 목록 로드 (최근 100명)
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (userError) {
        console.error('Load users error:', userError)
      } else {
        setUsers(userData || [])
      }

    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      sent: { label: '발송완료', color: 'bg-green-100 text-green-800' },
      error: { label: '오류', color: 'bg-red-100 text-red-800' },
      scheduled: { label: '예약됨', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', color: 'bg-green-100 text-green-800' },
      failed: { label: '실패', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getEmailTypeLabel = (type) => {
    const emailType = EMAIL_TYPES.find(t => t.value === type)
    return emailType ? emailType.label : type
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const sendTestEmail = async (emailType, recipientEmail) => {
    try {
      setSending(true)
      
      const testData = {
        name: 'テストユーザー',
        email: recipientEmail,
        campaignTitle: 'テストキャンペーン',
        brandName: 'テストブランド',
        rewardAmount: 10000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')
      }

      // 실제 이메일 발송 로직 호출
      const result = await emailTriggers.sendEmail(emailType, recipientEmail, testData)
      
      if (result.success) {
        alert('테스트 이메일이 발송되었습니다.')
        await loadData() // 데이터 새로고침
      } else {
        alert('이메일 발송에 실패했습니다: ' + result.error)
      }

    } catch (error) {
      console.error('Send test email error:', error)
      alert('이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const sendBulkEmail = async (campaignId, emailType) => {
    try {
      setSending(true)
      
      // 해당 캠페인의 승인된 신청자들 가져오기
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          user_profiles (
            name,
            email
          ),
          campaigns (
            title,
            brand,
            reward_amount,
            deadline
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'approved')

      if (error) {
        console.error('Get applications error:', error)
        alert('신청자 정보를 가져오는데 실패했습니다.')
        return
      }

      if (!applications || applications.length === 0) {
        alert('해당 캠페인에 승인된 신청자가 없습니다.')
        return
      }

      let successCount = 0
      let errorCount = 0

      // 각 사용자에게 이메일 발송
      for (const application of applications) {
        try {
          const user = application.user_profiles
          const campaign = application.campaigns

          if (user && user.email) {
            const emailData = {
              name: user.name || 'ユーザー',
              campaignTitle: campaign.title,
              brandName: campaign.brand,
              rewardAmount: campaign.reward_amount,
              deadline: new Date(campaign.deadline).toLocaleDateString('ko-KR')
            }

            const result = await emailTriggers.sendEmail(emailType, user.email, emailData)
            
            if (result.success) {
              successCount++
            } else {
              errorCount++
            }
          }
        } catch (error) {
          console.error('Send individual email error:', error)
          errorCount++
        }
      }

      alert(`일괄 이메일 발송 완료\n성공: ${successCount}건\n실패: ${errorCount}건`)
      await loadData() // 데이터 새로고침

    } catch (error) {
      console.error('Send bulk email error:', error)
      alert('일괄 이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const scheduleDeadlineReminders = async (campaignId) => {
    try {
      setSending(true)
      
      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) {
        alert('캠페인을 찾을 수 없습니다.')
        return
      }

      const result = await scheduleReminderEmails(campaignId, campaign.deadline)
      
      if (result.success) {
        alert(`마감일 알림이 ${result.scheduled}개 예약되었습니다.`)
        await loadData() // 데이터 새로고침
      } else {
        alert('알림 예약에 실패했습니다: ' + result.error)
      }

    } catch (error) {
      console.error('Schedule reminders error:', error)
      alert('알림 예약 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const deleteScheduledEmail = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('email_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        console.error('Delete schedule error:', error)
        alert('예약 삭제에 실패했습니다.')
        return
      }

      alert('예약된 이메일이 삭제되었습니다.')
      await loadData() // 데이터 새로고침

    } catch (error) {
      console.error('Delete scheduled email error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const exportEmailLogs = () => {
    const csvContent = [
      ['날짜', '수신자', '이메일 타입', '제목', '상태'].join(','),
      ...emailLogs.map(log => [
        formatDateTime(log.created_at),
        log.recipient_email,
        getEmailTypeLabel(log.template_type),
        log.subject,
        log.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `email_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredEmailLogs = emailLogs.filter(log => {
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Mail className="h-12 w-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">이메일 데이터를 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">이메일 관리</h2>
          <p className="text-gray-600">자동 이메일 발송 및 스케줄 관리</p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={exportEmailLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            로그 내보내기
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {emailLogs.length}
                </div>
                <div className="text-sm text-gray-600">총 발송</div>
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
                <div className="text-sm text-gray-600">발송 성공</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {scheduledEmails.filter(e => e.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-600">예약됨</div>
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
                <div className="text-sm text-gray-600">발송 실패</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">발송 로그</TabsTrigger>
          <TabsTrigger value="scheduled">예약된 이메일</TabsTrigger>
          <TabsTrigger value="send">이메일 발송</TabsTrigger>
          <TabsTrigger value="templates">템플릿 관리</TabsTrigger>
        </TabsList>

        {/* 발송 로그 탭 */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>이메일 발송 로그</CardTitle>
              <CardDescription>
                최근 발송된 이메일 내역을 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 필터 */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="이메일 주소 또는 제목으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="sent">발송 완료</SelectItem>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="error">오류</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 로그 목록 */}
              <div className="space-y-3">
                {filteredEmailLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium">{getEmailTypeLabel(log.template_type)}</span>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>수신자:</strong> {log.recipient_email}</p>
                        <p><strong>제목:</strong> {log.subject}</p>
                        <p><strong>발송일시:</strong> {formatDateTime(log.created_at)}</p>
                        {log.error_message && (
                          <p className="text-red-600"><strong>오류:</strong> {log.error_message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEmailLogs.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  조건에 맞는 이메일 로그가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예약된 이메일 탭 */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>예약된 이메일</CardTitle>
              <CardDescription>
                자동 발송 예정인 이메일 목록입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledEmails.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{getEmailTypeLabel(schedule.email_type)}</h4>
                        {getStatusBadge(schedule.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>캠페인:</strong> {schedule.campaigns?.title}</p>
                        <p><strong>예약일시:</strong> {formatDateTime(schedule.scheduled_at)}</p>
                        {schedule.completed_at && (
                          <p><strong>완료일시:</strong> {formatDateTime(schedule.completed_at)}</p>
                        )}
                      </div>
                    </div>
                    
                    {schedule.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteScheduledEmail(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {scheduledEmails.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  예약된 이메일이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이메일 발송 탭 */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 테스트 이메일 발송 */}
            <Card>
              <CardHeader>
                <CardTitle>테스트 이메일 발송</CardTitle>
                <CardDescription>
                  개별 이메일 템플릿을 테스트할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>이메일 타입</Label>
                  <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
                    <SelectTrigger>
                      <SelectValue placeholder="이메일 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>수신자 이메일</Label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    id="testEmail"
                  />
                </div>
                
                <Button 
                  onClick={() => {
                    const email = document.getElementById('testEmail').value
                    if (email && selectedEmailType) {
                      sendTestEmail(selectedEmailType, email)
                    }
                  }}
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      테스트 발송
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 일괄 이메일 발송 */}
            <Card>
              <CardHeader>
                <CardTitle>일괄 이메일 발송</CardTitle>
                <CardDescription>
                  캠페인 참가자들에게 일괄 이메일을 발송합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>캠페인 선택</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger>
                      <SelectValue placeholder="캠페인 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>이메일 타입</Label>
                  <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
                    <SelectTrigger>
                      <SelectValue placeholder="이메일 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => sendBulkEmail(selectedCampaign, selectedEmailType)}
                    disabled={sending || !selectedCampaign || !selectedEmailType}
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        발송 중...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        일괄 발송
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => scheduleDeadlineReminders(selectedCampaign)}
                    disabled={sending || !selectedCampaign}
                    variant="outline"
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        예약 중...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        마감일 알림 예약
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 템플릿 관리 탭 */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>이메일 템플릿</CardTitle>
              <CardDescription>
                사용 가능한 이메일 템플릿 목록입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {EMAIL_TYPES.map((type) => (
                  <div key={type.value} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{type.label}</h4>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        미리보기
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        편집
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminEmailManagement
