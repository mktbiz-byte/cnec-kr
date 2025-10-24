import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
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
  Loader2, ArrowLeft, Download, Eye, Edit, Check, X, 
  AlertCircle, CheckCircle, Clock, Users, FileText, 
  Calendar, DollarSign, Target, Mail, Phone, MapPin,
  Instagram, Youtube, Hash, ExternalLink, Copy,
  FolderOpen, FileVideo, BookOpen, Link as LinkIcon
} from 'lucide-react'

const CampaignApplicationsReport = () => {
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
  const [detailModal, setDetailModal] = useState(false)
  const [driveModal, setDriveModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [driveLinks, setDriveLinks] = useState({
    video_folder: '',
    guide_folder: ''
  })

  useEffect(() => {
    if (campaignId) {
      loadData()
    }
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 캠페인 정보 로드
      const campaignData = await database.campaigns.getById(campaignId)
      if (!campaignData) {
        setError('キャンペーンが見つかりません。')
        return
      }
      setCampaign(campaignData)
      
      // 해당 캠페인의 신청서들 로드
      const applicationsData = await database.applications.getByCampaignId(campaignId)
      setApplications(applicationsData || [])
      
      // 신청자들의 프로필 정보 로드
      const profiles = {}
      for (const app of applicationsData || []) {
        const profile = await database.userProfiles.getByUserId(app.user_id)
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

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        status: newStatus,
        reviewed_at: new Date().toISOString()
      })
      
      setSuccess(`ステータスを「${getStatusText(newStatus)}」に업데이트しました。`)
      loadData()
      
    } catch (error) {
      console.error('Status update error:', error)
      setError('ステータスの업데이트に실패했습니다。')
    } finally {
      setProcessing(false)
    }
  }

  const handleDriveLinksUpdate = async (applicationId, links) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        drive_links: links,
        drive_shared_at: new Date().toISOString()
      })
      
      setSuccess('Google Drive リンクを업데이트しました。')
      setDriveModal(false)
      loadData()
      
    } catch (error) {
      console.error('Drive links update error:', error)
      setError('Google Drive リンクの업데이트に실패했습니다。')
    } finally {
      setProcessing(false)
    }
  }

  const openDriveModal = (application) => {
    setSelectedApplication(application)
    setDriveLinks({
      video_folder: application.drive_links?.video_folder || '',
      guide_folder: application.drive_links?.guide_folder || ''
    })
    setDriveModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '審査中' },
      approved: { color: 'bg-green-100 text-green-800', text: '승인됨' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거부됨' },
      completed: { color: 'bg-blue-100 text-blue-800', text: '완료' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getStatusText = (status) => {
    const statusTexts = {
      pending: '審査中',
      approved: '승인됨',
      rejected: '거부됨',
      completed: '완료'
    }
    return statusTexts[status] || '審査中'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const exportToExcel = () => {
    // Excel 내보내기 기능 (간단한 CSV 형태)
    const headers = ['名前', 'メール', '年齢', '肌タイプ', 'Instagram', 'TikTok', 'YouTube', 'ステータス', '지원日']
    const rows = filteredApplications.map(app => {
      const profile = userProfiles[app.user_id]
      return [
        profile?.name || 'N/A',
        profile?.email || 'N/A',
        profile?.age || 'N/A',
        profile?.skin_type || 'N/A',
        profile?.instagram_url || 'N/A',
        profile?.tiktok_url || 'N/A',
        profile?.youtube_url || 'N/A',
        getStatusText(app.status),
        new Date(app.created_at).toLocaleDateString('ja-JP')
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${campaign?.title || 'campaign'}_applications.csv`
    link.click()
  }

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">지원者データを로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
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
                {campaign.brand}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(campaign.reward_amount)}
              </div>
              <div className="text-sm text-gray-600">보상</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm">
                <strong>지원者:</strong> {applications.length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <strong>승인됨:</strong> {applications.filter(app => app.status === 'approved').length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">
                <strong>審査中:</strong> {applications.filter(app => app.status === 'pending').length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm">
                <strong>締切:</strong> {new Date(campaign.application_deadline).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label>ステータス:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て ({applications.length})</SelectItem>
                <SelectItem value="pending">審査中 ({applications.filter(app => app.status === 'pending').length})</SelectItem>
                <SelectItem value="approved">승인됨 ({applications.filter(app => app.status === 'approved').length})</SelectItem>
                <SelectItem value="rejected">거부됨 ({applications.filter(app => app.status === 'rejected').length})</SelectItem>
                <SelectItem value="completed">완료 ({applications.filter(app => app.status === 'completed').length})</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const profile = userProfiles[application.user_id]
          
          return (
            <Card key={application.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                      {getStatusBadge(application.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(application.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{profile?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{profile?.age || 'N/A'}歳 / {profile?.skin_type || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{profile?.prefecture || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm mt-2">
                      {profile?.instagram_url && (
                        <div className="flex items-center space-x-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <span>{profile.instagram_followers || 0} フォロワー</span>
                        </div>
                      )}
                      {profile?.tiktok_url && (
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-black" />
                          <span>{profile.tiktok_followers || 0} フォロワー</span>
                        </div>
                      )}
                      {profile?.youtube_url && (
                        <div className="flex items-center space-x-2">
                          <Youtube className="h-4 w-4 text-red-500" />
                          <span>{profile.youtube_followers || 0} 登録者</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application)
                        setDetailModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      상세
                    </Button>
                    
                    {application.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          승인
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={processing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          거부됨
                        </Button>
                      </>
                    )}
                    
                    {application.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDriveModal(application)}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Drive管理
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">지원者がいません</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'このキャンペーンにはまだ지원者がいません'
                  : `「${getStatusText(statusFilter)}」の지원者がいません`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 응용서 상세 모달 */}
      <Dialog open={detailModal} onOpenChange={setDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>지원상세</DialogTitle>
            <DialogDescription>
              지원者の상세情報を확인してください
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">基本情報</TabsTrigger>
                  <TabsTrigger value="sns">SNS情報</TabsTrigger>
                  <TabsTrigger value="application">지원内容</TabsTrigger>
                  <TabsTrigger value="questions">質問回答</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>お名前</Label>
                      <p className="text-lg font-medium">{userProfiles[selectedApplication.user_id]?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>年齢</Label>
                      <p className="text-lg">{userProfiles[selectedApplication.user_id]?.age || 'N/A'}歳</p>
                    </div>
                    <div>
                      <Label>メールアドレス</Label>
                      <p>{userProfiles[selectedApplication.user_id]?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>電話番号</Label>
                      <p>{userProfiles[selectedApplication.user_id]?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>肌タイプ</Label>
                      <p>{userProfiles[selectedApplication.user_id]?.skin_type || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>住所</Label>
                      <p>{userProfiles[selectedApplication.user_id]?.prefecture || 'N/A'} {userProfiles[selectedApplication.user_id]?.city || ''}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sns" className="space-y-4">
                  <div className="space-y-4">
                    {userProfiles[selectedApplication.user_id]?.instagram_url && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Instagram className="h-6 w-6 text-pink-500" />
                          <div>
                            <p className="font-medium">Instagram</p>
                            <p className="text-sm text-gray-600">{userProfiles[selectedApplication.user_id].instagram_followers || 0} フォロワー</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfiles[selectedApplication.user_id].instagram_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            開く
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {userProfiles[selectedApplication.user_id]?.tiktok_url && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Hash className="h-6 w-6 text-black" />
                          <div>
                            <p className="font-medium">TikTok</p>
                            <p className="text-sm text-gray-600">{userProfiles[selectedApplication.user_id].tiktok_followers || 0} フォロワー</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfiles[selectedApplication.user_id].tiktok_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            開く
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {userProfiles[selectedApplication.user_id]?.youtube_url && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Youtube className="h-6 w-6 text-red-500" />
                          <div>
                            <p className="font-medium">YouTube</p>
                            <p className="text-sm text-gray-600">{userProfiles[selectedApplication.user_id].youtube_followers || 0} 登録者</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfiles[selectedApplication.user_id].youtube_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            開く
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="application" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>지원動機</Label>
                      <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedApplication.motivation || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>コンテンツ企画案</Label>
                      <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedApplication.content_plan || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>過去の経験・実績</Label>
                      <p className="mt-2 p-3 bg-gray-50 rounded-lg">{selectedApplication.previous_experience || 'N/A'}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="questions" className="space-y-4">
                  {selectedApplication.question_answers && Object.keys(selectedApplication.question_answers).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(selectedApplication.question_answers).map(([index, answer]) => {
                        const questionIndex = parseInt(index)
                        const question = campaign.questions?.[questionIndex]
                        
                        return question ? (
                          <div key={index}>
                            <Label>質問 {questionIndex + 1}: {question.text}</Label>
                            <p className="mt-2 p-3 bg-gray-50 rounded-lg">{answer || 'N/A'}</p>
                          </div>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">質問への回答がありません</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Google Drive 관리 모달 */}
      <Dialog open={driveModal} onOpenChange={setDriveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Drive 管理</DialogTitle>
            <DialogDescription>
              승인された크리에이터に共有するGoogle DriveとSlidesのリンクを설정してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{userProfiles[selectedApplication.user_id]?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">{userProfiles[selectedApplication.user_id]?.email || 'N/A'}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="video_folder">
                <div className="flex items-center space-x-2">
                  <FileVideo className="h-4 w-4 text-blue-600" />
                  <span>動画共有フォルダ (Google Drive)</span>
                </div>
              </Label>
              <Input
                id="video_folder"
                value={driveLinks.video_folder}
                onChange={(e) => setDriveLinks(prev => ({ ...prev, video_folder: e.target.value }))}
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guide_folder">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span>ガイドフォルダ (Google Slides)</span>
                </div>
              </Label>
              <Input
                id="guide_folder"
                value={driveLinks.guide_folder}
                onChange={(e) => setDriveLinks(prev => ({ ...prev, guide_folder: e.target.value }))}
                placeholder="https://docs.google.com/presentation/d/..."
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleDriveLinksUpdate(selectedApplication.id, driveLinks)}
                disabled={processing || (!driveLinks.video_folder && !driveLinks.guide_folder)}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                リンクを저장
              </Button>
              <Button
                variant="outline"
                onClick={() => setDriveModal(false)}
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

export default CampaignApplicationsReport
