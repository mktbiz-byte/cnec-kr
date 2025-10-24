import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database, supabase } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, ArrowLeft, Download, Eye, Edit, Save, 
  AlertCircle, CheckCircle, Users, FileText, 
  Calendar, DollarSign, MapPin, Package,
  Instagram, Youtube, Hash, ExternalLink, Copy,
  Truck, Search, Phone, Mail, User
} from 'lucide-react'

// 다국어 지원
const translations = {
  ko: {
    title: '확정 크리에이터 관리',
    subtitle: '확정된 크리에이터의 주소 확인 및 송장 번호 입력',
    backToDashboard: '대시보드로 돌아가기',
    confirmedCreators: '확정 크리에이터',
    name: '이름',
    email: '이메일',
    phone: '전화번호',
    address: '주소',
    trackingNumber: '송장번호',
    enterTracking: '송장번호 입력',
    saveTracking: '송장번호 저장',
    viewDetails: '상세보기',
    editAddress: '주소 수정',
    loading: '데이터를 불러오는 중...',
    error: '오류가 발생했습니다',
    success: '성공적으로 저장되었습니다',
    noCreators: '확정된 크리에이터가 없습니다',
    campaign: '캠페인',
    status: '상태',
    approved: '승인됨',
    completed: '완료됨',
    shipped: '배송됨',
    delivered: '배송완료',
    postalCode: '우편번호',
    fullAddress: '상세주소',
    trackingInfo: '배송 정보',
    updateAddress: '주소 업데이트',
    updateTracking: '송장 업데이트'
  },
  ja: {
    title: '확정 크리에이터管理',
    subtitle: '確定された크리에이터の住所확인及び送状番号入力',
    backToDashboard: '대시보드に돌아가기',
    confirmedCreators: '확정 크리에이터',
    name: '名前',
    email: 'メール',
    phone: '電話番号',
    address: '住所',
    trackingNumber: '送状番号',
    enterTracking: '送状番号入力',
    saveTracking: '送状番号저장',
    viewDetails: '상세표시',
    editAddress: '住所편집',
    loading: 'データを로딩 중...',
    error: '오류가 발생했습니다',
    success: '正常に저장されました',
    noCreators: '確定された크리에이터がいません',
    campaign: 'キャンペーン',
    status: 'ステータス',
    approved: '승인됨',
    completed: '완료済み',
    shipped: '発送済み',
    delivered: '配送완료',
    postalCode: '郵便番号',
    fullAddress: '상세住所',
    trackingInfo: '配送情報',
    updateAddress: '住所업데이트',
    updateTracking: '送状업데이트'
  },
  en: {
    title: 'Confirmed Creators Management',
    subtitle: 'Address verification and tracking number input for confirmed creators',
    backToDashboard: 'Back to Dashboard',
    confirmedCreators: 'Confirmed Creators',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    trackingNumber: 'Tracking Number',
    enterTracking: 'Enter Tracking Number',
    saveTracking: 'Save Tracking Number',
    viewDetails: 'View Details',
    editAddress: 'Edit Address',
    loading: 'Loading data...',
    error: 'An error occurred',
    success: 'Successfully saved',
    noCreators: 'No confirmed creators',
    campaign: 'Campaign',
    status: 'Status',
    approved: 'Approved',
    completed: 'Completed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    postalCode: 'Postal Code',
    fullAddress: 'Full Address',
    trackingInfo: 'Shipping Information',
    updateAddress: 'Update Address',
    updateTracking: 'Update Tracking'
  }
}

