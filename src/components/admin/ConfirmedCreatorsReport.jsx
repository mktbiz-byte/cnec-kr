import { useState, useEffect } from 'react'
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

const ConfirmedCreatorsReport = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
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
      
      // 특정 캠페인 또는 전체 캠페인 로드
      if (campaignId && campaignId !== 'undefined') {
        const campaignData = await database.campaigns.getById(campaignId)
        if (!campaignData) {
          setError('キャンペーンが見つかりません。')
          return
        }
        setCampaign(campaignData)
      } else {
        // campaignId가 없으면 전체 확정 크리에이터 보기
        console.log('전체 확정 크리에이터 보기 모드')
        setCampaign(null)
      }
      
      // 승인된 신청서들 로드 (확정 크리에이터)
      let applicationsData
      if (campaignId && campaignId !== 'undefined') {
        applicationsData = await database.applications.getByCampaign(campaignId)
      } else {
        applicationsData = await database.applications.getAll()
      }
      
      if (!applicationsData || applicationsData.length === 0) {
        setApplications([])
        return
      }
      
      const approvedApplications = (Array.isArray(applicationsData) ? applicationsData : applicationsData?.data || [])
        .filter(app => app.status === 'approved' || app.status === 'completed')
      setApplications(approvedApplications)
      
      // 신청자들의 프로필 정보 로드
      const profiles = {}
      for (const app of approvedApplications) {
        const profile = await database.userProfiles.get(app.user_id)
        if (profile) {
          profiles[app.user_id] = profile
        }
      }
      setUserProfiles(profiles)
      
    } catch (error) {
      console.error('Load data error:', error)
      setError('データの読み込みに실패했습니다。')
    } finally {
      setLoading(false)
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
      
      setSuccess('配送情報を업데이트しました。')
      setTrackingModal(false)
      loadData()
      
    } catch (error) {
      console.error('Tracking update error:', error)
      setError('配送情報の업데이트に실패했습니다。')
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
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const exportToExcel = () => {
    const headers = ['名前', 'Instagram', 'TikTok', 'YouTube', '郵便番号', '住所', '配送番号', '配送状況', '승인日']
    const rows = applications.map(app => {
      const profile = userProfiles[app.user_id]
      return [
        profile?.name || 'N/A',
        profile?.instagram_url || 'N/A',
        profile?.tiktok_url || 'N/A',
        profile?.youtube_url || 'N/A',
        profile?.postal_code || 'N/A',
        `${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A',
        app.tracking_number || '未発送',
        app.tracking_number ? '発送済み' : '未発送',
        app.approved_at ? new Date(app.approved_at).toLocaleDateString('ja-JP') : 'N/A'
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
          <p className="text-gray-600">확정 크리에이터データを로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!campaign && campaignId && campaignId !== 'undefined') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">キャンペーンが見つかりません</h3>
        <Button onClick={() => navigate('/campaigns-manage')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          キャンペーン목록に돌아가기
        </Button>
      </div>
    )
  }
  
  // 전체 확정 크리에이터 보기 모드
  if (!campaign && (!campaignId || campaignId === 'undefined')) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={() => navigate('/campaigns-manage')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              キャンペーン목록に돌아가기
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel出力
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">全キャンペーン확정 크리에이터</CardTitle>
            <CardDescription className="text-lg mt-2 text-purple-600">
              全キャンペーンの확정 크리에이터管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  <strong>확정 크리에이터:</strong> {applications.length}名
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="text-sm">
                  <strong>発送済み:</strong> {applications.filter(app => app.tracking_number).length}名
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
                          確定済み
                        </Badge>
                        {application.tracking_number && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Package className="h-3 w-3 mr-1" />
                            発送済み
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
                          <span className="font-medium text-blue-800">配送先住所</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <p><strong>郵便番号:</strong> {profile?.postal_code || 'N/A'}</p>
                          <p><strong>住所:</strong> {`${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A'}</p>
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
                        {application.tracking_number ? '配送情報편집' : '配送番号入力'}
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
                <h3 className="text-lg font-semibold text-gray-600 mb-2">확정 크리에이터がいません</h3>
                <p className="text-gray-500">まだ승인された크리에이터がいません。</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 배송 정보 입력 모달 */}
        <Dialog open={trackingModal} onOpenChange={setTrackingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>配送情報管理</DialogTitle>
              <DialogDescription>
                확정 크리에이터への商品発送情報を入力してください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">配送追跡番号</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="例: 123456789012"
                />
                <p className="text-sm text-gray-500">
                  日本郵便、ヤマト運輸、佐川急便などの追跡番号を入力してください。
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTrackingModal(false)}>
                취소
              </Button>
              <Button 
                onClick={() => handleTrackingUpdate(selectedApplication?.id, trackingNumber)}
                disabled={processing}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => navigate('/campaigns-manage')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            キャンペーン목록に돌아가기
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel出力
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
                {campaign.brand} - 확정 크리에이터管理
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(campaign.reward_amount)}
              </div>
              <div className="text-sm text-gray-600">単価보상</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <strong>확정 크리에이터:</strong> {applications.length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                <strong>発送済み:</strong> {applications.filter(app => app.tracking_number).length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                <strong>未発送:</strong> {applications.filter(app => !app.tracking_number).length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <span className="text-sm">
                <strong>総보상:</strong> {formatCurrency(applications.length * campaign.reward_amount)}
              </span>
            </div>
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
                        確定済み
                      </Badge>
                      {application.tracking_number && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Package className="h-3 w-3 mr-1" />
                          発送済み
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
                        <span className="font-medium text-blue-800">配送先住所</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <p><strong>郵便番号:</strong> {profile?.postal_code || 'N/A'}</p>
                        <p><strong>住所:</strong> {`${profile?.prefecture || ''} ${profile?.city || ''} ${profile?.address || ''}`.trim() || 'N/A'}</p>
                        <p><strong>電話番号:</strong> {profile?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* 배송 정보 */}
                    {application.tracking_number && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">配送情報</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(application.tracking_number)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              コピー
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={getJapanPostTrackingUrl(application.tracking_number)} target="_blank" rel="noopener noreferrer">
                                <Search className="h-3 w-3 mr-1" />
                                追跡
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-green-700">
                          <p><strong>配送番号:</strong> {application.tracking_number}</p>
                          <p><strong>発送日:</strong> {application.shipped_at ? new Date(application.shipped_at).toLocaleDateString('ja-JP') : 'N/A'}</p>
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
                      {application.tracking_number ? '配送情報편집' : '配送番号入力'}
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
              <h3 className="text-lg font-semibold text-gray-600 mb-2">확정 크리에이터がいません</h3>
              <p className="text-gray-500">まだ승인された크리에이터がいません。</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 배송 정보 입력 모달 */}
      <Dialog open={trackingModal} onOpenChange={setTrackingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配送情報管理</DialogTitle>
            <DialogDescription>
              日本郵便の配送番号を入力してください。追跡可能な番号を入力すると自動的に追跡リンクが生成されます。
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
                  <span>配送番号 (日本郵便)</span>
                </div>
              </Label>
              <Input
                id="tracking_number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="例: 1234-5678-9012"
              />
              <p className="text-xs text-gray-500">
                日本郵便の追跡番号を入力してください。空にすると配送情報がクリアされます。
              </p>
            </div>
            
            {trackingNumber && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>追跡URL:</strong>
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
                저장
              </Button>
              <Button
                variant="outline"
                onClick={() => setTrackingModal(false)}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ConfirmedCreatorsReport
