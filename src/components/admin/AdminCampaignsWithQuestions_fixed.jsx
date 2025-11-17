import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, supabase } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Loader2, Plus, Edit, Trash2, Eye, Download, Upload, 
  AlertCircle, CheckCircle, Clock, DollarSign, FileText, 
  ArrowRight, Copy, ExternalLink, Search, Filter, RefreshCw,
  Calendar, Users, Target, X, Save, Building, Link as LinkIcon,
  HelpCircle, Minus
} from 'lucide-react'

const AdminCampaignsWithQuestions = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [applicationsModal, setApplicationsModal] = useState(false)
  
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    brand: '',
    description: '',
    requirements: '',
    reward_amount: '',
    max_participants: '',
    application_deadline: '',
    start_date: '',
    end_date: '',
    status: 'active',
    google_drive_url: '',
    google_slides_url: '',
    question_1: '',
    question_1_required: false,
    question_2: '',
    question_2_required: false,
    question_3: '',
    question_3_required: false,
    question_4: '',
    question_4_required: false
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '캠페인 관리',
      createCampaign: '새 캠페인 생성',
      editCampaign: '캠페인 수정',
      deleteCampaign: '캠페인 삭제',
      viewApplications: '신청자 보기',
      campaignTitle: '캠페인 제목',
      brand: '브랜드',
      description: '설명',
      requirements: '참여 조건',
      rewardAmount: '보상금',
      maxParticipants: '최대 참여자',
      applicationDeadline: '신청 마감일',
      startDate: '시작일',
      endDate: '종료일',
      status: '상태',
      active: '활성',
      inactive: '비활성',
      completed: '완료',
      cancelled: '취소',
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      loading: '로딩 중...',
      processing: '처리 중...',
      success: '성공',
      error: '오류',
      confirmDelete: '정말로 이 캠페인을 삭제하시겠습니까?',
      campaignCreated: '캠페인이 성공적으로 생성되었습니다.',
      campaignUpdated: '캠페인이 성공적으로 수정되었습니다.',
      campaignDeleted: '캠페인이 성공적으로 삭제되었습니다.',
      createFailed: '캠페인 생성에 실패했습니다.',
      updateFailed: '캠페인 수정에 실패했습니다.',
      deleteFailed: '캠페인 삭제에 실패했습니다.',
      question: '질문',
      required: '필수',
      optional: '선택',
      googleDriveUrl: 'Google Drive URL',
      googleSlidesUrl: 'Google Slides URL'
    },
    ja: {
      title: '캠페인 관리',
      createCampaign: '新しい캠페인 생성',
      editCampaign: 'キャンペーン편집',
      deleteCampaign: 'キャンペーン삭제',
      viewApplications: '지원者を見る',
      campaignTitle: '캠페인 제목',
      brand: 'ブランド',
      description: '설명',
      requirements: '参加条건',
      rewardAmount: '보상金',
      maxParticipants: '最大参加者',
      applicationDeadline: '지원締切',
      startDate: '시작일',
      endDate: '종료日',
      status: 'ステータス',
      active: 'アクティブ',
      inactive: '非アクティブ',
      completed: '완료',
      cancelled: '취소',
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      loading: '로딩 중...',
      processing: '処理中...',
      success: '成功',
      error: 'エラー',
      confirmDelete: '本当にこのキャンペーンを삭제しますか？',
      campaignCreated: 'キャンペーンが正常に作成されました。',
      campaignUpdated: 'キャンペーンが正常に업데이트されました。',
      campaignDeleted: 'キャンペーンが正常に삭제されました。',
      createFailed: 'キャンペーンの作成に실패했습니다。',
      updateFailed: 'キャンペーンの업데이트に실패했습니다。',
      deleteFailed: 'キャンペーンの삭제に실패했습니다。',
      question: '質問',
      required: '必須',
      optional: '任意',
      googleDriveUrl: 'Google Drive URL',
      googleSlidesUrl: 'Google Slides URL'
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
      
      console.log('캠페인 데이터 로드 시작')
      
      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('데이터 로드 타임아웃')), 15000)
      )

      // 캠페인 데이터 로드
      const campaignsPromise = database.campaigns.getAll()
      const campaignsData = await Promise.race([campaignsPromise, timeout])
      
      console.log('로드된 캠페인 데이터:', campaignsData)
      setCampaigns(campaignsData || [])

      // 신청서 데이터 로드 (선택적)
      try {
        const applicationsPromise = database.applications.getAll()
        const applicationsData = await Promise.race([applicationsPromise, timeout])
        console.log('로드된 신청서 데이터:', applicationsData)
        setApplications(applicationsData || [])
      } catch (appError) {
        console.warn('신청서 데이터 로드 실패:', appError)
        setApplications([])
      }

    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`데이터를 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCampaignForm({
      title: '',
      brand: '',
      description: '',
      requirements: '',
      reward_amount: '',
      max_participants: '',
      application_deadline: '',
      start_date: '',
      end_date: '',
      status: 'active',
      google_drive_url: '',
      google_slides_url: '',
      question_1: '',
      question_1_required: false,
      question_2: '',
      question_2_required: false,
      question_3: '',
      question_3_required: false,
      question_4: '',
      question_4_required: false
    })
  }

  const handleCreateCampaign = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('캠페인 생성 시작:', campaignForm)

      // 필수 필드 검증
      if (!campaignForm.title.trim()) {
        setError('캠페인 제목을 입력해주세요.')
        return
      }
      if (!campaignForm.brand.trim()) {
        setError('브랜드명을 입력해주세요.')
        return
      }

      // 날짜 형식 변환
      const formatDate = (dateStr) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        return date.toISOString()
      }

      // 캠페인 데이터 준비
      const campaignData = {
        title: campaignForm.title.trim(),
        brand: campaignForm.brand.trim(),
        description: campaignForm.description.trim() || null,
        requirements: campaignForm.requirements.trim() || null,
        reward_amount: parseInt(campaignForm.reward_amount) || 0,
        max_participants: parseInt(campaignForm.max_participants) || 0,
        application_deadline: formatDate(campaignForm.application_deadline),
        start_date: formatDate(campaignForm.start_date),
        end_date: formatDate(campaignForm.end_date),
        status: campaignForm.status || 'active',
        google_drive_url: campaignForm.google_drive_url.trim() || null,
        google_slides_url: campaignForm.google_slides_url.trim() || null,
        question_1: campaignForm.question_1.trim() || null,
        question_1_required: campaignForm.question_1_required || false,
        question_2: campaignForm.question_2.trim() || null,
        question_2_required: campaignForm.question_2_required || false,
        question_3: campaignForm.question_3.trim() || null,
        question_3_required: campaignForm.question_3_required || false,
        question_4: campaignForm.question_4.trim() || null,
        question_4_required: campaignForm.question_4_required || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('생성할 캠페인 데이터:', campaignData)

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('캠페인 생성 타임아웃')), 15000)
      )

      // 캠페인 생성
      const createPromise = database.campaigns.create(campaignData)
      const result = await Promise.race([createPromise, timeout])
      
      console.log('캠페인 생성 결과:', result)
      
      setSuccess(t.campaignCreated)
      setCreateModal(false)
      resetForm()
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('캠페인 생성 오류:', error)
      setError(`${t.createFailed}: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateCampaign = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      if (!selectedCampaign?.id) {
        setError('선택된 캠페인이 없습니다.')
        return
      }

      console.log('캠페인 수정 시작:', campaignForm)

      // 필수 필드 검증
      if (!campaignForm.title.trim()) {
        setError('캠페인 제목을 입력해주세요.')
        return
      }
      if (!campaignForm.brand.trim()) {
        setError('브랜드명을 입력해주세요.')
        return
      }

      // 날짜 형식 변환
      const formatDate = (dateStr) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        return date.toISOString()
      }

      // 수정할 데이터 준비
      const updateData = {
        title: campaignForm.title.trim(),
        brand: campaignForm.brand.trim(),
        description: campaignForm.description.trim() || null,
        requirements: campaignForm.requirements.trim() || null,
        reward_amount: parseInt(campaignForm.reward_amount) || 0,
        max_participants: parseInt(campaignForm.max_participants) || 0,
        application_deadline: formatDate(campaignForm.application_deadline),
        start_date: formatDate(campaignForm.start_date),
        end_date: formatDate(campaignForm.end_date),
        status: campaignForm.status || 'active',
        google_drive_url: campaignForm.google_drive_url.trim() || null,
        google_slides_url: campaignForm.google_slides_url.trim() || null,
        question_1: campaignForm.question_1.trim() || null,
        question_1_required: campaignForm.question_1_required || false,
        question_2: campaignForm.question_2.trim() || null,
        question_2_required: campaignForm.question_2_required || false,
        question_3: campaignForm.question_3.trim() || null,
        question_3_required: campaignForm.question_3_required || false,
        question_4: campaignForm.question_4.trim() || null,
        question_4_required: campaignForm.question_4_required || false,
        updated_at: new Date().toISOString()
      }
      
      console.log('수정할 캠페인 데이터:', updateData)

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('캠페인 수정 타임아웃')), 15000)
      )

      // 캠페인 수정
      const updatePromise = database.campaigns.update(selectedCampaign.id, updateData)
      const result = await Promise.race([updatePromise, timeout])
      
      console.log('캠페인 수정 결과:', result)
      
      setSuccess(t.campaignUpdated)
      setEditModal(false)
      setSelectedCampaign(null)
      resetForm()
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('캠페인 수정 오류:', error)
      setError(`${t.updateFailed}: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCampaign = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      if (!selectedCampaign?.id) {
        setError('선택된 캠페인이 없습니다.')
        return
      }

      console.log('캠페인 삭제 시작:', selectedCampaign.id)

      // 타임아웃 설정
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('캠페인 삭제 타임아웃')), 15000)
      )

      // 캠페인 삭제
      const deletePromise = database.campaigns.delete(selectedCampaign.id)
      await Promise.race([deletePromise, timeout])
      
      console.log('캠페인 삭제 완료')
      
      setSuccess(t.campaignDeleted)
      setCancelModal(false)
      setSelectedCampaign(null)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('캠페인 삭제 오류:', error)
      setError(`${t.deleteFailed}: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const openEditModal = (campaign) => {
    setSelectedCampaign(campaign)
    
    // 날짜 형식 변환 (ISO -> YYYY-MM-DD)
    const formatDateForInput = (isoDate) => {
      if (!isoDate) return ''
      return new Date(isoDate).toISOString().split('T')[0]
    }

    setCampaignForm({
      title: campaign.title || '',
      brand: campaign.brand || '',
      description: campaign.description || '',
      requirements: campaign.requirements || '',
      reward_amount: campaign.reward_amount?.toString() || '',
      max_participants: campaign.max_participants?.toString() || '',
      application_deadline: formatDateForInput(campaign.application_deadline),
      start_date: formatDateForInput(campaign.start_date),
      end_date: formatDateForInput(campaign.end_date),
      status: campaign.status || 'active',
      google_drive_url: campaign.google_drive_url || '',
      google_slides_url: campaign.google_slides_url || '',
      question_1: campaign.question_1 || '',
      question_1_required: campaign.question_1_required || false,
      question_2: campaign.question_2 || '',
      question_2_required: campaign.question_2_required || false,
      question_3: campaign.question_3 || '',
      question_3_required: campaign.question_3_required || false,
      question_4: campaign.question_4 || '',
      question_4_required: campaign.question_4_required || false
    })
    
    setEditModal(true)
  }

  const openDeleteModal = (campaign) => {
    setSelectedCampaign(campaign)
    setCancelModal(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return ''
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'KRW'
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: 'default', text: t.active },
      inactive: { variant: 'secondary', text: t.inactive },
      completed: { variant: 'outline', text: t.completed },
      cancelled: { variant: 'destructive', text: t.cancelled }
    }
    
    const statusInfo = statusMap[status] || statusMap.active
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.text}
      </Badge>
    )
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
              <p className="text-gray-600 mt-2">
                총 {campaigns.length}개의 캠페인
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm()
                setCreateModal(true)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.createCampaign}
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

        {/* 캠페인 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{campaign.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {campaign.brand}
                    </CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">보상금:</span>
                    <span className="font-medium">{formatCurrency(campaign.reward_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">모집 인원:</span>
                    <span className="font-medium">{campaign.max_participants}명</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">마감일:</span>
                    <span className="font-medium">{formatDate(campaign.application_deadline)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(campaign)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              캠페인이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 캠페인을 생성해보세요.
            </p>
            <Button
              onClick={() => {
                resetForm()
                setCreateModal(true)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.createCampaign}
            </Button>
          </div>
        )}

        {/* 캠페인 생성 모달 */}
        <Dialog open={createModal} onOpenChange={setCreateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.createCampaign}</DialogTitle>
              <DialogDescription>
                새로운 캠페인의 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t.campaignTitle} *</Label>
                  <Input
                    id="title"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="캠페인 제목을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">{t.brand} *</Label>
                  <Input
                    id="brand"
                    value={campaignForm.brand}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="브랜드명을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="캠페인 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="requirements">{t.requirements}</Label>
                <Textarea
                  id="requirements"
                  value={campaignForm.requirements}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="참여 조건을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 수치 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reward_amount">{t.rewardAmount}</Label>
                  <Input
                    id="reward_amount"
                    type="number"
                    value={campaignForm.reward_amount}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, reward_amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">{t.maxParticipants}</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={campaignForm.max_participants}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, max_participants: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 날짜 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="application_deadline">{t.applicationDeadline}</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={campaignForm.application_deadline}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, application_deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">{t.startDate}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">{t.endDate}</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* 상태 및 URL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">{t.status}</Label>
                  <Select
                    value={campaignForm.status}
                    onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.active}</SelectItem>
                      <SelectItem value="inactive">{t.inactive}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="google_drive_url">{t.googleDriveUrl}</Label>
                  <Input
                    id="google_drive_url"
                    value={campaignForm.google_drive_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, google_drive_url: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="google_slides_url">{t.googleSlidesUrl}</Label>
                  <Input
                    id="google_slides_url"
                    value={campaignForm.google_slides_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, google_slides_url: e.target.value }))}
                    placeholder="https://docs.google.com/presentation/..."
                  />
                </div>
              </div>

              <Separator />

              {/* 질문 섹션 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">신청자 질문</h3>
                
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`question_${num}`}>{t.question} {num}</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`question_${num}_required`}
                          checked={campaignForm[`question_${num}_required`]}
                          onCheckedChange={(checked) => 
                            setCampaignForm(prev => ({ ...prev, [`question_${num}_required`]: checked }))
                          }
                        />
                        <Label htmlFor={`question_${num}_required`} className="text-sm">
                          {t.required}
                        </Label>
                      </div>
                    </div>
                    <Textarea
                      id={`question_${num}`}
                      value={campaignForm[`question_${num}`]}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, [`question_${num}`]: e.target.value }))}
                      placeholder={`질문 ${num}을 입력하세요 (선택사항)`}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleCreateCampaign}
                disabled={processing || !campaignForm.title || !campaignForm.brand}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t.createCampaign}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModal(false)
                  resetForm()
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 캠페인 수정 모달 */}
        <Dialog open={editModal} onOpenChange={setEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.editCampaign}</DialogTitle>
              <DialogDescription>
                캠페인 정보를 수정해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_title">{t.campaignTitle} *</Label>
                  <Input
                    id="edit_title"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="캠페인 제목을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_brand">{t.brand} *</Label>
                  <Input
                    id="edit_brand"
                    value={campaignForm.brand}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="브랜드명을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_description">{t.description}</Label>
                <Textarea
                  id="edit_description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="캠페인 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="edit_requirements">{t.requirements}</Label>
                <Textarea
                  id="edit_requirements"
                  value={campaignForm.requirements}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="참여 조건을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 수치 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_reward_amount">{t.rewardAmount}</Label>
                  <Input
                    id="edit_reward_amount"
                    type="number"
                    value={campaignForm.reward_amount}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, reward_amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_max_participants">{t.maxParticipants}</Label>
                  <Input
                    id="edit_max_participants"
                    type="number"
                    value={campaignForm.max_participants}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, max_participants: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 날짜 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_application_deadline">{t.applicationDeadline}</Label>
                  <Input
                    id="edit_application_deadline"
                    type="date"
                    value={campaignForm.application_deadline}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, application_deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_start_date">{t.startDate}</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_date">{t.endDate}</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* 상태 및 URL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_status">{t.status}</Label>
                  <Select
                    value={campaignForm.status}
                    onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.active}</SelectItem>
                      <SelectItem value="inactive">{t.inactive}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_google_drive_url">{t.googleDriveUrl}</Label>
                  <Input
                    id="edit_google_drive_url"
                    value={campaignForm.google_drive_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, google_drive_url: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit_google_slides_url">{t.googleSlidesUrl}</Label>
                  <Input
                    id="edit_google_slides_url"
                    value={campaignForm.google_slides_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, google_slides_url: e.target.value }))}
                    placeholder="https://docs.google.com/presentation/..."
                  />
                </div>
              </div>

              <Separator />

              {/* 질문 섹션 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">신청자 질문</h3>
                
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`edit_question_${num}`}>{t.question} {num}</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit_question_${num}_required`}
                          checked={campaignForm[`question_${num}_required`]}
                          onCheckedChange={(checked) => 
                            setCampaignForm(prev => ({ ...prev, [`question_${num}_required`]: checked }))
                          }
                        />
                        <Label htmlFor={`edit_question_${num}_required`} className="text-sm">
                          {t.required}
                        </Label>
                      </div>
                    </div>
                    <Textarea
                      id={`edit_question_${num}`}
                      value={campaignForm[`question_${num}`]}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, [`question_${num}`]: e.target.value }))}
                      placeholder={`질문 ${num}을 입력하세요 (선택사항)`}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleUpdateCampaign}
                disabled={processing || !campaignForm.title || !campaignForm.brand}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t.save}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditModal(false)
                  setSelectedCampaign(null)
                  resetForm()
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 모달 */}
        <Dialog open={cancelModal} onOpenChange={setCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.deleteCampaign}</DialogTitle>
              <DialogDescription>
                {t.confirmDelete}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCampaign && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium">{selectedCampaign.title}</h4>
                  <p className="text-sm text-gray-600">{selectedCampaign.brand}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleDeleteCampaign}
                disabled={processing}
                variant="destructive"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t.delete}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModal(false)
                  setSelectedCampaign(null)
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminCampaignsWithQuestions
