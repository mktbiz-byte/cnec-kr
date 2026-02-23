import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, database } from '../../lib/supabase'
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  Instagram, Youtube, Hash, Building2, FileText,
  Star, Shield, Users, TrendingUp
} from 'lucide-react'

const CreatorApplicationPage = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [existingApplication, setExistingApplication] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    instagram_url: '',
    instagram_followers: '',
    youtube_url: '',
    youtube_subscribers: '',
    tiktok_url: '',
    tiktok_followers: '',
    categories: [],
    experience: '',
    motivation: '',
    portfolio_url: '',
    available_start: '',
    agreement_terms: false,
    agreement_privacy: false
  })

  const categoryOptions = [
    '뷰티', '스킨케어', '패션', '라이프스타일',
    '푸드', '여행', '육아', '반려동물',
    '건강/피트니스', '테크/IT', '기타'
  ]

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/creator-application' } })
    }
  }, [user, authLoading, navigate])

  // 프로필 및 기존 지원 데이터 로드
  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      // 프로필 정보 자동 채우기
      const profile = await database.userProfiles.get(user.id)
      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.name || '',
          phone: profile.phone || '',
          email: user.email || '',
          age: profile.age || '',
          instagram_url: profile.instagram_url || '',
          youtube_url: profile.youtube_url || '',
          tiktok_url: profile.tiktok_url || ''
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }

      // 기존 지원서 확인
      const { data: existing, error: existingError } = await supabase
        .from('creator_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!existingError && existing) {
        setExistingApplication(existing)
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const validateForm = () => {
    const errors = []
    if (!formData.name.trim()) errors.push('이름을 입력해주세요')
    if (!formData.phone.trim()) errors.push('연락처를 입력해주세요')
    if (!formData.email.trim()) errors.push('이메일을 입력해주세요')
    if (!formData.instagram_url && !formData.youtube_url && !formData.tiktok_url) {
      errors.push('SNS 계정을 최소 1개 이상 입력해주세요')
    }
    if (formData.categories.length === 0) errors.push('활동 카테고리를 1개 이상 선택해주세요')
    if (!formData.motivation.trim()) errors.push('지원 동기를 입력해주세요')
    if (!formData.agreement_terms) errors.push('이용약관에 동의해주세요')
    if (!formData.agreement_privacy) errors.push('개인정보 수집 및 이용에 동의해주세요')
    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join('\n'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const submissionData = {
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        age: formData.age ? parseInt(formData.age) : null,
        instagram_url: formData.instagram_url || null,
        instagram_followers: formData.instagram_followers || null,
        youtube_url: formData.youtube_url || null,
        youtube_subscribers: formData.youtube_subscribers || null,
        tiktok_url: formData.tiktok_url || null,
        tiktok_followers: formData.tiktok_followers || null,
        categories: formData.categories,
        experience: formData.experience || null,
        motivation: formData.motivation,
        portfolio_url: formData.portfolio_url || null,
        available_start: formData.available_start || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('creator_applications')
        .insert([submissionData])

      if (insertError) throw insertError

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('지원서 제출 오류:', err)
      setError('지원서 제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 로딩
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 제출 완료
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">지원서가 제출되었습니다!</h2>
            <p className="text-gray-600 mb-2">
              소중한 지원서를 검토 후 개별적으로 연락드리겠습니다.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              검토에는 영업일 기준 3~5일이 소요될 수 있습니다.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 이미 지원한 경우
  if (existingApplication) {
    const statusLabels = {
      pending: '검토 중',
      reviewing: '심사 중',
      approved: '승인됨',
      rejected: '반려됨'
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">이미 지원서를 제출하셨습니다</h2>
            <p className="text-gray-600 mb-4">
              현재 지원 상태: <span className="font-semibold text-purple-600">{statusLabels[existingApplication.status] || existingApplication.status}</span>
            </p>
            <p className="text-sm text-gray-400 mb-8">
              지원일: {new Date(existingApplication.created_at).toLocaleDateString('ko-KR')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 p-1">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">크리에이터 지원서</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* 소속사 안내 배너 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">C·NEC 소속 크리에이터 모집</span>
          </div>
          <h2 className="text-xl font-bold mb-2">함께 성장할 크리에이터를 찾고 있어요!</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            C·NEC과 함께 브랜드 캠페인, 콘텐츠 제작, 수익 창출까지
            체계적으로 지원받으세요.
          </p>
        </div>

        {/* 지원 혜택 */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">소속 크리에이터 혜택</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">브랜드 캠페인 우선 배정</p>
                <p className="text-xs text-gray-500">다양한 브랜드 협업 기회를 우선적으로 제공합니다</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">체계적인 성장 지원</p>
                <p className="text-xs text-gray-500">콘텐츠 기획, 촬영, 편집 교육 및 피드백을 받을 수 있어요</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">계약 및 정산 관리</p>
                <p className="text-xs text-gray-500">투명한 계약 조건과 정산 시스템으로 안심하고 활동하세요</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">크리에이터 커뮤니티</p>
                <p className="text-xs text-gray-500">소속 크리에이터 간 네트워킹 및 정보 공유 기회 제공</p>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {/* 지원서 폼 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="실명을 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="나이를 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SNS 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">SNS 계정 정보</h3>
            <p className="text-xs text-gray-400 mb-4">최소 1개 이상의 SNS 계정을 입력해주세요</p>
            <div className="space-y-4">
              {/* 인스타그램 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <label className="text-sm font-medium text-gray-700">Instagram</label>
                </div>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                />
                <input
                  type="text"
                  name="instagram_followers"
                  value={formData.instagram_followers}
                  onChange={handleInputChange}
                  placeholder="팔로워 수 (예: 5000)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 유튜브 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <label className="text-sm font-medium text-gray-700">YouTube</label>
                </div>
                <input
                  type="url"
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                />
                <input
                  type="text"
                  name="youtube_subscribers"
                  value={formData.youtube_subscribers}
                  onChange={handleInputChange}
                  placeholder="구독자 수 (예: 10000)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 틱톡 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-gray-700" />
                  <label className="text-sm font-medium text-gray-700">TikTok</label>
                </div>
                <input
                  type="url"
                  name="tiktok_url"
                  value={formData.tiktok_url}
                  onChange={handleInputChange}
                  placeholder="https://tiktok.com/@username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                />
                <input
                  type="text"
                  name="tiktok_followers"
                  value={formData.tiktok_followers}
                  onChange={handleInputChange}
                  placeholder="팔로워 수 (예: 3000)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 활동 카테고리 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              활동 카테고리 <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">주로 활동하는 분야를 선택해주세요 (복수 선택 가능)</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.categories.includes(category)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 활동 경험 & 지원 동기 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">활동 경험 및 지원 동기</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  크리에이터 활동 경험
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="이전 브랜드 협업, 콘텐츠 제작 경험 등을 자유롭게 작성해주세요"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지원 동기 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  placeholder="C·NEC 소속 크리에이터에 지원하는 이유를 알려주세요"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  포트폴리오 URL
                </label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  placeholder="포트폴리오 또는 대표 콘텐츠 링크"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  활동 가능 시작일
                </label>
                <input
                  type="date"
                  name="available_start"
                  value={formData.available_start}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 동의 사항 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">동의 사항</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreement_terms"
                  checked={formData.agreement_terms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="text-red-500">[필수]</span> 소속사 계약 관련 이용약관에 동의합니다.
                  계약 체결 시 세부 조건은 별도 안내됩니다.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreement_privacy"
                  checked={formData.agreement_privacy}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  <span className="text-red-500">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                  수집된 정보는 지원서 검토 목적으로만 사용됩니다.
                </span>
              </label>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-base hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                제출 중...
              </>
            ) : (
              '지원서 제출하기'
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            제출된 지원서는 수정이 불가합니다. 신중하게 작성해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreatorApplicationPage
