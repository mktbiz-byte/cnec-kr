import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Loader2, ArrowLeft, Download, Eye, Edit, Save, 
  AlertCircle, CheckCircle, Users, FileText, 
  Calendar, DollarSign, MapPin, Package,
  Instagram, Youtube, Hash, ExternalLink, Copy,
  Truck, Search
} from 'lucide-react'
import i18n from '../../lib/i18n'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageSelector from '../LanguageSelector'

const ConfirmedCreatorsReport_multilingual = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [trackingModal, setTrackingModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('확정 크리에이터 데이터 로드 시작, campaignId:', campaignId)
      
      // 1단계: 캠페인 데이터 로드
      if (campaignId && campaignId !== 'undefined') {
        console.log('특정 캠페인 로드:', campaignId)
        try {
          const campaignData = await database.campaigns.getById(campaignId)
          if (!campaignData) {
            setError('캠페인을 찾을 수 없습니다.')
            return
          }
          setCampaign(campaignData)
          console.log('캠페인 데이터 로드 성공:', campaignData.title)
        } catch (error) {
          console.error('캠페인 로드 오류:', error)
          setError('캠페인 로드 중 오류가 발생했습니다.')
          return
        }
      } else {
        console.log('전체 확정 크리에이터 보기 모드')
        setCampaign(null)
      }
      
      // 2단계: 신청서 데이터 로드
      console.log('신청서 데이터 로드 시작...')
      try {
        let applicationsData
        if (campaignId && campaignId !== 'undefined') {
          applicationsData = await database.applications.getByCampaign(campaignId)
        } else {
          applicationsData = await database.applications.getAll()
        }
        
        console.log('로드된 신청서 수:', applicationsData?.length || 0)
        
        if (!applicationsData || applicationsData.length === 0) {
          setApplications([])
          setUserProfiles({})
          console.log('신청서 데이터 없음')
          return
        }
        
        // 승인된 신청서만 필터링 (확정 크리에이터)
        const approvedApplications = (Array.isArray(applicationsData) ? applicationsData : [])
          .filter(app => app.status === 'approved' || app.status === 'completed')
        
        console.log('승인된 신청서 수:', approvedApplications.length)
        setApplications(approvedApplications)
        
        // 3단계: 신청자들의 프로필 정보 로드
        console.log('프로필 정보 로드 시작...')
        const profiles = {}
        for (const app of approvedApplications) {
          try {
            const profile = await database.userProfiles.get(app.user_id)
            if (profile) {
              profiles[app.user_id] = profile
            }
          } catch (profileError) {
            console.warn('프로필 로드 실패:', app.user_id, profileError)
          }
        }
        setUserProfiles(profiles)
        console.log('프로필 로드 완료:', Object.keys(profiles).length)
        
      } catch (error) {
        console.error('신청서 데이터 로드 오류:', error)
        setApplications([])
        setUserProfiles({})
      }
      
    } catch (error) {
      console.error('전체 데이터 로드 오류:', error)
      setError('데이터 로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      console.log('확정 크리에이터 데이터 로드 완료')
    }
  }

  const handleTrackingUpdate = async (applicationId, trackingNum) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        tracking_number: trackingNum,
        shipped_at: trackingNum ? new Date().toISOString() : null
      })
      
      setSuccess(t('confirmedCreatorsReport.trackingUpdated'))
      setTrackingModal(false)
      loadData()
      
    } catch (error) {
      console.error('Tracking update error:', error)
      setError(t('common.error'))
    } finally {
      setProcessing(false)
    }
  }

  const openTrackingModal = (application) => {
    setSelectedApplication(application)
    setTrackingNumber(application.tracking_number || '')
    setTrackingModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    const locale = language === 'en' ? 'en-US' : 
                  language === 'ko' ? 'ko-KR' : 'ko-KR'
    
    return date.toLocaleDateString(locale)
  }

  const exportToExcel = () => {
    const headers = [
      t('common.name'), 
      'Instagram', 
      'TikTok', 
      'YouTube', 
      t('confirmedCreatorsReport.postalCode'), 
      t('confirmedCreatorsReport.address'), 
      t('confirmedCreatorsReport.trackingNumber'), 
      t('confirmedCreatorsReport.shippingStatus'), 
      t('confirmedCreatorsReport.approvalDate')
    ]
    
    const rows = applications.map(app => {
      const profile = userProfiles[app.user_id]
      return [
        profile?.name || 'N/A',
        profile?.instagram_url || 'N/A',
        profile?.tiktok_url || 'N/A',
        profile?.youtube_url || 'N/A',
        profile?.postal_code || 'N/A',
        `${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A',
        app.tracking_number || t('confirmedCreatorsReport.notShipped'),
        app.tracking_number ? t('confirmedCreatorsReport.shipped') : t('confirmedCreatorsReport.notShipped'),
        app.approved_at ? formatDate(app.approved_at) : 'N/A'
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${campaign?.title || 'campaign'}_confirmed_creators.csv`
    link.click()
  }

  const getJapanPostTrackingUrl = (trackingNumber) => {
    return `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}&locale=ja`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!campaign && campaignId && campaignId !== 'undefined') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('common.error')}</h3>
        {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
      </div>
    )
  }
  
  // 전체 확정 크리에이터 보기 모드
  if (!campaign && (!campaignId || campaignId === 'undefined')) {
    return (
      <div className="space-y-6">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
        </div>
          <div className="flex space-x-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('common.download')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('confirmedCreatorsReport.title')}</CardTitle>
            <CardDescription className="text-lg">
              {t('confirmedCreatorsReport.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  <strong>{t('confirmedCreatorsReport.confirmedCreators')}:</strong> {applications.length}{t('common.people')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="text-sm">
                  <strong>{t('confirmedCreatorsReport.shipped')}:</strong> {applications.filter(app => app.tracking_number).length}{t('common.people')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Creators List */}
        <div className="grid gap-4">
          {applications.map((application) => {
            const profile = userProfiles[application.user_id]
            
            return (
              <Card key={application.id} className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('confirmedCreatorsReport.confirmed')}
                        </Badge>
                        {application.tracking_number && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Package className="h-3 w-3 mr-1" />
                            {t('confirmedCreatorsReport.shipped')}
                          </Badge>
                        )}
                      </div>
                      
                      {/* SNS 정보 */}
                      <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                        {profile?.instagram_url && (
                          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Instagram className="h-4 w-4 text-pink-500" />
                              <span>Instagram</span>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 주소 정보 */}
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">{t('confirmedCreatorsReport.shippingAddress')}</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <p><strong>{t('confirmedCreatorsReport.postalCode')}:</strong> {profile?.postal_code || 'N/A'}</p>
                          <p><strong>{t('confirmedCreatorsReport.address')}:</strong> {`${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTrackingModal(application)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {application.tracking_number ? t('confirmedCreatorsReport.editShipping') : t('confirmedCreatorsReport.enterTracking')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {applications.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('confirmedCreatorsReport.noCreators')}</h3>
                <p className="text-gray-500">{t('confirmedCreatorsReport.noCreatorsDescription')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 배송 정보 입력 모달 */}
        <Dialog open={trackingModal} onOpenChange={setTrackingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('confirmedCreatorsReport.shippingManagement')}</DialogTitle>
              <DialogDescription>
                {t('confirmedCreatorsReport.shippingDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">{t('confirmedCreatorsReport.trackingNumber')}</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="例: 123456789012"
                />
                <p className="text-sm text-gray-500">
                  {t('confirmedCreatorsReport.trackingHelp')}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTrackingModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={() => handleTrackingUpdate(selectedApplication?.id, trackingNumber)}
                disabled={processing}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.download')}
          </Button>
        </div>
      </div>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{campaign.title}</CardTitle>
              <CardDescription className="text-lg mt-2 text-purple-600">
                {campaign.brand} - {t('confirmedCreatorsReport.management')}
              </CardDescription>
            </div>
            {/* 기업 보고서에서는 리워드 정보 숨김 */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <strong>{t('confirmedCreatorsReport.confirmedCreators')}:</strong> {applications.length}{t('common.people')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                <strong>{t('confirmedCreatorsReport.shipped')}:</strong> {applications.filter(app => app.tracking_number).length}{t('common.people')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                <strong>{t('confirmedCreatorsReport.notShipped')}:</strong> {applications.filter(app => !app.tracking_number).length}{t('common.people')}
              </span>
            </div>
            {/* 기업 보고서에서는 총 리워드 정보 숨김 */}
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Confirmed Creators List */}
      <div className="grid gap-4">
        {applications.map((application) => {
          const profile = userProfiles[application.user_id]
          
          return (
            <Card key={application.id} className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('confirmedCreatorsReport.confirmed')}
                      </Badge>
                      {application.tracking_number && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Package className="h-3 w-3 mr-1" />
                          {t('confirmedCreatorsReport.shipped')}
                        </Badge>
                      )}
                    </div>
                    
                    {/* SNS 정보 */}
                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                      {profile?.instagram_url && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            <span>Instagram</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {profile?.tiktok_url && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Hash className="h-4 w-4 text-black" />
                            <span>TikTok</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {profile?.youtube_url && (
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            <span>YouTube</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 주소 정보 */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">{t('confirmedCreatorsReport.shippingAddress')}</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <p><strong>{t('confirmedCreatorsReport.postalCode')}:</strong> {profile?.postal_code || 'N/A'}</p>
                        <p><strong>{t('confirmedCreatorsReport.address')}:</strong> {`${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A'}</p>
                        <p><strong>{t('confirmedCreatorsReport.phone')}:</strong> {profile?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* 배송 정보 */}
                    {application.tracking_number && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">{t('confirmedCreatorsReport.shippingInfo')}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(application.tracking_number)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {t('common.copy')}
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={getJapanPostTrackingUrl(application.tracking_number)} target="_blank" rel="noopener noreferrer">
                                <Search className="h-3 w-3 mr-1" />
                                {t('confirmedCreatorsReport.track')}
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-green-700">
                          <p><strong>{t('confirmedCreatorsReport.trackingNumber')}:</strong> {application.tracking_number}</p>
                          <p><strong>{t('confirmedCreatorsReport.shippingDate')}:</strong> {application.shipped_at ? formatDate(application.shipped_at) : 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTrackingModal(application)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {application.tracking_number ? t('confirmedCreatorsReport.editShipping') : t('confirmedCreatorsReport.enterTracking')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {applications.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('confirmedCreatorsReport.noCreators')}</h3>
              <p className="text-gray-500">{t('confirmedCreatorsReport.noCreatorsDescription')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 배송 정보 입력 모달 */}
      <Dialog open={trackingModal} onOpenChange={setTrackingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmedCreatorsReport.shippingManagement')}</DialogTitle>
            <DialogDescription>
              {t('confirmedCreatorsReport.shippingDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{userProfiles[selectedApplication.user_id]?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">
                  {`${userProfiles[selectedApplication.user_id]?.prefecture || ''} ${userProfiles[selectedApplication.user_id]?.city || ''}`.trim()}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="tracking_number">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span>{t('confirmedCreatorsReport.trackingNumber')}</span>
                </div>
              </Label>
              <Input
                id="tracking_number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="例: 1234-5678-9012"
              />
              <p className="text-xs text-gray-500">
                {t('confirmedCreatorsReport.trackingHelp')}
              </p>
            </div>
            
            {trackingNumber && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('confirmedCreatorsReport.trackingUrl')}:</strong>
                </p>
                <a 
                  href={getJapanPostTrackingUrl(trackingNumber)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {getJapanPostTrackingUrl(trackingNumber)}
                </a>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleTrackingUpdate(selectedApplication.id, trackingNumber)}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('common.save')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setTrackingModal(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfirmedCreatorsReport_multilingual