const ConfirmedCreatorsNew = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [language, setLanguage] = useState('ko')
  
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [trackingModal, setTrackingModal] = useState(false)
  const [addressModal, setAddressModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [addressForm, setAddressForm] = useState({
    postal_code: '',
    address: '',
    phone: ''
  })

  const t = translations[language]

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('확정 크리에이터 데이터 로드 시작, campaignId:', campaignId)
      
      // 캠페인 데이터 로드 (특정 캠페인인 경우)
      if (campaignId && campaignId !== 'undefined') {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()
        
        if (campaignError) {
          throw new Error(`캠페인 조회 실패: ${campaignError.message}`)
        }
        
        setCampaign(campaignData)
        console.log('캠페인 데이터:', campaignData)
      }
      
      // 확정된 크리에이터 데이터 로드 (실제 데이터베이스 구조에 맞게)
      let query = supabase
        .from('applications')
        .select(`
          *,
          campaigns (
            id,
            title,
            brand,
            reward_amount
          ),
          user_profiles (
            name,
            email,
            phone,
            age,
            skin_type,
            instagram_url
          )
        `)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
      
      if (campaignId && campaignId !== 'undefined') {
        query = query.eq('campaign_id', campaignId)
      }
      
      const { data: applicationsData, error: applicationsError } = await query
      
      if (applicationsError) {
        console.error('신청서 데이터 조회 오류:', applicationsError)
        setApplications([])
      } else {
        setApplications(applicationsData || [])
        console.log('확정 크리에이터 데이터:', applicationsData?.length || 0, '건')
      }
      
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터 로딩에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrackingUpdate = async () => {
    if (!selectedCreator || !trackingNumber.trim()) {
      setError('송장번호를 입력해주세요.')
      return
    }

    try {
      setProcessing(true)
      setError('')

      const { error } = await supabase
        .from('applications')
        .update({ 
          tracking_number: trackingNumber.trim(),
          shipping_status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCreator.id)

      if (error) {
        throw new Error(`송장번호 업데이트 실패: ${error.message}`)
      }

      // 로컬 상태 업데이트
      setApplications(prev => prev.map(app => 
        app.id === selectedCreator.id 
          ? { 
              ...app, 
              tracking_number: trackingNumber.trim(),
              shipping_status: 'shipped'
            }
          : app
      ))

      setSuccess('송장번호가 성공적으로 저장되었습니다.')
      setTrackingModal(false)
      setTrackingNumber('')
      setSelectedCreator(null)

      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('송장번호 업데이트 오류:', error)
      setError(error.message || '송장번호 업데이트에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const handleAddressUpdate = async () => {
    if (!selectedCreator) return

    try {
      setProcessing(true)
      setError('')

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          postal_code: addressForm.postal_code,
          address: addressForm.address,
          phone: addressForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCreator.user_profiles.id)

      if (error) {
        throw new Error(`주소 업데이트 실패: ${error.message}`)
      }

      // 로컬 상태 업데이트
      setApplications(prev => prev.map(app => 
        app.id === selectedCreator.id 
          ? { 
              ...app, 
              user_profiles: {
                ...app.user_profiles,
                postal_code: addressForm.postal_code,
                address: addressForm.address,
                phone: addressForm.phone
              }
            }
          : app
      ))

      setSuccess('주소가 성공적으로 업데이트되었습니다.')
      setAddressModal(false)
      setSelectedCreator(null)

      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('주소 업데이트 오류:', error)
      setError(error.message || '주소 업데이트에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const openTrackingModal = (creator) => {
    setSelectedCreator(creator)
    setTrackingNumber(creator.tracking_number || '')
    setTrackingModal(true)
  }

  const openAddressModal = (creator) => {
    setSelectedCreator(creator)
    setAddressForm({
      postal_code: creator.user_profiles?.postal_code || '',
      address: creator.user_profiles?.address || '',
      phone: creator.user_profiles?.phone || ''
    })
    setAddressModal(true)
  }

  const getStatusBadge = (application) => {
    if (application.shipping_status === 'shipped') {
      return <Badge className="bg-blue-100 text-blue-800">{t.shipped}</Badge>
    }
    if (application.shipping_status === 'delivered') {
      return <Badge className="bg-green-100 text-green-800">{t.delivered}</Badge>
    }
    if (application.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">{t.completed}</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">{t.approved}</Badge>
  }

  const exportToExcel = () => {
    const data = applications.map(app => ({
      '이름': app.user_profiles?.name || '',
      '이메일': app.user_profiles?.email || '',
      '전화번호': app.user_profiles?.phone || '',
      '우편번호': app.user_profiles?.postal_code || '',
      '주소': app.user_profiles?.address || '',
      '캠페인': app.campaigns?.title || '',
      '브랜드': app.campaigns?.brand || '',
      '상태': app.status,
      '송장번호': app.tracking_number || '',
      '배송상태': app.shipping_status || '',
      '승인일': app.approved_at ? new Date(app.approved_at).toLocaleDateString() : '',
      '발송일': app.shipped_at ? new Date(app.shipped_at).toLocaleDateString() : ''
    }))

    const filename = `confirmed_creators_${campaignId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.backToDashboard}</span>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {t.title}
              </h1>
              <p className="text-gray-600">
                {campaign ? `${campaign.title} - ${t.subtitle}` : t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={applications.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel 내보내기
            </Button>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 확정 크리에이터 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>{t.confirmedCreators}</span>
              <Badge variant="secondary">{applications.length}명</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t.noCreators}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 이름과 상태 */}
                        <div className="flex items-center space-x-3 mb-6">
                          <h3 className="text-xl font-bold text-gray-800">
                            {application.applicant_name || '이름 없음'}
                          </h3>
                          {getStatusBadge(application)}
                        </div>

                        {/* 정보 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* 연락처 정보 카드 */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              연락처 정보
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">전화번호:</span>
                                <span className="font-medium">{application.phone_number || '연락처 없음'}</span>
                              </div>
                            </div>
                          </div>

                          {/* 배송 주소 카드 */}
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              배송 주소
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">우편번호:</span>
                                <span className="font-medium">{application.postal_code || '없음'}</span>
                              </div>
                              <div className="flex items-start justify-between">
                                <span className="text-gray-600">주소:</span>
                                <span className="font-medium text-right max-w-48 break-words">
                                  {application.address || '주소 정보 없음'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 캠페인 정보 카드 */}
                          {!campaignId && (
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                캠페인 정보
                              </h4>
                              <div className="text-sm">
                                <span className="font-medium">{application.campaigns?.title || '캠페인 정보 없음'}</span>
                              </div>
                            </div>
                          )}

                          {/* 송장번호 카드 */}
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              송장번호
                            </h4>
                            <div className="text-sm">
                              <span className="font-medium">
                                {application.tracking_number || '송장번호 미입력'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddressModal(application)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {t.editAddress}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => openTrackingModal(application)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          {application.tracking_number ? t.updateTracking : t.enterTracking}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t pt-2 mt-4">
                      승인일: {application.approved_at ? new Date(application.approved_at).toLocaleString() : '정보 없음'}
                      {application.shipped_at && (
                        <span className="ml-4">
                          발송일: {new Date(application.shipped_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 송장번호 입력 모달 */}
        <Dialog open={trackingModal} onOpenChange={setTrackingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.trackingInfo}</DialogTitle>
              <DialogDescription>
                {selectedCreator?.user_profiles?.name}님의 송장번호를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking">{t.trackingNumber}</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="송장번호를 입력하세요"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setTrackingModal(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleTrackingUpdate}
                  disabled={processing || !trackingNumber.trim()}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t.saveTracking}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 주소 수정 모달 */}
        <Dialog open={addressModal} onOpenChange={setAddressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.updateAddress}</DialogTitle>
              <DialogDescription>
                {selectedCreator?.user_profiles?.name}님의 주소 정보를 수정하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="postal_code">{t.postalCode}</Label>
                <Input
                  id="postal_code"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="우편번호"
                />
              </div>
              
              <div>
                <Label htmlFor="address">{t.fullAddress}</Label>
                <Input
                  id="address"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="상세주소"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="전화번호"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setAddressModal(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddressUpdate}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t.updateAddress}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ConfirmedCreatorsNew
