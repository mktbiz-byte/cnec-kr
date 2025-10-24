import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, Search, Filter,
  Users, FileText, AlertCircle, Download, ExternalLink,
  Calendar, Mail, Instagram, Youtube, Video, RefreshCw,
  Link, FolderOpen, Presentation
} from 'lucide-react'

const ApplicationsReportSimple = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const campaignIdFromUrl = searchParams.get('campaign')

  const [applications, setApplications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedCampaign, setSelectedCampaign] = useState(campaignIdFromUrl || '')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [driveModal, setDriveModal] = useState(false)
  const [driveForm, setDriveForm] = useState({
    google_drive_url: '',
    google_slides_url: '',
    notes: ''
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '신청서 관리',
      subtitle: '모든 캠페인 신청서를 관리합니다',
      totalApplications: '총 신청서',
      pendingApplications: '대기 중',
      virtuallySelected: '가상 선택',
      approvedApplications: '승인됨',
      rejectedApplications: '거절됨',
      filterByCampaign: '캠페인별 필터',
      filterByStatus: '상태별 필터',
      searchPlaceholder: '이름, 이메일, 캠페인명으로 검색...',
      allCampaigns: '모든 캠페인',
      allStatuses: '모든 상태',
      pending: '대기 중',
      virtualSelected: '가상 선택',
      approved: '승인됨',
      rejected: '거절됨',
      viewDetails: '상세 보기',
      approve: '승인',
      reject: '거절',
      virtualSelect: '가상 선택',
      cancelVirtualSelect: '가상 선택 취소',
      provideDriveAccess: '드라이브 제공',
      applicationDetails: '신청서 상세 정보',
      campaignInfo: '캠페인 정보',
      applicantInfo: '신청자 정보',
      questionsAndAnswers: '질문 및 답변',
      name: '이름',
      email: '이메일',
      age: '나이',
      skinType: '피부 타입',
      bio: '자기소개',
      socialMedia: '소셜 미디어',
      appliedAt: '신청일',
      updatedAt: '수정일',
      virtualSelectedAt: '가상 선택일',
      approvedAt: '승인일',
      rejectedAt: '거절일',
      status: '상태',
      actions: '작업',
      close: '닫기',
      confirm: '확인',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다.',
      success: '성공적으로 처리되었습니다.',
      noApplications: '신청서가 없습니다.',
      confirmApprove: '이 신청서를 승인하시겠습니까?',
      confirmReject: '이 신청서를 거절하시겠습니까?',
      confirmVirtualSelect: '이 신청자를 가상 선택하시겠습니까?',
      confirmCancelVirtualSelect: '가상 선택을 취소하시겠습니까?',
      driveAccessTitle: '구글 드라이브 및 슬라이드 제공',
      driveAccessDescription: '승인된 참가자에게 구글 드라이브(영상 업로드용)와 구글 슬라이드(가이드)를 제공합니다.',
      googleDriveUrl: '구글 드라이브 URL (영상 업로드용)',
      googleSlidesUrl: '구글 슬라이드 URL (가이드)',
      notes: '추가 메모',
      save: '저장',
      exportExcel: 'Excel 내보내기'
    },
    ja: {
      title: '申請書管理',
      subtitle: 'すべてのキャンペーン申請書を管理します',
      totalApplications: '総申請書',
      pendingApplications: '待機中',
      virtuallySelected: '仮選択',
      approvedApplications: '승인됨',
      rejectedApplications: '拒否済み',
      filterByCampaign: 'キャンペーン別フィルター',
      filterByStatus: 'ステータス別フィルター',
      searchPlaceholder: '名前、メール、캠페인명で검색...',
      allCampaigns: 'すべてのキャンペーン',
      allStatuses: 'すべてのステータス',
      pending: '待機中',
      virtualSelected: '仮選択',
      approved: '승인됨',
      rejected: '拒否済み',
      viewDetails: '상세を見る',
      approve: '승인',
      reject: '拒否',
      virtualSelect: '仮選択',
      cancelVirtualSelect: '仮選択取消',
      provideDriveAccess: 'ドライブ提供',
      applicationDetails: '申請書상세情報',
      campaignInfo: 'キャンペーン情報',
      applicantInfo: '申請者情報',
      questionsAndAnswers: '質問と回答',
      name: '名前',
      email: 'メール',
      age: '年齢',
      skinType: '肌タイプ',
      bio: '自己紹介',
      socialMedia: 'ソーシャルメディア',
      appliedAt: '申請日',
      updatedAt: '업데이트日',
      virtualSelectedAt: '仮選択日',
      approvedAt: '승인日',
      rejectedAt: '拒否日',
      status: 'ステータス',
      actions: 'アクション',
      close: '닫기',
      confirm: '확인',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다。',
      success: '正常に処理されました。',
      noApplications: '申請書がありません。',
      confirmApprove: 'この申請書を승인しますか？',
      confirmReject: 'この申請書を拒否しますか？',
      confirmVirtualSelect: 'この申請者を仮選択しますか？',
      confirmCancelVirtualSelect: '仮選択を取り消しますか？',
      driveAccessTitle: 'Googleドライブ及びスライド提供',
      driveAccessDescription: '승인された参加者にGoogleドライブ（動画업로드用）とGoogleスライド（ガイド）を提供します。',
      googleDriveUrl: 'Googleドライブ URL（動画업로드用）',
      googleSlidesUrl: 'Googleスライド URL（ガイド）',
      notes: '추가メモ',
      save: '저장',
      exportExcel: 'Excel エクスポート'
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

      // 캠페인과 신청서 데이터 병렬 로드
      const [campaignsData, applicationsData] = await Promise.race([
        Promise.all([
          database.campaigns.getAll(),
          database.applications.getAll()
        ]),
        timeout
      ])
      
      console.log('데이터 로드 성공:', { campaigns: campaignsData?.length, applications: applicationsData?.length })
      
      setCampaigns(campaignsData || [])
      setApplications(applicationsData || [])
      
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`${t.error}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('신청서 상태 업데이트:', applicationId, newStatus)

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // 상태별 타임스탬프 추가
      if (newStatus === 'virtual_selected') {
        updateData.virtual_selected_at = new Date().toISOString()
      } else if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString()
      } else if (newStatus === 'rejected') {
        updateData.rejected_at = new Date().toISOString()
      }

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('상태 업데이트 타임아웃')), 15000)
      )

      const updatePromise = database.applications.update(applicationId, updateData)
      await Promise.race([updatePromise, timeout])
      
      console.log('상태 업데이트 완료')
      
      setSuccess(t.success)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      setError(`상태 업데이트에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleStatusChange = async (application, newStatus) => {
    let confirmMessage = ''
    
    switch (newStatus) {
      case 'approved':
        confirmMessage = t.confirmApprove
        break
      case 'rejected':
        confirmMessage = t.confirmReject
        break
      case 'virtual_selected':
        confirmMessage = t.confirmVirtualSelect
        break
      case 'pending':
        confirmMessage = t.confirmCancelVirtualSelect
        break
      default:
        return
    }

    if (confirm(confirmMessage)) {
      await updateApplicationStatus(application.id, newStatus)
    }
  }

  const openDriveModal = (application) => {
    setSelectedApplication(application)
    setDriveForm({
      google_drive_url: application.google_drive_url || '',
      google_slides_url: application.google_slides_url || '',
      notes: application.drive_notes || ''
    })
    setDriveModal(true)
  }

  const handleSaveDriveAccess = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('드라이브 접근 정보 저장:', selectedApplication.id, driveForm)

      const updateData = {
        google_drive_url: driveForm.google_drive_url.trim() || null,
        google_slides_url: driveForm.google_slides_url.trim() || null,
        drive_notes: driveForm.notes.trim() || null,
        drive_provided_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('드라이브 정보 저장 타임아웃')), 15000)
      )

      const updatePromise = database.applications.update(selectedApplication.id, updateData)
      await Promise.race([updatePromise, timeout])
      
      console.log('드라이브 정보 저장 완료')
      
      setSuccess('구글 드라이브 및 슬라이드 정보가 저장되었습니다.')
      setDriveModal(false)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('드라이브 정보 저장 오류:', error)
      setError(`드라이브 정보 저장에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const openDetailModal = (application) => {
    setSelectedApplication(application)
    setDetailModal(true)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'secondary', text: t.pending, icon: Clock },
      virtual_selected: { variant: 'default', text: t.virtualSelected, icon: Eye },
      approved: { variant: 'default', text: t.approved, icon: CheckCircle },
      rejected: { variant: 'destructive', text: t.rejected, icon: XCircle }
    }
    
    const statusInfo = statusMap[status] || statusMap.pending
    const IconComponent = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
        <IconComponent className="h-3 w-3" />
        <span>{statusInfo.text}</span>
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ja-JP', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'JPY'
    }).format(amount)
  }

  // 필터링된 신청서
  const filteredApplications = applications.filter(app => {
    const matchesCampaign = !selectedCampaign || app.campaign_id === selectedCampaign
    const matchesStatus = !statusFilter || app.status === statusFilter
    const matchesSearch = !searchTerm || 
      app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaigns.find(c => c.id === app.campaign_id)?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCampaign && matchesStatus && matchesSearch
  })

  // 통계 계산
  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status === 'pending').length,
    virtualSelected: filteredApplications.filter(app => app.status === 'virtual_selected').length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length
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
            <div className="flex space-x-2">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
              <Button
                onClick={() => {/* Excel 내보내기 기능 */}}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {t.exportExcel}
              </Button>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
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
            <CardContent className="p-4">
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
            <CardContent className="p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.virtuallySelected}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.virtualSelected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
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
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.rejectedApplications}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="campaign-filter">{t.filterByCampaign}</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.allCampaigns} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t.allCampaigns}</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">{t.filterByStatus}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t.allStatuses}</SelectItem>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="virtual_selected">{t.virtualSelected}</SelectItem>
                    <SelectItem value="approved">{t.approved}</SelectItem>
                    <SelectItem value="rejected">{t.rejected}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">{t.searchPlaceholder}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
            const campaign = campaigns.find(c => c.id === application.campaign_id)
            
            return (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user_name || '이름 없음'}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">캠페인:</p>
                          <p>{campaign?.title || '캠페인 정보 없음'}</p>
                        </div>
                        <div>
                          <p className="font-medium">이메일:</p>
                          <p>{application.user_email || '-'}</p>
                        </div>
                        <div>
                          <p className="font-medium">신청일:</p>
                          <p>{formatDate(application.created_at)}</p>
                        </div>
                      </div>

                      {/* 구글 드라이브/슬라이드 정보 표시 */}
                      {(application.google_drive_url || application.google_slides_url) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">제공된 자료:</p>
                          <div className="flex space-x-4">
                            {application.google_drive_url && (
                              <a
                                href={application.google_drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FolderOpen className="h-4 w-4 mr-1" />
                                구글 드라이브 (영상 업로드)
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                            {application.google_slides_url && (
                              <a
                                href={application.google_slides_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Presentation className="h-4 w-4 mr-1" />
                                구글 슬라이드 (가이드)
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(application)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.viewDetails}
                      </Button>

                      {application.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'virtual_selected')}
                            disabled={processing}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t.virtualSelect}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'approved')}
                            disabled={processing}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t.approve}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'rejected')}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t.reject}
                          </Button>
                        </>
                      )}

                      {application.status === 'virtual_selected' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'pending')}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t.cancelVirtualSelect}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'approved')}
                            disabled={processing}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t.approve}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(application, 'rejected')}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t.reject}
                          </Button>
                        </>
                      )}

                      {application.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDriveModal(application)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          {t.provideDriveAccess}
                        </Button>
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
              선택한 조건에 맞는 신청서가 없습니다.
            </p>
          </div>
        )}

        {/* 상세 정보 모달 */}
        <Dialog open={detailModal} onOpenChange={setDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.applicationDetails}</DialogTitle>
              <DialogDescription>
                신청서의 상세 정보를 확인합니다.
              </DialogDescription>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* 캠페인 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.campaignInfo}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {(() => {
                      const campaign = campaigns.find(c => c.id === selectedApplication.campaign_id)
                      return campaign ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">캠페인명:</p>
                            <p className="font-medium">{campaign.title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">브랜드:</p>
                            <p className="font-medium">{campaign.brand}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">보상금:</p>
                            <p className="font-medium">{formatCurrency(campaign.reward_amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">마감일:</p>
                            <p className="font-medium">{formatDate(campaign.application_deadline)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">캠페인 정보를 찾을 수 없습니다.</p>
                      )
                    })()}
                  </div>
                </div>

                {/* 신청자 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.applicantInfo}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t.name}:</p>
                        <p className="font-medium">{selectedApplication.user_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.email}:</p>
                        <p className="font-medium">{selectedApplication.user_email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.age}:</p>
                        <p className="font-medium">{selectedApplication.user_age || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t.skinType}:</p>
                        <p className="font-medium">{selectedApplication.user_skin_type || '-'}</p>
                      </div>
                    </div>
                    
                    {selectedApplication.user_bio && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{t.bio}:</p>
                        <p className="font-medium">{selectedApplication.user_bio}</p>
                      </div>
                    )}

                    {/* 소셜 미디어 링크 */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">{t.socialMedia}:</p>
                      <div className="flex space-x-4">
                        {selectedApplication.user_instagram_url && (
                          <a
                            href={selectedApplication.user_instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-pink-600 hover:text-pink-800"
                          >
                            <Instagram className="h-4 w-4 mr-1" />
                            Instagram
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                        {selectedApplication.user_youtube_url && (
                          <a
                            href={selectedApplication.user_youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-red-600 hover:text-red-800"
                          >
                            <Youtube className="h-4 w-4 mr-1" />
                            YouTube
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                        {selectedApplication.user_tiktok_url && (
                          <a
                            href={selectedApplication.user_tiktok_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-gray-800 hover:text-gray-900"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            TikTok
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 질문 및 답변 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t.questionsAndAnswers}</h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((num) => {
                      const question = selectedApplication[`question_${num}`]
                      const answer = selectedApplication[`answer_${num}`]
                      
                      if (!question && !answer) return null
                      
                      return (
                        <div key={num} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">질문 {num}:</p>
                          <p className="font-medium mb-2">{question || '질문 없음'}</p>
                          <p className="text-sm text-gray-600 mb-1">답변:</p>
                          <p className="text-gray-800">{answer || '답변 없음'}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 타임스탬프 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">처리 이력</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t.appliedAt}:</p>
                        <p className="font-medium">{formatDate(selectedApplication.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t.updatedAt}:</p>
                        <p className="font-medium">{formatDate(selectedApplication.updated_at)}</p>
                      </div>
                      {selectedApplication.virtual_selected_at && (
                        <div>
                          <p className="text-gray-600">{t.virtualSelectedAt}:</p>
                          <p className="font-medium">{formatDate(selectedApplication.virtual_selected_at)}</p>
                        </div>
                      )}
                      {selectedApplication.approved_at && (
                        <div>
                          <p className="text-gray-600">{t.approvedAt}:</p>
                          <p className="font-medium">{formatDate(selectedApplication.approved_at)}</p>
                        </div>
                      )}
                      {selectedApplication.rejected_at && (
                        <div>
                          <p className="text-gray-600">{t.rejectedAt}:</p>
                          <p className="font-medium">{formatDate(selectedApplication.rejected_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setDetailModal(false)}>
                    {t.close}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 구글 드라이브 제공 모달 */}
        <Dialog open={driveModal} onOpenChange={setDriveModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.driveAccessTitle}</DialogTitle>
              <DialogDescription>
                {t.driveAccessDescription}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="google_drive_url">{t.googleDriveUrl}</Label>
                <Input
                  id="google_drive_url"
                  value={driveForm.google_drive_url}
                  onChange={(e) => setDriveForm(prev => ({ ...prev, google_drive_url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div>
                <Label htmlFor="google_slides_url">{t.googleSlidesUrl}</Label>
                <Input
                  id="google_slides_url"
                  value={driveForm.google_slides_url}
                  onChange={(e) => setDriveForm(prev => ({ ...prev, google_slides_url: e.target.value }))}
                  placeholder="https://docs.google.com/presentation/..."
                />
              </div>

              <div>
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea
                  id="notes"
                  value={driveForm.notes}
                  onChange={(e) => setDriveForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="추가 안내사항이나 메모를 입력하세요..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDriveModal(false)}
                  disabled={processing}
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSaveDriveAccess}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ApplicationsReportSimple
