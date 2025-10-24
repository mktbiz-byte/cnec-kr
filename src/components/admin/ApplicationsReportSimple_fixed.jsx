import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Loader2, ArrowLeft, Download, Eye, Check, X, 
  AlertCircle, CheckCircle, Clock, Users, FileText, 
  Calendar, DollarSign, Target, Mail, Phone, MapPin,
  Instagram, Youtube, Hash, ExternalLink, Star,
  UserCheck, UserX, UserPlus, Search, Filter, RefreshCw
} from 'lucide-react'

const ApplicationsReportSimple = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [applications, setApplications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [userProfiles, setUserProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailsModal, setDetailsModal] = useState(false)

  const [filters, setFilters] = useState({
    campaign: 'all',
    status: 'all',
    search: ''
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '신청서 관리',
      subtitle: '모든 캠페인 신청서를 관리합니다',
      totalApplications: '총 신청서',
      pendingApplications: '대기 중',
      approvedApplications: '승인됨',
      rejectedApplications: '거절됨',
      filterByCampaign: '캠페인별 필터',
      filterByStatus: '상태별 필터',
      allCampaigns: '모든 캠페인',
      allStatuses: '모든 상태',
      pending: '대기 중',
      approved: '승인됨',
      rejected: '거절됨',
      completed: '완료됨',
      viewDetails: '상세 보기',
      approve: '승인',
      reject: '거절',
      backToDashboard: '대시보드로 돌아가기',
      loading: '데이터를 불러오는 중...',
      error: '데이터를 불러오는데 실패했습니다.',
      noApplications: '신청서가 없습니다.',
      applicationDetails: '신청서 상세 정보',
      campaignInfo: '캠페인 정보',
      applicantInfo: '신청자 정보',
      answers: '질문 답변',
      additionalInfo: '추가 정보',
      submittedAt: '신청일',
      updatedAt: '수정일',
      statusUpdated: '상태가 업데이트되었습니다.',
      statusUpdateFailed: '상태 업데이트에 실패했습니다.',
      search: '검색',
      refresh: '새로고침',
      name: '이름',
      email: '이메일',
      socialMedia: '소셜 미디어',
      noData: '데이터 없음'
    },
    ja: {
      title: '지원 관리',
      subtitle: 'すべてのキャンペーン지원を管理します',
      totalApplications: '総지원数',
      pendingApplications: '대기 중',
      approvedApplications: '승인됨',
      rejectedApplications: '거부됨済み',
      filterByCampaign: 'キャンペーン別フィルター',
      filterByStatus: 'ステータス別フィルター',
      allCampaigns: 'すべてのキャンペーン',
      allStatuses: 'すべてのステータス',
      pending: '대기 중',
      approved: '승인됨',
      rejected: '거부됨済み',
      completed: '완료',
      viewDetails: '상세を見る',
      approve: '승인',
      reject: '거부됨',
      backToDashboard: '대시보드に돌아가기',
      loading: 'データを로딩 중...',
      error: 'データの読み込みに실패했습니다。',
      noApplications: '지원がありません。',
      applicationDetails: '지원상세情報',
      campaignInfo: 'キャンペーン情報',
      applicantInfo: '지원者情報',
      answers: '質問回答',
      additionalInfo: '추가情報',
      submittedAt: '지원日',
      updatedAt: '업데이트日',
      statusUpdated: 'ステータスが업데이트されました。',
      statusUpdateFailed: 'ステータスの업데이트に실패했습니다。',
      search: '검색',
      refresh: '업데이트',
      name: '名前',
      email: 'メール',
      socialMedia: 'ソーシャルメディア',
      noData: 'データなし'
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('신청서 데이터 로드 시작')
      
      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('데이터 로드 타임아웃')), 15000)
      )

      // 병렬로 데이터 로드
      const [applicationsResult, campaignsResult, profilesResult] = await Promise.allSettled([
        Promise.race([database.applications.getAll(), timeout]),
        Promise.race([database.campaigns.getAll(), timeout]),
        Promise.race([database.userProfiles.getAll(), timeout])
      ])

      // 신청서 데이터 처리
      if (applicationsResult.status === 'fulfilled') {
        console.log('신청서 데이터 로드 성공:', applicationsResult.value)
        setApplications(applicationsResult.value || [])
      } else {
        console.warn('신청서 데이터 로드 실패:', applicationsResult.reason)
        setApplications([])
      }

      // 캠페인 데이터 처리
      if (campaignsResult.status === 'fulfilled') {
        console.log('캠페인 데이터 로드 성공:', campaignsResult.value)
        setCampaigns(campaignsResult.value || [])
      } else {
        console.warn('캠페인 데이터 로드 실패:', campaignsResult.reason)
        setCampaigns([])
      }

      // 사용자 프로필 데이터 처리
      if (profilesResult.status === 'fulfilled') {
        console.log('프로필 데이터 로드 성공:', profilesResult.value)
        setUserProfiles(profilesResult.value || [])
      } else {
        console.warn('프로필 데이터 로드 실패:', profilesResult.reason)
        setUserProfiles([])
      }

    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`${t.error}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('상태 업데이트 시작:', applicationId, newStatus)

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('상태 업데이트 타임아웃')), 10000)
      )

      // 상태 업데이트
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      const updatePromise = database.applications.update(applicationId, updateData)
      await Promise.race([updatePromise, timeout])
      
      console.log('상태 업데이트 완료')
      
      setSuccess(t.statusUpdated)
      
      // 로컬 상태 업데이트
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
          : app
      ))

      // 상세 모달이 열려있다면 업데이트
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({
          ...prev,
          status: newStatus,
          updated_at: new Date().toISOString()
        }))
      }
      
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      setError(`${t.statusUpdateFailed}: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const openDetailsModal = (application) => {
    setSelectedApplication(application)
    setDetailsModal(true)
  }

  const getCampaignById = (campaignId) => {
    return campaigns.find(c => c.id === campaignId) || {}
  }

  const getUserProfileById = (userId) => {
    return userProfiles.find(p => p.user_id === userId) || {}
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'secondary', text: t.pending, icon: Clock },
      approved: { variant: 'default', text: t.approved, icon: CheckCircle },
      rejected: { variant: 'destructive', text: t.rejected, icon: X },
      completed: { variant: 'outline', text: t.completed, icon: Star }
    }
    
    const statusInfo = statusMap[status] || statusMap.pending
    const IconComponent = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center">
        <IconComponent className="h-3 w-3 mr-1" />
        {statusInfo.text}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return t.noData
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return t.noData
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ja-JP', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'JPY'
    }).format(amount)
  }

  // 필터링된 신청서
  const filteredApplications = applications.filter(app => {
    const campaign = getCampaignById(app.campaign_id)
    const userProfile = getUserProfileById(app.user_id)
    
    // 캠페인 필터
    if (filters.campaign !== 'all' && app.campaign_id !== parseInt(filters.campaign)) {
      return false
    }
    
    // 상태 필터
    if (filters.status !== 'all' && app.status !== filters.status) {
      return false
    }
    
    // 검색 필터
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const campaignTitle = campaign.title?.toLowerCase() || ''
      const userName = userProfile.name?.toLowerCase() || ''
      const userEmail = userProfile.email?.toLowerCase() || ''
      
      if (!campaignTitle.includes(searchTerm) && 
          !userName.includes(searchTerm) && 
          !userEmail.includes(searchTerm)) {
        return false
      }
    }
    
    return true
  })

  // 통계 계산
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t.loading}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-2">{t.subtitle}</p>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.refresh}
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalApplications}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.pendingApplications}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.approvedApplications}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <X className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.rejectedApplications}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.filterByCampaign}
                </label>
                <Select
                  value={filters.campaign}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, campaign: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCampaigns}</SelectItem>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.filterByStatus}
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="approved">{t.approved}</SelectItem>
                    <SelectItem value="rejected">{t.rejected}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.search}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="캠페인명, 신청자명, 이메일로 검색..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 신청서 목록 */}
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const campaign = getCampaignById(application.campaign_id)
            const userProfile = getUserProfileById(application.user_id)
            
            return (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.title || t.noData}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>신청자:</strong> {userProfile.name || t.noData}</p>
                          <p><strong>이메일:</strong> {userProfile.email || t.noData}</p>
                        </div>
                        <div>
                          <p><strong>브랜드:</strong> {campaign.brand || t.noData}</p>
                          <p><strong>보상금:</strong> {formatCurrency(campaign.reward_amount)}</p>
                        </div>
                        <div>
                          <p><strong>신청일:</strong> {formatDate(application.created_at)}</p>
                          <p><strong>수정일:</strong> {formatDate(application.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsModal(application)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.viewDetails}
                      </Button>
                      
                      {application.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'approved')}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t.approve}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={processing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t.reject}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.noApplications}
            </h3>
            <p className="text-gray-600">
              필터 조건을 변경하거나 새로고침해보세요.
            </p>
          </div>
        )}

        {/* 상세 정보 모달 */}
        <Dialog open={detailsModal} onOpenChange={setDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.applicationDetails}</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* 캠페인 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.campaignInfo}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const campaign = getCampaignById(selectedApplication.campaign_id)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><strong>제목:</strong> {campaign.title || t.noData}</p>
                            <p><strong>브랜드:</strong> {campaign.brand || t.noData}</p>
                            <p><strong>보상금:</strong> {formatCurrency(campaign.reward_amount)}</p>
                          </div>
                          <div>
                            <p><strong>모집 인원:</strong> {campaign.max_participants || t.noData}명</p>
                            <p><strong>마감일:</strong> {formatDate(campaign.application_deadline)}</p>
                            <p><strong>상태:</strong> {getStatusBadge(selectedApplication.status)}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <Separator />

                {/* 신청자 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.applicantInfo}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const userProfile = getUserProfileById(selectedApplication.user_id)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><strong>{t.name}:</strong> {userProfile.name || t.noData}</p>
                            <p><strong>{t.email}:</strong> {userProfile.email || t.noData}</p>
                            <p><strong>나이:</strong> {userProfile.age || t.noData}</p>
                            <p><strong>피부 타입:</strong> {userProfile.skin_type || t.noData}</p>
                          </div>
                          <div>
                            <p><strong>{t.socialMedia}:</strong></p>
                            {userProfile.instagram_url && (
                              <p className="text-sm">
                                <Instagram className="h-4 w-4 inline mr-1" />
                                <a href={userProfile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Instagram
                                </a>
                              </p>
                            )}
                            {userProfile.youtube_url && (
                              <p className="text-sm">
                                <Youtube className="h-4 w-4 inline mr-1" />
                                <a href={userProfile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  YouTube
                                </a>
                              </p>
                            )}
                            {userProfile.tiktok_url && (
                              <p className="text-sm">
                                <Hash className="h-4 w-4 inline mr-1" />
                                <a href={userProfile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  TikTok
                                </a>
                              </p>
                            )}
                            {!userProfile.instagram_url && !userProfile.youtube_url && !userProfile.tiktok_url && (
                              <p className="text-sm text-gray-500">{t.noData}</p>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <Separator />

                {/* 질문 답변 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.answers}</h3>
                  <div className="space-y-4">
                    {(() => {
                      const campaign = getCampaignById(selectedApplication.campaign_id)
                      return (
                        <>
                          {campaign.question_1 && selectedApplication.answer_1 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium mb-2">{campaign.question_1}</p>
                              <p className="text-gray-700">{selectedApplication.answer_1}</p>
                            </div>
                          )}
                          {campaign.question_2 && selectedApplication.answer_2 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium mb-2">{campaign.question_2}</p>
                              <p className="text-gray-700">{selectedApplication.answer_2}</p>
                            </div>
                          )}
                          {campaign.question_3 && selectedApplication.answer_3 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium mb-2">{campaign.question_3}</p>
                              <p className="text-gray-700">{selectedApplication.answer_3}</p>
                            </div>
                          )}
                          {campaign.question_4 && selectedApplication.answer_4 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-medium mb-2">{campaign.question_4}</p>
                              <p className="text-gray-700">{selectedApplication.answer_4}</p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {selectedApplication.additional_info && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t.additionalInfo}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.additional_info}</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* 상태 변경 버튼 */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p><strong>{t.submittedAt}:</strong> {formatDate(selectedApplication.created_at)}</p>
                    <p><strong>{t.updatedAt}:</strong> {formatDate(selectedApplication.updated_at)}</p>
                  </div>
                  
                  {selectedApplication.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {t.approve}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        {t.reject}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ApplicationsReportSimple
