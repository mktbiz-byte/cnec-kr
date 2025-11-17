import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, User, Calendar, DollarSign, FileText, ExternalLink,
  CheckCircle, Clock, AlertCircle, Upload, Link as LinkIcon,
  Instagram, Youtube, Hash, Twitter, Star, Award, Gift,
  CreditCard, Banknote, Send, Eye, Download, Play,
  MapPin, Phone, Mail, Edit, Save, X
} from 'lucide-react'

const MyPageWorkflow = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [points, setPoints] = useState(0)
  const [withdrawals, setWithdrawals] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // 모달 상태
  const [snsModal, setSnsModal] = useState(false)
  const [pointRequestModal, setPointRequestModal] = useState(false)
  const [videoSubmissionModal, setVideoSubmissionModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  
  // 폼 상태
  const [snsUrls, setSnsUrls] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: ''
  })
  const [videoSubmission, setVideoSubmission] = useState({
    video_url: '',
    description: '',
    hashtags: ''
  })
  const [pointRequest, setPointRequest] = useState({
    amount: '',
    reason: ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // 사용자 프로필 로드
      const profileData = await database.userProfiles.getByUserId(user.id)
      setUserProfile(profileData)
      
      if (profileData) {
        setSnsUrls({
          instagram: profileData.instagram_url || '',
          tiktok: profileData.tiktok_url || '',
          youtube: profileData.youtube_url || '',
          twitter: profileData.twitter_url || ''
        })
      }
      
      // 캠페인 신청 내역 로드
      const applicationsData = await database.applications.getByUserId(user.id)
      setApplications(applicationsData || [])
      
      // 포인트 정보 로드
      const pointsData = await database.points.getByUserId(user.id)
      const totalPoints = pointsData?.reduce((sum, point) => sum + point.amount, 0) || 0
      setPoints(totalPoints)
      
      // 출금 내역 로드
      const withdrawalsData = await database.withdrawals.getByUserId(user.id)
      setWithdrawals(withdrawalsData || [])
      
    } catch (error) {
      console.error('Load user data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '審査中', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', color: 'bg-green-100 text-green-800' },
      rejected: { label: '不承認', color: 'bg-red-100 text-red-800' },
      completed: { label: '完了', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const handleSnsUpdate = async () => {
    try {
      if (!userProfile) return
      
      const updateData = {
        instagram_url: snsUrls.instagram,
        tiktok_url: snsUrls.tiktok,
        youtube_url: snsUrls.youtube,
        twitter_url: snsUrls.twitter,
        updated_at: new Date().toISOString()
      }
      
      await database.userProfiles.update(userProfile.id, updateData)
      setUserProfile({ ...userProfile, ...updateData })
      setSnsModal(false)
      
      alert('SNS情報を更新しました。')
      
    } catch (error) {
      console.error('SNS update error:', error)
      alert('SNS情報の更新に失敗しました。')
    }
  }

  const handleVideoSubmission = async () => {
    try {
      if (!selectedApplication) return
      
      const submissionData = {
        application_id: selectedApplication.id,
        user_id: user.id,
        video_url: videoSubmission.video_url,
        description: videoSubmission.description,
        hashtags: videoSubmission.hashtags.split(',').map(tag => tag.trim()),
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      }
      
      await database.videoSubmissions.create(submissionData)
      
      // 신청 상태 업데이트
      await database.applications.update(selectedApplication.id, {
        status: 'video_submitted',
        updated_at: new Date().toISOString()
      })
      
      setVideoSubmissionModal(false)
      setVideoSubmission({ video_url: '', description: '', hashtags: '' })
      setSelectedApplication(null)
      
      // 데이터 새로고침
      await loadUserData()
      
      alert('動画を提出しました。')
      
    } catch (error) {
      console.error('Video submission error:', error)
      alert('動画の提出に失敗しました。')
    }
  }

  const handlePointRequest = async () => {
    try {
      const requestData = {
        user_id: user.id,
        amount: parseInt(pointRequest.amount),
        reason: pointRequest.reason,
        status: 'pending',
        requested_at: new Date().toISOString()
      }
      
      await database.pointRequests.create(requestData)
      
      setPointRequestModal(false)
      setPointRequest({ amount: '', reason: '' })
      
      alert('ポイント申請を送信しました。管理者の承認をお待ちください。')
      
    } catch (error) {
      console.error('Point request error:', error)
      alert('ポイント申請に失敗しました。')
    }
  }

  const canAccessCampaignMaterials = (application) => {
    return application.status === 'approved' || application.status === 'completed'
  }

  const canSubmitVideo = (application) => {
    return application.status === 'approved' && !application.video_submitted
  }

  const canRequestPoints = (application) => {
    return application.status === 'completed' && application.video_submitted
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
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎬</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">CNEC Japan</h1>
                <p className="text-sm text-gray-600">マイページ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" asChild>
                <Link to="/">ホーム</Link>
              </Button>
              <Button variant="outline" onClick={signOut}>
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            おかえりなさい、{userProfile?.name || 'ユーザー'}さん
          </h2>
          <p className="text-gray-600">
            キャンペーンの進行状況とポイント残高を確認できます
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{applications.length}</div>
                  <div className="text-sm text-gray-600">総応募数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {applications.filter(app => app.status === 'approved').length}
                  </div>
                  <div className="text-sm text-gray-600">承認済み</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">{points}</div>
                  <div className="text-sm text-gray-600">ポイント残高</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {applications.filter(app => app.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">完了済み</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="campaigns">キャンペーン</TabsTrigger>
            <TabsTrigger value="points">ポイント</TabsTrigger>
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>最近の応募</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.slice(0, 3).map((application) => (
                    <div key={application.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{application.campaign?.title || 'キャンペーン'}</div>
                        <div className="text-sm text-gray-600">{formatDate(application.created_at)}</div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">応募履歴がありません</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>クイックアクション</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link to="/">
                      <Eye className="h-4 w-4 mr-2" />
                      新しいキャンペーンを見る
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSnsModal(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    SNS情報を更新
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setPointRequestModal(true)}
                    disabled={points === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    ポイント申請
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/japan-bank-transfer">
                      <Banknote className="h-4 w-4 mr-2" />
                      出金申請
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">キャンペーン履歴</h3>
              <Button asChild>
                <Link to="/">新しいキャンペーンを探す</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{application.campaign?.title || 'キャンペーン'}</h4>
                        <p className="text-gray-600">{application.campaign?.brand}</p>
                        <p className="text-sm text-gray-500">応募日: {formatDate(application.created_at)}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(application.status)}
                        <div className="text-lg font-bold text-purple-600 mt-2">
                          {formatCurrency(application.campaign?.reward_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Campaign Workflow */}
                    <div className="space-y-3">
                      {/* Step 1: Application Submitted */}
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">応募完了</span>
                      </div>

                      {/* Step 2: Review */}
                      <div className="flex items-center space-x-3">
                        {application.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : application.status === 'approved' || application.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm">
                          {application.status === 'pending' ? '審査中' : 
                           application.status === 'approved' || application.status === 'completed' ? '承認済み' : '不承認'}
                        </span>
                      </div>

                      {/* Step 3: Campaign Materials Access */}
                      {canAccessCampaignMaterials(application) && (
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm">キャンペーン資料アクセス可能</span>
                          <div className="flex space-x-2">
                            {application.campaign?.google_drive_link && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(application.campaign.google_drive_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Google Drive
                              </Button>
                            )}
                            {application.campaign?.google_slides_link && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(application.campaign.google_slides_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Google Slides
                              </Button>
                            )}
                            {(!application.campaign?.google_drive_link && !application.campaign?.google_slides_link) && (
                              <span className="text-sm text-gray-500">管理者が準備中...</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 4: Video Submission */}
                      {canSubmitVideo(application) && (
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm">動画提出待ち</span>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application)
                              setVideoSubmissionModal(true)
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            動画を提出
                          </Button>
                        </div>
                      )}

                      {application.video_submitted && (
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm">動画提出完了</span>
                        </div>
                      )}

                      {/* Step 5: Points Request */}
                      {canRequestPoints(application) && (
                        <div className="flex items-center space-x-3">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm">ポイント申請可能</span>
                          <Button 
                            size="sm"
                            onClick={() => setPointRequestModal(true)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            ポイント申請
                          </Button>
                        </div>
                      )}

                      {application.status === 'completed' && (
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm">キャンペーン完了</span>
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
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        まだキャンペーンに応募していません
                      </h3>
                      <p className="text-gray-500 mb-4">
                        新しいキャンペーンに応募して、収益化を始めましょう
                      </p>
                      <Button asChild>
                        <Link to="/">キャンペーンを探す</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>ポイント残高</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">{points}</div>
                    <div className="text-gray-600 mb-4">ポイント</div>
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => setPointRequestModal(true)}
                        disabled={points === 0}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        ポイント申請
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/japan-bank-transfer">
                          <Banknote className="h-4 w-4 mr-2" />
                          出金申請
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>出金履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawals.length > 0 ? (
                    <div className="space-y-3">
                      {withdrawals.slice(0, 5).map((withdrawal) => (
                        <div key={withdrawal.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{formatCurrency(withdrawal.amount)}</div>
                            <div className="text-sm text-gray-600">{formatDate(withdrawal.created_at)}</div>
                          </div>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">出金履歴がありません</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>プロフィール情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">名前</Label>
                        <p className="text-gray-800">{userProfile.name || '未設定'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">年齢</Label>
                        <p className="text-gray-800">{userProfile.age || '未設定'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">電話番号</Label>
                        <p className="text-gray-800">{userProfile.phone || '未設定'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">肌タイプ</Label>
                        <p className="text-gray-800">{userProfile.skin_type || '未設定'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">住所</Label>
                        <p className="text-gray-800">
                          {userProfile.prefecture && userProfile.city && userProfile.address
                            ? `${userProfile.prefecture} ${userProfile.city} ${userProfile.address}`
                            : '未設定'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">SNSアカウント</Label>
                        <div className="space-y-2">
                          {userProfile.instagram_url && (
                            <div className="flex items-center space-x-2">
                              <Instagram className="h-4 w-4 text-pink-500" />
                              <a 
                                href={userProfile.instagram_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Instagram
                              </a>
                            </div>
                          )}
                          {userProfile.tiktok_url && (
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4 text-purple-500" />
                              <a 
                                href={userProfile.tiktok_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                TikTok
                              </a>
                            </div>
                          )}
                          {userProfile.youtube_url && (
                            <div className="flex items-center space-x-2">
                              <Youtube className="h-4 w-4 text-red-500" />
                              <a 
                                href={userProfile.youtube_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                YouTube
                              </a>
                            </div>
                          )}
                          {userProfile.twitter_url && (
                            <div className="flex items-center space-x-2">
                              <Twitter className="h-4 w-4 text-blue-500" />
                              <a 
                                href={userProfile.twitter_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Twitter
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      プロフィールが未設定です
                    </h3>
                    <p className="text-gray-500 mb-4">
                      キャンペーンに応募するためにプロフィールを設定してください
                    </p>
                    <Button asChild>
                      <Link to="/">キャンペーンに応募する</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* SNS Update Modal */}
      <Dialog open={snsModal} onOpenChange={setSnsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SNS情報更新</DialogTitle>
            <DialogDescription>
              SNSアカウントのURLを更新してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                value={snsUrls.instagram}
                onChange={(e) => setSnsUrls(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok URL</Label>
              <Input
                id="tiktok"
                value={snsUrls.tiktok}
                onChange={(e) => setSnsUrls(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input
                id="youtube"
                value={snsUrls.youtube}
                onChange={(e) => setSnsUrls(prev => ({ ...prev, youtube: e.target.value }))}
                placeholder="https://youtube.com/@username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input
                id="twitter"
                value={snsUrls.twitter}
                onChange={(e) => setSnsUrls(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleSnsUpdate} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              更新
            </Button>
            <Button variant="outline" onClick={() => setSnsModal(false)}>
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Submission Modal */}
      <Dialog open={videoSubmissionModal} onOpenChange={setVideoSubmissionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>動画提出</DialogTitle>
            <DialogDescription>
              SNSに投稿した動画のURLを提出してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">動画URL *</Label>
              <Input
                id="video_url"
                value={videoSubmission.video_url}
                onChange={(e) => setVideoSubmission(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://instagram.com/p/xxx または https://tiktok.com/@user/video/xxx"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">動画の説明</Label>
              <Textarea
                id="description"
                value={videoSubmission.description}
                onChange={(e) => setVideoSubmission(prev => ({ ...prev, description: e.target.value }))}
                placeholder="動画の内容や工夫した点を説明してください"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hashtags">使用したハッシュタグ</Label>
              <Input
                id="hashtags"
                value={videoSubmission.hashtags}
                onChange={(e) => setVideoSubmission(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="#kbeauty, #cosmetics, #review (カンマ区切り)"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleVideoSubmission} 
              className="flex-1"
              disabled={!videoSubmission.video_url}
            >
              <Send className="h-4 w-4 mr-2" />
              提出
            </Button>
            <Button variant="outline" onClick={() => setVideoSubmissionModal(false)}>
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Point Request Modal */}
      <Dialog open={pointRequestModal} onOpenChange={setPointRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ポイント申請</DialogTitle>
            <DialogDescription>
              獲得したポイントの申請を行います
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">申請ポイント数 *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={points}
                value={pointRequest.amount}
                onChange={(e) => setPointRequest(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="申請するポイント数"
                required
              />
              <p className="text-sm text-gray-500">現在の残高: {points} ポイント</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">申請理由</Label>
              <Textarea
                id="reason"
                value={pointRequest.reason}
                onChange={(e) => setPointRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="ポイント申請の理由を入力してください"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handlePointRequest} 
              className="flex-1"
              disabled={!pointRequest.amount || parseInt(pointRequest.amount) > points}
            >
              <Send className="h-4 w-4 mr-2" />
              申請
            </Button>
            <Button variant="outline" onClick={() => setPointRequestModal(false)}>
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyPageWorkflow
