import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, User, Settings, FileText, Award, ArrowLeft, Edit, Save, X, 
  Instagram, Youtube, Hash, Calendar, Palette, Mail, Phone, 
  ExternalLink, Download, Upload, CreditCard, Building, MapPin,
  DollarSign, Clock, Check, AlertCircle, FolderOpen, Link as LinkIcon
} from 'lucide-react'

// 일본 주요 은행 코드
const JAPANESE_BANKS = [
  { code: '0001', name: 'みずほ銀行', nameEn: 'Mizuho Bank' },
  { code: '0005', name: '三菱UFJ銀行', nameEn: 'MUFG Bank' },
  { code: '0009', name: '三井住友銀行', nameEn: 'Sumitomo Mitsui Banking Corporation' },
  { code: '0010', name: 'りそな銀行', nameEn: 'Resona Bank' },
  { code: '0017', name: 'ゆうちょ銀行', nameEn: 'Japan Post Bank' },
  { code: '0033', name: '楽天銀行', nameEn: 'Rakuten Bank' },
  { code: '0035', name: 'ジャパンネット銀行', nameEn: 'PayPay Bank' },
  { code: '0038', name: '住信SBIネット銀行', nameEn: 'SBI Sumishin Net Bank' },
  { code: '0040', name: 'イオン銀行', nameEn: 'Aeon Bank' },
  { code: '0042', name: 'ソニー銀行', nameEn: 'Sony Bank' }
]

