// Homepage redesign with indigo color system - v1.1
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

      {/* Hero Section - 리디자인 */}
      <section className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 좌측: 텍스트 콘텐츠 */}
            <div className="text-left">
              {/* 뱃지 */}
              <span className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-indigo-600 shadow-sm mb-6">
                🎯 매달 100개+ 브랜드 캠페인
              </span>

              {/* 메인 타이틀 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
                뷰티 콘텐츠로
                <br />
                <span className="text-indigo-600">수익을 만드세요</span>
              </h1>

              {/* 서브 타이틀 */}
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl">
                K-뷰티 브랜드 캠페인에 참여하고,<br />
                콘텐츠 하나로 최대 100만원까지 보상받으세요
              </p>

              {/* CTA 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-base px-8 py-6 rounded-xl shadow-lg shadow-indigo-200"
                >
                  <a href="#campaigns" className="flex items-center gap-2">
                    지금 캠페인 보기
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 font-semibold text-base px-8 py-6 rounded-xl"
                  asChild
                >
                  <Link to="/signup">
                    크리에이터 등록하기
                  </Link>
                </Button>
              </div>

              {/* 신뢰 지표 */}
              <div className="flex flex-wrap gap-8 lg:gap-12">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-indigo-600">5,000+</span>
                  <span className="text-sm text-gray-500">활동 크리에이터</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-indigo-600">500+</span>
                  <span className="text-sm text-gray-500">완료 캠페인</span>
                </div>
                <div className="text-center">
                  <span className="block text-3xl font-bold text-indigo-600">98%</span>
                  <span className="text-sm text-gray-500">만족도</span>
                </div>
              </div>
            </div>

            {/* 우측: 비주얼 - 캠페인 카드 미리보기 */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-30"></div>

              {/* 메인 영상 또는 이미지 */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
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

              {/* 플로팅 배지 */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">포인트 즉시 지급</p>
                    <p className="text-xs text-gray-500">캠페인 완료 시</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* About Section - 혜택 섹션 리뉴얼 */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              WHY CNEC
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">CNEC에서만 가능한 혜택</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              초보부터 전문 크리에이터까지, 단계별 성장을 지원합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* 카드 1: 체계적인 교육 */}
            <div className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">체계적인 교육</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                초보도 전문가로 성장할 수 있는 1:1 멘토링과 교육 프로그램
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  콘텐츠 제작 교육
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  1:1 멘토링
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  성공 사례 공유
                </li>
              </ul>
            </div>

            {/* 카드 2: 브랜드 파트너십 */}
            <div className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">브랜드 파트너십</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                100개 이상의 K-뷰티 브랜드와 직접 협업 기회
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  브랜드 직접 매칭
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  장기 계약 기회
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  독점 캠페인 참여
                </li>
              </ul>
            </div>

            {/* 카드 3: 성장 지원 */}
            <div className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">성장 지원</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                유튜브 채널 육성부터 숏폼 크리에이터까지 단계별 성장 지원
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  유튜브 육성 프로그램
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  숏폼 크리에이터 혜택
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  포인트 추가 지급
                </li>
              </ul>
            </div>

            {/* 카드 4: 숏폼 전문 */}
            <div className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-200">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">숏폼 전문</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                TikTok, Instagram Reels, YouTube Shorts 최적화 콘텐츠 지원
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  숏폼 트렌드 분석
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  편집 가이드 제공
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  바이럴 전략 공유
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              CAMPAIGNS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">현재 모집 중인 캠페인</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              K-뷰티 브랜드의 최신 캠페인에 참가하고 수익을 만드세요
            </p>
          </div>

          {/* 필터 탭 - 통일된 인디고 스타일 */}
          <div className="flex justify-center mb-10 flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              전체 캠페인
            </button>
            <button
              onClick={() => setSelectedCategory('planned')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === 'planned'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              📹 기획형
            </button>
            <button
              onClick={() => setSelectedCategory('oliveyoung')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === 'oliveyoung'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              📸 올영
            </button>
            <button
              onClick={() => setSelectedCategory('4week_challenge')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === '4week_challenge'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              🏆 4주 챌린지
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">캠페인을 불러오는 중...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                현재 모집 중인 캠페인이 없습니다
              </h3>
              <p className="text-gray-500">새로운 캠페인이 시작될 때까지 기다려주세요.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {campaigns
                .filter(campaign => {
                  if (selectedCategory === 'all') return true
                  // campaign_type으로 필터링
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
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-200"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  {/* 썸네일 */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                        <Target className="w-12 h-12 text-indigo-300" />
                      </div>
                    )}
                    {/* 상태 배지 */}
                    <span className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md">
                      모집 중
                    </span>
                    {/* 타입 배지 */}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 text-indigo-600 text-xs font-medium rounded-md backdrop-blur-sm">
                      {campaign.campaign_type === '4week_challenge' ? '4주 챌린지' : campaign.is_oliveyoung_sale ? '올영' : '기획형'}
                    </span>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="p-5">
                    {/* 브랜드 & 제목 */}
                    <p className="text-xs text-gray-500 mb-1">{campaign.brand}</p>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">
                      {campaign.title}
                    </h3>

                    {/* 플랫폼 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(() => {
                        if (Array.isArray(campaign.target_platforms)) {
                          return campaign.target_platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1))
                        }
                        if (campaign.target_platforms && typeof campaign.target_platforms === 'object') {
                          const platforms = []
                          if (campaign.target_platforms.instagram) platforms.push('Instagram')
                          if (campaign.target_platforms.youtube) platforms.push('YouTube')
                          if (campaign.target_platforms.tiktok) platforms.push('TikTok')
                          return platforms.length > 0 ? platforms : ['Instagram']
                        }
                        return ['Instagram']
                      })().map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {getPlatformIcon(platform)}
                          <span>{platform}</span>
                        </span>
                      ))}
                    </div>

                    {/* 일정 (1줄로 간결하게) */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      {campaign.application_deadline && (
                        <>
                          <span>마감 {new Date(campaign.application_deadline).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                          {campaign.start_date && <span className="text-gray-300">│</span>}
                        </>
                      )}
                      {campaign.start_date && (
                        <span>촬영 {new Date(campaign.start_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                      )}
                      {campaign.end_date && (
                        <>
                          <span className="text-gray-300">│</span>
                          <span>업로드 {new Date(campaign.end_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                        </>
                      )}
                    </div>

                    {/* 하단: 보상 & 버튼 */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-indigo-600">
                          {formatCurrency(campaign.creator_points_override || campaign.reward_points || campaign.reward_amount || 0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">보상</span>
                      </div>
                      <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                        자세히 보기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 크리에이터 성장 프로그램 섹션 */}
      <section id="growth-programs" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              GROWTH PATH
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">크리에이터 성장 프로그램</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              단계별 성장 경로를 통해 초보부터 전문 크리에이터까지
            </p>
          </div>

          {/* 단계별 카드 - 화살표 연결 */}
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-0 max-w-6xl mx-auto mb-16">
            {/* STEP 1 - 기획형 캠페인 */}
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <span className="inline-block text-xs font-semibold text-indigo-600 mb-4">STEP 1</span>
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">기획형 캠페인</h3>
              <p className="text-sm text-gray-500 mb-6">누구나 시작할 수 있어요</p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  가입 후 바로 참여 가능
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  다양한 브랜드 캠페인
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  제품 제공 + 포인트 지급
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  경험 쌓으며 성장
                </li>
              </ul>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="w-full py-3 border border-indigo-600 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-colors"
              >
                캠페인 보기
              </button>
            </div>

            {/* 화살표 1 */}
            <div className="hidden lg:flex items-center justify-center px-4">
              <ArrowRight className="w-8 h-8 text-gray-300" />
            </div>

            {/* STEP 2 - 숏폼 크리에이터 (Featured) */}
            <div className="flex-1 relative bg-white border-2 border-indigo-400 rounded-2xl p-8 text-center shadow-lg shadow-indigo-100 hover:-translate-y-1 transition-all duration-200">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                실적으로 승격
              </span>
              <span className="inline-block text-xs font-semibold text-indigo-600 mb-4">STEP 2</span>
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Star className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-indigo-600 mb-2">숏폼 크리에이터</h3>
              <p className="text-sm text-gray-500 mb-6">활동 실적으로 승격</p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  <strong>20~50% 추가 보상</strong>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  캠페인 우선 배정
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  브랜드 협업 기회
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-indigo-600 font-semibold">✓</span>
                  전담 매니저 배정
                </li>
              </ul>
              <button
                onClick={() => navigate('/cnec-plus')}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                상세 보기
              </button>
            </div>

            {/* 화살표 2 */}
            <div className="hidden lg:flex items-center justify-center px-4">
              <ArrowRight className="w-8 h-8 text-gray-300" />
            </div>

            {/* STEP 3 - 유튜브 육성 */}
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <span className="inline-block text-xs font-semibold text-amber-600 mb-4">STEP 3</span>
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">유튜브 육성</h3>
              <p className="text-sm text-gray-500 mb-6">최고 등급 프로그램</p>
              <ul className="space-y-3 text-left mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-amber-600 font-semibold">✓</span>
                  <strong>100만P 지원</strong>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-amber-600 font-semibold">✓</span>
                  제품비 100% 지원
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-amber-600 font-semibold">✓</span>
                  1:1 멘토링 + 교육
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-amber-600 font-semibold">✓</span>
                  채널 성장 전략 지원
                </li>
              </ul>
              <button
                onClick={() => navigate('/cnec-plus')}
                className="w-full py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
              >
                상세 보기
              </button>
            </div>
          </div>

          {/* CTA 섹션 */}
          <div className="bg-indigo-600 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">지금 바로 CNEC Plus에 도전하세요!</h3>
            <p className="text-indigo-100 mb-8">
              기획형 캠페인 5회 이상 참여 시 숏폼 크리에이터로 승격 가능합니다.<br />
              뷰티 전문 유튜버를 꿈꾼다면 유튜브 육성 프로그램에 지원하세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/cnec-plus')}
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
              >
                CNEC Plus 상세보기
              </button>
              <button
                onClick={() => { window.location.href = '#campaigns'; }}
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                기획형 캠페인 보기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section - 리뉴얼 */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              PORTFOLIO
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">CNEC 포트폴리오</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              지금까지의 캠페인 실적과 성공사례를 확인해보세요
            </p>
          </div>

          {/* YouTube 카드 */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
              {/* 헤더 */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">CNEC Korea</h3>
                  <p className="text-red-600 text-sm font-medium">YouTube 채널</p>
                </div>
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">
                실제 캠페인 영상과 성공사례, 크리에이터 인터뷰 등<br />
                CNEC의 매력적인 콘텐츠를 YouTube에서 만나보세요
              </p>

              {/* 콘텐츠 탭 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-gray-900 mb-1">캠페인 실적</p>
                  <p className="text-xs text-gray-500">성공 사례 영상</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-gray-900 mb-1">크리에이터 소개</p>
                  <p className="text-xs text-gray-500">인터뷰 영상</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-gray-900 mb-1">브랜드 소개</p>
                  <p className="text-xs text-gray-500">상품 리뷰</p>
                </div>
              </div>

              <button
                onClick={() => window.open('https://www.youtube.com/@bizcnec', '_blank')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                포트폴리오 보기
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            <div className="text-center">
              <span className="block text-4xl md:text-5xl font-bold text-indigo-600 mb-2">500+</span>
              <span className="text-sm text-gray-500">성공 캠페인</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl md:text-5xl font-bold text-indigo-600 mb-2">5,000+</span>
              <span className="text-sm text-gray-500">참가 크리에이터</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl md:text-5xl font-bold text-indigo-600 mb-2">50M+</span>
              <span className="text-sm text-gray-500">총 재생 횟수</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl md:text-5xl font-bold text-indigo-600 mb-2">98%</span>
              <span className="text-sm text-gray-500">만족도</span>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section - 6단계 리뉴얼 */}
      <section id="guide" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              HOW TO JOIN
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">CNEC 캠페인 참가방법</h2>
            <p className="text-gray-500 text-lg">
              간단 6단계로 캠페인에 참가할 수 있습니다
            </p>
          </div>

          {/* 6단계 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto mb-12">
            {[
              { step: 1, title: '회원 등록', description: 'Google 계정으로 간단 등록', icon: <User className="h-7 w-7" /> },
              { step: 2, title: '프로필 완성', description: 'SNS 계정과 상세정보 등록', icon: <Star className="h-7 w-7" /> },
              { step: 3, title: '캠페인 응모', description: '관심있는 캠페인에 응모', icon: <Target className="h-7 w-7" /> },
              { step: 4, title: '심사 · 확정', description: '브랜드 심사 후 참가 확정', icon: <CheckCircle className="h-7 w-7" /> },
              { step: 5, title: '콘텐츠 제작', description: '가이드라인에 따라 영상 제작', icon: <Play className="h-7 w-7" /> },
              { step: 6, title: '보상 받기', description: '포인트 획득 후 계좌로 송금', icon: <DollarSign className="h-7 w-7" /> }
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                {/* 화살표 연결선 (마지막 제외) */}
                {index < 5 && (
                  <div className="hidden lg:block absolute top-10 -right-3 text-gray-300 text-xl">→</div>
                )}
                <div className="text-xs font-semibold text-indigo-600 mb-3">{item.step}</div>
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-indigo-600">{item.icon}</div>
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-10 py-6 rounded-xl"
              asChild
            >
              <Link to="/signup">
                지금 시작하기
              </Link>
            </Button>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10 max-w-4xl">
          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
            <p className="text-gray-500 text-lg">
              크리에이터들이 가장 궁금해하는 질문들을 모았습니다
            </p>
          </div>

          <div className="space-y-3">
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
              <details key={index} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900">Q. {faq.question}</span>
                  <span className="text-indigo-600 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 mb-4">더 궁금한 점이 있으신가요?</p>
            <button
              onClick={() => window.open('https://pf.kakao.com/_TjhGG', '_blank')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-500 transition-colors"
            >
              💬 카카오톡 채널 문의하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 lg:px-10">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={cnecLogo} alt="CNEC Korea" className="h-8 brightness-0 invert" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                K-뷰티 브랜드와 크리에이터를 연결하는<br />전문 파트너십 플랫폼
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">서비스</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#campaigns" className="hover:text-white transition-colors">캠페인</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">서비스 소개</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">포트폴리오</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">지원</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#guide" className="hover:text-white transition-colors">참가방법</a></li>
                <li><a href="#" className="hover:text-white transition-colors">자주 묻는 질문</a></li>
                <li><a href="https://pf.kakao.com/_TjhGG" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">문의하기</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">문의</h4>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>mkt@howlab.co.kr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-sm text-slate-500 text-center">
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
