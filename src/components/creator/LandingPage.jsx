import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database } from '../../lib/supabase'
import cnecLogo from '../../assets/cnec-logo-final.png'
import {
  Star, DollarSign, Target, Shield, Users, Zap,
  ChevronRight, Play, CheckCircle, Instagram, Youtube,
  Loader2, ArrowRight, Gift
} from 'lucide-react'

const LandingPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 로그인한 사용자는 크리에이터 앱으로 리다이렉트
    if (user) {
      navigate('/creator')
    }
  }, [user, navigate])

  useEffect(() => {
    loadCampaigns()
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

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src={cnecLogo} alt="CNEC" className="h-8" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-black transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
            <Zap size={16} />
            뷰티 크리에이터를 위한 최고의 플랫폼
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            브랜드와 함께<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              성장하는 크리에이터
            </span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            CNEC에서 다양한 뷰티 브랜드와 협업하고,<br className="hidden sm:block" />
            콘텐츠를 만들며 수익을 창출하세요.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl"
            >
              지금 시작하기 <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">500+</p>
              <p className="text-sm text-gray-500">활성 크리에이터</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">100+</p>
              <p className="text-sm text-gray-500">파트너 브랜드</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">1,000+</p>
              <p className="text-sm text-gray-500">완료된 캠페인</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">5억+</p>
              <p className="text-sm text-gray-500">총 정산 금액</p>
            </div>
          </div>
        </div>
      </section>

      {/* 혜택 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              CNEC 크리에이터 혜택
            </h2>
            <p className="text-gray-500">크리에이터의 성장을 위한 다양한 지원</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5">
                <DollarSign size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">확실한 수익</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                캠페인당 최대 100만원까지 포인트 지급. 빠른 정산으로 안정적인 수익을 보장합니다.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-5">
                <Gift size={28} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">무료 제품</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                캠페인 참여 시 브랜드의 신제품을 무료로 받아보세요. 트렌디한 제품을 먼저 경험할 수 있습니다.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                <Star size={28} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">성장 지원</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                레벨 시스템과 AI 가이드로 콘텐츠 제작 역량을 키우세요. 단계별 성장을 지원합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 캠페인 미리보기 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              모집 중인 캠페인
            </h2>
            <p className="text-gray-500">지금 바로 참여할 수 있는 캠페인들</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">현재 모집 중인 캠페인이 없습니다</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {campaigns.map((campaign, idx) => (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {campaign.image_url ? (
                      <img src={campaign.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift size={40} className="text-gray-300" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                      모집중
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-1">{campaign.brand}</p>
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">{campaign.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-extrabold text-purple-600">
                        {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                      </span>
                      <Link
                        to="/signup"
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black"
                      >
                        지원하기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-purple-600 font-bold hover:underline"
            >
              더 많은 캠페인 보기 <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-24 px-4 bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
            지금 CNEC 크리에이터가 되세요
          </h2>
          <p className="text-purple-200 mb-10 text-lg">
            가입 후 바로 캠페인에 지원할 수 있습니다
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-purple-700 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
          >
            무료로 시작하기 <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img src={cnecLogo} alt="CNEC" className="h-6 opacity-60" />
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white">개인정보처리방침</a>
              <a href="#" className="hover:text-white">고객센터</a>
            </div>
          </div>
          <p className="text-center text-xs mt-8 text-gray-500">
            © 2024 CNEC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
