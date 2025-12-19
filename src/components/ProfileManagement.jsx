import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, Save, Edit, ArrowLeft, User, Mail, 
  AlertCircle, CheckCircle, Lock, Eye, EyeOff,
  Heart, Baby, Scale, Calendar, MapPin, Phone,
  Instagram, Hash, Youtube, Globe, Shield
} from 'lucide-react'

const ProfileManagement = () => {
  const { user } = useAuth()
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    age: '',
    skin_type: '',
    weight: '',
    height: '',
    has_children: false,
    is_married: false,
    prefecture: '',
    city: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    blog_url: ''
  })
  
  const [privacy, setPrivacy] = useState({
    show_weight: false,
    show_height: false,
    show_age: true,
    show_children: false,
    show_married: false,
    show_location: false
  })
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleUser, setIsGoogleUser] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 사용자 프로필 로드
      const userProfile = await database.userProfiles.getByUserId(user.id)
      if (userProfile) {
        setProfile(userProfile)
        setPrivacy(userProfile.privacy_settings || privacy)
      }
      
      // Google 사용자인지 확인
      setIsGoogleUser(user.app_metadata?.provider === 'google')
      
    } catch (error) {
      console.error('Load profile error:', error)
      setError('プロフィールの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 필수 필드 검증
      if (!profile.name?.trim()) {
        setError('名前は必須項目です。')
        return
      }
      
      if (!profile.email?.trim()) {
        setError('メールアドレスは必須項目です。')
        return
      }
      
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profile.email)) {
        setError('有効なメールアドレスを入力してください。')
        return
      }
      
      // 나이 검증
      if (profile.age && (parseInt(profile.age) < 13 || parseInt(profile.age) > 100)) {
        setError('年齢は13歳から100歳の間で入力してください。')
        return
      }
      
      // 프로필 업데이트
      const updatedProfile = {
        ...profile,
        privacy_settings: privacy,
        updated_at: new Date().toISOString()
      }
      
      await database.userProfiles.update(user.id, updatedProfile)
      
      setSuccess('プロフィールを保存しました。')
      
    } catch (error) {
      console.error('Save profile error:', error)
      setError('プロフィールの保存に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setProcessing(true)
      setError('')
      
      if (!passwordData.current_password) {
        setError('現在のパスワードを入力してください。')
        return
      }
      
      if (!passwordData.new_password) {
        setError('新しいパスワードを入力してください。')
        return
      }
      
      if (passwordData.new_password.length < 6) {
        setError('新しいパスワードは6文字以上で入力してください。')
        return
      }
      
      if (passwordData.new_password !== passwordData.confirm_password) {
        setError('新しいパスワードが一致しません。')
        return
      }
      
      // Supabase 비밀번호 변경
      const { error } = await database.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (error) {
        setError('パスワードの変更に失敗しました。')
        return
      }
      
      setSuccess('パスワードを変更しました。')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
    } catch (error) {
      console.error('Change password error:', error)
      setError('パスワードの変更に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-2">プロフィール管理</h1>
          <p className="text-gray-600">あなたの情報を管理・編集できます</p>
        </div>

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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>基本情報</span>
              </CardTitle>
              <CardDescription>
                あなたの基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span>名前 *</span>
                    </div>
                  </Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="山田 太郎"
                  />
                </div>

                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>メールアドレス *</span>
                    </div>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>

                {/* 전화번호 */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>電話番号</span>
                    </div>
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="080-1234-5678"
                  />
                </div>

                {/* 자기소개 */}
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    <div className="flex items-center space-x-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <span>自己紹介</span>
                    </div>
                  </Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="あなたについて簡単に紹介してください..."
                    rows={4}
                  />
                </div>

                {/* 나이 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="age">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>年齢</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_age}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_age: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="25"
                    min="13"
                    max="100"
                  />
                </div>

                {/* 피부타입 */}
                <div className="space-y-2">
                  <Label htmlFor="skin_type">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span>肌タイプ</span>
                    </div>
                  </Label>
                  <Select 
                    value={profile.skin_type} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, skin_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="肌タイプを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">乾性肌</SelectItem>
                      <SelectItem value="oily">脂性肌</SelectItem>
                      <SelectItem value="combination">混合肌</SelectItem>
                      <SelectItem value="sensitive">敏感肌</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>追加情報</span>
              </CardTitle>
              <CardDescription>
                オプション情報（公開設定可能）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 체중 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weight">
                      <div className="flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-green-600" />
                        <span>体重 (kg)</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_weight}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_weight: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="55"
                    min="30"
                    max="200"
                  />
                </div>

                {/* 신장 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="height">
                      <div className="flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-green-600" />
                        <span>身長 (cm)</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_height}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_height: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="165"
                    min="100"
                    max="250"
                  />
                </div>

                {/* 자녀 유무 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_children">
                      <div className="flex items-center space-x-2">
                        <Baby className="h-4 w-4 text-blue-600" />
                        <span>お子様</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_children}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_children: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Select 
                    value={profile.has_children ? 'yes' : 'no'} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, has_children: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">いない</SelectItem>
                      <SelectItem value="yes">いる</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 결혼 유무 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_married">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-red-600" />
                        <span>結婚</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_married}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_married: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Select 
                    value={profile.is_married ? 'yes' : 'no'} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, is_married: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">未婚</SelectItem>
                      <SelectItem value="yes">既婚</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 지역 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prefecture">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span>都道府県</span>
                      </div>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={privacy.show_location}
                        onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_location: checked }))}
                      />
                      <span className="text-sm text-gray-600">公開</span>
                    </div>
                  </div>
                  <Select 
                    value={profile.prefecture} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, prefecture: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefectures.map((prefecture) => (
                        <SelectItem key={prefecture} value={prefecture}>
                          {prefecture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 시/구 */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <span>市区町村</span>
                    </div>
                  </Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="新宿区"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SNS Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Instagram className="h-5 w-5 text-pink-600" />
                <span>SNS情報</span>
              </CardTitle>
              <CardDescription>
                あなたのSNSアカウントを登録してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Instagram */}
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">
                    <div className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <span>Instagram</span>
                    </div>
                  </Label>
                  <Input
                    id="instagram_url"
                    value={profile.instagram_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="https://www.instagram.com/username"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <Label htmlFor="tiktok_url">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-black" />
                      <span>TikTok</span>
                    </div>
                  </Label>
                  <Input
                    id="tiktok_url"
                    value={profile.tiktok_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                    placeholder="https://www.tiktok.com/@username"
                  />
                </div>

                {/* YouTube */}
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      <span>YouTube</span>
                    </div>
                  </Label>
                  <Input
                    id="youtube_url"
                    value={profile.youtube_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://www.youtube.com/channel/..."
                  />
                </div>

                {/* ブログ */}
                <div className="space-y-2">
                  <Label htmlFor="blog_url">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span>ブログ</span>
                    </div>
                  </Label>
                  <Input
                    id="blog_url"
                    value={profile.blog_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, blog_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          {!isGoogleUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>パスワード変更</span>
                </CardTitle>
                <CardDescription>
                  セキュリティのため定期的にパスワードを変更してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">現在のパスワード</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        placeholder="現在のパスワード"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">新しいパスワード</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="新しいパスワード（6文字以上）"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">パスワード確認</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="新しいパスワード（確認）"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={processing}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    パスワード変更
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleSaveProfile}
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            プロフィールを保存
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProfileManagement
