import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Loader2, Play, Users, Target, Shield,
  Instagram, Youtube, Hash, Twitter, ExternalLink,
  Star, Award, Calendar, DollarSign, Eye, ArrowRight,
  CheckCircle, Clock, MapPin, Phone, Mail, User, Zap,
  Menu, X
} from 'lucide-react'

const HomePageExactReplica = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalCreators: 0,
    totalApplications: 0,
    totalRewards: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadPageData()
  }, [])

  const loadPageData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCampaigns(),
        loadStats()
      ])
    } catch (error) {
      console.error('Page data load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const campaignsData = await database.campaigns.getAll()
      const activeCampaigns = campaignsData?.filter(campaign => campaign.status === 'active') || []
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error('Load campaigns error:', error)
      setCampaigns([])
    }
  }

  const loadStats = async () => {
    try {
      const [campaignsData, applicationsData, usersData] = await Promise.all([
        database.campaigns.getAll(),
        database.applications.getAll(),
        database.userProfiles.getAll()
      ])
      
      const allCampaigns = campaignsData || []
      const applications = applicationsData || []
      const users = usersData || []
      
      console.log('Stats data:', {
        campaigns: allCampaigns.length,
        applications: applications.length,
        users: users.length,
        rewards: allCampaigns.reduce((sum, campaign) => sum + (campaign.reward_amount || 0), 0)
      })
      
      setStats({
        totalCampaigns: allCampaigns.length,
        totalCreators: users.length,
        totalApplications: applications.length,
        totalRewards: allCampaigns.reduce((sum, campaign) => sum + (campaign.reward_amount || 0), 0)
      })
    } catch (error) {
      console.error('Load stats error:', error)
      // 오류 발생 시 기본값 설정
      setStats({
        totalCampaigns: 0,
        totalCreators: 0,
        totalApplications: 0,
        totalRewards: 0
      })
    }
  }

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign)
    setDetailModal(true)
  }

  const handleApplyToCampaign = () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (selectedCampaign) {
      navigate(`/campaign-application?campaign_id=${selectedCampaign.id}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
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

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return 'bg-pink-100 text-pink-800'
      case 'tiktok':
        return 'bg-purple-100 text-purple-800'
      case 'youtube':
        return 'bg-red-100 text-red-800'
      case 'twitter':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - 참조 사이트와 정확히 일치 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎬</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">CNEC Japan</h1>
                <p className="text-xs text-gray-600">K-Beauty × ショート動画プラットフォーム</p>
              </div>
            </div>
            
            {/* 데스크톱 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-4">
              <Badge className="bg-green-500 text-white hover:bg-green-600 cursor-pointer">
                <a href="#campaigns">キャンペーン</a>
              </Badge>
              <Badge className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer">
                <a href="#about">サービス紹介</a>
              </Badge>
              <Badge className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer">
                <a href="https://www.youtube.com/@CNEC_JP" target="_blank" rel="noopener noreferrer">ポートフォリオ</a>
              </Badge>
              <Badge className="bg-purple-500 text-white hover:bg-purple-600 cursor-pointer">
                <a href="#guide">参加方法</a>
              </Badge>
              {user ? (
                <>
                  <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer">
                    <Link to="/mypage">マイページ</Link>
                  </Badge>
                  <Badge className="bg-gray-500 text-white hover:bg-gray-600 cursor-pointer">
                    <button onClick={signOut}>ログアウト</button>
                  </Badge>
                </>
              ) : (
                <>
                  <Badge className="bg-teal-500 text-white hover:bg-teal-600 cursor-pointer">
                    <Link to="/login">ログイン</Link>
                  </Badge>
                  <Badge className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer">
                    <Link to="/signup">新規登録</Link>
                  </Badge>
                </>
              )}
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* 모바일 메뉴 */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2 pt-4">
                <Badge className="bg-green-500 text-white hover:bg-green-600 cursor-pointer w-fit">
                  <a href="#campaigns">キャンペーン</a>
                </Badge>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer w-fit">
                  <a href="#about">サービス紹介</a>
                </Badge>
                <Badge className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer w-fit">
                  <a href="https://www.youtube.com/@CNEC_JP" target="_blank" rel="noopener noreferrer">ポートフォリオ</a>
                </Badge>
                <Badge className="bg-purple-500 text-white hover:bg-purple-600 cursor-pointer w-fit">
                  <a href="#guide">参加方法</a>
                </Badge>
                {user ? (
                  <>
                    <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer w-fit">
                      <Link to="/mypage">マイページ</Link>
                    </Badge>
                    <Badge className="bg-gray-500 text-white hover:bg-gray-600 cursor-pointer w-fit">
                      <button onClick={signOut}>ログアウト</button>
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge className="bg-teal-500 text-white hover:bg-teal-600 cursor-pointer w-fit">
                      <Link to="/login">ログイン</Link>
                    </Badge>
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer w-fit">
                      <Link to="/signup">新規登録</Link>
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - 참조 사이트와 정확히 일치하는 그라데이션 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500"></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            K-Beauty × ショート動画
            <br />
            <span className="text-yellow-300">専門プラットフォーム</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
            韓国コスメブランドとクリエイターを繋ぐ新しいマーケティングプラットフォーム。
            あなたの創造性を収益化しませんか？
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-purple-600 text-white hover:bg-purple-700 border-2 border-purple-400"
              asChild
            >
              <Link to="/signup">
                <Users className="h-5 w-5 mr-2" />
                クリエイター登録
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              <a href="#campaigns" className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                キャンペーンを見る
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section - 참조 사이트와 정확히 일치하는 색상 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {stats.totalCampaigns}
              </div>
              <div className="text-gray-600 font-medium">総キャンペーン数</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {stats.totalCreators.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">登録クリエイター数</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {stats.totalApplications}
              </div>
              <div className="text-gray-600 font-medium">総応募数</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600 mb-2">
                {formatCurrency(stats.totalRewards)}
              </div>
              <div className="text-gray-600 font-medium">総報酬額</div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">現在募集中のキャンペーン</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              韓国コスメブランドの最新キャンペーンに参加して、あなたの影響力を収益化しましょう
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">キャンペーンを読み込み中...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                現在募集中のキャンペーンはありません
              </h3>
              <p className="text-gray-500">新しいキャンペーンが開始されるまでお待ちください。</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {campaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  {campaign.image_url && (
                    <div className="w-full h-48 overflow-hidden">
                      <img 
                        src={campaign.image_url} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-bold text-gray-800 leading-tight">
                        {campaign.title}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800 font-medium">募集中</Badge>
                    </div>
                    <CardDescription className="text-purple-600 font-medium text-base">
                      {campaign.brand}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-4">
                      {campaign.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">対象プラットフォーム:</div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // target_platforms가 객체인 경우 처리
                          if (campaign.target_platforms && typeof campaign.target_platforms === 'object') {
                            const platforms = []
                            if (campaign.target_platforms.instagram) platforms.push('Instagram')
                            if (campaign.target_platforms.youtube) platforms.push('YouTube')
                            if (campaign.target_platforms.tiktok) platforms.push('TikTok')
                            return platforms.length > 0 ? platforms : ['Instagram', 'TikTok']
                          }
                          // 배열인 경우 또는 기본값
                          return campaign.target_platforms || ['Instagram', 'TikTok']
                        })().map((platform) => (
                          <Badge 
                            key={platform} 
                            className={`${getPlatformColor(platform)} flex items-center space-x-1 text-xs`}
                          >
                            {getPlatformIcon(platform)}
                            <span>{platform}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(campaign.reward_amount)}
                        </div>
                        <div className="text-sm text-gray-500">報酬</div>
                      </div>
                      <Button className="bg-gray-800 text-white hover:bg-gray-900">
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section - 참조 사이트와 정확히 일치 */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">CNEC Japanとは</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              K-Beautyブランドとクリエイターを繋ぐ専門プラットフォーム
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">ターゲット特化</h3>
              <p className="text-gray-600 leading-relaxed">
                K-Beautyに特化したマーケティングで効果的なプロモーションを実現
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">ショート動画重視</h3>
              <p className="text-gray-600 leading-relaxed">
                TikTok、Instagram Reelsなどショート動画プラットフォームに最適化
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">安心のサポート</h3>
              <p className="text-gray-600 leading-relaxed">
                ブランドとクリエイター双方をサポートする充実したサービス
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section - 참조 사이트와 정확히 일치 */}
      <section id="portfolio" className="py-16 bg-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-6">🎬</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">CNECポートフォリオ</h2>
              <p className="text-gray-600 text-lg">
                これまでのキャンペーン実績と成功事例をご覧ください
              </p>
            </div>
            
            <Card className="bg-white shadow-xl">
              <CardContent className="pt-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start mb-6">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mr-4">
                        <Youtube className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">CNEC Japan</h3>
                        <p className="text-red-600 font-semibold">YouTube チャンネル</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      実際のキャンペーン動画や成功事例、クリエイターのインタビューなど、
                      CNECの魅力的なコンテンツをYouTubeでご覧いただけます。
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-red-600 font-semibold">キャンペーン実績</div>
                        <div className="text-gray-700 text-sm">成功事例動画</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 font-semibold">クリエイター紹介</div>
                        <div className="text-gray-700 text-sm">インタビュー動画</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 font-semibold">ブランド紹介</div>
                        <div className="text-gray-700 text-sm">商品レビュー</div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-red-600 text-white hover:bg-red-700 mb-6"
                      onClick={() => window.open('https://www.youtube.com/@CNEC_JP', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      ポートフォリオを見る
                    </Button>
                  </div>
                </div>
                
                {/* 통계 섹션 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">500+</div>
                    <div className="text-gray-600 text-sm">成功キャンペーン</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">5,000+</div>
                    <div className="text-gray-600 text-sm">参加クリエイター</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">50M+</div>
                    <div className="text-gray-600 text-sm">総再生回数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">98%</div>
                    <div className="text-gray-600 text-sm">満足度</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Guide Section - 참조 사이트와 정확히 일치하는 6단계 */}
      <section id="guide" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">CNECキャンペーン参加方法</h2>
            <p className="text-gray-600 text-lg">
              簡単6ステップでキャンペーンに参加できます
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                {
                  step: 1,
                  title: '会員登録',
                  description: 'Googleアカウントで簡単登録',
                  icon: <User className="h-8 w-8" />
                },
                {
                  step: 2,
                  title: 'プロフィール完成',
                  description: 'SNSアカウントと詳細情報を登録',
                  icon: <Star className="h-8 w-8" />
                },
                {
                  step: 3,
                  title: 'キャンペーン応募',
                  description: '興味のあるキャンペーンに応募',
                  icon: <Target className="h-8 w-8" />
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-purple-600">{item.icon}</div>
                  </div>
                  <div className="text-sm text-purple-600 font-semibold mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: 4,
                  title: '審査・確定',
                  description: 'ブランドによる審査と参加確定',
                  icon: <CheckCircle className="h-8 w-8" />
                },
                {
                  step: 5,
                  title: 'コンテンツ制作',
                  description: 'ガイドラインに沿って動画制作',
                  icon: <Play className="h-8 w-8" />
                },
                {
                  step: 6,
                  title: '報酬受取',
                  description: 'ポイント獲得と日本の銀行口座へ送金',
                  icon: <DollarSign className="h-8 w-8" />
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-purple-600">{item.icon}</div>
                  </div>
                  <div className="text-sm text-purple-600 font-semibold mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - 참조 사이트와 정확히 일치 */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🎬</div>
                <div className="text-xl font-bold">CNEC Japan</div>
              </div>
              <p className="text-gray-400 text-sm">
                K-Beautyブランドとクリエイターを繋ぐ専門プラットフォーム
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#campaigns" className="hover:text-white transition-colors">キャンペーン</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">サービス紹介</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">ポートフォリオ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#guide" className="hover:text-white transition-colors">参加方法</a></li>
                <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">お問い合わせ</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>mkt@howlab.co.kr</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>대표자 : 박철용 | 사업 : 하우랩마케팅회사</p>
          </div>
        </div>
      </footer>

      {/* Campaign Detail Modal */}
      <Dialog open={detailModal} onOpenChange={setDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedCampaign?.title}</DialogTitle>
            <DialogDescription className="text-purple-600 font-medium text-lg">
              {selectedCampaign?.brand}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">キャンペーン詳細</h4>
                <p className="text-gray-600">{selectedCampaign.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">対象プラットフォーム</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // target_platforms가 객체인 경우 처리
                    if (selectedCampaign.target_platforms && typeof selectedCampaign.target_platforms === 'object') {
                      const platforms = []
                      if (selectedCampaign.target_platforms.instagram) platforms.push('Instagram')
                      if (selectedCampaign.target_platforms.youtube) platforms.push('YouTube')
                      if (selectedCampaign.target_platforms.tiktok) platforms.push('TikTok')
                      return platforms.length > 0 ? platforms : ['Instagram', 'TikTok']
                    }
                    // 배열인 경우 또는 기본값
                    return selectedCampaign.target_platforms || ['Instagram', 'TikTok']
                  })().map((platform) => (
                    <Badge 
                      key={platform} 
                      className={`${getPlatformColor(platform)} flex items-center space-x-1`}
                    >
                      {getPlatformIcon(platform)}
                      <span>{platform}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">報酬</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(selectedCampaign.reward_amount)}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleApplyToCampaign}
                  className="flex-1"
                >
                  このキャンペーンに応募する
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModal(false)}
                >
                  閉じる
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HomePageExactReplica
