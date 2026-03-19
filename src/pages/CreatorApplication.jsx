import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, Coins, Star,
  Loader2, CheckCircle, AlertCircle,
  Calendar, Send, Quote
} from 'lucide-react'
import MeetingCalendar from './MeetingCalendar'
import cnecLogo from '../assets/cnec-logo-horizontal.png'

const BENEFITS = [
  {
    icon: ShoppingBag,
    title: '공동구매 지원',
    description: '파트너 크리에이터를 위한 공동구매 기회를 제공해 드려요. 브랜드 제품을 특별 조건으로 만나보세요.',
    gradient: 'from-orange-50 to-amber-50',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100'
  },
  {
    icon: Coins,
    title: '포인트 10% 보너스',
    description: '캠페인에 참여하시면 정산 포인트에 10% 보너스를 추가로 드려요.',
    gradient: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100'
  },
  {
    icon: Star,
    title: '캠페인 우선 안내',
    description: '새로운 캠페인이 열리면, 가장 먼저 안내를 받으실 수 있어요.',
    gradient: 'from-purple-50 to-violet-50',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-100'
  }
]

const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

const CreatorApplication = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    youtube_url: '',
    instagram_url: ''
  })
  const [selectedSlots, setSelectedSlots] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  // 슬롯 조회
  const fetchSlots = useCallback(async () => {
    try {
      setLoadingSlots(true)
      const res = await fetch('/.netlify/functions/get-available-slots')
      const data = await res.json()
      if (data.success) {
        setAvailableSlots(data.slots || [])
      }
    } catch (err) {
      console.error('슬롯 조회 오류:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  // 후기 조회
  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true)
      const res = await fetch('/.netlify/functions/get-program-reviews')
      const data = await res.json()
      if (data.success) {
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('후기 조회 오류:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
    fetchReviews()
  }, [fetchSlots, fetchReviews])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectSlot = (slot) => {
    if (selectedSlots.length >= 3) return
    if (selectedSlots.find(s => s.id === slot.id)) return
    setSelectedSlots(prev => [...prev, slot])
  }

  const handleRemoveSlot = (slotId) => {
    setSelectedSlots(prev => prev.filter(s => s.id !== slotId))
  }

  const validate = () => {
    if (!formData.name.trim()) return '이름을 입력해 주세요.'
    if (!formData.phone.trim()) return '연락처를 입력해 주세요.'
    const phoneDigits = formData.phone.replace(/-/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return '올바른 연락처를 입력해 주세요.'
    if (selectedSlots.length === 0) return '최소 1개의 상담 희망일을 선택해 주세요.'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const body = {
        creator_name: formData.name.trim(),
        creator_phone: formData.phone,
        creator_email: null,
        youtube_url: formData.youtube_url.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        preferred_slots: selectedSlots.map(s => ({
          slot_id: s.id,
          date: s.date,
          time: s.time
        }))
      }

      const res = await fetch('/.netlify/functions/submit-meeting-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // 이미 신청한 경우 친근한 메시지
        if (res.status === 409) {
          setError('이미 상담 신청을 해주셨어요! 담당자가 곧 연락드릴게요 :)')
        } else {
          setError(data.error || '잠시 문제가 생겼어요. 다시 시도해 주세요.')
        }
      }
    } catch (err) {
      console.error('제출 오류:', err)
      setError('네트워크 오류가 발생했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">상담 신청이 완료되었어요!</h2>
          <p className="text-[#6B7280] mb-2 leading-relaxed">
            담당자가 편하게 연락드릴게요 :)
          </p>
          <p className="text-sm text-[#6B7280]">
            보통 1~2 영업일 내에 연락드려요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 섹션 1: 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <img
            src={cnecLogo}
            alt="CNEC"
            className="h-7 object-contain"
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        {/* 히어로 섹션 */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3 leading-snug">
            크넥이 크리에이터님의<br />활동을 지원해드려요
          </h1>
          <p className="text-[#6B7280] leading-relaxed">
            어떤 지원을 받을 수 있는지, 편하게 알아보세요 :)
          </p>
        </div>

        {/* 섹션 2: 혜택 카드 3개 */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${benefit.gradient} rounded-2xl p-5 shadow-sm`}
                >
                  <div className={`w-11 h-11 ${benefit.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A2E] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 섹션 3: 크리에이터 후기 */}
        {!loadingReviews && reviews.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4">함께하고 있는 크리에이터들의 이야기</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 shadow-sm relative"
                >
                  <Quote className="w-6 h-6 text-[#6C5CE7] opacity-30 mb-3" />
                  <p className="text-sm text-[#1A1A2E] leading-relaxed mb-4">
                    {review.review_text}
                  </p>
                  <p className="text-xs text-[#6B7280] text-right font-medium">
                    — {review.display_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 섹션 4: 프로그램 상담 신청 폼 */}
        <div className="space-y-5">
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">
              프로그램이 궁금하시다면, 편하게 상담 신청해 주세요
            </h2>
            <p className="text-sm text-[#6B7280]">
              담당자가 직접 연락드려서 자세히 안내해 드릴게요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력해 주세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="연락처를 입력해 주세요"
                  maxLength={13}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  유튜브 채널 URL
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleInputChange}
                  placeholder="유튜브 채널 주소 (선택)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  인스타그램 URL
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleInputChange}
                  placeholder="인스타그램 주소 (선택)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 미팅 희망일 선택 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#6C5CE7]" />
              <h3 className="text-sm font-bold text-[#1A1A2E]">
                상담 희망일을 선택해 주세요 (최대 3개) <span className="text-red-500">*</span>
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-3">
              희망하시는 날짜와 시간을 선택해 주세요. 선택 순서대로 우선순위가 정해져요.
            </p>

            {loadingSlots ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-2" />
                <p className="text-sm text-[#6B7280]">가능한 일정을 불러오는 중...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">현재 예약 가능한 일정이 없어요.</p>
                <p className="text-xs text-[#6B7280] mt-1">잠시 후 다시 확인해 주세요.</p>
              </div>
            ) : (
              <MeetingCalendar
                slots={availableSlots}
                selectedSlots={selectedSlots}
                onSelectSlot={handleSelectSlot}
                onRemoveSlot={handleRemoveSlot}
                maxSelections={3}
              />
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedSlots.length === 0}
            className="w-full bg-[#6C5CE7] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#5A4BD1] active:bg-[#4A3DC0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                신청 중...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                프로그램 안내 상담 신청
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#6B7280] pb-2">
            신청 후 담당자가 편하게 연락드릴게요.
          </p>
        </div>

        {/* 섹션 5: 푸터 */}
        <div className="mt-16 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm font-medium text-[#6B7280]">크넥 (CNEC) | 주식회사 하우파파</p>
          <p className="text-xs text-[#6B7280] mt-1">크리에이터와 브랜드를 연결하는 K-뷰티 플랫폼</p>
        </div>
      </div>
    </div>
  )
}

export default CreatorApplication
