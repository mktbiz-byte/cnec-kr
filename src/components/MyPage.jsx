import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Settings, Award, AlertCircle, Loader2, CheckCircle2, Palette, Mail, Phone, ArrowLeft, Edit, Save, X, FileText, Instagram, DollarSign } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import WithdrawalModal from './WithdrawalModal'
import WithdrawalHistory from './WithdrawalHistory'

const MyPage = () => {
  const { user, userProfile, signOut } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)
  
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
    avatar_url: ''
  })
  
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadPageData()
  }, [user, navigate])

  useEffect(() => {
    // 사용자 프로필로 폼 초기화
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
        avatar_url: userProfile.avatar_url || ''
      })
    }
  }, [userProfile, user])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const applicationsData = await database.applications.getByUser(user.id)
      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Load page data error:', error)
      setError(language === 'ko' 
        ? '데이터를 불러올 수 없습니다.'
        : 'データを読み込めません。'
      )
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(language === 'ko' ? '파일 크기는 10MB 이하여야 합니다.' : 'ファイルサイズは10MB以下である必要があります。')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async () => {
    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      let updatedData = { ...profileData }

      // 프로필 사진 업로드
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath)

        updatedData.avatar_url = publicUrl
        setAvatarFile(null)
        setAvatarPreview(null)
      }

      // 프로필 업데이트 함수 호출
      await database.userProfiles.update(user.id, updatedData)
      
      setSuccess(language === 'ko' 
        ? '프로필이 성공적으로 업데이트되었습니다.'
        : 'プロフィールが正常に更新されました。'
      )
      setEditMode(false)
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Update profile error:', error)
      setError(language === 'ko' 
        ? '프로필 업데이트에 실패했습니다.'
        : 'プロフィールの更新に失敗しました。'
      )
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: language === 'ko' ? '검토중' : '審査中' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '승인됨' : '承認済み' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: language === 'ko' ? '거절됨' : '拒否' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: language === 'ko' ? '완료됨' : '完了' }
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
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
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
              {language === 'ko' ? '홈으로' : 'ホームへ'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {language === 'ko' ? '마이페이지' : 'マイページ'}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          
          <Button variant="outline" onClick={signOut}>
            {t('logout')}
          </Button>
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{language === 'ko' ? '프로필' : 'プロフィール'}</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{language === 'ko' ? '신청 내역' : '応募履歴'}</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>{language === 'ko' ? '보상 내역' : '報酬履歴'}</span>
            </TabsTrigger>
          </TabsList>

          {/* 프로필 탭 */}
          <TabsContent value="profile">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{language === 'ko' ? '프로필 정보' : 'プロフィール情報'}</span>
                    </CardTitle>
                    <CardDescription>
                      {language === 'ko' 
                        ? '캠페인 신청 시 사용될 정보입니다.'
                        : 'キャンペーン応募時に使用される情報です。'
                      }
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
                          {language === 'ko' ? '취소' : 'キャンセル'}
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
                          {language === 'ko' ? '저장' : '保存'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {language === 'ko' ? '편집' : '編集'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 프로필 사진 */}
                <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={avatarPreview || profileData.avatar_url} alt={profileData.name} />
                    <AvatarFallback className="text-3xl bg-purple-100 text-purple-600">
                      {profileData.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {editMode && (
                    <div className="flex flex-col items-center space-y-2">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="w-full"
                      >
                        {language === 'ko' ? '프로필 사진 변경' : 'プロフィール写真変更'}
                      </Button>
                      <p className="text-xs text-gray-500">
                        {language === 'ko' ? 'JPG, PNG 파일 (10MB 이하)' : 'JPG, PNGファイル (10MB以下)'}
                      </p>
                    </div>
                  )}
                </div>

                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {language === 'ko' ? '기본 정보' : '基本情報'}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'ko' ? '이름' : '名前'}
                      </Label>
                      {editMode ? (
                        <Input
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          placeholder={language === 'ko' ? '이름을 입력하세요' : '名前を入力してください'}
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.name || (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {language === 'ko' ? '이메일' : 'メールアドレス'}
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'ko' ? '전화번호' : '電話番号'}
                      </Label>
                      {editMode ? (
                        <Input
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder={language === 'ko' ? '전화번호를 입력하세요' : '電話番号を入力してください'}
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.phone || (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">
                        {language === 'ko' ? '나이' : '年齢'}
                      </Label>
                      {editMode ? (
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          min="13"
                          max="100"
                          value={profileData.age}
                          onChange={handleInputChange}
                          placeholder={language === 'ko' ? '나이를 입력하세요' : '年齢を入力してください'}
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          {profileData.age ? `${profileData.age}${language === 'ko' ? '세' : '歳'}` : (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skin_type">
                      {language === 'ko' ? '피부 타입' : '肌タイプ'}
                    </Label>
                    {editMode ? (
                      <Select value={profileData.skin_type} onValueChange={(value) => handleSelectChange('skin_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ko' ? '피부 타입 선택' : '肌タイプを選択'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dry">{language === 'ko' ? '건성' : '乾燥肌'}</SelectItem>
                          <SelectItem value="oily">{language === 'ko' ? '지성' : '脂性肌'}</SelectItem>
                          <SelectItem value="combination">{language === 'ko' ? '복합성' : '混合肌'}</SelectItem>
                          <SelectItem value="sensitive">{language === 'ko' ? '민감성' : '敏感肌'}</SelectItem>
                          <SelectItem value="normal">{language === 'ko' ? '보통' : '普通肌'}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        {profileData.skin_type ? (
                          {
                            dry: language === 'ko' ? '건성' : '乾燥肌',
                            oily: language === 'ko' ? '지성' : '脂性肌',
                            combination: language === 'ko' ? '복합성' : '混合肌',
                            sensitive: language === 'ko' ? '민감성' : '敏感肌',
                            normal: language === 'ko' ? '보통' : '普通肌'
                          }[profileData.skin_type]
                        ) : (language === 'ko' ? '미입력' : '未入力')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      {language === 'ko' ? '자기소개' : '自己紹介'}
                    </Label>
                    {editMode ? (
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        placeholder={language === 'ko' ? '자기소개를 입력하세요' : '自己紹介を入力してください'}
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">
                        {profileData.bio || (language === 'ko' ? '미입력' : '未入力')}
                      </div>
                    )}
                  </div>
                </div>

                {/* SNS 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Instagram className="h-5 w-5 mr-2" />
                    {language === 'ko' ? 'SNS 정보' : 'SNS情報'}
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
                          ) : (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_followers">
                        {language === 'ko' ? 'Instagram 팔로워 수' : 'Instagramフォロワー数'}
                      </Label>
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
                          {profileData.instagram_followers ? profileData.instagram_followers.toLocaleString() : (language === 'ko' ? '미입력' : '未入力')}
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
                          ) : (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_followers">
                        {language === 'ko' ? 'TikTok 팔로워 수' : 'TikTokフォロワー数'}
                      </Label>
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
                          {profileData.tiktok_followers ? profileData.tiktok_followers.toLocaleString() : (language === 'ko' ? '미입력' : '未入力')}
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
                          ) : (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube_followers">
                        {language === 'ko' ? 'YouTube 구독자 수' : 'YouTube登録者数'}
                      </Label>
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
                          {profileData.youtube_followers ? profileData.youtube_followers.toLocaleString() : (language === 'ko' ? '미입력' : '未入力')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 신청 내역 탭 */}
          <TabsContent value="applications">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{language === 'ko' ? '캠페인 신청 내역' : 'キャンペーン応募履歴'}</span>
                </CardTitle>
                <CardDescription>
                  {language === 'ko' 
                    ? '신청한 캠페인들의 진행 상황을 확인할 수 있습니다.'
                    : '応募したキャンペーンの進行状況を確認できます。'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {language === 'ko' ? '신청한 캠페인이 없습니다' : '応募したキャンペーンはありません'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {language === 'ko' 
                        ? '새로운 캠페인에 신청해보세요!'
                        : '新しいキャンペーンに応募してみましょう！'
                      }
                    </p>
                    <Link to="/">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        {language === 'ko' ? '캠페인 보기' : 'キャンペーンを見る'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                {application.campaigns?.title}
                              </h4>
                              <p className="text-purple-600 font-medium mb-2">
                                {application.campaigns?.brand}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>
                                  {language === 'ko' ? '신청일:' : '応募日:'} {formatDate(application.created_at)}
                                </span>
                                <span>
                                  {language === 'ko' ? '보상:' : '報酬:'} {formatCurrency(application.campaigns?.reward_amount)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {getStatusBadge(application.status)}
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

          {/* 보상 내역 탭 */}
           <TabsContent value="rewards">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>{language === 'ko' ? '보상 및 포인트' : '報酬・ポイント'}</span>
                </CardTitle>
                <CardDescription>
                  {language === 'ko' 
                    ? '캠페인 참여로 획득한 포인트 및 출금 내역입니다.'
                    : 'キャンペーン参加で獲得したポイントと出金履歴です。'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ko' ? '현재 보유 포인트' : '現在の保有ポイント'}</p>
                      <p className="text-3xl font-bold text-purple-600">{formatCurrency(userProfile?.points || 0)}</p>
                    </div>
                    <Button 
                      onClick={() => setWithdrawalModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {language === 'ko' ? '출금 신청' : '出金申請'}
                    </Button>
                  </div>
                </div>
                
                <Separator />

                <WithdrawalHistory userId={user?.id} />
              </CardContent>
            </Card>
            
            {/* 출금 신청 모달 */}
            <WithdrawalModal 
              isOpen={withdrawalModalOpen}
              onClose={() => setWithdrawalModalOpen(false)}
              userId={user?.id}
              availablePoints={userProfile?.points || 0}
              onSuccess={() => {
                setSuccess(language === 'ko' 
                  ? '출금 신청이 완료되었습니다. 처리까지 영업일 기준 3-5일이 소요됩니다.'
                  : '出金申請が完了しました。処理まで営業日基準3-5日かかります。'
                )
                setTimeout(() => setSuccess(''), 5000)
                loadPageData()
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MyPage
