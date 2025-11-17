import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, User, Calendar, DollarSign, FileText, 
  AlertCircle, CheckCircle, Clock, ExternalLink,
  Instagram, Youtube, Hash, FolderOpen, BookOpen,
  Upload, Link as LinkIcon, Play, Eye, Copy,
  Bell, Settings, LogOut, CreditCard, MapPin
} from 'lucide-react'

const MyPageWithVideoUpload = () => {
  const { user, signOut } = useAuth()
  
  const [userProfile, setUserProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [campaigns, setCampaigns] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [videoModal, setVideoModal] = useState(false)
  const [videoLinks, setVideoLinks] = useState({
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    other_url: '',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 사용자 프로필 로드
      const profileData = await database.userProfiles.getByUserId(user.id)
      setUserProfile(profileData)
      
      // 사용자의 캠페인 신청 내역 로드
      const applicationsData = await database.applications.getByUserId(user.id)
      setApplications(applicationsData || [])
      
      // 캠페인 정보 로드
      const campaignIds = [...new Set(applicationsData?.map(app => app.campaign_id) || [])]
      const campaignsData = {}
      for (const campaignId of campaignIds) {
        const campaign = await database.campaigns.getById(campaignId)
        if (campaign) {
          campaignsData[campaignId] = campaign
        }
      }
      setCampaigns(campaignsData)
      
    } catch (error) {
      console.error('Load data error:', error)
      setError('データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoLinksUpdate = async (applicationId, links) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        video_links: links,
        video_uploaded_at: new Date().toISOString(),
        status: 'completed' // 영상 업로드 완료 시 상태를 완료로 변경
      })
      
      setSuccess('動画リンクを更新しました。')
      setVideoModal(false)
      loadData()
      
    } catch (error) {
      console.error('Video links update error:', error)
      setError('動画リンクの更新に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const openVideoModal = (application) => {
    setSelectedApplication(application)
    setVideoLinks({
      instagram_url: application.video_links?.instagram_url || '',
      tiktok_url: application.video_links?.tiktok_url || '',
      youtube_url: application.video_links?.youtube_url || '',
      other_url: application.video_links?.other_url || '',
      notes: application.video_links?.notes || ''
    })
    setVideoModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '審査中', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: '承認済み', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: '却下', icon: AlertCircle },
      completed: { color: 'bg-blue-100 text-blue-800', text: '完了', icon: CheckCircle }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('リンクをコピーしました。')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">マイページ</h1>
                <p className="text-gray-600">{userProfile?.name || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                通知
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Profile */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>プロフィール</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">お名前</Label>
                    <p className="font-medium">{userProfile?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">年齢</Label>
                    <p>{userProfile?.age || 'N/A'}歳</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">肌タイプ</Label>
                    <p>{userProfile?.skin_type || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">住所</Label>
                    <p className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{userProfile?.prefecture || 'N/A'}</span>
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">SNSアカウント</Label>
                    {userProfile?.instagram_url && (
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <span className="text-sm">{userProfile.instagram_followers || 0} フォロワー</span>
                      </div>
                    )}
                    {userProfile?.tiktok_url && (
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-black" />
                        <span className="text-sm">{userProfile.tiktok_followers || 0} フォロワー</span>
                      </div>
                    )}
                    {userProfile?.youtube_url && (
                      <div className="flex items-center space-x-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{userProfile.youtube_followers || 0} 登録者</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>統計</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">総応募数</span>
                    <span className="font-bold">{applications.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">承認済み</span>
                    <span className="font-bold text-green-600">
                      {applications.filter(app => app.status === 'approved' || app.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">完了済み</span>
                    <span className="font-bold text-blue-600">
                      {applications.filter(app => app.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">獲得報酬</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(
                        applications
                          .filter(app => app.status === 'completed')
                          .reduce((total, app) => total + (campaigns[app.campaign_id]?.reward_amount || 0), 0)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Applications */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>キャンペーン応募履歴</span>
                  </CardTitle>
                  <CardDescription>
                    応募したキャンペーンの状況を確認できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.map((application) => {
                      const campaign = campaigns[application.campaign_id]
                      
                      return (
                        <Card key={application.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold">{campaign?.title || 'N/A'}</h3>
                                  {getStatusBadge(application.status)}
                                </div>
                                
                                <p className="text-purple-600 font-medium mb-2">{campaign?.brand}</p>
                                
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span>報酬: {formatCurrency(campaign?.reward_amount)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span>応募日: {new Date(application.created_at).toLocaleDateString('ko-KR')}</span>
                                  </div>
                                </div>

                                {/* 승인된 경우 Google Drive 링크 표시 */}
                                {(application.status === 'approved' || application.status === 'completed') && application.drive_links && (
                                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 mb-3">共有リソース</h4>
                                    <div className="space-y-2">
                                      {application.drive_links.video_folder && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <FolderOpen className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm">動画共有フォルダ</span>
                                          </div>
                                          <div className="flex space-x-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => copyToClipboard(application.drive_links.video_folder)}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                              <a href={application.drive_links.video_folder} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {application.drive_links.guide_folder && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <BookOpen className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">ガイドフォルダ</span>
                                          </div>
                                          <div className="flex space-x-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => copyToClipboard(application.drive_links.guide_folder)}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                              <a href={application.drive_links.guide_folder} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 영상 업로드 링크 표시 */}
                                {application.video_links && Object.values(application.video_links).some(link => link) && (
                                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-3">アップロード済み動画</h4>
                                    <div className="space-y-2">
                                      {application.video_links.instagram_url && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Instagram className="h-4 w-4 text-pink-500" />
                                            <span className="text-sm">Instagram</span>
                                          </div>
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={application.video_links.instagram_url} target="_blank" rel="noopener noreferrer">
                                              <Play className="h-3 w-3 mr-1" />
                                              視聴
                                            </a>
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {application.video_links.tiktok_url && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Hash className="h-4 w-4 text-black" />
                                            <span className="text-sm">TikTok</span>
                                          </div>
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={application.video_links.tiktok_url} target="_blank" rel="noopener noreferrer">
                                              <Play className="h-3 w-3 mr-1" />
                                              視聴
                                            </a>
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {application.video_links.youtube_url && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Youtube className="h-4 w-4 text-red-500" />
                                            <span className="text-sm">YouTube</span>
                                          </div>
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={application.video_links.youtube_url} target="_blank" rel="noopener noreferrer">
                                              <Play className="h-3 w-3 mr-1" />
                                              視聴
                                            </a>
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {application.video_links.other_url && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <LinkIcon className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm">その他</span>
                                          </div>
                                          <Button variant="outline" size="sm" asChild>
                                            <a href={application.video_links.other_url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              開く
                                            </a>
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                {application.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => openVideoModal(application)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    動画アップロード
                                  </Button>
                                )}
                                
                                {application.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openVideoModal(application)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    動画リンク編集
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    
                    {applications.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">応募履歴がありません</h3>
                        <p className="text-gray-500">キャンペーンに応募すると、ここに表示されます。</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 영상 업로드 모달 */}
      <Dialog open={videoModal} onOpenChange={setVideoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>動画リンクアップロード</DialogTitle>
            <DialogDescription>
              SNSにアップロードした動画のリンクを共有してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{campaigns[selectedApplication.campaign_id]?.title}</p>
                <p className="text-sm text-gray-600">{campaigns[selectedApplication.campaign_id]?.brand}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span>Instagram 動画URL</span>
                  </div>
                </Label>
                <Input
                  id="instagram_url"
                  value={videoLinks.instagram_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiktok_url">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-black" />
                    <span>TikTok 動画URL</span>
                  </div>
                </Label>
                <Input
                  id="tiktok_url"
                  value={videoLinks.tiktok_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  placeholder="https://www.tiktok.com/@username/video/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube_url">
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <span>YouTube 動画URL</span>
                  </div>
                </Label>
                <Input
                  id="youtube_url"
                  value={videoLinks.youtube_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="other_url">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4 text-gray-500" />
                    <span>その他のURL</span>
                  </div>
                </Label>
                <Input
                  id="other_url"
                  value={videoLinks.other_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, other_url: e.target.value }))}
                  placeholder="その他のプラットフォームのURL"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={videoLinks.notes}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="動画に関する追加情報があれば記入してください"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleVideoLinksUpdate(selectedApplication.id, videoLinks)}
                disabled={processing || !Object.values(videoLinks).some(link => link && link !== videoLinks.notes)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                動画リンクを保存
              </Button>
              <Button
                variant="outline"
                onClick={() => setVideoModal(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyPageWithVideoUpload
