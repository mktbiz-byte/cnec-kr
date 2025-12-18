import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database } from '../../lib/supabase'
import cnecLogo from '../../assets/cnec-logo-final.png'
import {
  Star, DollarSign, Target, Users, Video,
  ChevronRight, Loader2, Gift, Sparkles,
  TrendingUp, Award, ArrowRight, CheckCircle2,
  Play, Zap
} from 'lucide-react'

const LandingPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      navigate('/creator')
    }
  }, [user, navigate])

  useEffect(() => {
    loadCampaigns()
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadCampaigns = async () => {
    try {
      const data = await database.campaigns.getAll()
      const now = new Date()
      const active = data?.filter(c => {
        if (c.status !== 'active') return false
        if (c.approval_status === 'pending_approval') return false
        if (c.application_deadline) {
          const deadline = new Date(c.application_deadline)
          if (now > deadline) return false
        }
        return true
      }) || []
      setCampaigns(active.slice(0, 3))
    } catch (error) {
      console.error('캠페인 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    if (amount >= 10000) return `${Math.floor(amount / 10000)}만원`
    return `${amount.toLocaleString()}원`
  }

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-green-500'
      case '4week_challenge': return 'bg-purple-500'
      case 'planned': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올영세일'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      default: return '일반'
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Immersive Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-md mx-auto px-5 flex justify-between items-center">
          <img
            src={cnecLogo}
            alt="CNEC"
            className={`h-6 transition-opacity ${scrolled ? 'opacity-100' : 'opacity-90'}`}
          />
          <Link
            to="/login"
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              scrolled
                ? 'bg-gray-900 text-white hover:bg-black'
                : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
            }`}
          >
            로그인
          </Link>
        </div>
      </header>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-[520px] bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Video className="absolute top-32 right-8 w-8 h-8 text-white/10 animate-float" />
          <Gift className="absolute top-48 left-12 w-6 h-6 text-white/10 animate-float-delayed" />
          <Star className="absolute bottom-40 right-16 w-10 h-10 text-white/10 animate-float" />
          <DollarSign className="absolute bottom-32 left-8 w-7 h-7 text-white/10 animate-float-delayed" />
        </div>

        <div className="relative z-10 max-w-md mx-auto px-5 pt-28 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="text-sm font-medium text-white/90">현재 12개 캠페인 모집중</span>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            브랜드와 함께<br />
            <span className="bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
              성장하는 크리에이터
            </span>
          </h1>

          <p className="text-base text-white/70 mb-8 leading-relaxed">
            CNEC에서 뷰티 브랜드와 협업하고<br />
            콘텐츠로 수익을 창출하세요
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-10">
            <Link
              to="/signup"
              className="flex-1 py-4 bg-white text-gray-900 text-center font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl shadow-black/20 flex items-center justify-center gap-2"
            >
              무료로 시작하기
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 text-white/60">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 size={14} className="text-green-400" />
              무료 가입
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 size={14} className="text-green-400" />
              빠른 정산
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 size={14} className="text-green-400" />
              AI 가이드
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      <div className="max-w-md mx-auto px-5 -mt-6 relative z-20">
        {/* Stats Cards - Floating Style */}
        <section className="mb-10">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Users, value: '500+', label: '크리에이터', color: 'purple' },
              { icon: Target, value: '1K+', label: '캠페인', color: 'green' },
              { icon: Award, value: '100+', label: '브랜드', color: 'blue' },
              { icon: DollarSign, value: '5억', label: '정산', color: 'amber' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-3 shadow-lg shadow-gray-100 border border-gray-100 text-center">
                <div className={`w-8 h-8 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon size={16} className={`text-${stat.color}-600`} />
                </div>
                <p className="text-lg font-black text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section - Visual Cards */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">크리에이터 혜택</h2>
            <span className="text-xs font-bold text-white bg-purple-600 px-2 py-1 rounded-md">PRO</span>
          </div>

          <div className="space-y-4">
            {/* Benefit Card 1 */}
            <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-5">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={80} className="text-green-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-2.5 rounded-xl shadow-lg shadow-green-200">
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 text-lg">확실한 수익</h3>
                    <p className="text-xs text-green-700/70">캠페인당 최대 100만원</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {['포인트 현금 전환', '빠른 정산 (D+7)', '투명한 정산 내역'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-green-800/80 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Benefit Card 2 */}
            <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 p-5">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gift size={80} className="text-purple-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-200">
                    <Gift size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg">무료 제품</h3>
                    <p className="text-xs text-purple-700/70">브랜드 신제품 체험</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {['신제품 우선 체험', '제품 무료 제공', '트렌드 선점 가능'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-purple-800/80 font-medium">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Benefit Card 3 */}
            <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={80} className="text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200">
                    <TrendingUp size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">성장 지원</h3>
                    <p className="text-xs text-blue-700/70">AI 가이드 & 레벨 시스템</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {['AI 촬영 가이드', '등급별 혜택 제공', '브랜드 직접 제안'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-blue-800/80 font-medium">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Live Campaigns */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">모집중인 캠페인</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <Link to="/signup" className="text-sm text-purple-600 font-bold flex items-center gap-0.5 hover:gap-1.5 transition-all">
              전체보기 <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
              <Target size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">현재 모집 중인 캠페인이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, idx) => (
                <Link
                  key={idx}
                  to="/signup"
                  className="block bg-white p-4 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all active:scale-[0.99] group"
                >
                  <div className="flex gap-4">
                    <div className="relative">
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="w-24 h-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                          <Gift size={28} className="text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 ${getCategoryColor(campaign.campaign_type)} text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm`}>
                        {getCategoryLabel(campaign.campaign_type)}
                      </div>
                    </div>

                    <div className="flex-1 py-1 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">{campaign.brand}</p>
                        <h4 className="font-bold text-gray-900 leading-snug text-base line-clamp-2 group-hover:text-purple-700 transition-colors">
                          {campaign.title}
                        </h4>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 w-5 h-5 rounded-md flex items-center justify-center">
                            <Zap size={12} className="text-white" fill="white" />
                          </div>
                          <span className="font-black text-gray-900 text-lg">
                            {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                          </span>
                        </div>
                        <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg group-hover:bg-purple-600 transition-colors flex items-center gap-1">
                          지원 <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Final CTA */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-5">
                <Sparkles size={14} className="text-yellow-400" />
                <span className="text-sm font-medium text-white/90">누적 크리에이터 500명 돌파</span>
              </div>

              <h3 className="text-2xl font-black mb-3">
                지금 바로 시작하세요
              </h3>
              <p className="text-sm text-white/60 mb-6">
                가입 후 바로 캠페인에 지원할 수 있어요
              </p>

              <Link
                to="/signup"
                className="block w-full py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-2"
              >
                무료로 시작하기
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-100">
          <div className="flex flex-col items-center">
            <img src={cnecLogo} alt="CNEC" className="h-5 opacity-30 mb-4" />
            <div className="flex gap-6 text-xs text-gray-400 mb-4">
              <a href="#" className="hover:text-gray-600 transition-colors">이용약관</a>
              <a href="#" className="hover:text-gray-600 transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-gray-600 transition-colors">고객센터</a>
            </div>
            <p className="text-xs text-gray-400">
              © 2024 CNEC. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default LandingPage
