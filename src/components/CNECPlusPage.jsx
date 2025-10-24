import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Crown, Star, TrendingUp, Users, CheckCircle, ArrowRight } from 'lucide-react'

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
      icon: Crown,
      title: '프리미엄 캠페인 접근',
      description: '일반 회원에게는 공개되지 않는 고급 브랜드의 비공개 캠페인에 우선 참여할 수 있습니다.'
    },
    {
      icon: TrendingUp,
      title: '높은 지원금',
      description: '일반 캠페인 대비 2~3배 높은 지원금을 받을 수 있으며, 성과에 따른 추가 보너스도 제공됩니다.'
    },
    {
      icon: Users,
      title: '전담 매니저 배정',
      description: 'CNEC Plus 전담 매니저가 캠페인 매칭부터 콘텐츠 제작까지 1:1로 지원합니다.'
    },
    {
      icon: Star,
      title: '우선 선발 혜택',
      description: '인기 캠페인 지원 시 CNEC Plus 회원에게 우선 선발 기회가 주어집니다.'
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
      alert('CNEC Plus 지원이 완료되었습니다!\n담당자가 검토 후 미팅 일정을 안내드리겠습니다.')
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
            CNEC Plus 지원이 성공적으로 제출되었습니다.<br />
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
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5" />
              <span className="text-sm font-semibold">프리미엄 크리에이터 프로그램</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">CNEC Plus</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              더 높은 수준의 캠페인과 지원금으로<br />
              프로페셔널 크리에이터로 성장하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* CNEC Plus란? */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">CNEC Plus란?</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              CNEC Plus는 <strong className="text-purple-600">검증된 크리에이터</strong>를 위한 프리미엄 프로그램입니다.
              일반 캠페인의 지원금이 부족하다고 느끼시나요? CNEC Plus 회원이 되면 <strong className="text-purple-600">비공개 프리미엄 캠페인</strong>에 접근할 수 있으며,
              <strong className="text-purple-600"> 2~3배 높은 지원금</strong>을 받을 수 있습니다.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
              <p className="text-amber-900 font-semibold mb-2">⚠️ 중요 안내</p>
              <p className="text-amber-800">
                CNEC Plus는 <strong>미팅을 통해 확정</strong>됩니다. 지원서 제출 후 담당자와의 미팅을 거쳐 
                최종 승인되면 프리미엄 캠페인 활동이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 혜택 */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">CNEC Plus 회원 혜택</h2>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">CNEC Plus 지원하기</h2>
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

            {/* SNS 계정 */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인스타그램 계정
                </label>
                <input
                  type="text"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  유튜브 채널
                </label>
                <input
                  type="text"
                  name="youtube_channel"
                  value={formData.youtube_channel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="채널 URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  틱톡 계정
                </label>
                <input
                  type="text"
                  name="tiktok_handle"
                  value={formData.tiktok_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="@username"
                />
              </div>
            </div>

            {/* 콘텐츠 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주요 콘텐츠 카테고리 *
              </label>
              <select
                name="content_category"
                value={formData.content_category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="beauty">뷰티/메이크업</option>
                <option value="fashion">패션/스타일</option>
                <option value="lifestyle">라이프스타일</option>
                <option value="food">푸드/쿠킹</option>
                <option value="fitness">피트니스/건강</option>
                <option value="travel">여행</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                포트폴리오 링크 *
              </label>
              <textarea
                name="portfolio_links"
                value={formData.portfolio_links}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="대표 콘텐츠 링크를 줄바꿈으로 구분하여 입력해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNEC Plus 지원 동기 *
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="CNEC Plus에 지원하시는 이유와 향후 활동 계획을 작성해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                크리에이터 경력 및 성과
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="브랜드 협업 경험, 주요 성과, 수상 경력 등을 작성해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호하는 브랜드/제품 카테고리
              </label>
              <input
                type="text"
                name="preferred_brands"
                value={formData.preferred_brands}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="예: 스킨케어, 메이크업, 헤어케어"
              />
            </div>

            {/* 동의 사항 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">안내 사항</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>지원서 제출 후 1~2일 내에 담당자가 검토합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>서류 통과 시 미팅 일정을 이메일로 안내드립니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>미팅은 온라인 또는 오프라인으로 진행되며, 약 30분 소요됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>미팅을 통해 최종 확정되면</strong> CNEC Plus 활동이 가능합니다.</span>
                </li>
              </ul>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? '제출 중...' : (
                  <>
                    지원서 제출
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CNECPlusPage

