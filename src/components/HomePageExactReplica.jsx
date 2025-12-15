// Homepage redesign v3.0 - Clean Professional SaaS Style
import React, { useState, useEffect } from 'react'
import cnecLogo from '../assets/cnec-logo-final.png'
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
      const now = new Date()
      const activeCampaigns = campaignsData?.filter(campaign => {
        // status가 active이어야 함
        if (campaign.status !== 'active') return false
        
        // approval_status가 pending_approval이 아니어야 함 (승인 대기 중 캠페인 숨김)
        if (campaign.approval_status === 'pending_approval') return false
        
        // 모집 마감일이 지나지 않았어야 함
        if (campaign.application_deadline) {
          const deadline = new Date(campaign.application_deadline)
          deadline.setHours(23, 59, 59, 999) // 마감일 맹까지 허용
          if (now > deadline) return false
        }
        
        // 남은 슬롯이 0보다 커야 함
        if (campaign.remaining_slots !== undefined && campaign.remaining_slots !== null) {
          if (campaign.remaining_slots <= 0) return false
        }
        
        return true
      }) || []
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
        rewards: allCampaigns.reduce((sum, campaign) => sum + (campaign.reward_points || campaign.reward_amount || 0), 0)
      })
      
      setStats({
        totalCampaigns: allCampaigns.length,
        totalCreators: users.length,
        totalApplications: applications.length,
        totalRewards: allCampaigns.reduce((sum, campaign) => sum + (campaign.reward_points || campaign.reward_amount || 0), 0)
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
      {/* Header - 인디고 컬러 시스템 적용 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link to="/" className="flex items-center">
              <img src={cnecLogo} alt="CNEC Korea" className="h-10" />
            </Link>

            {/* 데스크톱 네비게이션 - 중앙 배치 */}
            <nav className="hidden md:flex items-center gap-2">
              <a href="#campaigns" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                캠페인
              </a>
              <a href="#about" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                서비스 소개
              </a>
              <a href="https://www.youtube.com/@bizcnec" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                포트폴리오
              </a>
              <a href="#guide" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                참가방법
              </a>
            </nav>

            {/* 우측 버튼 영역 */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/mypage" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all">
                    마이페이지
                  </Link>
                  <button
                    onClick={signOut}
                    className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all">
                    로그인
                  </Link>
                  <Link to="/signup" className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all">
                    회원가입
                  </Link>
                </>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* 모바일 메뉴 */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 bg-white">
              <div className="flex flex-col space-y-1">
                <a href="#campaigns" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  캠페인
                </a>
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  서비스 소개
                </a>
                <a href="https://www.youtube.com/@bizcnec" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  포트폴리오
                </a>
                <a href="#guide" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  참가방법
                </a>
                <div className="pt-4 mt-4 border-t border-gray-100 flex flex-col space-y-2">
                  {user ? (
                    <>
                      <Link to="/mypage" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-center">
                        마이페이지
                      </Link>
                      <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="px-4 py-3 text-base font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-center">
                        로그인
                      </Link>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all text-center">
                        회원가입
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Clean Professional Style */}
      <section className="relative py-12 md:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* 좌측: 텍스트 콘텐츠 */}
            <div className="text-center lg:text-left">
              {/* 메인 타이틀 */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 md:mb-6 leading-tight text-gray-900">
                K-뷰티 브랜드와 함께<br />
                <span className="text-indigo-600">크리에이터</span>로 성장하세요
              </h1>

              {/* 서브 타이틀 */}
              <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                데이터 기반 AI 매칭으로 최적의 브랜드와 연결됩니다.<br className="hidden sm:block" />
                초보도 OK, 체계적인 교육과 지원을 받으세요.
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm md:text-base px-8 py-6 rounded-lg"
                  asChild
                >
                  <a href="#campaigns" className="flex items-center justify-center gap-2">
                    캠페인 둘러보기
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium text-sm md:text-base px-8 py-6 rounded-lg"
                  asChild
                >
                  <Link to="/signup">
                    무료로 시작하기
                  </Link>
                </Button>
              </div>

              {/* 신뢰 지표 */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <span>100+ 브랜드 파트너</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <span>5,000+ 크리에이터</span>
                </div>
              </div>
            </div>

            {/* 우측: 비주얼 */}
            <div className="relative mt-6 lg:mt-0">
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/GDwYeELp0aQ"
                    title="CNEC Korea 소개 영상"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section - Clean Professional Style */}
      <section id="campaigns" className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              현재 모집 중인 캠페인
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              브랜드와 함께 콘텐츠를 제작하고 보상을 받으세요
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex justify-start md:justify-center mb-6 md:mb-10 gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedCategory('planned')}
              className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'planned'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              기획형
            </button>
            <button
              onClick={() => setSelectedCategory('oliveyoung')}
              className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'oliveyoung'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              올영세일
            </button>
            <button
              onClick={() => setSelectedCategory('4week_challenge')}
              className={`flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === '4week_challenge'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              4주 챌린지
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 md:py-16">
              <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500 text-sm md:text-base">캠페인을 불러오는 중...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 md:w-8 md:h-8 text-gray-400" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">
                현재 모집 중인 캠페인이 없습니다
              </h3>
              <p className="text-gray-500 text-sm md:text-base">새로운 캠페인이 시작될 때까지 기다려주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
              {campaigns
                .filter(campaign => {
                  if (selectedCategory === 'all') return true
                  if (selectedCategory === 'planned') {
                    return campaign.campaign_type === 'planned'
                  }
                  if (selectedCategory === 'oliveyoung') {
                    return campaign.campaign_type === 'oliveyoung'
                  }
                  if (selectedCategory === '4week_challenge') {
                    return campaign.campaign_type === '4week_challenge'
                  }
                  return false
                })
                .map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  {/* 썸네일 */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Target className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {/* 상태 배지 */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-md">
                      모집중
                    </span>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="p-4 md:p-5">
                    {/* 브랜드 */}
                    <p className="text-xs text-gray-500 mb-1">{campaign.brand}</p>

                    {/* 제목 */}
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">
                      {campaign.title}
                    </h3>

                    {/* 플랫폼 & 마감일 */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        {(() => {
                          if (Array.isArray(campaign.target_platforms)) {
                            return campaign.target_platforms.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1))
                          }
                          return ['Instagram']
                        })().map((platform) => (
                          <span key={platform} className={`px-2 py-0.5 rounded text-xs ${getPlatformColor(platform)}`}>
                            {platform}
                          </span>
                        ))}
                      </div>
                      {campaign.application_deadline && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{new Date(campaign.application_deadline).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 마감</span>
                        </>
                      )}
                    </div>

                    {/* 하단: 보상 & CTA */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-lg font-bold text-indigo-600">
                        {formatCurrency(campaign.creator_points_override || campaign.reward_points || campaign.reward_amount || 0)}
                      </span>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        지원하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section - 캠페인 타입 소개 (Pricing Card Style) */}
      <section id="about" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              뷰티 크리에이터를 위한 3가지 캠페인
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              데이터 기반 AI 매칭으로 성과를 만들어드립니다.
            </p>
          </div>

          {/* 3개 캠페인 타입 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {/* 카드 1: 올영세일 패키지 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-7 hover:border-indigo-300 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">올영세일 패키지</h3>
              <div className="mb-4">
                <span className="text-3xl md:text-4xl font-bold text-indigo-600">₩400,000</span>
                <span className="text-gray-500 text-sm">/건</span>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                세일 기간 집중 트래픽과 구매 전환을 유도하는 실속형 패키지
              </p>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors mb-6"
              >
                선택하기
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  3단계 콘텐츠 (리뷰→홍보→당일)
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  구매 전환 유도형 기획
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  SNS 업로드 URL 3개
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  원본 영상 파일 제공
                </li>
              </ul>
            </div>

            {/* 카드 2: 기획형 캠페인 (인기) */}
            <div className="relative bg-white border-2 border-indigo-500 rounded-xl p-6 md:p-7 shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                인기
              </span>
              <h3 className="text-lg font-semibold text-indigo-600 mb-3">기획형 캠페인</h3>
              <div className="mb-4">
                <span className="text-3xl md:text-4xl font-bold text-indigo-600">₩200,000</span>
                <span className="text-gray-500 text-sm">/건</span>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                합리적인 비용으로 전문적인 숏폼 기획을 시작하고 싶은 브랜드
              </p>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-6"
              >
                선택하기
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  브랜드 맞춤 시나리오 기획
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  촬영 가이드라인 제공
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  AI 크리에이터 매칭
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  SNS 업로드 URL 1개
                </li>
              </ul>
            </div>

            {/* 카드 3: 4주 챌린지 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-7 hover:border-indigo-300 hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4주 챌린지</h3>
              <div className="mb-4">
                <span className="text-3xl md:text-4xl font-bold text-indigo-600">₩600,000</span>
                <span className="text-gray-500 text-sm">/건</span>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                진정성 있는 리뷰와 장기적인 바이럴 효과를 위한 프리미엄 플랜
              </p>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors mb-6"
              >
                선택하기
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  주차별 미션 (총 4편 제작)
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  Before & After 변화 기록
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  SNS 업로드 URL 4개
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  2차 활용 및 파트너코드
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 크리에이터 성장 프로그램 섹션 - Clean Style */}
      <section id="growth-programs" className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              크리에이터 성장 프로그램
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              단계별로 성장하며 더 많은 혜택을 받으세요
            </p>
          </div>

          {/* 성장 단계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto mb-10">
            {/* STEP 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-sm text-gray-500">누구나 시작</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">기획형 캠페인</h3>
              <p className="text-sm text-gray-500 mb-5">
                가입 후 바로 참여 가능한 캠페인
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  제품 제공 + 포인트 지급
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  팔로워 제한 없음
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  초보자 친화적
                </li>
              </ul>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                캠페인 보기
              </button>
            </div>

            {/* STEP 2 - Featured */}
            <div className="relative bg-white border-2 border-indigo-500 rounded-xl p-6 shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                실적으로 승격
              </span>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-sm text-indigo-600 font-medium">추천</span>
              </div>
              <h3 className="text-lg font-semibold text-indigo-600 mb-2">숏폼 크리에이터</h3>
              <p className="text-sm text-gray-500 mb-5">
                활동 실적으로 승격되는 프로그램
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <strong>20~50% 추가 보상</strong>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  캠페인 우선 배정
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  전담 매니저 배정
                </li>
              </ul>
              <button
                onClick={() => navigate('/cnec-plus')}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                승격 조건 보기
              </button>
            </div>

            {/* STEP 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-sm text-gray-500">프리미엄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">유튜브 육성</h3>
              <p className="text-sm text-gray-500 mb-5">
                뷰티 유튜버를 위한 최고 프로그램
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <strong>100만P 지원</strong>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  1:1 전문 멘토링
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  제품비 100% 지원
                </li>
              </ul>
              <button
                onClick={() => navigate('/cnec-plus')}
                className="w-full py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                자세히 알아보기
              </button>
            </div>
          </div>

          {/* CTA 배너 */}
          <div className="bg-indigo-600 rounded-xl p-6 md:p-8 max-w-3xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              5회 캠페인 참여로 숏폼 크리에이터 승격
            </h3>
            <p className="text-indigo-100 text-sm md:text-base mb-6">
              지금 시작해서 더 많은 혜택을 받으세요
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-white text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* Portfolio Section - 모바일 최적화 */}
      <section id="portfolio" className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold tracking-wide mb-3 md:mb-4">
              PORTFOLIO
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">CNEC 포트폴리오</h2>
            <p className="text-gray-500 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4">
              지금까지의 캠페인 실적과 성공사례를 확인해보세요
            </p>
          </div>

          {/* YouTube 카드 */}
          <div className="max-w-4xl mx-auto mb-8 md:mb-12">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-5 md:p-8 lg:p-10">
              {/* 헤더 */}
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Youtube className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">CNEC Korea</h3>
                  <p className="text-red-600 text-xs md:text-sm font-medium">YouTube 채널</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">
                실제 캠페인 영상과 성공사례, 크리에이터 인터뷰 등<br className="hidden sm:block" />
                CNEC의 매력적인 콘텐츠를 YouTube에서 만나보세요
              </p>

              {/* 콘텐츠 탭 */}
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg md:rounded-xl p-3 md:p-4 text-left">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 mb-0.5 md:mb-1">캠페인 실적</p>
                  <p className="text-xs text-gray-500 hidden sm:block">성공 사례 영상</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl p-3 md:p-4 text-left">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 mb-0.5 md:mb-1">크리에이터</p>
                  <p className="text-xs text-gray-500 hidden sm:block">인터뷰 영상</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl p-3 md:p-4 text-left">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 mb-0.5 md:mb-1">브랜드 소개</p>
                  <p className="text-xs text-gray-500 hidden sm:block">상품 리뷰</p>
                </div>
              </div>

              <button
                onClick={() => window.open('https://www.youtube.com/@bizcnec', '_blank')}
                className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-red-600 text-white text-sm md:text-base font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                포트폴리오 보기
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-6 md:gap-12 lg:gap-20">
            <div className="text-center">
              <span className="block text-2xl md:text-4xl lg:text-5xl font-bold text-indigo-600 mb-1 md:mb-2">500+</span>
              <span className="text-xs md:text-sm text-gray-500">성공 캠페인</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-4xl lg:text-5xl font-bold text-indigo-600 mb-1 md:mb-2">5,000+</span>
              <span className="text-xs md:text-sm text-gray-500">참가 크리에이터</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-4xl lg:text-5xl font-bold text-indigo-600 mb-1 md:mb-2">50M+</span>
              <span className="text-xs md:text-sm text-gray-500">총 재생 횟수</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl md:text-4xl lg:text-5xl font-bold text-indigo-600 mb-1 md:mb-2">98%</span>
              <span className="text-xs md:text-sm text-gray-500">만족도</span>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section - 모바일 최적화 */}
      <section id="guide" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold tracking-wide mb-3 md:mb-4">
              HOW TO JOIN
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">CNEC 캠페인 참가방법</h2>
            <p className="text-gray-500 text-sm md:text-base lg:text-lg">
              간단 6단계로 캠페인에 참가할 수 있습니다
            </p>
          </div>

          {/* 6단계 그리드 */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 max-w-6xl mx-auto mb-8 md:mb-12">
            {[
              { step: 1, title: '회원 등록', description: 'Google 계정으로 간단 등록', icon: <User className="h-5 w-5 md:h-7 md:w-7" /> },
              { step: 2, title: '프로필 완성', description: 'SNS 계정과 상세정보 등록', icon: <Star className="h-5 w-5 md:h-7 md:w-7" /> },
              { step: 3, title: '캠페인 응모', description: '관심있는 캠페인에 응모', icon: <Target className="h-5 w-5 md:h-7 md:w-7" /> },
              { step: 4, title: '심사 · 확정', description: '브랜드 심사 후 참가 확정', icon: <CheckCircle className="h-5 w-5 md:h-7 md:w-7" /> },
              { step: 5, title: '콘텐츠 제작', description: '가이드라인에 따라 영상 제작', icon: <Play className="h-5 w-5 md:h-7 md:w-7" /> },
              { step: 6, title: '보상 받기', description: '포인트 획득 후 계좌로 송금', icon: <DollarSign className="h-5 w-5 md:h-7 md:w-7" /> }
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                {/* 화살표 연결선 (마지막 제외) */}
                {index < 5 && (
                  <div className="hidden lg:block absolute top-10 -right-3 text-gray-300 text-xl">→</div>
                )}
                <div className="text-xs font-semibold text-indigo-600 mb-2 md:mb-3">{item.step}</div>
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <div className="text-indigo-600">{item.icon}</div>
                </div>
                <h4 className="text-xs md:text-sm lg:text-base font-semibold text-gray-900 mb-0.5 md:mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed hidden sm:block">{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm md:text-base px-8 md:px-10 py-4 md:py-6 rounded-xl"
              asChild
            >
              <Link to="/signup">
                지금 시작하기
              </Link>
            </Button>
          </div>
        </div>
      </section>


      {/* FAQ Section - 모바일 최적화 */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10 max-w-4xl">
          {/* 섹션 헤더 */}
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-semibold tracking-wide mb-3 md:mb-4">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">자주 묻는 질문</h2>
            <p className="text-gray-500 text-sm md:text-base lg:text-lg px-4">
              크리에이터들이 가장 궁금해하는 질문들을 모았습니다
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            {[
              { question: '크넥(CNEC)은 어떤 플랫폼인가요?', answer: '크넥은 한국 화장품 브랜드와 크리에이터를 연결하는 인플루언서 마케팅 플랫폼입니다. 집에서 부업으로 숏폼 영상을 제작하고 포인트를 받을 수 있습니다.' },
              { question: '캠페인에 어떻게 참여하나요?', answer: '1) 회원가입 및 프로필 완성 → 2) 관심 있는 캠페인 선택 → 3) 지원서 작성 → 4) 브랜드 심사 → 5) 선정 시 제품 수령 → 6) 콘텐츠 제작 및 업로드 → 7) 포인트 지급' },
              { question: '포인트는 언제 지급되나요?', answer: '캠페인 완료 후 브랜드 승인이 완료되면 즉시 포인트가 지급됩니다. 일반적으로 콘텐츠 업로드 후 3-7일 이내에 지급됩니다.' },
              { question: '포인트는 어떻게 출금하나요?', answer: '마이페이지에서 출금 신청을 할 수 있습니다. 10만 포인트(10만원) 이상부터 출금 가능하며, 은행 계좌 정보와 주민등록번호를 입력하면 됩니다.' },
              { question: '출금은 얼마나 걸리나요?', answer: '출금 신청 후 영업일 기준 3-5일 이내에 등록하신 은행 계좌로 입금됩니다.' },
              { question: '캠페인 선정 기준은 무엇인가요?', answer: 'SNS 팔로워 수, 콘텐츠 품질, 과거 캠페인 참여 이력, 브랜드와의 적합성 등을 종합적으로 고려합니다. 팔로워가 적어도 양질의 콘텐츠를 제작하면 선정될 수 있습니다.' },
              { question: '여러 캠페인에 동시에 참여할 수 있나요?', answer: '네, 가능합니다. 단, 각 캠페인의 마감일을 준수하고 양질의 콘텐츠를 제작할 수 있는 범위 내에서 참여해주세요.' },
              { question: '개인정보는 안전하게 보관되나요?', answer: '네, 주민등록번호 등 민감한 정보는 암호화되어 저장되며, 관리자도 원본을 볼 수 없습니다. 개인정보보호법에 따라 안전하게 관리됩니다.' }
            ].map((faq, index) => (
              <details key={index} className="group bg-white border border-gray-200 rounded-lg md:rounded-xl overflow-hidden">
                <summary className="flex justify-between items-center p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-sm md:text-base text-gray-900 pr-4">Q. {faq.question}</span>
                  <span className="text-indigo-600 text-lg md:text-xl group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                </summary>
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100 pt-3 md:pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <p className="text-gray-500 text-sm md:text-base mb-3 md:mb-4">더 궁금한 점이 있으신가요?</p>
            <button
              onClick={() => window.open('https://pf.kakao.com/_TjhGG', '_blank')}
              className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-amber-400 text-gray-900 text-sm md:text-base font-semibold rounded-xl hover:bg-amber-500 transition-colors"
            >
              💬 카카오톡 채널 문의하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer - 모바일 최적화 */}
      <footer className="bg-slate-900 text-white py-10 md:py-16">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <img src={cnecLogo} alt="CNEC Korea" className="h-7 md:h-8 brightness-0 invert" />
              </div>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                K-뷰티 브랜드와 크리에이터를 연결하는<br />전문 파트너십 플랫폼
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">서비스</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-400">
                <li><a href="#campaigns" className="hover:text-white transition-colors">캠페인</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">서비스 소개</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">포트폴리오</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">지원</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-400">
                <li><a href="#guide" className="hover:text-white transition-colors">참가방법</a></li>
                <li><a href="#" className="hover:text-white transition-colors">자주 묻는 질문</a></li>
                <li><a href="https://pf.kakao.com/_TjhGG" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">문의하기</a></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="font-semibold text-white text-sm md:text-base mb-3 md:mb-4">문의</h4>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>mkt@howlab.co.kr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 md:mt-12 pt-6 md:pt-8 text-xs md:text-sm text-slate-500 text-center">
            <p>대표자: 박철용 | 사업: 하우랩마케팅회사 | © 2024 CNEC Korea. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Campaign Detail Modal */}
      <Dialog open={detailModal} onOpenChange={setDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto pb-24">
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
                <p className="text-gray-600 whitespace-pre-wrap">{selectedCampaign.description || selectedCampaign.product_features || '캠페인 설명이 없습니다.'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">지원 가능 플랫폼</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // target_platforms가 배열인 경우
                    if (Array.isArray(selectedCampaign.target_platforms)) {
                      return selectedCampaign.target_platforms.map(p => {
                        return p.charAt(0).toUpperCase() + p.slice(1)
                      })
                    }
                    // target_platforms가 객체인 경우 (레거시 지원)
                    if (selectedCampaign.target_platforms && typeof selectedCampaign.target_platforms === 'object') {
                      const platforms = []
                      if (selectedCampaign.target_platforms.instagram) platforms.push('Instagram')
                      if (selectedCampaign.target_platforms.youtube) platforms.push('YouTube')
                      if (selectedCampaign.target_platforms.tiktok) platforms.push('TikTok')
                      return platforms.length > 0 ? platforms : ['Instagram']
                    }
                    // target_platforms가 null이면 제목에서 추출
                    const title = (selectedCampaign.title || selectedCampaign.campaign_name || '').toLowerCase()
                    const platforms = []
                    if (title.includes('유튜브') || title.includes('youtube')) platforms.push('YouTube')
                    if (title.includes('인스타') || title.includes('instagram')) platforms.push('Instagram')
                    if (title.includes('틱톡') || title.includes('tiktok')) platforms.push('TikTok')
                    return platforms.length > 0 ? platforms : ['Instagram']
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
              
              {/* 참여조건 */}
              {(selectedCampaign.min_followers || selectedCampaign.min_subscribers || selectedCampaign.recruitment_count) && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">📋 참여조건</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {selectedCampaign.min_followers && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>최소 팔로워: <strong>{selectedCampaign.min_followers.toLocaleString()}명</strong></span>
                      </div>
                    )}
                    {selectedCampaign.min_subscribers && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>최소 구독자: <strong>{selectedCampaign.min_subscribers.toLocaleString()}명</strong></span>
                      </div>
                    )}
                    {selectedCampaign.recruitment_count && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>모집 인원: <strong>{selectedCampaign.recruitment_count}명</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 일정 및 요구사항 */}
              {(selectedCampaign.application_start_date || selectedCampaign.application_end_date || selectedCampaign.content_submission_deadline || selectedCampaign.requirements) && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">📅 일정 및 요구사항</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {selectedCampaign.application_start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>지원 시작: <strong>{new Date(selectedCampaign.application_start_date).toLocaleDateString('ko-KR')}</strong></span>
                      </div>
                    )}
                    {selectedCampaign.application_end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>지원 마감: <strong>{new Date(selectedCampaign.application_end_date).toLocaleDateString('ko-KR')}</strong></span>
                      </div>
                    )}
                    {/* 콘텐츠 제출 마감: 캠페인 타입별로 다르게 표시 */}
                    {selectedCampaign.campaign_type === '4week_challenge' ? (
                      <div>
                        <div className="font-medium text-gray-800 mb-2">콘텐츠 제출 마감 (4주 챌린지):</div>
                        <div className="space-y-1 ml-6">
                          {selectedCampaign.week1_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>1주차: <strong>{new Date(selectedCampaign.week1_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                          {selectedCampaign.week2_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>2주차: <strong>{new Date(selectedCampaign.week2_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                          {selectedCampaign.week3_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>3주차: <strong>{new Date(selectedCampaign.week3_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                          {selectedCampaign.week4_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>4주차: <strong>{new Date(selectedCampaign.week4_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedCampaign.campaign_type === 'oliveyoung' ? (
                      <div>
                        <div className="font-medium text-gray-800 mb-2">콘텐츠 제출 마감 (올영세일):</div>
                        <div className="space-y-1 ml-6">
                          {selectedCampaign.step1_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>STEP 1: <strong>{new Date(selectedCampaign.step1_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                          {selectedCampaign.step2_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>STEP 2: <strong>{new Date(selectedCampaign.step2_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                          {selectedCampaign.step3_deadline && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>STEP 3: <strong>{new Date(selectedCampaign.step3_deadline).toLocaleDateString('ko-KR')}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedCampaign.content_submission_deadline ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>콘텐츠 제출 마감: <strong>{new Date(selectedCampaign.content_submission_deadline).toLocaleDateString('ko-KR')}</strong></span>
                      </div>
                    ) : null}
                    {selectedCampaign.requirements && (
                      <div className="mt-3">
                        <div className="font-medium text-gray-800 mb-1">지원 요구사항:</div>
                        <p className="text-gray-600 whitespace-pre-wrap">{selectedCampaign.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 보상 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎁 보상</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(selectedCampaign.creator_points_override || selectedCampaign.reward_points || selectedCampaign.reward_amount || 0)}
                </p>
              </div>
              
              {/* 추가 정보 */}
              {(selectedCampaign.deadline || selectedCampaign.campaign_type) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">📌 추가 정보</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {selectedCampaign.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span>마감일: <strong>{new Date(selectedCampaign.deadline).toLocaleDateString('ko-KR')}</strong></span>
                      </div>
                    )}
                    {selectedCampaign.campaign_type && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gray-600" />
                        <span>캠페인 타입: <strong>{selectedCampaign.campaign_type === '4week_challenge' ? '4주 챌린지' : selectedCampaign.is_oliveyoung_sale ? '올영 캠페인' : '기획형 캠페인'}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleApplyToCampaign}
                  className="flex-1"
                >
                  이 캠페인에 지원하기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModal(false)}
                >
                  닫기
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
