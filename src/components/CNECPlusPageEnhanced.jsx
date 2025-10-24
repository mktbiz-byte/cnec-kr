import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Crown, Star, TrendingUp, Users, CheckCircle, ArrowRight, Youtube, Instagram, Award, Zap, DollarSign, Target, Home } from 'lucide-react'
import cnecLogo from '../assets/cnec-logo-final.png'

const CNECPlusPageEnhanced = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedProgram, setSelectedProgram] = useState('youtube') // 'youtube' or 'shortform'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    sns_links: '', // Instagram, TikTok, YouTube 등 모든 SNS 링크
    follower_count: '',
    why_cnec_plus: '', // 지원 동기 및 어필 포인트
    program_type: 'youtube' // 'youtube' or 'shortform'
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
          program_type: selectedProgram,
          status: 'pending',
          applied_at: new Date().toISOString()
        }])

      if (error) throw error

      setSuccess(true)
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
              <span className="text-sm font-semibold">프리미엄 크리에이터 프로그램</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">CNEC Plus</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              체계적인 교육과 전문 지원으로<br />
              프로페셔널 뷰티 크리에이터로 성장하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 프로그램 선택 탭 */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setSelectedProgram('youtube')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedProgram === 'youtube'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Youtube className="inline-block w-5 h-5 mr-2" />
              유튜브 육성 프로그램
            </button>
            <button
              onClick={() => setSelectedProgram('shortform')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedProgram === 'shortform'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Instagram className="inline-block w-5 h-5 mr-2" />
              숏폼 크리에이터 프로그램
            </button>
          </div>
        </div>

        {/* 유튜브 육성 프로그램 */}
        {selectedProgram === 'youtube' && (
          <div className="space-y-8">
            {/* 프로그램 소개 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Youtube className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">유튜브 육성 프로그램</h2>
                  <p className="text-gray-600">뷰티 전문 유튜브 채널을 함께 성장시키는 CNEC의 대표 프로그램</p>
                </div>
              </div>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <p className="text-amber-900 font-semibold mb-2">🏆 인기 프로그램</p>
                <p className="text-amber-800">
                  뷰티 전문 유튜브 채널을 함께 성장시키는 CNEC의 대표 프로그램입니다.
                </p>
              </div>

              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">
                  뷰티 전문 유튜브 채널을 함께 성장시키는 CNEC의 대표 프로그램입니다.
                  초기 채널 운영 자금부터 제품 지원, 전문 교육, 1:1 멘토링까지 
                  체계적인 지원을 통해 성공적인 뷰티 크리에이터로 성장할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 프로그램 혜택 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">프로그램 혜택</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">100만 포인트 지원</h4>
                    <p className="text-gray-600">초기 채널 운영 자금 전액 지원</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">제품비 100% 지원</h4>
                    <p className="text-gray-600">리뷰용 뷰티 제품 무제한 제공</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">체계적인 교육</h4>
                    <p className="text-gray-600">콘텐츠 기획, 촬영, 편집 전문 교육</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">1:1 멘토링</h4>
                    <p className="text-gray-600">성공한 크리에이터의 노하우 전수</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">채널 성장 전략</h4>
                    <p className="text-gray-600">알고리즘 분석 및 최적화 지원</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 지원 자격 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">지원 자격</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">뷰티에 관심이 많은 크리에이터</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">주 3회 이상 콘텐츠 업로드 가능</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">6개월 이상 장기 활동 의지</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">구독자 수 무관 (초보 환영)</span>
                </li>
              </ul>
            </div>

            {/* 프로그램 통계 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-red-600 mb-2">50+</div>
                  <div className="text-gray-600">참여 크리에이터</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">평균 5만</div>
                  <div className="text-gray-600">구독자 성장</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">6개월</div>
                  <div className="text-gray-600">프로그램 기간</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 숏폼 크리에이터 프로그램 */}
        {selectedProgram === 'shortform' && (
          <div className="space-y-8">
            {/* 프로그램 소개 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Instagram className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">숏폼 크리에이터 프로그램</h2>
                  <p className="text-gray-600">CNEC의 공식 숏폼 크리에이터로 활동하며 특별한 혜택 제공</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-900 font-semibold mb-2">⭐ 추천 프로그램</p>
                <p className="text-blue-800">
                  CNEC의 공식 숏폼 크리에이터로 활동하며 특별한 혜택과 기회를 누리세요.
                </p>
              </div>

              <div className="prose max-w-none text-gray-600">
                <p className="text-lg leading-relaxed">
                  Instagram Reels, TikTok, YouTube Shorts 등 숏폼 플랫폼에서 활동하는 
                  크리에이터를 위한 프리미엄 프로그램입니다. 일반 캠페인 대비 높은 보상과 
                  우선 배정 혜택을 받으며, 브랜드와의 직접 협업 기회도 제공됩니다.
                </p>
              </div>
            </div>

            {/* 프로그램 혜택 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">프로그램 혜택</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">포인트 추가 지급</h4>
                    <p className="text-gray-600">일반 캠페인 대비 20-50% 추가 보상</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">추천 크리에이터 선정</h4>
                    <p className="text-gray-600">메인 페이지 및 브랜드에 우선 노출</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">브랜드 협업 참여</h4>
                    <p className="text-gray-600">오프라인 이벤트 및 팝업스토어 초대</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">공동구매 협업</h4>
                    <p className="text-gray-600">크리에이터 전용 공동구매 기획 및 수익 분배</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">독점 캠페인 우선 배정</h4>
                    <p className="text-gray-600">고액 캠페인 및 장기 계약 우선 제안</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">전문 매니지먼트</h4>
                    <p className="text-gray-600">전담 매니저의 1:1 케어 및 성장 관리</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 선정 기준 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">선정 기준</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">CNEC 캠페인 5회 이상 참여</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">평균 평점 4.5점 이상</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">SNS 팔로워 1만 명 이상 (또는 높은 참여율)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">뷰티 콘텐츠 전문성 및 일관성</span>
                </li>
              </ul>
            </div>

            {/* 프로그램 통계 */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">30+</div>
                  <div className="text-gray-600">숏폼 크리에이터</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">평균 150만원</div>
                  <div className="text-gray-600">월 수익</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">장기</div>
                  <div className="text-gray-600">계약 기간</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 프로그램 비교 테이블 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">프로그램 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-900">혜택</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-900">일반 크리에이터</th>
                  <th className="text-center py-4 px-4 font-bold text-purple-600">크넥플러스</th>
                  <th className="text-center py-4 px-4 font-bold text-red-600">유튜브 육성 프로그램</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">캠페인 참여</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4 text-purple-600 font-semibold">✓ (우선 배정)</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">포인트 지급</td>
                  <td className="text-center py-4 px-4">기본</td>
                  <td className="text-center py-4 px-4 text-purple-600 font-semibold">10~30% 추가 포인트 지급</td>
                  <td className="text-center py-4 px-4 text-red-600 font-semibold">월간 100만 포인트 지급 + 10~30% 추가 지급</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">제품 지원</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4 text-red-600 font-semibold">100% 지원</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">교육/멘토링</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4 text-purple-600">✓</td>
                  <td className="text-center py-4 px-4 text-red-600 font-semibold">✓ (1:1)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">브랜드 협업</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4 text-purple-600">✓</td>
                  <td className="text-center py-4 px-4 text-red-600">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">매니지먼트</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4 text-purple-600">✓</td>
                  <td className="text-center py-4 px-4 text-red-600">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 지원 폼 - 간소화 버전 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">CNEC Plus 지원하기</h2>
          <p className="text-gray-600 mb-8">
            {selectedProgram === 'youtube' ? '유튜브 육성 프로그램' : '숏폼 크리에이터 프로그램'}에 지원합니다. 
            간단한 정보와 함께 자신을 어필할 수 있는 내용을 작성해주세요.
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
                  팔로워/구독자 수 *
                </label>
                <input
                  type="text"
                  name="follower_count"
                  value={formData.follower_count}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 인스타 1.5만, 유튜브 3천"
                />
              </div>
            </div>

            {/* SNS 링크 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SNS 링크 (Instagram, TikTok, YouTube 등) *
              </label>
              <textarea
                name="sns_links"
                value={formData.sns_links}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Instagram: https://instagram.com/yourname&#10;TikTok: https://tiktok.com/@yourname&#10;YouTube: https://youtube.com/@yourname"
              />
            </div>

            {/* 어필 포인트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 동기 및 어필 포인트 *
              </label>
              <textarea
                name="why_cnec_plus"
                value={formData.why_cnec_plus}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="• 왜 CNEC Plus에 지원하시나요?&#10;• 뷰티 크리에이터로서 어떤 강점이 있나요?&#10;• 어떤 콘텐츠를 만들고 싶으신가요?&#10;• CNEC Plus를 통해 이루고 싶은 목표는 무엇인가요?&#10;&#10;자유롭게 작성해주세요. 성실하고 구체적인 답변이 선발에 도움이 됩니다."
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: 구체적인 경험, 콘텐츠 스타일, 목표 등을 작성하면 좋습니다.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-blue-900 font-semibold mb-2">📋 지원 절차 안내</p>
              <ol className="text-blue-800 space-y-1 text-sm">
                <li>1. 지원서 제출 (지금 작성 중)</li>
                <li>2. 서류 검토 (1~2일 소요)</li>
                <li>3. 미팅 진행 (온라인/오프라인)</li>
                <li>4. 최종 확정 후 활동 시작</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '제출 중...' : '지원서 제출하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CNECPlusPageEnhanced

