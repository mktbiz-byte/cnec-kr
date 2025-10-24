import React, { useState, useEffect } from 'react'
import cnecLogo from '../assets/cnec-logo-clean.png'
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [faqs, setFaqs] = useState([])
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
        return 'bg-blue-100 text-blue-800'
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
            <Link to="/" className="flex items-center">
              <img src={cnecLogo} alt="CNEC Korea" className="h-20" />
            </Link>
            
            {/* 데스크톱 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center space-x-4">
              <Badge className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                <a href="#campaigns">캠페인</a>
              </Badge>
              <Badge className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                <a href="#about">서비스소개</a>
              </Badge>
              <Badge className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                <a href="https://www.youtube.com/@bizcnec" target="_blank" rel="noopener noreferrer">포트폴리오</a>
              </Badge>
              <Badge className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                <a href="#guide">참가방법</a>
              </Badge>
              {user ? (
                <>
                  <Badge className="bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer">
                    <Link to="/mypage">마이페이지</Link>
                  </Badge>
                  <Badge className="bg-gray-600 text-white hover:bg-gray-700 cursor-pointer">
                    <button onClick={signOut}>로그아웃</button>
                  </Badge>
                </>
              ) : (
                <>
                  <Badge className="bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer">
                    <Link to="/login">로그인</Link>
                  </Badge>
                  <Badge className="bg-blue-700 text-white hover:bg-blue-800 cursor-pointer">
                    <Link to="/signup">회원가입</Link>
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
                  <a href="#campaigns">캠페인</a>
                </Badge>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer w-fit">
                  <a href="#about">서비스소개</a>
                </Badge>
                <Badge className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer w-fit">
                  <a href="https://www.youtube.com/@bizcnec" target="_blank" rel="noopener noreferrer">포트폴리오</a>
                </Badge>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer w-fit">
                  <a href="#guide">참가방법</a>
                </Badge>
                {user ? (
                  <>
                    <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer w-fit">
                      <Link to="/mypage">마이페이지</Link>
                    </Badge>
                    <Badge className="bg-gray-500 text-white hover:bg-gray-600 cursor-pointer w-fit">
                      <button onClick={signOut}>로그아웃</button>
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge className="bg-teal-500 text-white hover:bg-teal-600 cursor-pointer w-fit">
                      <Link to="/login">로그인</Link>
                    </Badge>
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer w-fit">
                      <Link to="/signup">회원가입</Link>
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - PDF 개선안 반영 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500"></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          {/* 메인 타이틀 */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            K-Beauty 크리에이터와 함께
            <br />
            <span className="text-yellow-300">성장하는</span> 플랫폼
          </h1>
          
          {/* 서브 타이틀 */}
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
            뷰티 크리에이터를 육성하고 양성하며,<br />
            브랜드와 함께 성장하는 전문 파트너십 플랫폼
          </p>
          
          {/* 메인 영상 */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl"
                src="https://www.youtube.com/embed/GDwYeELp0aQ"
                title="CNEC Korea 소개 영상"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-6"
              asChild
            >
              <Link to="/signup">
                크리에이터 등록하기
              </Link>
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-700 text-white hover:bg-blue-800 font-bold text-lg px-8 py-6"
            >
              <a href="#programs">
                프로그램 알아보기
              </a>
            </Button>
          </div>

          {/* 핵심 가치 제안 (3가지) */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">체계적인 교육</h3>
              <p className="text-sm text-gray-700">뷰티 콘텐츠 제작 노하우 전수</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">브랜드 파트너십</h3>
              <p className="text-sm text-gray-700">100+ 뷰티 브랜드와 직접 협업</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">성장 지원</h3>
              <p className="text-sm text-gray-700">유튜브 채널 육성 프로그램</p>
            </div>
          </div>
        </div>
      </section>



      {/* About Section - PDF 개선안 반영: 4개 카드 그리드 */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">CNEC만의 혜택</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              K-뷰티 크리에이터를 육성하고 양성하는 전문 플랫폼입니다.<br />
              브랜드와 크리에이터가 함께 성장하며, 지속 가능한 파트너십을 구축합니다.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Feature 1: 크리에이터 육성 */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎓</span>
                </div>
                <CardTitle className="text-center text-xl">크리에이터 육성</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center mb-4">
                  체계적인 교육 프로그램과 멘토링을 통해 초보 크리에이터도 전문가로 성장할 수 있도록 지원합니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>콘텐츠 제작 교육</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>1:1 멘토링</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>성공 사례 공유</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: 브랜드 파트너십 */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🤝</span>
                </div>
                <CardTitle className="text-center text-xl">브랜드 파트너십</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center mb-4">
                  100개 이상의 K-뷰티 브랜드와 직접 협업하며, 크리에이터에게 다양한 기회를 제공합니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>브랜드 직접 매칭</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>장기 계약 기회</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>독점 캠페인 참여</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: 성장 지원 시스템 */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <CardTitle className="text-center text-xl">성장 지원 시스템</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center mb-4">
                  유튜브 채널 육성부터 숏폼 크리에이터 프로그램까지, 단계별 성장을 체계적으로 지원합니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>유튜브 육성 프로그램</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>숏폼 크리에이터 혜택</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>포인트 추가 지급</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4: 숏폼 콘텐츠 전문 */}
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📱</span>
                </div>
                <CardTitle className="text-center text-xl">숏폼 콘텐츠 전문</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center mb-4">
                  TikTok, Instagram Reels, YouTube Shorts 등 숏폼 플랫폼에 최적화된 콘텐츠 제작을 지원합니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">✓</span>
                    <span>숏폼 트렌드 분석</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">✓</span>
                    <span>편집 가이드 제공</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">✓</span>
                    <span>바이럴 전략 공유</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">현재 모집 중인 캠페인</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              한국 화장품 브랜드의 최신 캠페인에 참가하고, 당신의 영향력을 수익화하세요
            </p>
          </div>
          
          {/* 카테고리 탭 */}
          <div className="flex justify-center mb-12 flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체 캠페인
            </button>
            <button
              onClick={() => setSelectedCategory('youtube')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === 'youtube'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🎬 유튜브 모집
            </button>
            <button
              onClick={() => setSelectedCategory('instagram')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === 'instagram'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              📸 인스타 모집
            </button>
            <button
              onClick={() => setSelectedCategory('4week_challenge')}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedCategory === '4week_challenge'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏆 4주 챌린지
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">캠페인를로딩중...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                현재 모집 중인 캠페인없습니다
              </h3>
              <p className="text-gray-500">새로운캠페인가시작되는까지기다려주세요.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {campaigns
                .filter(campaign => selectedCategory === 'all' || campaign.category === selectedCategory)
                .map((campaign) => (
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
                      <Badge className="bg-green-100 text-green-800 font-medium">모집 중</Badge>
                    </div>
                    <CardDescription className="text-blue-600 font-medium text-base">
                      {campaign.brand}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-4">
                      {campaign.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">対象플랫폼:</div>
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
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(campaign.reward_amount)}
                        </div>
                        <div className="text-sm text-gray-500">보상</div>
                      </div>
                      <Button className="bg-gray-800 text-white hover:bg-gray-900">
                        자세히 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 크리에이터 성장 프로그램 섹션 */}
      <section id="growth-programs" className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">크리에이터 성장 프로그램</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              단계별 성장 경로를 통해 초보부터 전문 크리에이터까지<br />
              CNEC와 함께 성장하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* 일반 캠페인 */}
            <Card className="hover:shadow-xl transition-shadow bg-white">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🚀</span>
                </div>
                <CardTitle className="text-center text-xl">일반 캠페인</CardTitle>
                <p className="text-center text-sm text-gray-600">누구나 시작할 수 있어요</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">가입 후 바로 참여 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">다양한 브랜드 캠페인</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">제품 제공 + 포인트 지급</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">경험 쳐서 성장 가능</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/campaigns')}
                >
                  캠페인 보기
                </Button>
              </CardContent>
            </Card>

            {/* 숏폼 크리에이터 */}
            <Card className="hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⭐</span>
                </div>
                <CardTitle className="text-center text-xl text-blue-600">숏폼 크리에이터</CardTitle>
                <p className="text-center text-sm text-gray-600">활동 실적으로 승격</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700"><strong>20-50% 추가 보상</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">캠페인 우선 배정</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">브랜드 협업 기회</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-gray-700">전담 매니저 배정</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/cnec-plus')}
                >
                  상세 보기
                </Button>
              </CardContent>
            </Card>

            {/* 유튜브 육성 */}
            <Card className="hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-white border-2 border-red-300">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏆</span>
                </div>
                <CardTitle className="text-center text-xl text-red-600">유튜브 육성</CardTitle>
                <p className="text-center text-sm text-gray-600">최고 등급 프로그램</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span className="text-gray-700"><strong>100만P 지원</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span className="text-gray-700">제품비 100% 지원</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span className="text-gray-700">1:1 멘토링 + 교육</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span className="text-gray-700">채널 성장 전략 지원</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => navigate('/cnec-plus')}
                >
                  상세 보기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA 섹션 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">지금 바로 CNEC Plus에 도전하세요!</h3>
            <p className="text-gray-600 mb-6">
              일반 캠페인 5회 이상 참여 시 숏폼 크리에이터로 승격 가능합니다.<br />
              뷰티 전문 유튜버를 꾸꾸신다면 유튜브 육성 프로그램에 지원하세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={() => navigate('/cnec-plus')}
              >
                CNEC Plus 상세보기
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                onClick={() => navigate('/campaigns')}
              >
                일반 캠페인 보기
              </Button>
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
              <h2 className="text-4xl font-bold text-gray-800 mb-4">CNEC포트폴리오</h2>
              <p className="text-gray-600 text-lg">
                지금까지의캠페인실적와성공사례를보기해주세요
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
                        <h3 className="text-2xl font-bold text-gray-800">CNEC Korea</h3>
                        <p className="text-red-600 font-semibold">YouTube 채널</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      실제의캠페인영상와성공사례, 크리에이터의인터뷰등, 
                      CNEC의매력적콘텐츠를YouTube에서보기받으실 수 있습니다.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-red-600 font-semibold">캠페인실적</div>
                        <div className="text-gray-700 text-sm">성공사례영상</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 font-semibold">크리에이터소개</div>
                        <div className="text-gray-700 text-sm">인터뷰영상</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 font-semibold">브랜드소개</div>
                        <div className="text-gray-700 text-sm">상품리뷰</div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-red-600 text-white hover:bg-red-700 mb-6"
                      onClick={() => window.open('https://www.youtube.com/@bizcnec', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      포트폴리오를보기
                    </Button>
                  </div>
                </div>
                
                {/* 통계 섹션 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-1">500+</div>
                    <div className="text-gray-600 text-sm">성공캠페인</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">5,000+</div>
                    <div className="text-gray-600 text-sm">참가크리에이터</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">50M+</div>
                    <div className="text-gray-600 text-sm">총재생회수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">98%</div>
                    <div className="text-gray-600 text-sm">만족도</div>
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
            <h2 className="text-4xl font-bold text-gray-800 mb-4">CNEC캠페인참가방법</h2>
            <p className="text-gray-600 text-lg">
              간단6단계에서캠페인에참가할 수 있습니다
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                {
                  step: 1,
                  title: '회원등록',
                  description: 'Google계정에서간단등록',
                  icon: <User className="h-8 w-8" />
                },
                {
                  step: 2,
                  title: '프로필완성',
                  description: 'SNS계정와상세정보를등록',
                  icon: <Star className="h-8 w-8" />
                },
                {
                  step: 3,
                  title: '캠페인응모',
                  description: '흥미의캠페인에응모',
                  icon: <Target className="h-8 w-8" />
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-blue-600">{item.icon}</div>
                  </div>
                  <div className="text-sm text-blue-600 font-semibold mb-2">
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
                  title: '심사 · 확정',
                  description: '브랜드에 의한심사와참가확정',
                  icon: <CheckCircle className="h-8 w-8" />
                },
                {
                  step: 5,
                  title: '콘텐츠제작',
                  description: '가이드라인에따라영상제작',
                  icon: <Play className="h-8 w-8" />
                },
                {
                  step: 6,
                  title: '보상받기',
                  description: '포인트획득와한국의은행계좌로송금',
                  icon: <DollarSign className="h-8 w-8" />
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-blue-600">{item.icon}</div>
                  </div>
                  <div className="text-sm text-blue-600 font-semibold mb-2">
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


      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">자주 묻는 질문</h2>
            <p className="text-gray-600 text-lg">
              크리에이터들이 가장 궁금해하는 질문들을 모았습니다
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: '크넥(CNEC)은 어떤 플랫폼인가요?',
                answer: '크넥은 한국 화장품 브랜드와 크리에이터를 연결하는 인플루언서 마케팅 플랫폼입니다. 집에서 부업으로 숏폼 영상을 제작하고 포인트를 받을 수 있습니다.'
              },
              {
                question: '캠페인에 어떻게 참여하나요?',
                answer: '1) 회원가입 및 프로필 완성 → 2) 관심 있는 캠페인 선택 → 3) 지원서 작성 → 4) 브랜드 심사 → 5) 선정 시 제품 수령 → 6) 콘텐츠 제작 및 업로드 → 7) 포인트 지급'
              },
              {
                question: '포인트는 언제 지급되나요?',
                answer: '캠페인 완료 후 브랜드 승인이 완료되면 즉시 포인트가 지급됩니다. 일반적으로 콘텐츠 업로드 후 3-7일 이내에 지급됩니다.'
              },
              {
                question: '포인트는 어떻게 출금하나요?',
                answer: '마이페이지에서 출금 신청을 할 수 있습니다. 10만 포인트(10만원) 이상부터 출금 가능하며, 은행 계좌 정보와 주민등록번호를 입력하면 됩니다.'
              },
              {
                question: '출금은 얼마나 걸리나요?',
                answer: '출금 신청 후 영업일 기준 3-5일 이내에 등록하신 은행 계좌로 입금됩니다.'
              },
              {
                question: '캠페인 선정 기준은 무엇인가요?',
                answer: 'SNS 팔로워 수, 콘텐츠 품질, 과거 캠페인 참여 이력, 브랜드와의 적합성 등을 종합적으로 고려합니다. 팔로워가 적어도 양질의 콘텐츠를 제작하면 선정될 수 있습니다.'
              },
              {
                question: '여러 캠페인에 동시에 참여할 수 있나요?',
                answer: '네, 가능합니다. 단, 각 캠페인의 마감일을 준수하고 양질의 콘텐츠를 제작할 수 있는 범위 내에서 참여해주세요.'
              },
              {
                question: '개인정보는 안전하게 보관되나요?',
                answer: '네, 주민등록번호 등 민감한 정보는 암호화되어 저장되며, 관리자도 원본을 볼 수 없습니다. 개인정보보호법에 따라 안전하게 관리됩니다.'
              }
            ].map((faq, index) => (
              <details key={index} className="bg-gray-50 rounded-lg p-6 cursor-pointer hover:bg-gray-100 transition-colors">
                <summary className="font-semibold text-lg text-gray-800 flex justify-between items-center">
                  <span>Q. {faq.question}</span>
                  <span className="text-blue-600 text-2xl">+</span>
                </summary>
                <div className="mt-4 text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">더 궁금한 점이 있으신가요?</p>
            <Button 
              size="lg" 
              className="bg-yellow-400 text-gray-800 hover:bg-yellow-500 font-bold"
              onClick={() => window.open('https://pf.kakao.com/_TjhGG', '_blank')}
            >
              💬 카카오톡 채널 문의하기
            </Button>
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
                <div className="text-xl font-bold">CNEC Korea</div>
              </div>
              <p className="text-gray-400 text-sm">
                한국 화장품 브랜드와 크리에이터를 연결하는 전문 플랫폼
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#campaigns" className="hover:text-white transition-colors">캠페인</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">서비스소개</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">포트폴리오</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#guide" className="hover:text-white transition-colors">참가방법</a></li>
                <li><a href="#" className="hover:text-white transition-colors">자주 묻는 질문</a></li>
                <li><a href="#" className="hover:text-white transition-colors">문의하기</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">문의하기</h4>
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
            <DialogDescription className="text-blue-600 font-medium text-lg">
              {selectedCampaign?.brand}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">캠페인상세</h4>
                <p className="text-gray-600">{selectedCampaign.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">対象플랫폼</h4>
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
                <h4 className="font-semibold text-gray-800 mb-2">보상</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(selectedCampaign.reward_amount)}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleApplyToCampaign}
                  className="flex-1"
                >
                  こ의캠페인에지원하기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModal(false)}
                >
                  閉じ
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
