import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
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

const CampaignApplicationEnhanced = () => {
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
    shipping_address: '',
    shipping_postal_code: '',
    shipping_city: '',
    shipping_prefecture: '',
    
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
          skin_concerns: profileData.skin_concerns || [],
          shipping_address: profileData.address || '',
          shipping_postal_code: profileData.postal_code || '',
          shipping_city: profileData.city || '',
          shipping_prefecture: profileData.prefecture || '',
          instagram_url: profileData.instagram_url || '',
          instagram_followers: profileData.instagram_followers || '',
          tiktok_url: profileData.tiktok_url || '',
          tiktok_followers: profileData.tiktok_followers || '',
          youtube_url: profileData.youtube_url || '',
          youtube_followers: profileData.youtube_followers || '',
          twitter_url: profileData.twitter_url || '',
          twitter_followers: profileData.twitter_followers || ''
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
    const required = [
      'name', 'age', 'phone', 'skin_type', 
      'shipping_address', 'shipping_postal_code', 'shipping_city', 'shipping_prefecture',
      'instagram_url', 'motivation'
    ]
    
    for (const field of required) {
      if (!applicationForm[field]) {
        setError(`必須項目が入力されていません: ${getFieldLabel(field)}`)
        return false
      }
    }
    
    if (!applicationForm.terms_agreed || !applicationForm.privacy_agreed) {
      setError('利用規約とプライバシーポリシーに同意してください。')
      return false
    }
    
    return true
  }

  const getFieldLabel = (field) => {
    const labels = {
      name: '名前',
      age: '年齢',
      phone: '電話番号',
      skin_type: '肌タイプ',
      shipping_address: '配送先住所',
      shipping_postal_code: '郵便番号',
      shipping_city: '市区町村',
      shipping_prefecture: '都道府県',
      instagram_url: 'Instagram URL',
      motivation: '応募動機'
    }
    return labels[field] || field
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      setError('')
      
      // 사용자 프로필 업데이트
      const profileData = {
        user_id: user.id,
        name: applicationForm.name,
        age: parseInt(applicationForm.age),
        phone: applicationForm.phone,
        skin_type: applicationForm.skin_type,
        skin_concerns: applicationForm.skin_concerns,
        address: applicationForm.shipping_address,
        postal_code: applicationForm.shipping_postal_code,
        city: applicationForm.shipping_city,
        prefecture: applicationForm.shipping_prefecture,
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
        status: 'pending',
        motivation: applicationForm.motivation,
        content_plan: applicationForm.content_plan,
        previous_experience: applicationForm.previous_experience,
        sns_urls: {
          instagram: applicationForm.instagram_url,
          tiktok: applicationForm.tiktok_url,
          youtube: applicationForm.youtube_url,
          twitter: applicationForm.twitter_url
        },
        follower_counts: {
          instagram: parseInt(applicationForm.instagram_followers) || 0,
          tiktok: parseInt(applicationForm.tiktok_followers) || 0,
          youtube: parseInt(applicationForm.youtube_followers) || 0,
          twitter: parseInt(applicationForm.twitter_followers) || 0
        },
        shipping_info: {
          address: applicationForm.shipping_address,
          postal_code: applicationForm.shipping_postal_code,
          city: applicationForm.shipping_city,
          prefecture: applicationForm.shipping_prefecture
        },
        agreements: {
          terms: applicationForm.terms_agreed,
          privacy: applicationForm.privacy_agreed,
          marketing: applicationForm.marketing_agreed
        },
        created_at: new Date().toISOString()
      }
      
      await database.applications.create(applicationData)
      
      setSuccess('キャンペーンへの応募が完了しました！')
      
      // 3초 후 마이페이지로 이동
      setTimeout(() => {
        navigate('/profile')
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

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'tiktok':
        return <Hash className="h-4 w-4" />
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'twitter':
        return <Twitter className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
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
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">エラー</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>
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
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">応募完了</h3>
              <p className="text-gray-600 mb-4">{success}</p>
              <p className="text-sm text-gray-500">マイページに移動します...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">キャンペーン応募</h1>
            <p className="text-gray-600">必要な情報を入力してキャンペーンに応募してください</p>
          </div>
        </div>

        {/* Campaign Info */}
        {campaign && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{campaign.title}</span>
                <Badge className="bg-green-100 text-green-800">募集中</Badge>
              </CardTitle>
              <CardDescription className="text-purple-600 font-medium text-lg">
                {campaign.brand}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">報酬: {formatCurrency(campaign.reward_amount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>応募締切: {new Date(campaign.application_deadline).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">対象プラットフォーム</h4>
                  <div className="flex flex-wrap gap-2">
                    {(campaign.target_platforms || ['Instagram', 'TikTok']).map((platform) => (
                      <Badge key={platform} className="flex items-center space-x-1">
                        {getPlatformIcon(platform)}
                        <span>{platform}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報 */}
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
                  <Label htmlFor="name">名前 *</Label>
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
                    type="tel"
                    value={applicationForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="090-1234-5678"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={applicationForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 肌情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>肌情報</span>
              </CardTitle>
              <CardDescription>
                K-Beautyキャンペーンに最適なマッチングのため、肌タイプをお聞かせください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skin_type">肌タイプ *</Label>
                <Select 
                  value={applicationForm.skin_type} 
                  onValueChange={(value) => handleInputChange('skin_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="肌タイプを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">普通肌</SelectItem>
                    <SelectItem value="dry">乾燥肌</SelectItem>
                    <SelectItem value="oily">脂性肌</SelectItem>
                    <SelectItem value="combination">混合肌</SelectItem>
                    <SelectItem value="sensitive">敏感肌</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>肌の悩み（複数選択可）</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'ニキビ', 'シミ', 'シワ', '毛穴', '乾燥', '脂性',
                    'くすみ', 'たるみ', '赤み', '敏感', 'その他'
                  ].map((concern) => (
                    <div key={concern} className="flex items-center space-x-2">
                      <Checkbox
                        id={concern}
                        checked={applicationForm.skin_concerns.includes(concern)}
                        onCheckedChange={(checked) => handleSkinConcernChange(concern, checked)}
                      />
                      <Label htmlFor={concern} className="text-sm">{concern}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配送情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>配送先情報</span>
              </CardTitle>
              <CardDescription>
                キャンペーン商品の配送先住所を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">郵便番号 *</Label>
                  <Input
                    id="postal_code"
                    value={applicationForm.shipping_postal_code}
                    onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                    placeholder="123-4567"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prefecture">都道府県 *</Label>
                  <Select 
                    value={applicationForm.shipping_prefecture} 
                    onValueChange={(value) => handleInputChange('shipping_prefecture', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
                        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
                        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
                        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
                        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
                        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
                        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
                      ].map((prefecture) => (
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

          {/* SNS情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Instagram className="h-5 w-5" />
                <span>SNS情報</span>
              </CardTitle>
              <CardDescription>
                キャンペーンで使用するSNSアカウント情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instagram */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <h4 className="font-semibold">Instagram *</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      value={applicationForm.instagram_url}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_followers">フォロワー数</Label>
                    <Input
                      id="instagram_followers"
                      type="number"
                      min="0"
                      value={applicationForm.instagram_followers}
                      onChange={(e) => handleInputChange('instagram_followers', e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* TikTok */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Hash className="h-5 w-5 text-purple-500" />
                  <h4 className="font-semibold">TikTok</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url">TikTok URL</Label>
                    <Input
                      id="tiktok_url"
                      value={applicationForm.tiktok_url}
                      onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                      placeholder="https://tiktok.com/@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_followers">フォロワー数</Label>
                    <Input
                      id="tiktok_followers"
                      type="number"
                      min="0"
                      value={applicationForm.tiktok_followers}
                      onChange={(e) => handleInputChange('tiktok_followers', e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* YouTube */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold">YouTube</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      value={applicationForm.youtube_url}
                      onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_followers">チャンネル登録者数</Label>
                    <Input
                      id="youtube_followers"
                      type="number"
                      min="0"
                      value={applicationForm.youtube_followers}
                      onChange={(e) => handleInputChange('youtube_followers', e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Twitter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Twitter className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold">Twitter</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input
                      id="twitter_url"
                      value={applicationForm.twitter_url}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_followers">フォロワー数</Label>
                    <Input
                      id="twitter_followers"
                      type="number"
                      min="0"
                      value={applicationForm.twitter_followers}
                      onChange={(e) => handleInputChange('twitter_followers', e.target.value)}
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 応募内容 */}
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
                  placeholder="このキャンペーンに応募する理由や、ブランドへの想いをお聞かせください"
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content_plan">コンテンツ企画案</Label>
                <Textarea
                  id="content_plan"
                  value={applicationForm.content_plan}
                  onChange={(e) => handleInputChange('content_plan', e.target.value)}
                  placeholder="どのようなコンテンツを制作予定か、具体的なアイデアがあればお聞かせください"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="previous_experience">過去のキャンペーン参加経験</Label>
                <Textarea
                  id="previous_experience"
                  value={applicationForm.previous_experience}
                  onChange={(e) => handleInputChange('previous_experience', e.target.value)}
                  placeholder="過去に参加したキャンペーンや、コスメレビューの経験があればお聞かせください"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 同意事項 */}
          <Card>
            <CardHeader>
              <CardTitle>同意事項</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={applicationForm.terms_agreed}
                  onCheckedChange={(checked) => handleInputChange('terms_agreed', checked)}
                  required
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  <span className="text-red-500">*</span> 利用規約に同意します
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy"
                  checked={applicationForm.privacy_agreed}
                  onCheckedChange={(checked) => handleInputChange('privacy_agreed', checked)}
                  required
                />
                <Label htmlFor="privacy" className="text-sm leading-relaxed">
                  <span className="text-red-500">*</span> プライバシーポリシーに同意します
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing"
                  checked={applicationForm.marketing_agreed}
                  onCheckedChange={(checked) => handleInputChange('marketing_agreed', checked)}
                />
                <Label htmlFor="marketing" className="text-sm leading-relaxed">
                  マーケティング情報の受信に同意します（任意）
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 送信ボタン */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  応募中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  キャンペーンに応募する
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignApplicationEnhanced
