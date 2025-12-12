import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Crown, Star, TrendingUp, Users, CheckCircle, ArrowRight, Home, Award, Briefcase, FileText } from 'lucide-react'
import cnecLogo from '../assets/cnec-logo-final.png'

const CNECPlusPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    instagram_handle: '',
    youtube_channel: '',
    tiktok_handle: '',
    follower_count: '',
    content_category: '',
    portfolio_links: '',
    motivation: '',
    experience: '',
    preferred_brands: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const benefits = [
    {
      icon: TrendingUp,
      title: '월 5건 이상 뷰티 캠페인 참여 기회',
      description: 'CNEC 소속 크리에이터로서 매월 안정적인 캠페인 참여 기회를 보장받습니다.'
    },
    {
      icon: Crown,
      title: '실지급비 10~20% 상향 조정',
      description: '일반 크리에이터 대비 높은 지원금을 받으며, 성과에 따라 추가 보너스가 제공됩니다.'
    },
    {
      icon: Award,
      title: '매월 제품비 지원',
      description: '월간 한도액에 맞춰 제품비를 지원받아 안정적인 콘텐츠 제작이 가능합니다.'
    },
    {
      icon: Star,
      title: '추천 크리에이터 승급 및 프로필 우선 전달',
      description: '별도의 지원 과정 없이 기업에게 프로필이 직접 전달되어 브랜드가 먼저 찾는 크리에이터가 됩니다.'
    },
    {
      icon: FileText,
      title: '차등 적용 프로필화 작업 지원',
      description: '전문 디자인 및 콘텐츠 팀의 맞춤형 프로필 제작으로 브랜드 어필력을 극대화합니다.'
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await database
        .from('cnecplus_applications')
        .insert([{
          user_id: user.id,
          ...formData,
          status: 'pending',
          applied_at: new Date().toISOString()
        }])

      if (error) throw error

      setSuccess(true)
      alert('CNEC Plus 소속 계약 지원이 완료되었습니다!\n담당자가 검토 후 미팅 일정을 안내드리겠습니다.')
    } catch (err) {
      console.error('지원 실패:', err)
      alert('지원에 실패했습니다: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">지원 완료!</h2>
          <p className="text-gray-600 mb-6">
            CNEC Plus 소속 계약 지원이 성공적으로 제출되었습니다.<br />
            담당자가 검토 후 미팅 일정을 이메일로 안내드리겠습니다.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src={cnecLogo} alt="CNEC Korea" className="h-12" />
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Home className="w-4 h-4" />
            메인페이지
          </Link>
        </div>
      </nav>

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5" />
              <span className="text-sm font-semibold">CNEC 소속 크리에이터 프로그램</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">CNEC Plus</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              체계적인 지원과 전문 관리로<br />
              프로페셔널 뷰티 크리에이터로 성장하세요
            </p>
            <p className="text-lg text-purple-200 mt-4 italic">
              "크리에이터의 성공이 곧 우리의 성공입니다"
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* CNEC Plus란? */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">CNEC Plus 소속 계약이란?</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              CNEC Plus는 <strong className="text-purple-600">CNEC 소속 크리에이터</strong>로서 다양한 혜택을 누리며,
              뷰티 콘텐츠 크리에이터로서의 커리어를 한 단계 업그레이드할 수 있는 프로그램입니다.
            </p>
            <p className="text-lg leading-relaxed mb-4">
              <strong className="text-purple-600">CNEC는 크리에이터의 지속 가능한 성장을 위해 전방위적인 지원을 약속합니다.</strong>
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
              <p className="text-amber-900 font-semibold mb-2">⚠️ 중요 안내</p>
              <p className="text-amber-800">
                CNEC Plus 소속 계약은 <strong>미팅을 통해 확정</strong>됩니다. 지원서 제출 후 담당자와의 미팅을 거쳐 
                최종 승인되면 CNEC 소속 크리에이터로 활동하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 혜택 */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">CNEC Plus 소속 크리에이터 혜택</h2>
          <p className="text-center text-gray-600 mb-8">
            CNEC는 크리에이터의 지속 가능한 성장을 위해 전방위적인 지원을 약속합니다.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 지원 절차 */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">지원 절차</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: '지원서 제출', desc: '아래 양식 작성' },
              { step: '2', title: '서류 검토', desc: '1~2일 소요' },
              { step: '3', title: '미팅 진행', desc: '온라인/오프라인' },
              { step: '4', title: '활동 시작', desc: '확정 후 즉시' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 지원 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">CNEC Plus 소속 계약 지원하기</h2>
          <p className="text-gray-600 mb-8">
            모든 항목을 정확히 작성해주세요. 제출 후 담당자가 검토하여 미팅 일정을 안내드립니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 팔로워 수 *
                </label>
                <input
                  type="number"
                  name="follower_count"
                  value={formData.follower_count}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* SNS 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">SNS 채널 정보</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram 계정
                </label>
                <input
                  type="text"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="@your_instagram"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube 채널 URL
                </label>
                <input
                  type="url"
                  name="youtube_channel"
                  value={formData.youtube_channel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok 계정
                </label>
                <input
                  type="text"
                  name="tiktok_handle"
                  value={formData.tiktok_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="@your_tiktok"
                />
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주요 콘텐츠 카테고리 *
                </label>
                <input
                  type="text"
                  name="content_category"
                  value={formData.content_category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 스킨케어, 메이크업, 헤어케어 등"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포트폴리오 링크
                </label>
                <textarea
                  name="portfolio_links"
                  value={formData.portfolio_links}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="대표 콘텐츠 링크를 입력해주세요 (여러 개 가능)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지원 동기 및 어필 포인트 *
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="CNEC Plus에 지원하시는 이유와 본인의 강점을 자유롭게 작성해주세요."
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Tip: 구체적인 경험, 콘텐츠 스타일, 목표 등을 작성하면 좋습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  크리에이터 경력
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="크리에이터 활동 경력, 협업 경험 등을 작성해주세요."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선호 브랜드
                </label>
                <input
                  type="text"
                  name="preferred_brands"
                  value={formData.preferred_brands}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="협업하고 싶은 브랜드를 입력해주세요"
                />
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>처리 중...</>
                ) : (
                  <>
                    지원서 제출하기
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">CNEC와 함께 시작하세요</h3>
          <p className="text-lg text-purple-100 mb-6">
            CNEC 소속 크리에이터로서 다양한 혜택을 누리며,<br />
            뷰티 콘텐츠 크리에이터로서의 커리어를 한 단계 업그레이드하세요.
          </p>
          <p className="text-sm text-purple-200">
            문의 및 지원: CNEC 크리에이터 지원팀
          </p>
        </div>
      </div>
    </div>
  )
}

export default CNECPlusPage
