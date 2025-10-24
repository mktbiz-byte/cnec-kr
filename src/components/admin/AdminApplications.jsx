import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Download, Eye, Check, X, Clock, ExternalLink, FileText, Package, Users, Filter, Search } from 'lucide-react'
import * as XLSX from 'xlsx'

const AdminApplications = () => {
  const { language } = useLanguage()
  
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 모달 상태
  const [detailModal, setDetailModal] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 승인 폼 데이터
  const [approvalData, setApprovalData] = useState({
    google_drive_link: '',
    google_slides_link: '',
    shipping_info_required: false,
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCampaign) {
      loadApplications()
    }
  }, [selectedCampaign])

  // ESCキーでモーダルを닫기
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (approveModal) {
          setApproveModal(false)
        }
        if (detailModal) {
          setDetailModal(false)
        }
        if (rejectModal) {
          setRejectModal(false)
        }
      }
    }

    if (approveModal || detailModal || rejectModal) {
      document.addEventListener('keydown', handleEscKey)
      return () => {
        document.removeEventListener('keydown', handleEscKey)
      }
    }
  }, [approveModal, detailModal, rejectModal])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const campaignsData = await database.campaigns.getAll()
      setCampaigns(campaignsData || [])
      
      // 전체 신청서도 함께 로드
      const allApplicationsData = await database.applications.getAll()
      setApplications(allApplicationsData || [])
      
      // 사용자 프로필 정보도 함께 로드
      if (allApplicationsData && allApplicationsData.length > 0) {
        const profiles = {}
        for (const app of allApplicationsData) {
          if (app.user_id) {
            try {
              const profile = await database.userProfiles.get(app.user_id)
              if (profile) {
                profiles[app.user_id] = profile
              }
            } catch (profileError) {
              console.warn('프로필 로드 실패:', app.user_id, profileError)
            }
          }
        }
        setUserProfiles(profiles)
      }
      
      if (campaignsData && campaignsData.length > 0) {
        setSelectedCampaign(campaignsData[0].id.toString())
      }
      
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

  const loadApplications = async () => {
    if (!selectedCampaign) return
    
    try {
      const applicationsData = await database.applications.getByCampaign(selectedCampaign)
      setApplications(applicationsData || [])
      
      // 사용자 프로필 정보도 함께 로드
      if (applicationsData && applicationsData.length > 0) {
        const profiles = {}
        for (const app of applicationsData) {
          if (app.user_id) {
            try {
              const profile = await database.userProfiles.get(app.user_id)
              if (profile) {
                profiles[app.user_id] = profile
              }
            } catch (profileError) {
              console.warn('프로필 로드 실패:', app.user_id, profileError)
            }
          }
        }
        setUserProfiles(profiles)
      }
    } catch (error) {
      console.error('Load applications error:', error)
      setError(language === 'ko' 
        ? '지원자 데이터를 불러올 수 없습니다.'
        : '지원者データを読み込めません。'
      )
    }
  }

  const handleApprove = async () => {
    if (!selectedApplication) return
    
    try {
      const updateData = {
        status: 'approved',
        google_drive_link: approvalData.google_drive_link,
        google_slides_link: approvalData.google_slides_link,
        admin_notes: approvalData.notes,
        approved_at: new Date().toISOString()
      }
      
      await database.applications.update(selectedApplication.id, updateData)
      
      setSuccess(language === 'ko' 
        ? '지원자가 승인되었습니다.'
        : '지원者が승인されました。'
      )
      setApproveModal(false)
      setSelectedApplication(null)
      setApprovalData({
        google_drive_link: '',
        google_slides_link: '',
        shipping_info_required: false,
        notes: ''
      })
      loadApplications()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Approve error:', error)
      setError(language === 'ko' 
        ? '승인 처리에 실패했습니다.'
        : '승인処理に실패했습니다。'
      )
    }
  }

  const handleReject = async (reason) => {
    if (!selectedApplication) return
    
    try {
      const isApprovedCancellation = selectedApplication.status === 'approved'
      
      const updateData = {
        status: isApprovedCancellation ? 'cancelled' : 'rejected',
        admin_notes: reason,
        rejected_at: new Date().toISOString()
      }
      
      await database.applications.update(selectedApplication.id, updateData)
      
      setSuccess(isApprovedCancellation
        ? (language === 'ko' 
            ? '크리에이터 확정이 취소되었습니다.'
            : '크리에이터確定が취소されました。'
          )
        : (language === 'ko' 
            ? '지원자가 거절되었습니다.'
            : '지원者が拒否されました。'
          )
      )
      setRejectModal(false)
      setSelectedApplication(null)
      loadApplications()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Reject error:', error)
      setError(language === 'ko' 
        ? '거절 처리에 실패했습니다.'
        : '拒否処理に실패했습니다。'
      )
    }
  }

  const downloadApplicationsExcel = () => {
    if (!applications.length) return
    
    const campaign = campaigns.find(c => c.id.toString() === selectedCampaign)
    
    const excelData = applications.map((app, index) => ({
      [language === 'ko' ? '번호' : '番号']: index + 1,
      [language === 'ko' ? '이름' : '名前']: app.user_name,
      [language === 'ko' ? '이메일' : 'メール']: app.user_email,
      [language === 'ko' ? '피부타입' : '肌タイプ']: app.skin_type,
      [language === 'ko' ? '나이' : '年齢']: app.age,
      [language === 'ko' ? '인스타그램' : 'Instagram']: app.instagram_url || '',
      [language === 'ko' ? '인스타그램 팔로워' : 'Instagram フォロワー']: app.instagram_followers || 0,
      [language === 'ko' ? '틱톡' : 'TikTok']: app.tiktok_url || '',
      [language === 'ko' ? '틱톡 팔로워' : 'TikTok フォロワー']: app.tiktok_followers || 0,
      [language === 'ko' ? '유튜브' : 'YouTube']: app.youtube_url || '',
      [language === 'ko' ? '유튜브 구독자' : 'YouTube 登録者']: app.youtube_subscribers || 0,
      [language === 'ko' ? '상태' : 'ステータス']: getStatusText(app.status),
      [language === 'ko' ? '신청일' : '지원日']: new Date(app.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP'),
      [language === 'ko' ? '관리자 메모' : '관리자メモ']: app.admin_notes || ''
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ko' ? '지원자 목록' : '지원者リスト')
    
    const fileName = `${campaign?.title || 'campaign'}_applications_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const downloadApprovedShippingInfo = () => {
    const approvedApps = applications.filter(app => app.status === 'approved')
    if (!approvedApps.length) return
    
    const campaign = campaigns.find(c => c.id.toString() === selectedCampaign)
    
    const shippingData = approvedApps.map((app, index) => ({
      [language === 'ko' ? '번호' : '番号']: index + 1,
      [language === 'ko' ? '이름' : '名前']: app.user_name,
      [language === 'ko' ? '이메일' : 'メール']: app.user_email,
      [language === 'ko' ? '전화번호' : '電話番号']: app.phone || '',
      [language === 'ko' ? '주소' : '住所']: app.address || '',
      [language === 'ko' ? '우편번호' : '郵便番号']: app.postal_code || '',
      [language === 'ko' ? '배송 메모' : '配送メモ']: app.shipping_notes || '',
      [language === 'ko' ? '승인일' : '승인日']: app.approved_at ? new Date(app.approved_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP') : ''
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(shippingData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ko' ? '배송 정보' : '配送情報')
    
    const fileName = `${campaign?.title || 'campaign'}_shipping_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: language === 'ko' ? '검토중' : '審査中',
      approved: language === 'ko' ? '승인됨' : '승인됨',
      rejected: language === 'ko' ? '거절됨' : '拒否',
      content_uploaded: language === 'ko' ? '컨텐츠 업로드됨' : 'コンテンツ업로드済み',
      points_requested: language === 'ko' ? '포인트 요청됨' : '포인트要請済み',
      completed: language === 'ko' ? '완료' : '완료',
      cancelled: language === 'ko' ? '취소됨' : '취소済み'
    }
    return statusMap[status] || status
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: Check },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
      content_uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FileText },
      points_requested: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FileText },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: Check },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X }
    }
    
    const style = statusStyles[status] || statusStyles.pending
    const Icon = style.icon
    
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{getStatusText(status)}</span>
      </Badge>
    )
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      app.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ko' ? '로딩 중...' : '로딩 중...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 알림 메시지 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {language === 'ko' ? '캠페인 지원자 관리' : 'キャンペーン지원者管理'}
          </h1>
          <p className="text-gray-600">
            {language === 'ko' ? '캠페인별 지원자를 관리하고 승인/거절을 처리하세요' : 'キャンペーン別지원者を管理し、승인・拒否を処理してください'}
          </p>
        </div>

        {/* 캠페인 선택 및 액션 */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="space-y-2">
                  <Label>{language === 'ko' ? '캠페인 선택' : 'キャンペーン選択'}</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={language === 'ko' ? '캠페인을 선택하세요' : 'キャンペーンを選択してください'} />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.title} ({campaign.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{filteredApplications.length} {language === 'ko' ? '명' : '명'}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={downloadApplicationsExcel}
                  disabled={!applications.length}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{language === 'ko' ? '지원자 엑셀 다운로드' : '지원者Excel 다운로드'}</span>
                </Button>
                
                <Button
                  onClick={downloadApprovedShippingInfo}
                  disabled={!applications.filter(app => app.status === 'approved').length}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>{language === 'ko' ? '배송정보 다운로드' : '配送情報다운로드'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 필터 및 검색 */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ko' ? '전체' : '全て'}</SelectItem>
                    <SelectItem value="pending">{language === 'ko' ? '검토중' : '審査中'}</SelectItem>
                    <SelectItem value="approved">{language === 'ko' ? '승인됨' : '승인됨'}</SelectItem>
                    <SelectItem value="rejected">{language === 'ko' ? '거절됨' : '拒否'}</SelectItem>
                    <SelectItem value="content_uploaded">{language === 'ko' ? '컨텐츠 업로드됨' : 'コンテンツ업로드済み'}</SelectItem>
                    <SelectItem value="completed">{language === 'ko' ? '완료' : '완료'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder={language === 'ko' ? '이름 또는 이메일로 검색...' : '名前またはメールで검색...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지원자 목록 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>
              {language === 'ko' ? '지원자 목록' : '지원者リスト'}
            </CardTitle>
            <CardDescription>
              {selectedCampaign && campaigns.find(c => c.id.toString() === selectedCampaign)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {language === 'ko' ? '지원자가 없습니다' : '지원者はいません'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ko' 
                    ? '아직 이 캠페인에 지원한 사용자가 없습니다.'
                    : 'まだこのキャンペーンに지원したユーザーはいません。'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ko' ? '이름' : '名前'}</TableHead>
                      <TableHead>{language === 'ko' ? '이메일' : 'メール'}</TableHead>
                      <TableHead>{language === 'ko' ? '피부타입' : '肌タイプ'}</TableHead>
                      <TableHead>{language === 'ko' ? 'SNS' : 'SNS'}</TableHead>
                      <TableHead>{language === 'ko' ? '상태' : 'ステータス'}</TableHead>
                      <TableHead>{language === 'ko' ? '신청일' : '지원日'}</TableHead>
                      <TableHead>{language === 'ko' ? '액션' : 'アクション'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.user_name || 
                           userProfiles[application.user_id]?.name || 
                           '정보 없음'}
                        </TableCell>
                        <TableCell>
                          {application.user_email || 
                           userProfiles[application.user_id]?.email || 
                           '정보 없음'}
                        </TableCell>
                        <TableCell>{application.skin_type}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {application.instagram_url && (
                              <Badge variant="outline" className="text-xs">
                                IG: {application.instagram_followers || 0}
                              </Badge>
                            )}
                            {application.tiktok_url && (
                              <Badge variant="outline" className="text-xs">
                                TT: {application.tiktok_followers || 0}
                              </Badge>
                            )}
                            {application.youtube_url && (
                              <Badge variant="outline" className="text-xs">
                                YT: {application.youtube_subscribers || 0}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
                        </TableCell>
                        <TableCell>{formatDate(application.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application)
                                setDetailModal(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplication(application)
                                    setApprovalData({
                                      google_drive_link: '',
                                      google_slides_link: '',
                                      shipping_info_required: false,
                                      notes: ''
                                    })
                                    setApproveModal(true)
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedApplication(application)
                                    setRejectModal(true)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {application.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setRejectModal(true)
                                }}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {language === 'ko' ? '취소' : '취소'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 상세 정보 모달 */}
        <Dialog open={detailModal} onOpenChange={setDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? '지원자 상세 정보' : '지원者상세情報'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {language === 'ko' ? '이름' : '名前'}
                    </Label>
                    <p className="text-lg">
                      {selectedApplication.user_name || 
                       userProfiles[selectedApplication.user_id]?.name || 
                       '정보 없음'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {language === 'ko' ? '이메일' : 'メール'}
                    </Label>
                    <p className="text-lg">
                      {selectedApplication.user_email || 
                       userProfiles[selectedApplication.user_id]?.email || 
                       '정보 없음'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {language === 'ko' ? '피부타입' : '肌タイプ'}
                    </Label>
                    <p className="text-lg">{selectedApplication.skin_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {language === 'ko' ? '나이' : '年齢'}
                    </Label>
                    <p className="text-lg">{selectedApplication.age}</p>
                  </div>
                </div>

                {/* SNS 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {language === 'ko' ? 'SNS 정보' : 'SNS情報'}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedApplication.instagram_url && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-500">Instagram</Label>
                        <p className="text-sm mb-1">
                          {language === 'ko' ? '팔로워:' : 'フォロワー:'} {selectedApplication.instagram_followers || 0}
                        </p>
                        <a
                          href={selectedApplication.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {language === 'ko' ? '프로필 보기' : '프로필표시'}
                        </a>
                      </div>
                    )}
                    
                    {selectedApplication.tiktok_url && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-500">TikTok</Label>
                        <p className="text-sm mb-1">
                          {language === 'ko' ? '팔로워:' : 'フォロワー:'} {selectedApplication.tiktok_followers || 0}
                        </p>
                        <a
                          href={selectedApplication.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {language === 'ko' ? '프로필 보기' : '프로필표시'}
                        </a>
                      </div>
                    )}
                    
                    {selectedApplication.youtube_url && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-medium text-gray-500">YouTube</Label>
                        <p className="text-sm mb-1">
                          {language === 'ko' ? '구독자:' : '登録者:'} {selectedApplication.youtube_subscribers || 0}
                        </p>
                        <a
                          href={selectedApplication.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {language === 'ko' ? '채널 보기' : 'チャンネル표시'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 질문 답변 */}
                {selectedApplication.answers && Object.keys(selectedApplication.answers).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {language === 'ko' ? '질문 답변' : '質問回答'}
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(selectedApplication.answers).map(([question, answer]) => (
                        <div key={question} className="p-4 bg-gray-50 rounded-lg">
                          <Label className="text-sm font-medium text-gray-500">{question}</Label>
                          <p className="mt-1">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관리자 메모 */}
                {selectedApplication.admin_notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {language === 'ko' ? '관리자 메모' : '관리자メモ'}
                    </h3>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p>{selectedApplication.admin_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 승인 처리 - 인라인 편집 방식 */}
        {approveModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
            style={{ zIndex: '99999 !important', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setApproveModal(false)
              }
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
              style={{ zIndex: '100000 !important', position: 'relative' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {language === 'ko' ? '지원자 승인' : '지원者승인'}
                  </h2>
                  <button
                    onClick={() => setApproveModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  {language === 'ko' 
                    ? '지원자를 승인하고 필요한 링크를 제공하세요.'
                    : '지원者を승인し、必要なリンクを提供してください。'
                  }
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {language === 'ko' ? '구글 드라이브 링크 (영상 공유용)' : 'Google ドライブリンク (動画共有用)'}
                    </label>
                    <input
                      type="url"
                      value={approvalData.google_drive_link}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, google_drive_link: e.target.value }))}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {language === 'ko' ? '구글 슬라이드 링크 (가이드)' : 'Google スライドリンク (ガイド)'}
                    </label>
                    <input
                      type="url"
                      value={approvalData.google_slides_link}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, google_slides_link: e.target.value }))}
                      placeholder="https://docs.google.com/presentation/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {language === 'ko' ? '관리자 메모' : '관리자メモ'}
                    </label>
                    <textarea
                      value={approvalData.notes}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={language === 'ko' 
                        ? '승인과 함께 전달할 메시지를 입력하세요...'
                        : '승인と一緒に伝えるメッセージを入力してください...'
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    onClick={() => setApproveModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {language === 'ko' ? '취소' : '취소'}
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {language === 'ko' ? '승인' : '승인'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 거절/취소 모달 */}
        <Dialog open={rejectModal} onOpenChange={setRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedApplication?.status === 'approved' 
                  ? (language === 'ko' ? '크리에이터 확정 취소' : '크리에이터確定취소')
                  : (language === 'ko' ? '지원자 거절' : '지원者拒否')
                }
              </DialogTitle>
              <DialogDescription>
                {selectedApplication?.status === 'approved'
                  ? (language === 'ko' 
                      ? '확정된 크리에이터를 취소하는 사유를 입력해주세요.'
                      : '確定された크리에이터を취소する理由を入力してください。'
                    )
                  : (language === 'ko' 
                      ? '거절 사유를 입력해주세요.'
                      : '拒否理由を入力してください。'
                    )
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder={language === 'ko' 
                  ? '거절 사유를 입력하세요...'
                  : '拒否理由を入力してください...'
                }
                rows={4}
                id="reject-reason"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setRejectModal(false)}>
                {language === 'ko' ? '취소' : '취소'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  const reason = document.getElementById('reject-reason').value
                  handleReject(reason)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {selectedApplication?.status === 'approved'
                  ? (language === 'ko' ? '취소' : '취소')
                  : (language === 'ko' ? '거절' : '拒否')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminApplications
