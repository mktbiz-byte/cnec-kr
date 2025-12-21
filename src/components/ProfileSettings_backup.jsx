import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database, supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, Save, User, MapPin, Lock, Calendar, 
  Instagram, Youtube, Hash, Globe, CheckCircle,
  AlertCircle, Home, ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'

const ProfileSettings = () => {
  const { user } = useAuth()
  const { language } = useLanguage()
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    address: '',
    skin_type: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    group_purchase_available: false,
    bio: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '프로필 설정',
      subtitle: '개인 정보 및 크리에이터 프로필을 관리하세요',
      basicInfo: '기본 정보',
      name: '이름',
      email: '이메일',
      age: '나이',
      address: '주소',
      skinType: '피부 타입',
      skinTypes: {
        dry: '건성',
        oily: '지성',
        combination: '복합성',
        sensitive: '민감성',
        normal: '보통'
      },
      snsInfo: 'SNS 정보',
      instagramUrl: '인스타그램 URL',
      youtubeUrl: '유튜브 URL',
      tiktokUrl: '틱톡 URL',
      groupPurchase: '공동구매 가능',
      groupPurchaseDesc: '공동구매 캠페인에 참여할 수 있습니다',
      bio: '자기소개',
      bioPlaceholder: '자신을 소개해주세요...',
      passwordChange: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      confirmPassword: '비밀번호 확인',
      save: '저장',
      saving: '저장 중...',
      backToMyPage: '마이페이지로 돌아가기',
      backToHome: '메인화면으로',
      profileUpdated: '프로필이 업데이트되었습니다.',
      passwordUpdated: '비밀번호가 변경되었습니다.',
      error: '오류가 발생했습니다.',
      loading: '프로필을 불러오는 중...',
      passwordMismatch: '새 비밀번호가 일치하지 않습니다.',
      passwordTooShort: '비밀번호는 최소 6자 이상이어야 합니다.'
    },
    ja: {
      title: 'プロフィール設定',
      subtitle: '個人情報とクリエイタープロフィールを管理してください',
      basicInfo: '基本情報',
      name: '名前',
      email: 'メール',
      age: '年齢',
      address: '住所',
      skinType: '肌タイプ',
      skinTypes: {
        dry: '乾燥肌',
        oily: '脂性肌',
        combination: '混合肌',
        sensitive: '敏感肌',
        normal: '普通肌'
      },
      snsInfo: 'SNS情報',
      instagramUrl: 'Instagram URL',
      youtubeUrl: 'YouTube URL',
      tiktokUrl: 'TikTok URL',
      groupPurchase: '共同購入可能',
      groupPurchaseDesc: '共同購入キャンペーンに参加できます',
      bio: '自己紹介',
      bioPlaceholder: '自己紹介をしてください...',
      passwordChange: 'パスワード変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      confirmPassword: 'パスワード確認',
      save: '保存',
      saving: '保存中...',
      backToMyPage: 'マイページに戻る',
      backToHome: 'メイン画面へ',
      profileUpdated: 'プロフィールが更新されました。',
      passwordUpdated: 'パスワードが変更されました。',
      error: 'エラーが発生しました。',
      loading: 'プロフィールを読み込み中...',
      passwordMismatch: '新しいパスワードが一致しません。',
      passwordTooShort: 'パスワードは最低6文字以上である必要があります。'
    }
  }

  const t = texts[language] || texts.ja

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      
      const profileData = await database.userProfiles.get(user.id)
      
      if (profileData) {
        setProfile({
          name: profileData.name || '',
          email: user.email || '',
          age: profileData.age || '',
          address: profileData.address || '',
          skin_type: profileData.skin_type || '',
          instagram_url: profileData.instagram_url || '',
          youtube_url: profileData.youtube_url || '',
          tiktok_url: profileData.tiktok_url || '',
          group_purchase_available: profileData.group_purchase_available || false,
          bio: profileData.bio || ''
        })
      } else {
        // 프로필이 없으면 기본값으로 설정
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
    } catch (error) {
      console.error('Profile load error:', error)
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      console.log('프로필 저장 시작:', user?.id)
      console.log('저장할 데이터:', profile)

      if (!user?.id) {
        throw new Error('사용자 ID가 없습니다.')
      }

      const profileData = {
        user_id: user.id,
        email: user.email || profile.email || '',
        name: profile.name || '',
        age: profile.age ? parseInt(profile.age) : null,
        address: profile.address || '',
        skin_type: profile.skin_type || '',
        instagram_url: profile.instagram_url || '',
        youtube_url: profile.youtube_url || '',
        tiktok_url: profile.tiktok_url || '',
        group_purchase_available: profile.group_purchase_available || false,
        bio: profile.bio || '',
        updated_at: new Date().toISOString()
      }

      console.log('Supabase에 저장할 데이터:', profileData)

      const result = await database.userProfiles.upsert(profileData)
      console.log('저장 결과:', result)
      
      setSuccess(t.profileUpdated)
    } catch (error) {
      console.error('Profile save error:', error)
      console.error('Error details:', error.message)
      setError(`${t.error}: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError(t.passwordMismatch)
        return
      }

      if (passwordData.newPassword.length < 6) {
        setError(t.passwordTooShort)
        return
      }

      setSaving(true)
      setError('')
      setSuccess('')

      // Supabase auth를 통한 비밀번호 변경
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setSuccess(t.passwordUpdated)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Password change error:', error)
      setError(error.message || t.error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-2">{t.subtitle}</p>
            </div>
            <div className="flex space-x-4">
              <Link to="/profile">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t.backToMyPage}</span>
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>{t.backToHome}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{t.basicInfo}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.name}
                />
              </div>

              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="age">{t.age}</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={t.age}
                />
              </div>

              <div>
                <Label htmlFor="address">{t.address}</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t.address}
                />
              </div>

              <div>
                <Label htmlFor="skin_type">{t.skinType}</Label>
                <Select
                  value={profile.skin_type}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, skin_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.skinType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">{t.skinTypes.dry}</SelectItem>
                    <SelectItem value="oily">{t.skinTypes.oily}</SelectItem>
                    <SelectItem value="combination">{t.skinTypes.combination}</SelectItem>
                    <SelectItem value="sensitive">{t.skinTypes.sensitive}</SelectItem>
                    <SelectItem value="normal">{t.skinTypes.normal}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio">{t.bio}</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t.bioPlaceholder}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* SNS 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>{t.snsInfo}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instagram_url" className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4" />
                  <span>{t.instagramUrl}</span>
                </Label>
                <Input
                  id="instagram_url"
                  value={profile.instagram_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <Label htmlFor="youtube_url" className="flex items-center space-x-2">
                  <Youtube className="h-4 w-4" />
                  <span>{t.youtubeUrl}</span>
                </Label>
                <Input
                  id="youtube_url"
                  value={profile.youtube_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://youtube.com/@username"
                />
              </div>

              <div>
                <Label htmlFor="tiktok_url" className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>{t.tiktokUrl}</span>
                </Label>
                <Input
                  id="tiktok_url"
                  value={profile.tiktok_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  placeholder="https://tiktok.com/@username"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="group_purchase"
                  checked={profile.group_purchase_available}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, group_purchase_available: checked }))}
                />
                <Label htmlFor="group_purchase" className="text-sm">
                  {t.groupPurchase}
                </Label>
              </div>
              <p className="text-xs text-gray-500">{t.groupPurchaseDesc}</p>

              <Separator />

              <Button 
                onClick={handleProfileSave} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 (이메일 가입자만) */}
          {user?.app_metadata?.provider === 'email' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>{t.passwordChange}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current_password">{t.currentPassword}</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_password">{t.newPassword}</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">{t.confirmPassword}</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    variant="outline"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.saving}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        {t.passwordChange}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
