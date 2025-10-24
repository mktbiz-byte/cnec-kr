import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, supabase } from '../../lib/supabase'
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
import { 
  Loader2, Plus, Edit, Trash2, Eye, Download, Upload, 
  AlertCircle, CheckCircle, Clock, DollarSign, FileText, 
  ArrowRight, Copy, ExternalLink, Search, Filter, RefreshCw,
  Calendar, Users, Target, X, Save, Building, Link as LinkIcon
} from 'lucide-react'

const AdminCampaignsEnhanced = () => {
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
    start_date: null,
    end_date: null,
    application_deadline: null,
    status: 'draft',
    category: '',
    target_audience: '',
    campaign_materials: '',
    special_instructions: ''
  })

  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 캠페인 로드
      const campaignsData = await database.campaigns.getAll()
      setCampaigns(campaignsData || [])
      
      // 신청 내역 로드
      const applicationsData = await database.applications.getAll()
      setApplications(applicationsData || [])
      
    } catch (error) {
      console.error('Load data error:', error)
      setError(language === 'ko' 
        ? '데이터를 불러올 수 없습니다.'
        : 'データを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 필수 필드 검증
      if (!campaignForm.title || !campaignForm.brand || !campaignForm.description) {
        setError(language === 'ko' 
          ? '제목, 브랜드, 설명을 모두 입력해주세요.'
          : 'タイトル、ブランド、설명をすべて入力してください。'
        )
        setProcessing(false)
        return
      }

      // 날짜 필드 유효성 검사
      if (!campaignForm.start_date || !campaignForm.end_date || !campaignForm.application_deadline) {
        setError(language === 'ko' 
          ? '시작일, 종료일, 신청 마감일을 모두 입력해주세요.'
          : '시작일、종료日、지원締切日をすべて入力してください。'
        )
        setProcessing(false)
        return
      }

      // 날짜 논리 검증
      const startDate = new Date(campaignForm.start_date)
      const endDate = new Date(campaignForm.end_date)
      const deadlineDate = new Date(campaignForm.application_deadline)

      if (deadlineDate >= startDate) {
        setError(language === 'ko' 
          ? '신청 마감일은 시작일보다 이전이어야 합니다.'
          : '지원締切日は시작일より前である必要があります。'
        )
        setProcessing(false)
        return
      }

      if (startDate >= endDate) {
        setError(language === 'ko' 
          ? '시작일은 종료일보다 이전이어야 합니다.'
          : '시작일は종료日より前である必要があります。'
        )
        setProcessing(false)
        return
      }
      
      const campaignData = {
        ...campaignForm,
        reward_amount: parseInt(campaignForm.reward_amount) || 0,
        max_participants: parseInt(campaignForm.max_participants) || 0,
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date,
        application_deadline: campaignForm.application_deadline,
        created_at: new Date().toISOString()
      }
      
      await database.campaigns.create(campaignData)
      
      setSuccess(language === 'ko' 
        ? '캠페인이 생성되었습니다.'
        : 'キャンペーンが作成されました。'
      )
      setCreateModal(false)
      resetForm()
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Create campaign error:', error)
      setError(language === 'ko' 
        ? '캠페인 생성에 실패했습니다.'
        : 'キャンペーンの作成に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return
    
    try {
      setProcessing(true)
      setError('')
      
      // 필수 필드 검증
      if (!campaignForm.title || !campaignForm.brand || !campaignForm.description) {
        setError(language === 'ko' 
          ? '제목, 브랜드, 설명을 모두 입력해주세요.'
          : 'タイトル、ブランド、설명をすべて入力してください。'
        )
        setProcessing(false)
        return
      }

      // 날짜 필드 유효성 검사
      if (!campaignForm.start_date || !campaignForm.end_date || !campaignForm.application_deadline) {
        setError(language === 'ko' 
          ? '시작일, 종료일, 신청 마감일을 모두 입력해주세요.'
          : '시작일、종료日、지원締切日をすべて入力してください。'
        )
        setProcessing(false)
        return
      }

      // 날짜 논리 검증
      const startDate = new Date(campaignForm.start_date)
      const endDate = new Date(campaignForm.end_date)
      const deadlineDate = new Date(campaignForm.application_deadline)

      if (deadlineDate >= startDate) {
        setError(language === 'ko' 
          ? '신청 마감일은 시작일보다 이전이어야 합니다.'
          : '지원締切日は시작일より前である必要があります。'
        )
        setProcessing(false)
        return
      }

      if (startDate >= endDate) {
        setError(language === 'ko' 
          ? '시작일은 종료일보다 이전이어야 합니다.'
          : '시작일は종료日より前である必要があります。'
        )
        setProcessing(false)
        return
      }
      
      const updateData = {
        ...campaignForm,
        reward_amount: parseInt(campaignForm.reward_amount) || 0,
        max_participants: parseInt(campaignForm.max_participants) || 0,
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date,
        application_deadline: campaignForm.application_deadline,
        updated_at: new Date().toISOString()
      }
      
      await database.campaigns.update(selectedCampaign.id, updateData)
      
      setSuccess(language === 'ko' 
        ? '캠페인이 업데이트되었습니다.'
        : 'キャンペーンが업데이트されました。'
      )
      setEditModal(false)
      resetForm()
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Update campaign error:', error)
      setError(language === 'ko' 
        ? '캠페인 업데이트에 실패했습니다.'
        : 'キャンペーンの업데이트に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelCampaign = async () => {
    if (!selectedCampaign) return
    
    try {
      setProcessing(true)
      setError('')
      
      // 캠페인 상태를 취소로 변경
      await database.campaigns.update(selectedCampaign.id, {
        status: 'cancelled',
        cancel_reason: cancelReason,
        cancelled_at: new Date().toISOString()
      })
      
      // 해당 캠페인의 모든 신청을 취소 상태로 변경
      const campaignApplications = applications.filter(app => app.campaign_id === selectedCampaign.id)
      for (const application of campaignApplications) {
        await database.applications.updateStatus(application.id, 'cancelled')
      }
      
      setSuccess(language === 'ko' 
        ? '캠페인이 취소되었습니다.'
        : 'キャンペーンが취소されました。'
      )
      setCancelModal(false)
      setCancelReason('')
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Cancel campaign error:', error)
      setError(language === 'ko' 
        ? '캠페인 취소에 실패했습니다.'
        : 'キャンペーンの취소に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const exportCampaignsToExcel = async () => {
    try {
      setProcessing(true)
      
      const data = campaigns.map(campaign => ({
        'ID': campaign.id,
        'タイトル': campaign.title,
        'ブランド': campaign.brand,
        '보상金額': campaign.reward_amount,
        '最大参加者': campaign.max_participants,
        '状態': campaign.status,
        '시작일': campaign.start_date,
        '종료日': campaign.end_date,
        '지원締切': campaign.application_deadline,
        '생성일': new Date(campaign.created_at).toLocaleDateString('ja-JP'),
        'カテゴリー': campaign.category || '',
        'ターゲット': campaign.target_audience || ''
      }))
      
      const filename = `campaigns_${new Date().toISOString().split('T')[0]}.csv`
      
      // CSV 생성
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      setSuccess(language === 'ko' 
        ? 'Excel 파일이 다운로드되었습니다.'
        : 'Excelファイルが다운로드されました。'
      )
      
    } catch (error) {
      console.error('Export error:', error)
      setError(language === 'ko' 
        ? 'Excel 내보내기에 실패했습니다.'
        : 'Excelエクスポートに실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const exportApplicationsToExcel = async (campaignId) => {
    try {
      setProcessing(true)
      
      const campaignApplications = applications.filter(app => app.campaign_id === campaignId)
      
      const data = campaignApplications.map(app => ({
        'ID': app.id,
        'ユーザーID': app.user_id,
        '캠페인 제목': app.campaigns?.title || '',
        '状態': app.status,
        '지원日': new Date(app.created_at).toLocaleDateString('ja-JP'),
        '업데이트日': new Date(app.updated_at).toLocaleDateString('ja-JP'),
        'SNS Instagram': app.sns_urls?.instagram || '',
        'SNS TikTok': app.sns_urls?.tiktok || '',
        'SNS YouTube': app.sns_urls?.youtube || '',
        'SNS Twitter': app.sns_urls?.twitter || ''
      }))
      
      const campaign = campaigns.find(c => c.id === campaignId)
      const filename = `applications_${campaign?.title || campaignId}_${new Date().toISOString().split('T')[0]}.csv`
      
      // CSV 생성
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      setSuccess(language === 'ko' 
        ? '신청자 Excel 파일이 다운로드되었습니다.'
        : '지원者Excelファイルが다운로드されました。'
      )
      
    } catch (error) {
      console.error('Export applications error:', error)
      setError(language === 'ko' 
        ? '신청자 Excel 내보내기에 실패했습니다.'
        : '지원者Excelエクスポートに실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const exportConfirmedCreatorsToExcel = async (campaignId) => {
    try {
      setProcessing(true)
      
      const confirmedApplications = applications.filter(app => 
        app.campaign_id === campaignId && 
        (app.status === 'approved' || app.status === 'completed')
      )
      
      // 사용자 프로필 정보 가져오기
      const userIds = confirmedApplications.map(app => app.user_id)
      const { data: userProfiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds)
      
      if (error) throw error
      
      const data = confirmedApplications.map(app => {
        const profile = userProfiles.find(p => p.user_id === app.user_id)
        return {
          'ID': app.id,
          'ユーザーID': app.user_id,
          '名前': profile?.name || '',
          '電話番号': profile?.phone || '',
          '住所': profile?.address || '',
          'メールアドレス': profile?.email || '',
          '年齢': profile?.age || '',
          '肌タイプ': profile?.skin_type || '',
          'Instagram': profile?.instagram_url || '',
          'Instagramフォロワー': profile?.instagram_followers || '',
          'TikTok': profile?.tiktok_url || '',
          'TikTokフォロワー': profile?.tiktok_followers || '',
          'YouTube': profile?.youtube_url || '',
          'YouTubeフォロワー': profile?.youtube_followers || '',
          '지원日': new Date(app.created_at).toLocaleDateString('ja-JP'),
          '状態': app.status
        }
      })
      
      const campaign = campaigns.find(c => c.id === campaignId)
      const filename = `confirmed_creators_${campaign?.title || campaignId}_${new Date().toISOString().split('T')[0]}.csv`
      
      // CSV 생성
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      setSuccess(language === 'ko' 
        ? '확정 크리에이터 배송 정보 Excel 파일이 다운로드되었습니다.'
        : '확정 크리에이터配送情報Excelファイルが다운로드されました。'
      )
      
    } catch (error) {
      console.error('Export confirmed creators error:', error)
      setError(language === 'ko' 
        ? '확정 크리에이터 Excel 내보내기에 실패했습니다.'
        : '확정 크리에이터Excelエクスポートに실패했습니다。'
      )
    } finally {
      setProcessing(false)
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
      start_date: '',
      end_date: '',
      application_deadline: '',
      status: 'draft',
      category: '',
      target_audience: '',
      google_drive_url: '',
      google_slides_url: '',
      campaign_materials: '',
      special_instructions: ''
    })
  }

  const openEditModal = (campaign) => {
    setSelectedCampaign(campaign)
    setCampaignForm({
      title: campaign.title || '',
      brand: campaign.brand || '',
      description: campaign.description || '',
      requirements: campaign.requirements || '',
      reward_amount: campaign.reward_amount?.toString() || '',
      max_participants: campaign.max_participants?.toString() || '',
      start_date: campaign.start_date || null,
      end_date: campaign.end_date || null,
      application_deadline: campaign.application_deadline || null,
      status: campaign.status || 'draft',
      category: campaign.category || '',
      target_audience: campaign.target_audience || '',
      google_drive_url: campaign.google_drive_url || '',
      google_slides_url: campaign.google_slides_url || '',
      campaign_materials: campaign.campaign_materials || '',
      special_instructions: campaign.special_instructions || ''
    })
    setEditModal(true)
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: language === 'ko' ? '초안' : '下書き' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '활성' : 'アクティブ' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: language === 'ko' ? '일시정지' : '一時停止' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: language === 'ko' ? '완료' : '완료' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: language === 'ko' ? '취소됨' : '취소' }
    }
    
    const style = statusStyles[status] || statusStyles.draft
    
    return (
      <Badge className={`${style.bg} ${style.text}`}>
        {style.label}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.status !== 'all' && campaign.status !== filters.status) return false
    if (filters.search && !campaign.title?.toLowerCase().includes(filters.search.toLowerCase()) && 
        !campaign.brand?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.dateFrom && new Date(campaign.created_at) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(campaign.created_at) > new Date(filters.dateTo)) return false
    return true
  })

  const getCampaignApplications = (campaignId) => {
    return applications.filter(app => app.campaign_id === campaignId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {language === 'ko' ? '캠페인 관리' : '캠페인 관리'}
          </h1>
          <p className="text-gray-600">
            {language === 'ko' 
              ? '캠페인을 생성, 수정, 취소하고 신청자를 관리합니다.'
              : 'キャンペーンの作成、편집、취소、지원者管理を行います。'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportCampaignsToExcel}
            disabled={processing}
          >
            <Download className="h-4 w-4 mr-2" />
            {language === 'ko' ? '캠페인 Excel' : 'キャンペーンExcel'}
          </Button>
          <Button
            onClick={() => setCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ko' ? '새 캠페인' : '新規キャンペーン'}
          </Button>
          <Button
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ko' ? '새로고침' : '업데이트'}
          </Button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ko' ? '상태' : '状態'}</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ko' ? '전체' : '全て'}</SelectItem>
                  <SelectItem value="draft">{language === 'ko' ? '초안' : '下書き'}</SelectItem>
                  <SelectItem value="active">{language === 'ko' ? '활성' : 'アクティブ'}</SelectItem>
                  <SelectItem value="paused">{language === 'ko' ? '일시정지' : '一時停止'}</SelectItem>
                  <SelectItem value="completed">{language === 'ko' ? '완료' : '완료'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'ko' ? '취소됨' : '취소'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ko' ? '검색' : '검색'}</Label>
              <Input
                placeholder={language === 'ko' ? '캠페인명 또는 브랜드 검색' : '캠페인명またはブランド검색'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ko' ? '시작일' : '시작일'}</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ko' ? '종료일' : '종료日'}</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 캠페인 목록 */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {language === 'ko' ? '캠페인이 없습니다' : 'キャンペーンはありません'}
              </h3>
              <p className="text-gray-500 mb-4">
                {language === 'ko' 
                  ? '새로운 캠페인을 생성해보세요.'
                  : '新しいキャンペーンを作成してみましょう。'
                }
              </p>
              <Button
                onClick={() => setCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'ko' ? '첫 캠페인 만들기' : '最初のキャンペーンを作成'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => {
            const campaignApplications = getCampaignApplications(campaign.id)
            const approvedCount = campaignApplications.filter(app => app.status === 'approved').length
            const completedCount = campaignApplications.filter(app => app.status === 'completed').length
            
            return (
              <Card key={campaign.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {campaign.title}
                        </h4>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-purple-600 font-medium mb-2">
                        {campaign.brand}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <p>
                            {language === 'ko' ? '보상:' : '보상:'} {formatCurrency(campaign.reward_amount)}
                          </p>
                          <p>
                            {language === 'ko' ? '최대 참가자:' : '最大参加者:'} {campaign.max_participants}
                          </p>
                          <p>
                            {language === 'ko' ? '신청자:' : '지원者:'} {campaignApplications.length}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p>
                            {language === 'ko' ? '승인됨:' : '승인됨:'} {approvedCount}
                          </p>
                          <p>
                            {language === 'ko' ? '완료됨:' : '완료:'} {completedCount}
                          </p>
                          <p>
                            {language === 'ko' ? '생성일:' : '생성일:'} {formatDate(campaign.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* 액션 버튼들 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {language === 'ko' ? '편집' : '편집'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setApplicationsModal(true)
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {language === 'ko' ? '신청자' : '지원者'} ({campaignApplications.length})
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportApplicationsToExcel(campaign.id)}
                      disabled={processing}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {language === 'ko' ? '신청자 Excel' : '지원者Excel'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConfirmedCreatorsToExcel(campaign.id)}
                      disabled={processing}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {language === 'ko' ? '확정자 배송정보' : '確定者配送情報'}
                    </Button>
                    
                    {campaign.google_drive_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(campaign.google_drive_url, '_blank')}
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Google Drive
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    
                    {campaign.google_slides_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(campaign.google_slides_url, '_blank')}
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Google Slides
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    
                    {campaign.status !== 'cancelled' && campaign.status !== 'completed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign)
                          setCancelModal(true)
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {language === 'ko' ? '취소' : '취소'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 캠페인 생성 모달 */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '새 캠페인 생성' : '新規캠페인 생성'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko' 
                ? '새로운 캠페인의 정보를 입력하세요.'
                : '新しいキャンペーンの情報を入力してください。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{language === 'ko' ? '캠페인 제목' : '캠페인 제목'}</Label>
                <Input
                  id="title"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={language === 'ko' ? '캠페인 제목을 입력하세요' : '캠페인 제목を入力してください'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">{language === 'ko' ? '브랜드명' : 'ブランド名'}</Label>
                <Input
                  id="brand"
                  value={campaignForm.brand}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder={language === 'ko' ? '브랜드명을 입력하세요' : 'ブランド名を入力してください'}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{language === 'ko' ? '캠페인 설명' : 'キャンペーン설명'}</Label>
              <Textarea
                id="description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'ko' ? '캠페인에 대한 자세한 설명을 입력하세요' : 'キャンペーンの상세설명を入力してください'}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requirements">{language === 'ko' ? '참가 요건' : '参加要건'}</Label>
              <Textarea
                id="requirements"
                value={campaignForm.requirements}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder={language === 'ko' ? '참가자가 충족해야 할 요건을 입력하세요' : '参加者が満たすべき要건を入力してください'}
                rows={3}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward_amount">{language === 'ko' ? '보상 금액 (JPY)' : '보상金額 (JPY)'}</Label>
                <Input
                  id="reward_amount"
                  type="number"
                  min="0"
                  value={campaignForm.reward_amount}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, reward_amount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_participants">{language === 'ko' ? '최대 참가자 수' : '最大参加者数'}</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  value={campaignForm.max_participants}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, max_participants: e.target.value }))}
                  placeholder="50"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{language === 'ko' ? '시작일' : '시작일'}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">{language === 'ko' ? '종료일' : '종료日'}</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="application_deadline">{language === 'ko' ? '신청 마감일' : '지원締切日'}</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={campaignForm.application_deadline}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, application_deadline: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{language === 'ko' ? '카테고리' : 'カテゴリー'}</Label>
                <Select 
                  value={campaignForm.category} 
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ko' ? '카테고리 선택' : 'カテゴリーを選択'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beauty">{language === 'ko' ? '뷰티' : '美容'}</SelectItem>
                    <SelectItem value="fashion">{language === 'ko' ? '패션' : 'ファッション'}</SelectItem>
                    <SelectItem value="food">{language === 'ko' ? '음식' : '食品'}</SelectItem>
                    <SelectItem value="lifestyle">{language === 'ko' ? '라이프스타일' : 'ライフスタイル'}</SelectItem>
                    <SelectItem value="tech">{language === 'ko' ? '기술' : 'テクノロジー'}</SelectItem>
                    <SelectItem value="other">{language === 'ko' ? '기타' : 'その他'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">{language === 'ko' ? '상태' : '状態'}</Label>
                <Select 
                  value={campaignForm.status} 
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{language === 'ko' ? '초안' : '下書き'}</SelectItem>
                    <SelectItem value="active">{language === 'ko' ? '활성' : 'アクティブ'}</SelectItem>
                    <SelectItem value="paused">{language === 'ko' ? '일시정지' : '一時停止'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_audience">{language === 'ko' ? '타겟 오디언스' : 'ターゲットオーディエンス'}</Label>
              <Input
                id="target_audience"
                value={campaignForm.target_audience}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, target_audience: e.target.value }))}
                placeholder={language === 'ko' ? '20-30대 여성, 뷰티에 관심 있는 사람 등' : '20-30代女性、美容に興味のある方など'}
              />
            </div>
            

            
            <div className="space-y-2">
              <Label htmlFor="special_instructions">{language === 'ko' ? '특별 지시사항' : '特別指示事項'}</Label>
              <Textarea
                id="special_instructions"
                value={campaignForm.special_instructions}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder={language === 'ko' ? '크리에이터에게 전달할 특별한 지시사항이 있다면 입력하세요' : '크리에이터に伝える特別な指示事項があれば入力してください'}
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateCampaign}
                disabled={processing || !campaignForm.title || !campaignForm.brand}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '캠페인 생성' : '캠페인 생성'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModal(false)
                  resetForm()
                }}
              >
                {language === 'ko' ? '취소' : '취소'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 캠페인 편집 모달 */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '캠페인 편집' : 'キャンペーン편집'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko' 
                ? '캠페인 정보를 수정하세요.'
                : 'キャンペーン情報を편집してください。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 편집 폼 내용은 생성 폼과 동일하므로 생략 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">{language === 'ko' ? '캠페인 제목' : '캠페인 제목'}</Label>
                <Input
                  id="edit_title"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={language === 'ko' ? '캠페인 제목을 입력하세요' : '캠페인 제목を入力してください'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_brand">{language === 'ko' ? '브랜드명' : 'ブランド名'}</Label>
                <Input
                  id="edit_brand"
                  value={campaignForm.brand}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder={language === 'ko' ? '브랜드명을 입력하세요' : 'ブランド名を入力してください'}
                />
              </div>
            </div>
            
            {/* 나머지 필드들... */}
            
            <div className="flex space-x-2">
              <Button
                onClick={handleUpdateCampaign}
                disabled={processing || !campaignForm.title || !campaignForm.brand}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '변경사항 저장' : '変更を저장'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditModal(false)
                  resetForm()
                }}
              >
                {language === 'ko' ? '취소' : '취소'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 캠페인 취소 모달 */}
      <Dialog open={cancelModal} onOpenChange={setCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '캠페인 취소' : 'キャンペーン취소'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko' 
                ? '캠페인을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                : 'キャンペーンを취소しますか？この操作は元に戻せません。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCampaign && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{selectedCampaign.title}</p>
                <p className="text-sm text-gray-600">{selectedCampaign.brand}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cancelReason">
                {language === 'ko' ? '취소 사유' : '취소理由'}
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={language === 'ko' ? '취소 사유를 입력하세요' : '취소理由を入力してください'}
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleCancelCampaign}
                disabled={processing || !cancelReason}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '캠페인 취소' : 'キャンペーン취소'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModal(false)
                  setCancelReason('')
                }}
              >
                {language === 'ko' ? '돌아가기' : '돌아가기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminCampaignsEnhanced
