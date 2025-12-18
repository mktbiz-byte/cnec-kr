import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database } from '../../lib/supabase'
import cnecLogo from '../../assets/cnec-logo-final.png'
import {
  Star, DollarSign, Target, Users,
  ChevronRight, Loader2, Gift, Sparkles,
  TrendingUp, Award
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

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-green-100 text-green-700'
      case '4week_challenge': return 'bg-purple-100 text-purple-700'
      case 'planned': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-4 flex justify-between items-center">
          <img src={cnecLogo} alt="CNEC" className="h-7" />
          <Link
            to="/login"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
          >
            로그인
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pb-10">
        {/* 히어로 섹션 */}
        <section className="pt-8 pb-6">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-white/70" />
                <span className="text-sm font-medium text-white/70">뷰티 크리에이터 플랫폼</span>
              </div>

              <h1 className="text-2xl font-extrabold leading-tight mb-2">
                브랜드와 함께<br />
                성장하는 크리에이터
              </h1>

              <p className="text-sm text-white/70 mb-6">
                CNEC에서 다양한 뷰티 브랜드와 협업하고<br />
                콘텐츠를 만들며 수익을 창출하세요
              </p>

              <div className="flex gap-3">
                <Link
                  to="/signup"
                  className="flex-1 py-3 bg-white text-purple-700 text-center font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  시작하기
                </Link>
                <Link
                  to="/login"
                  className="flex-1 py-3 bg-white/20 text-white text-center font-bold rounded-xl hover:bg-white/30 transition-colors"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 통계 카드 */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-purple-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900">500+</p>
              <p className="text-xs text-gray-500">활성 크리에이터</p>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900">1,000+</p>
              <p className="text-xs text-gray-500">완료된 캠페인</p>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900">100+</p>
              <p className="text-xs text-gray-500">파트너 브랜드</p>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-amber-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900">5억+</p>
              <p className="text-xs text-gray-500">총 정산 금액</p>
            </div>
          </div>
        </section>

        {/* 혜택 섹션 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">크리에이터 혜택</h2>

          <div className="space-y-3">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">확실한 수익</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    캠페인당 최대 100만원까지 포인트 지급. 빠른 정산으로 안정적인 수익을 보장합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gift size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">무료 제품</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    캠페인 참여 시 브랜드의 신제품을 무료로 받아보세요. 트렌디한 제품을 먼저 경험할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">성장 지원</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    레벨 시스템과 AI 가이드로 콘텐츠 제작 역량을 키우세요. 단계별 성장을 지원합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 모집 중인 캠페인 */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">모집 중인 캠페인</h2>
            <Link
              to="/signup"
              className="text-sm text-purple-600 font-medium flex items-center gap-0.5"
            >
              전체보기 <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Target size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">현재 모집 중인 캠페인이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4"
                >
                  {campaign.image_url ? (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center">
                      <Gift size={24} className="text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 py-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-400">{campaign.brand}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getCategoryColor(campaign.campaign_type)}`}>
                          {getCategoryLabel(campaign.campaign_type)}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-tight text-base line-clamp-2">
                        {campaign.title}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-extrabold text-gray-900 text-lg">
                        {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                      </span>
                      <Link
                        to="/signup"
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                      >
                        지원하기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA 섹션 */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 text-center">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star size={28} className="text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">지금 시작하세요</h3>
              <p className="text-sm text-white/60 mb-5">
                가입 후 바로 캠페인에 지원할 수 있습니다
              </p>
              <Link
                to="/signup"
                className="block w-full py-3.5 bg-white text-gray-900 text-center font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                무료로 시작하기
              </Link>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="pt-6 border-t border-gray-200">
          <div className="flex flex-col items-center">
            <img src={cnecLogo} alt="CNEC" className="h-5 opacity-40 mb-4" />
            <div className="flex gap-4 text-xs text-gray-400 mb-4">
              <a href="#" className="hover:text-gray-600">이용약관</a>
              <a href="#" className="hover:text-gray-600">개인정보처리방침</a>
              <a href="#" className="hover:text-gray-600">고객센터</a>
            </div>
            <p className="text-xs text-gray-400">
              © 2024 CNEC. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
