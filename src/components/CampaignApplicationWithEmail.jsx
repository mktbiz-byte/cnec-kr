import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { emailTriggers } from '../lib/emailService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, ArrowLeft, Send, User, MapPin, Phone, Mail,
  Instagram, Youtube, Hash, Twitter, CheckCircle, AlertCircle,
  Calendar, Target, DollarSign, FileText, Star
} from 'lucide-react'

// 일본 도도부현 목록
const JAPANESE_PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

// 피부타입 옵션
const SKIN_TYPES = [
  { value: 'normal', label: '普通肌' },
  { value: 'dry', label: '乾燥肌' },
  { value: 'oily', label: '脂性肌' },
  { value: 'combination', label: '混合肌' },
  { value: 'sensitive', label: '敏感肌' }
]

// 피부고민 옵션
const SKIN_CONCERNS = [
  { value: 'acne', label: 'ニキビ' },
  { value: 'pores', label: '毛穴' },
  { value: 'dryness', label: '乾燥' },
  { value: 'oiliness', label: 'テカリ' },
  { value: 'sensitivity', label: '敏感' },
  { value: 'aging', label: 'エイジング' },
  { value: 'dullness', label: 'くすみ' },
  { value: 'spots', label: 'シミ・そばかす' }
]

const CampaignApplicationWithEmail = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const campaignId = searchParams.get('campaign_id')
  
  const [campaign, setCampaign] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [applicationForm, setApplicationForm] = useState({
    // 기본 정보
    name: '',
    age: '',
    phone: '',
    email: '',
    
    // 피부 정보
    skin_type: '',
    skin_concerns: [],
    
    // 배송 정보
    shipping_postal_code: '',
    shipping_prefecture: '',
    shipping_city: '',
    shipping_address: '',
    
    // SNS 정보
    instagram_url: '',
    instagram_followers: '',
    tiktok_url: '',
    tiktok_followers: '',
    youtube_url: '',
    youtube_followers: '',
    twitter_url: '',
    twitter_followers: '',
    
    // 신청 내용
    motivation: '',
    content_plan: '',
    previous_experience: '',
    
    // 동의사항
    terms_agreed: false,
    privacy_agreed: false,
    marketing_agreed: false
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!campaignId) {
      navigate('/')
      return
    }
    
    loadData()
  }, [user, campaignId])

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
      
      // 사용자 프로필 로드
      const profileData = await database.userProfiles.getByUserId(user.id)
      if (profileData) {
        setUserProfile(profileData)
        
        // 기존 프로필 정보로 폼 초기화
        setApplicationForm(prev => ({
          ...prev,
          name: profileData.name || '',
          age: profileData.age || '',
          phone: profileData.phone || '',
          email: user.email || '',
          skin_type: profileData.skin_type || '',
          shipping_postal_code: profileData.postal_code || '',
          shipping_prefecture: profileData.prefecture || '',
          shipping_city: profileData.city || '',
          shipping_address: profileData.address || '',
          instagram_url: profileData.instagram_url || '',
          tiktok_url: profileData.tiktok_url || '',
          youtube_url: profileData.youtube_url || '',
          twitter_url: profileData.twitter_url || ''
        }))
      } else {
        // 이메일은 기본으로 설정
        setApplicationForm(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
      
      // 이미 신청했는지 확인
      const existingApplication = await database.applications.getByUserAndCampaign(user.id, campaignId)
      if (existingApplication) {
        setError('このキャンペーンには既に応募済みです。')
        return
      }
      
    } catch (error) {
      console.error('Load data error:', error)
      setError('データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setApplicationForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkinConcernChange = (concern, checked) => {
    setApplicationForm(prev => ({
      ...prev,
      skin_concerns: checked 
        ? [...prev.skin_concerns, concern]
        : prev.skin_concerns.filter(c => c !== concern)
    }))
  }

  const validateForm = () => {
    const errors = []
    
    // 필수 필드 검증
    if (!applicationForm.name.trim()) errors.push('お名前を入力してください。')
    if (!applicationForm.age || applicationForm.age < 18 || applicationForm.age > 100) {
      errors.push('年齢を正しく入力してください（18-100歳）。')
    }
    if (!applicationForm.phone.trim()) errors.push('電話番号を入力してください。')
    if (!applicationForm.skin_type) errors.push('肌タイプを選択してください。')
    
    // 배송 정보 검증
    if (!applicationForm.shipping_postal_code.trim()) errors.push('郵便番号を入力してください。')
    if (!applicationForm.shipping_prefecture) errors.push('都道府県を選択してください。')
    if (!applicationForm.shipping_city.trim()) errors.push('市区町村を入力してください。')
    if (!applicationForm.shipping_address.trim()) errors.push('住所を入力してください。')
    
    // SNS 정보 검증 (최소 1개 필요)
    const hasSNS = applicationForm.instagram_url || applicationForm.tiktok_url || 
                   applicationForm.youtube_url || applicationForm.twitter_url
    if (!hasSNS) {
      errors.push('SNSアカウントを最低1つ入力してください。')
    }
    
    // 신청 내용 검증
    if (!applicationForm.motivation.trim()) errors.push('応募動機を入力してください。')
    if (!applicationForm.content_plan.trim()) errors.push('コンテンツ企画案を入力してください。')
    
    // 동의사항 검증
    if (!applicationForm.terms_agreed) errors.push('利用規約に同意してください。')
    if (!applicationForm.privacy_agreed) errors.push('プライバシーポリシーに同意してください。')
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      
      // 사용자 프로필 업데이트 또는 생성
      const profileData = {
        user_id: user.id,
        name: applicationForm.name,
        age: parseInt(applicationForm.age),
        phone: applicationForm.phone,
        email: applicationForm.email,
        skin_type: applicationForm.skin_type,
        skin_concerns: applicationForm.skin_concerns,
        postal_code: applicationForm.shipping_postal_code,
        prefecture: applicationForm.shipping_prefecture,
        city: applicationForm.shipping_city,
        address: applicationForm.shipping_address,
        instagram_url: applicationForm.instagram_url,
        instagram_followers: parseInt(applicationForm.instagram_followers) || 0,
        tiktok_url: applicationForm.tiktok_url,
        tiktok_followers: parseInt(applicationForm.tiktok_followers) || 0,
        youtube_url: applicationForm.youtube_url,
        youtube_followers: parseInt(applicationForm.youtube_followers) || 0,
        twitter_url: applicationForm.twitter_url,
        twitter_followers: parseInt(applicationForm.twitter_followers) || 0,
        updated_at: new Date().toISOString()
      }
      
      if (userProfile) {
        await database.userProfiles.update(userProfile.id, profileData)
      } else {
        await database.userProfiles.create(profileData)
      }
      
      // 캠페인 신청 생성
      const applicationData = {
        user_id: user.id,
        campaign_id: campaignId,
        motivation: applicationForm.motivation,
        content_plan: applicationForm.content_plan,
        previous_experience: applicationForm.previous_experience,
        terms_agreed: applicationForm.terms_agreed,
        privacy_agreed: applicationForm.privacy_agreed,
        marketing_agreed: applicationForm.marketing_agreed,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      const newApplication = await database.applications.create(applicationData)
      
      // 📧 이메일 발송: 캠페인 신청 완료
      await emailTriggers.onApplicationSubmitted(newApplication, campaign, {
        name: applicationForm.name,
        email: applicationForm.email
      })
      
      setSuccess('キャンペーンへの応募が完了しました！審査結果をお待ちください。')
      
      // 3초 후 마이페이지로 이동
      setTimeout(() => {
        navigate('/mypage')
      }, 3000)
      
    } catch (error) {
      console.error('Submit application error:', error)
      setError('応募の送信に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">キャンペーン情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">エラー</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">応募完了</h3>
              <p className="text-gray-600 mb-4">{success}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  📧 確認メールを送信しました
                </p>
                <p className="text-sm text-gray-500">
                  マイページに自動的に移動します...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              ホームに戻る
            </Button>
            <h1 className="text-xl font-bold text-gray-800">キャンペーン応募</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Info */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {campaign.brand}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(campaign.reward_amount)}
                  </div>
                  <div className="text-sm text-gray-600">報酬</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{campaign.description}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">
                    <strong>応募締切:</strong> {new Date(campaign.application_deadline).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">
                    <strong>投稿締切:</strong> {new Date(campaign.deadline).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>基本情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">お名前 *</Label>
                    <Input
                      id="name"
                      value={applicationForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="山田太郎"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">年齢 *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="100"
                      value={applicationForm.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="25"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号 *</Label>
                    <Input
                      id="phone"
                      value={applicationForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="090-1234-5678"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={applicationForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@email.com"
                      required
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 피부 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>肌情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>肌タイプ *</Label>
                  <Select 
                    value={applicationForm.skin_type} 
                    onValueChange={(value) => handleInputChange('skin_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="肌タイプを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKIN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>肌悩み（複数選択可）</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SKIN_CONCERNS.map((concern) => (
                      <div key={concern.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={concern.value}
                          checked={applicationForm.skin_concerns.includes(concern.value)}
                          onCheckedChange={(checked) => handleSkinConcernChange(concern.value, checked)}
                        />
                        <Label htmlFor={concern.value} className="text-sm">
                          {concern.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 배송 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>配送先情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">郵便番号 *</Label>
                    <Input
                      id="postal_code"
                      value={applicationForm.shipping_postal_code}
                      onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                      placeholder="150-0001"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>都道府県 *</Label>
                    <Select 
                      value={applicationForm.shipping_prefecture} 
                      onValueChange={(value) => handleInputChange('shipping_prefecture', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="都道府県を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {JAPANESE_PREFECTURES.map((prefecture) => (
                          <SelectItem key={prefecture} value={prefecture}>
                            {prefecture}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">市区町村 *</Label>
                  <Input
                    id="city"
                    value={applicationForm.shipping_city}
                    onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                    placeholder="渋谷区"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">住所 *</Label>
                  <Input
                    id="address"
                    value={applicationForm.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    placeholder="神南1-2-3 マンション名 101号室"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* SNS 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>SNSアカウント情報</CardTitle>
                <CardDescription>
                  最低1つのSNSアカウントを入力してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instagram */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <Label>Instagram</Label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      value={applicationForm.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/username"
                    />
                    <Input
                      type="number"
                      value={applicationForm.instagram_followers}
                      onChange={(e) => handleInputChange('instagram_followers', e.target.value)}
                      placeholder="フォロワー数"
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-5 w-5 text-purple-500" />
                    <Label>TikTok</Label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      value={applicationForm.tiktok_url}
                      onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                      placeholder="https://tiktok.com/@username"
                    />
                    <Input
                      type="number"
                      value={applicationForm.tiktok_followers}
                      onChange={(e) => handleInputChange('tiktok_followers', e.target.value)}
                      placeholder="フォロワー数"
                    />
                  </div>
                </div>

                {/* YouTube */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <Label>YouTube</Label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      value={applicationForm.youtube_url}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@username"
                    />
                    <Input
                      type="number"
                      value={applicationForm.youtube_followers}
                      onChange={(e) => handleInputChange('youtube_followers', e.target.value)}
                      placeholder="チャンネル登録者数"
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-5 w-5 text-blue-500" />
                    <Label>Twitter (X)</Label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      value={applicationForm.twitter_url}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/username"
                    />
                    <Input
                      type="number"
                      value={applicationForm.twitter_followers}
                      onChange={(e) => handleInputChange('twitter_followers', e.target.value)}
                      placeholder="フォロワー数"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 신청 내용 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>応募内容</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivation">応募動機 *</Label>
                  <Textarea
                    id="motivation"
                    value={applicationForm.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder="このキャンペーンに応募する理由を教えてください"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content_plan">コンテンツ企画案 *</Label>
                  <Textarea
                    id="content_plan"
                    value={applicationForm.content_plan}
                    onChange={(e) => handleInputChange('content_plan', e.target.value)}
                    placeholder="どのようなコンテンツを制作予定ですか？"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previous_experience">過去の経験（任意）</Label>
                  <Textarea
                    id="previous_experience"
                    value={applicationForm.previous_experience}
                    onChange={(e) => handleInputChange('previous_experience', e.target.value)}
                    placeholder="コスメレビューやPR投稿の経験があれば教えてください"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 동의사항 */}
            <Card>
              <CardHeader>
                <CardTitle>同意事項</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={applicationForm.terms_agreed}
                    onCheckedChange={(checked) => handleInputChange('terms_agreed', checked)}
                    required
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="text-sm font-medium">
                      利用規約に同意します *
                    </Label>
                    <p className="text-xs text-gray-600">
                      <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        利用規約を確認する
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={applicationForm.privacy_agreed}
                    onCheckedChange={(checked) => handleInputChange('privacy_agreed', checked)}
                    required
                  />
                  <div className="space-y-1">
                    <Label htmlFor="privacy" className="text-sm font-medium">
                      プライバシーポリシーに同意します *
                    </Label>
                    <p className="text-xs text-gray-600">
                      <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        プライバシーポリシーを確認する
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={applicationForm.marketing_agreed}
                    onCheckedChange={(checked) => handleInputChange('marketing_agreed', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="marketing" className="text-sm font-medium">
                      マーケティング情報の受信に同意します（任意）
                    </Label>
                    <p className="text-xs text-gray-600">
                      新しいキャンペーン情報やお得な情報をメールでお送りします
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 whitespace-pre-line">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                disabled={submitting}
                className="w-full md:w-auto px-12 py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    応募中...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    キャンペーンに応募する
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CampaignApplicationWithEmail
