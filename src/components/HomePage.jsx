import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Target, Award, TrendingUp } from 'lucide-react'

const HomePage = () => {
  const { user, signOut } = useAuth()
  const { language, changeLanguage, t } = useLanguage()
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPageData()
  }, [])

  const loadPageData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [campaignsData, statsData] = await Promise.all([
        database.campaigns.getActive(),
        database.stats.getOverall()
      ])
      
      setCampaigns(campaignsData || [])
      setStats(statsData || {})
    } catch (error) {
      console.error('Load page data error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const getCampaignTypeBadge = (campaignType) => {
    const badges = {
      regular: { label: '📝 일반', labelJa: '📝 一般', color: 'bg-blue-100 text-blue-700' },
      oliveyoung: { label: '🌸 올영세일', labelJa: '🌸 オリーブヤング', color: 'bg-pink-100 text-pink-700' },
      '4week_challenge': { label: '💪 4주 챌린지', labelJa: '💪 4週チャレンジ', color: 'bg-purple-100 text-purple-700' }
    }
    const badge = badges[campaignType] || badges.regular
    return (
      <Badge variant="outline" className={`${badge.color} font-semibold text-xs`}>
        {language === 'ko' ? badge.label : badge.labelJa}
      </Badge>
    )
  }

  const getPlatformBadge = (platform) => {
    const platformStyles = {
      instagram: 'bg-pink-100 text-pink-800',
      tiktok: 'bg-purple-100 text-purple-800',
      youtube: 'bg-red-100 text-red-800',
      twitter: 'bg-blue-100 text-blue-800'
    }
    
    return (
      <Badge className={platformStyles[platform] || 'bg-gray-100 text-gray-800'}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎬</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">CNEC Japan</h1>
                <p className="text-xs text-gray-600">K-Beauty × ショート動画</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#campaigns" className="text-gray-600 hover:text-purple-600 transition-colors">
                キャンペーン
              </a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition-colors">
                サービス紹介
              </a>
              <a href="#contact" className="text-gray-600 hover:text-purple-600 transition-colors">
                お問い合わせ
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
              {/* 사용자 메뉴 */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <Link to="/profile">
                    <Button variant="outline" size="sm">
                      マイページ
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    ログアウト
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      ログイン
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">
                      新規登録
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
            K-Beauty × ショート動画<br />
            <span className="text-purple-600">専門プラットフォーム</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {language === 'ko' 
              ? '한국 코스메틱 브랜드와 크리에이터를 연결하는 새로운 마케팅 플랫폼'
              : '韓国コスメブランドとクリエイターを繋ぐ新しいマーケティングプラットフォーム'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                {language === 'ko' ? '크리에이터 등록' : 'クリエイター登録'}
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('campaigns')?.scrollIntoView()}>
              {language === 'ko' ? '캠페인 보기' : 'キャンペーンを見る'}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {stats.totalCampaigns || 0}
                </div>
                <div className="text-gray-600">{t('totalCampaigns')}</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.totalUsers || 0}
                </div>
                <div className="text-gray-600">{t('totalUsers')}</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.totalApplications || 0}
                </div>
                <div className="text-gray-600">{t('totalApplications')}</div>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-6">
                <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {formatCurrency(stats.totalRewards)}
                </div>
                <div className="text-gray-600">{t('totalRewards')}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {language === 'ko' ? '현재 모집 중인 캠페인' : '現在募集中のキャンペーン'}
            </h2>
            <p className="text-gray-600">
              {language === 'ko' 
                ? '한국 코스메틱 브랜드의 최신 캠페인에 참여하세요'
                : '韓国コスメブランドの最新キャンペーンに参加しよう'
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">{t('loadingFailed')}</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={loadPageData} variant="outline">
                {language === 'ko' ? '다시 시도' : '再試行'}
              </Button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {language === 'ko' ? '현재 모집 중인 캠페인이 없습니다' : '現在募集中のキャンペーンはありません'}
              </h3>
              <p className="text-gray-500">
                {language === 'ko' 
                  ? '새로운 캠페인이 시작될 때까지 기다려주세요.'
                  : '新しいキャンペーンが開始されるまでお待ちください。'
                }
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {language === 'ko' ? '모집중' : '募集中'}
                        </Badge>
                        {getCampaignTypeBadge(campaign.campaign_type)}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(campaign.reward_points * 0.6)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {language === 'ko' ? '보상' : '報酬'}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{campaign.title}</CardTitle>
                    <CardDescription className="text-purple-600 font-medium">
                      {campaign.brand}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {campaign.description}
                    </p>
                    
                    {campaign.platforms && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {campaign.platforms.map((platform) => (
                          <span key={platform}>
                            {getPlatformBadge(platform)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-gray-600">{language === 'ko' ? '모집 인원' : '募集人数'}</div>
                        <div className="font-bold text-blue-600">{campaign.total_slots || campaign.max_participants || 0}명</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="text-xs text-gray-600">{language === 'ko' ? '마감일' : '締切'}</div>
                        <div className="font-bold text-orange-600">
                          {campaign.recruitment_deadline || campaign.application_deadline
                            ? new Date(campaign.recruitment_deadline || campaign.application_deadline).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR', { month: 'numeric', day: 'numeric' })
                            : '-'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <Link to={`/campaign-application?campaign_id=${campaign.id}`}>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        {language === 'ko' ? '신청하기' : '応募する'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {language === 'ko' ? 'CNEC Japan이란?' : 'CNEC Japanとは'}
            </h2>
            <p className="text-gray-600">
              {language === 'ko' 
                ? 'K-Beauty 브랜드와 크리에이터를 연결하는 전문 플랫폼'
                : 'K-Beautyブランドとクリエイターを繋ぐ専門プラットフォーム'
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === 'ko' ? '타겟 특화' : 'ターゲット特化'}
                </h3>
                <p className="text-gray-600">
                  {language === 'ko' 
                    ? 'K-Beauty에 특화된 마케팅으로 효과적인 프로모션을 실현'
                    : 'K-Beautyに特化したマーケティングで効果的なプロモーションを実現'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === 'ko' ? '숏폼 동영상 중심' : 'ショート動画重視'}
                </h3>
                <p className="text-gray-600">
                  {language === 'ko' 
                    ? 'TikTok, Instagram Reels 등 숏폼 동영상 플랫폼에 최적화'
                    : 'TikTok、Instagram Reelsなどショート動画プラットフォームに最適化'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold mb-2">
                  {language === 'ko' ? '안심 서포트' : '安心のサポート'}
                </h3>
                <p className="text-gray-600">
                  {language === 'ko' 
                    ? '브랜드와 크리에이터 양쪽을 지원하는 충실한 서비스'
                    : 'ブランドとクリエイター双方をサポートする充実したサービス'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {language === 'ko' ? '문의하기' : 'お問い合わせ'}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === 'ko' 
              ? '궁금한 점이나 상담이 있으시면 언제든지 문의해주세요'
              : 'ご質問やご相談がございましたらお気軽にお問い合わせください'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="mailto:mkt_biz@cnec.co.kr">
                {language === 'ko' ? '이메일로 문의' : 'メールでお問い合わせ'}
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:+82-2-1234-5678">
                {language === 'ko' ? '전화로 문의' : '電話でお問い合わせ'}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🎬</div>
                <div className="text-xl font-bold">CNEC Japan</div>
              </div>
              <p className="text-gray-400">
                {language === 'ko' 
                  ? 'K-Beauty × 숏폼 동영상의 전문 플랫폼'
                  : 'K-Beauty × ショート動画の専門プラットフォーム'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">
                {language === 'ko' ? '서비스' : 'サービス'}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#campaigns" className="hover:text-white transition-colors">{t('campaigns')}</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">
                  {language === 'ko' ? '크리에이터 등록' : 'クリエイター登録'}
                </Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">
                {language === 'ko' ? '지원' : 'サポート'}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">
                  {language === 'ko' ? '자주 묻는 질문' : 'よくある質問'}
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors">
                  {language === 'ko' ? '이용약관' : '利用規約'}
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors">
                  {language === 'ko' ? '개인정보처리방침' : 'プライバシーポリシー'}
                </a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">
                {language === 'ko' ? '문의' : 'お問い合わせ'}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: mkt_biz@cnec.co.kr</li>
                <li>Tel: +82-2-1234-5678</li>
                <li>Address: Seoul, South Korea</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CNEC Japan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
