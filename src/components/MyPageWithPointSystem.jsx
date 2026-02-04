import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Loader2, Upload, Download, Eye, Edit, Save, X,
  AlertCircle, CheckCircle, Clock, DollarSign, 
  Calendar, FileText, ExternalLink, Play, Coins,
  Instagram, Youtube, Hash, Globe, AlertTriangle,
  CreditCard, Banknote, TrendingUp, Home, Settings, User
} from 'lucide-react'
import { Link } from 'react-router-dom'

const MyPageWithPointSystem = () => {
  const { user } = useAuth()
  const { language } = useLanguage()
  
  const [applications, setApplications] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [pointBalance, setPointBalance] = useState(0)
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
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('Loading user data')
      
      // 사용자 프로필 로드
      try {
        const profile = await database.userProfiles.get(user.id)
        console.log('User profile loaded')
        setUserProfile(profile)
      } catch (profileError) {
        console.error('Profile loading error:', profileError)
        // 프로필이 없어도 계속 진행
        setUserProfile(null)
      }
      
      // 사용자의 신청서들 로드
      try {
        const userApplications = await database.applications.getByUser(user.id)
        console.log('User applications loaded:', userApplications?.length || 0, '개')
        setApplications(userApplications || [])
        
        // 포인트 잔액 계산
        const completedApps = userApplications?.filter(app => app.status === 'completed') || []
        const totalPoints = completedApps.reduce((sum, app) => {
          return sum + (app.campaigns?.reward_amount || app.campaign?.reward_amount || 0)
        }, 0)
        
        // 출금 요청된 포인트 차감
        try {
          const withdrawalRequests = await database.withdrawals.getByUser(user.id)
          const withdrawnPoints = withdrawalRequests?.reduce((sum, withdrawal) => {
            return sum + (withdrawal.status === 'completed' ? withdrawal.amount : 0)
          }, 0) || 0
          
          setPointBalance(totalPoints - withdrawnPoints)
        } catch (withdrawalError) {
          console.error('Withdrawal loading error:', withdrawalError)
          setPointBalance(totalPoints) // 출금 정보 없이도 포인트 표시
        }
        
      } catch (applicationError) {
        console.error('Applications loading error:', applicationError)
        setApplications([])
        setPointBalance(0)
      }
      
    } catch (error) {
      console.error('Load user data error:', error)
      setError(`データの読み込みに失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (applicationId) => {
    try {
      setProcessing(true)
      setError('')
      
      // 빈 링크 제거
      const cleanedLinks = Object.fromEntries(
        Object.entries(videoLinks).filter(([key, value]) => value.trim() !== '')
      )
      
      if (Object.keys(cleanedLinks).length === 0 || (Object.keys(cleanedLinks).length === 1 && cleanedLinks.notes)) {
        setError('最低1つの動画URLを入力してください。')
        return
      }
      
      await database.applications.update(applicationId, {
        video_links: cleanedLinks,
        video_uploaded_at: new Date().toISOString(),
        status: 'completed'
      })
      
      // 포인트 신청 자격 부여
      await database.applications.update(applicationId, {
        point_eligible: true
      })
      
      setSuccess('動画アップロードが完了しました！ポイント申請が可能になりました。')
      setVideoModal(false)
      loadUserData()
      
    } catch (error) {
      console.error('Video upload error:', error)
      setError('動画アップロードに失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handlePointRequest = async (applicationId, campaignReward) => {
    try {
      setProcessing(true)
      setError('')
      
      // 포인트 신청 요청 생성
      await database.pointRequests.create({
        user_id: user.id,
        application_id: applicationId,
        amount: campaignReward,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      
      setSuccess('ポイント申請を送信しました。管理者の承認をお待ちください。')
      loadUserData()
      
    } catch (error) {
      console.error('Point request error:', error)
      setError('ポイント申請に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const openVideoModal = (application) => {
    setSelectedApplication(application)
    setVideoLinks(application.video_links || {
      instagram_url: '',
      tiktok_url: '',
      youtube_url: '',
      other_url: '',
      notes: ''
    })
    setVideoModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '審査中', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: '承認済み', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: '却下', icon: X },
      completed: { color: 'bg-blue-100 text-blue-800', text: '完了', icon: CheckCircle }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">マイページ</h1>
              <p className="text-gray-600">キャンペーン参加状況とポイント管理</p>
            </div>
            <div className="flex space-x-3">
              <Link to="/">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>メイン画面</span>
                </Button>
              </Link>
              <Link to="/profile-settings">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>プロフィール設定</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Point Balance Card */}
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-6 w-6 text-green-600" />
              <span>ポイント残高</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(pointBalance)}
                </div>
                <p className="text-sm text-gray-600">利用可能ポイント</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => window.location.href = '/withdrawal'}
                  disabled={pointBalance <= 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  出金申請
                </Button>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  履歴
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Applications List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">参加キャンペーン</h2>
          
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>{application.campaign?.title || 'N/A'}</span>
                      {getStatusBadge(application.status)}
                    </CardTitle>
                    <CardDescription className="text-purple-600 font-medium mt-1">
                      {application.campaign?.brand || 'N/A'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(application.campaign?.reward_amount)}
                    </div>
                    <div className="text-sm text-gray-600">報酬</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        応募日: {new Date(application.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>
                        ステータス: {application.status === 'pending' ? '審査中' : 
                                   application.status === 'approved' ? '承認済み' :
                                   application.status === 'completed' ? '完了' : '却下'}
                      </span>
                    </div>
                    {application.approved_at && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>
                          承認日: {new Date(application.approved_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 승인된 경우 영상 업로드 섹션 */}
                  {application.status === 'approved' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">動画アップロード</h4>
                          <p className="text-sm text-blue-600">
                            承認されました！動画をアップロードしてポイントを獲得しましょう。
                          </p>
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            <strong>重要:</strong> 動画1次共有後、修正後にSNSアップロードしてください。任意アップロードは禁止です。
                          </div>
                        </div>
                        <Button
                          onClick={() => openVideoModal(application)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          動画アップロード
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 완료된 경우 업로드된 영상 표시 */}
                  {application.status === 'completed' && application.video_links && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-3">アップロード済み動画</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {application.video_links.instagram_url && (
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
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
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
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
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
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
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-blue-500" />
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
                      
                      {/* 포인트 신청 버튼 */}
                      {application.point_eligible && !application.point_requested && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-green-800">ポイント申請可能</p>
                              <p className="text-sm text-green-600">
                                動画アップロードが完了しました。ポイントを申請してください。
                              </p>
                            </div>
                            <Button
                              onClick={() => handlePointRequest(application.id, application.campaign?.reward_amount)}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Coins className="h-4 w-4 mr-2" />
                              ポイント申請
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {application.point_requested && (
                        <div className="mt-4 pt-4 border-t">
                          <Badge className="bg-orange-100 text-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            ポイント申請中
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {applications.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">参加キャンペーンがありません</h3>
                  <p className="text-gray-500 mb-4">まだキャンペーンに参加していません。</p>
                  <Button onClick={() => window.location.href = '/'}>
                    キャンペーンを探す
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 영상 업로드 모달 */}
        <Dialog open={videoModal} onOpenChange={setVideoModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>動画アップロード</DialogTitle>
              <DialogDescription>
                SNSにアップロードした動画のURLを入力してください
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">重要な注意事項</p>
                  <p>動画1次共有後、修正後にSNSアップロードしてください。任意アップロードは禁止です。</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url" className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span>Instagram URL</span>
                </Label>
                <Input
                  id="instagram_url"
                  value={videoLinks.instagram_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://www.instagram.com/reel/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiktok_url" className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-black" />
                  <span>TikTok URL</span>
                </Label>
                <Input
                  id="tiktok_url"
                  value={videoLinks.tiktok_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  placeholder="https://www.tiktok.com/@username/video/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube_url" className="flex items-center space-x-2">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span>YouTube URL</span>
                </Label>
                <Input
                  id="youtube_url"
                  value={videoLinks.youtube_url}
                  onChange={(e) => setVideoLinks(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="other_url" className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>その他プラットフォーム URL</span>
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
                  placeholder="追加の情報や備考があれば入力してください"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={() => handleVideoUpload(selectedApplication?.id)}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                アップロード完了
              </Button>
              <Button
                variant="outline"
                onClick={() => setVideoModal(false)}
              >
                キャンセル
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MyPageWithPointSystem