const MyPageComplete = () => {
  const { user, userProfile, updateProfile, signOut } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  
  const [applications, setApplications] = useState([])
  const [points, setPoints] = useState(0)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  
  // 모달 상태
  const [snsUploadModal, setSnsUploadModal] = useState(false)
  const [pointRequestModal, setPointRequestModal] = useState(false)
  const [withdrawalModal, setWithdrawalModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    skin_type: '',
    age: '',
    bio: '',
    instagram_url: '',
    instagram_followers: '',
    tiktok_url: '',
    tiktok_followers: '',
    youtube_url: '',
    youtube_followers: '',
    twitter_url: '',
    twitter_followers: ''
  })

  // SNS URL 업로드 폼
  const [snsUrls, setSnsUrls] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: ''
  })

  // 출금 요청 폼
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bank_code: '',
    bank_name: '',
    branch_code: '',
    branch_name: '',
    account_type: 'savings',
    account_number: '',
    account_holder_name: '',
    account_holder_name_kana: '',
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    purpose: 'service_fee',
    notes: ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadPageData()
  }, [user, navigate])

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || user?.user_metadata?.name || '',
        phone: userProfile.phone || '',
        skin_type: userProfile.skin_type || '',
        age: userProfile.age || '',
        bio: userProfile.bio || '',
        instagram_url: userProfile.instagram_url || '',
        instagram_followers: userProfile.instagram_followers || '',
        tiktok_url: userProfile.tiktok_url || '',
        tiktok_followers: userProfile.tiktok_followers || '',
        youtube_url: userProfile.youtube_url || '',
        youtube_followers: userProfile.youtube_followers || '',
        twitter_url: userProfile.twitter_url || '',
        twitter_followers: userProfile.twitter_followers || ''
      })
    }
  }, [userProfile, user])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 캠페인 신청 내역 로드
      const applicationsData = await database.applications.getByUser(user.id)
      setApplications(applicationsData || [])
      
      // 포인트 잔액 로드
      const pointsData = await database.points?.getBalance?.(user.id) || 0
      setPoints(pointsData)
      
      // 출금 내역 로드
      const withdrawalsData = await database.withdrawals?.getByUser?.(user.id) || []
      setWithdrawals(withdrawalsData)
      
    } catch (error) {
      console.error('Load page data error:', error)
      setError('データを読み込めません。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      await updateProfile(profileData)
      
      setSuccess('プロフィールが正常に更新されました。')
      setEditMode(false)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Update profile error:', error)
      setError('プロフィールの更新に失敗しました。')
    } finally {
      setUpdating(false)
    }
  }

  // SNS URL 업로드 처리
  const handleSnsUpload = async (applicationId) => {
    try {
      setUpdating(true)
      setError('')
      
      // SNS URL을 데이터베이스에 저장
      await database.applications.updateSnsUrls(applicationId, snsUrls)
      
      setSuccess('SNS URLが正常にアップロードされました。')
      setSnsUploadModal(false)
      setSnsUrls({ instagram: '', tiktok: '', youtube: '', twitter: '' })
      
      // 신청 내역 새로고침
      await loadPageData()
      
    } catch (error) {
      console.error('SNS upload error:', error)
      setError('SNS URLのアップロードに失敗しました。')
    } finally {
      setUpdating(false)
    }
  }

  // 포인트 요청 처리
  const handlePointRequest = async (applicationId) => {
    try {
      setUpdating(true)
      setError('')
      
      // 포인트 요청 처리
      await database.applications.requestPoints(applicationId)
      
      setSuccess('ポイント要求が正常に送信されました。')
      setPointRequestModal(false)
      
      // 신청 내역 새로고침
      await loadPageData()
      
    } catch (error) {
      console.error('Point request error:', error)
      setError('ポイント要求に失敗しました。')
    } finally {
      setUpdating(false)
    }
  }

  // 출금 요청 처리
  const handleWithdrawalRequest = async () => {
    try {
      setUpdating(true)
      setError('')
      
      // 출금 요청 데이터 검증
      const amount = parseInt(withdrawalForm.amount)
      if (amount <= 0 || amount > points) {
        setError('有効な金額を入力してください。')
        return
      }
      
      // 출금 요청 생성
      await database.withdrawals.create({
        user_id: user.id,
        amount: amount,
        bank_info: {
          bank_code: withdrawalForm.bank_code,
          bank_name: withdrawalForm.bank_name,
          branch_code: withdrawalForm.branch_code,
          branch_name: withdrawalForm.branch_name,
          account_type: withdrawalForm.account_type,
          account_number: withdrawalForm.account_number,
          account_holder_name: withdrawalForm.account_holder_name,
          account_holder_name_kana: withdrawalForm.account_holder_name_kana
        },
        recipient_info: {
          name: withdrawalForm.recipient_name,
          address: withdrawalForm.recipient_address,
          phone: withdrawalForm.recipient_phone
        },
        purpose: withdrawalForm.purpose,
        notes: withdrawalForm.notes,
        status: 'pending'
      })
      
      setSuccess('出金要求が正常に送信されました。')
      setWithdrawalModal(false)
      
      // 폼 초기화
      setWithdrawalForm({
        amount: '',
        bank_code: '',
        bank_name: '',
        branch_code: '',
        branch_name: '',
        account_type: 'savings',
        account_number: '',
        account_holder_name: '',
        account_holder_name_kana: '',
        recipient_name: '',
        recipient_address: '',
        recipient_phone: '',
        purpose: 'service_fee',
        notes: ''
      })
      
      // 데이터 새로고침
      await loadPageData()
      
    } catch (error) {
      console.error('Withdrawal request error:', error)
      setError('出金要求に失敗しました。')
    } finally {
      setUpdating(false)
    }
  }

  // Google Drive/Slides 링크 열기
  const openCampaignMaterials = (application) => {
    if (application.campaigns?.google_drive_url) {
      window.open(application.campaigns.google_drive_url, '_blank')
    } else if (application.campaigns?.google_slides_url) {
      window.open(application.campaigns.google_slides_url, '_blank')
    } else {
      setError('キャンペーン資料が見つかりません。')
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '審査中' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '承認済み' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '拒否' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: '完了' },
      sns_uploaded: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'SNS投稿済み' },
      points_requested: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'ポイント要求済み' }
    }
    
    const style = statusStyles[status] || statusStyles.pending
    
    return (
      <Badge className={`${style.bg} ${style.text}`}>
        {style.label}
      </Badge>
    )
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              ホームへ
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">マイページ</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">現在のポイント</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(points)}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              ログアウト
            </Button>
          </div>
        </div>

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

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>キャンペーン</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>プロフィール</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>ポイント</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>出金履歴</span>
            </TabsTrigger>
          </TabsList>

          {/* 캠페인 탭 */}
          <TabsContent value="campaigns">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>キャンペーン応募履歴</span>
                </CardTitle>
                <CardDescription>
                  応募したキャンペーンの進行状況を確認し、必要な作業を実行できます。
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      応募したキャンペーンはありません
                    </h3>
                    <p className="text-gray-500 mb-4">
                      新しいキャンペーンに応募してみましょう！
                    </p>
                    <Link to="/">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        キャンペーンを見る
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                {application.campaigns?.title}
                              </h4>
                              <p className="text-purple-600 font-medium mb-2">
                                {application.campaigns?.brand}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>応募日: {formatDate(application.created_at)}</span>
                                <span>報酬: {formatCurrency(application.campaigns?.reward_amount)}</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {getStatusBadge(application.status)}
                            </div>
                          </div>

                          {/* 승인된 캠페인의 액션 버튼들 */}
                          {application.status === 'approved' && (
                            <div className="border-t pt-4">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCampaignMaterials(application)}
                                  className="flex items-center space-x-1"
                                >
                                  <FolderOpen className="h-4 w-4" />
                                  <span>キャンペーン資料</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                
                                <Dialog open={snsUploadModal} onOpenChange={setSnsUploadModal}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedApplication(application)}
                                      className="flex items-center space-x-1"
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span>SNS URL登録</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>SNS URL登録</DialogTitle>
                                      <DialogDescription>
                                        投稿したSNSのURLを登録してください。
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="instagram">Instagram URL</Label>
                                        <Input
                                          id="instagram"
                                          value={snsUrls.instagram}
                                          onChange={(e) => setSnsUrls(prev => ({ ...prev, instagram: e.target.value }))}
                                          placeholder="https://instagram.com/p/..."
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="tiktok">TikTok URL</Label>
                                        <Input
                                          id="tiktok"
                                          value={snsUrls.tiktok}
                                          onChange={(e) => setSnsUrls(prev => ({ ...prev, tiktok: e.target.value }))}
                                          placeholder="https://tiktok.com/@user/video/..."
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="youtube">YouTube URL</Label>
                                        <Input
                                          id="youtube"
                                          value={snsUrls.youtube}
                                          onChange={(e) => setSnsUrls(prev => ({ ...prev, youtube: e.target.value }))}
                                          placeholder="https://youtube.com/watch?v=..."
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="twitter">Twitter URL</Label>
                                        <Input
                                          id="twitter"
                                          value={snsUrls.twitter}
                                          onChange={(e) => setSnsUrls(prev => ({ ...prev, twitter: e.target.value }))}
                                          placeholder="https://twitter.com/user/status/..."
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <Button
                                          onClick={() => handleSnsUpload(selectedApplication?.id)}
                                          disabled={updating}
                                          className="flex-1"
                                        >
                                          {updating ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          ) : (
                                            <Upload className="h-4 w-4 mr-2" />
                                          )}
                                          登録
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => setSnsUploadModal(false)}
                                        >
                                          キャンセル
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          )}

                          {/* SNS 업로드 완료 후 포인트 요청 */}
                          {application.status === 'sns_uploaded' && (
                            <div className="border-t pt-4">
                              <Dialog open={pointRequestModal} onOpenChange={setPointRequestModal}>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedApplication(application)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    ポイント要求
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>ポイント要求</DialogTitle>
                                    <DialogDescription>
                                      キャンペーンが完了しました。ポイントを要求しますか？
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="font-semibold">{selectedApplication?.campaigns?.title}</p>
                                      <p className="text-purple-600">報酬: {formatCurrency(selectedApplication?.campaigns?.reward_amount)}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={() => handlePointRequest(selectedApplication?.id)}
                                        disabled={updating}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                      >
                                        {updating ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <DollarSign className="h-4 w-4 mr-2" />
                                        )}
                                        ポイント要求
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setPointRequestModal(false)}
                                      >
                                        キャンセル
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 프로필 탭 */}
          <TabsContent value="profile">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>プロフィール情報</span>
                    </CardTitle>
                    <CardDescription>
                      キャンペーン応募時に使用される情報です。
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    {editMode ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(false)}
                          disabled={updating}
                        >
                          <X className="h-4 w-4 mr-2" />
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={updating}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {updating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          保存
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">基本情報</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">名前</Label>
                      {editMode ? (
                        <Input
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          placeholder="名前を入力してください"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.name || '未入力'}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">メールアドレス</Label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">電話番号</Label>
                      {editMode ? (
                        <Input
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder="電話番号を入力してください"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.phone || '未入力'}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">年齢</Label>
                      {editMode ? (
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          min="13"
                          max="100"
                          value={profileData.age}
                          onChange={handleInputChange}
                          placeholder="年齢を入力してください"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.age ? `${profileData.age}歳` : '未入力'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skin_type">肌タイプ</Label>
                    {editMode ? (
                      <Select value={profileData.skin_type} onValueChange={(value) => handleSelectChange('skin_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="肌タイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dry">乾燥肌</SelectItem>
                          <SelectItem value="oily">脂性肌</SelectItem>
                          <SelectItem value="combination">混合肌</SelectItem>
                          <SelectItem value="sensitive">敏感肌</SelectItem>
                          <SelectItem value="normal">普通肌</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        {profileData.skin_type ? (
                          {
                            dry: '乾燥肌',
                            oily: '脂性肌',
                            combination: '混合肌',
                            sensitive: '敏感肌',
                            normal: '普通肌'
                          }[profileData.skin_type]
                        ) : '未入力'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">自己紹介</Label>
                    {editMode ? (
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        placeholder="自己紹介を入力してください"
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">
                        {profileData.bio || '未入力'}
                      </div>
                    )}
                  </div>
                </div>

                {/* SNS 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Instagram className="h-5 w-5 mr-2" />
                    SNS情報
                  </h3>
                  
                  {/* Instagram */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram_url">Instagram URL</Label>
                      {editMode ? (
                        <Input
                          id="instagram_url"
                          name="instagram_url"
                          value={profileData.instagram_url}
                          onChange={handleInputChange}
                          placeholder="https://instagram.com/username"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.instagram_url ? (
                            <a href={profileData.instagram_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                              {profileData.instagram_url}
                            </a>
                          ) : '未入力'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_followers">Instagramフォロワー数</Label>
                      {editMode ? (
                        <Input
                          id="instagram_followers"
                          name="instagram_followers"
                          type="number"
                          min="0"
                          value={profileData.instagram_followers}
                          onChange={handleInputChange}
                          placeholder="1000"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.instagram_followers ? profileData.instagram_followers.toLocaleString() : '未入力'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* TikTok */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url">TikTok URL</Label>
                      {editMode ? (
                        <Input
                          id="tiktok_url"
                          name="tiktok_url"
                          value={profileData.tiktok_url}
                          onChange={handleInputChange}
                          placeholder="https://tiktok.com/@username"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.tiktok_url ? (
                            <a href={profileData.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                              {profileData.tiktok_url}
                            </a>
                          ) : '未入力'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_followers">TikTokフォロワー数</Label>
                      {editMode ? (
                        <Input
                          id="tiktok_followers"
                          name="tiktok_followers"
                          type="number"
                          min="0"
                          value={profileData.tiktok_followers}
                          onChange={handleInputChange}
                          placeholder="1000"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.tiktok_followers ? profileData.tiktok_followers.toLocaleString() : '未入力'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* YouTube */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtube_url">YouTube URL</Label>
                      {editMode ? (
                        <Input
                          id="youtube_url"
                          name="youtube_url"
                          value={profileData.youtube_url}
                          onChange={handleInputChange}
                          placeholder="https://youtube.com/@username"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.youtube_url ? (
                            <a href={profileData.youtube_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                              {profileData.youtube_url}
                            </a>
                          ) : '未入力'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube_followers">YouTube登録者数</Label>
                      {editMode ? (
                        <Input
                          id="youtube_followers"
                          name="youtube_followers"
                          type="number"
                          min="0"
                          value={profileData.youtube_followers}
                          onChange={handleInputChange}
                          placeholder="1000"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.youtube_followers ? profileData.youtube_followers.toLocaleString() : '未入力'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 포인트 탭 */}
          <TabsContent value="points">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>ポイント管理</span>
                </CardTitle>
                <CardDescription>
                  獲得したポイントを確認し、出金要求を行うことができます。
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">現在のポイント</h3>
                      <p className="text-3xl font-bold">{formatCurrency(points)}</p>
                    </div>
                    
                    <Dialog open={withdrawalModal} onOpenChange={setWithdrawalModal}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={points <= 0}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          出金要求
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>出金要求</DialogTitle>
                          <DialogDescription>
                            日本の銀行口座への送金情報を入力してください。
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* 출금 금액 */}
                          <div className="space-y-2">
                            <Label htmlFor="amount">出金金額</Label>
                            <Input
                              id="amount"
                              type="number"
                              min="1"
                              max={points}
                              value={withdrawalForm.amount}
                              onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                              placeholder="出金したい金額を入力"
                            />
                            <p className="text-sm text-gray-600">
                              利用可能: {formatCurrency(points)}
                            </p>
                          </div>

                          <Separator />

                          {/* 은행 정보 */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">銀行情報</h4>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bank_code">銀行</Label>
                                <Select 
                                  value={withdrawalForm.bank_code} 
                                  onValueChange={(value) => {
                                    const bank = JAPANESE_BANKS.find(b => b.code === value)
                                    setWithdrawalForm(prev => ({ 
                                      ...prev, 
                                      bank_code: value,
                                      bank_name: bank?.name || ''
                                    }))
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="銀行を選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JAPANESE_BANKS.map(bank => (
                                      <SelectItem key={bank.code} value={bank.code}>
                                        {bank.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="branch_code">支店コード</Label>
                                <Input
                                  id="branch_code"
                                  value={withdrawalForm.branch_code}
                                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, branch_code: e.target.value }))}
                                  placeholder="001"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="branch_name">支店名</Label>
                              <Input
                                id="branch_name"
                                value={withdrawalForm.branch_name}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, branch_name: e.target.value }))}
                                placeholder="本店"
                              />
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="account_type">口座種別</Label>
                                <Select 
                                  value={withdrawalForm.account_type} 
                                  onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, account_type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="savings">普通</SelectItem>
                                    <SelectItem value="checking">当座</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="account_number">口座番号</Label>
                                <Input
                                  id="account_number"
                                  value={withdrawalForm.account_number}
                                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_number: e.target.value }))}
                                  placeholder="1234567"
                                />
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="account_holder_name">口座名義人</Label>
                                <Input
                                  id="account_holder_name"
                                  value={withdrawalForm.account_holder_name}
                                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                                  placeholder="山田太郎"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="account_holder_name_kana">口座名義人（カナ）</Label>
                                <Input
                                  id="account_holder_name_kana"
                                  value={withdrawalForm.account_holder_name_kana}
                                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name_kana: e.target.value }))}
                                  placeholder="ヤマダタロウ"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* 수취인 정보 */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">受取人情報</h4>
                            
                            <div className="space-y-2">
                              <Label htmlFor="recipient_name">受取人名</Label>
                              <Input
                                id="recipient_name"
                                value={withdrawalForm.recipient_name}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                                placeholder="受取人の名前"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="recipient_address">受取人住所</Label>
                              <Textarea
                                id="recipient_address"
                                value={withdrawalForm.recipient_address}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, recipient_address: e.target.value }))}
                                placeholder="〒000-0000 東京都..."
                                rows={2}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="recipient_phone">受取人電話番号</Label>
                              <Input
                                id="recipient_phone"
                                value={withdrawalForm.recipient_phone}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, recipient_phone: e.target.value }))}
                                placeholder="090-0000-0000"
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* 송금 목적 */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="purpose">送金目的</Label>
                              <Select 
                                value={withdrawalForm.purpose} 
                                onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, purpose: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service_fee">サービス料</SelectItem>
                                  <SelectItem value="salary">給与</SelectItem>
                                  <SelectItem value="commission">手数料</SelectItem>
                                  <SelectItem value="other">その他</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="notes">備考</Label>
                              <Textarea
                                id="notes"
                                value={withdrawalForm.notes}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="追加情報があれば入力してください"
                                rows={2}
                              />
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={handleWithdrawalRequest}
                              disabled={updating || !withdrawalForm.amount || !withdrawalForm.bank_code}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {updating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-2" />
                              )}
                              出金要求
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setWithdrawalModal(false)}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">ポイント獲得履歴</h3>
                    <div className="space-y-2">
                      {applications
                        .filter(app => app.status === 'completed' || app.status === 'points_requested')
                        .map(app => (
                          <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{app.campaigns?.title}</p>
                              <p className="text-sm text-gray-600">{formatDate(app.updated_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                +{formatCurrency(app.campaigns?.reward_amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 출금 내역 탭 */}
          <TabsContent value="withdrawals">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>出金履歴</span>
                </CardTitle>
                <CardDescription>
                  出金要求の履歴と状況を確認できます。
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💳</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      出金履歴はありません
                    </h3>
                    <p className="text-gray-500">
                      ポイントを獲得して出金要求を行ってください。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <Card key={withdrawal.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-800">
                                  {formatCurrency(withdrawal.amount)}
                                </h4>
                                {getStatusBadge(withdrawal.status)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>要求日: {formatDate(withdrawal.created_at)}</p>
                                <p>銀行: {withdrawal.bank_info?.bank_name}</p>
                                <p>口座: {withdrawal.bank_info?.account_number}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MyPageComplete
