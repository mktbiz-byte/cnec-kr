import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, Video, Coins, Star,
  Loader2, CheckCircle, AlertCircle,
  Calendar, Send, MapPin
} from 'lucide-react'
import MeetingCalendar from './MeetingCalendar'
import cnecLogo from '../assets/cnec-logo-horizontal.png'

const BENEFITS = [
  {
    icon: ShoppingBag,
    title: '공동구매 지원',
    description: '소속 크리에이터 전용 공동구매 기회를 제공해 드려요. 브랜드 제품을 특별 조건으로 만나보세요.',
    color: 'bg-orange-50',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100'
  },
  {
    icon: Video,
    title: '내돈내산 영상 촬영 지원',
    description: '자유롭게 촬영하고 싶은 제품이 있다면, 촬영 비용을 지원해 드립니다.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100'
  },
  {
    icon: Coins,
    title: '월 정산 포인트 10% 추가 지급',
    description: '캠페인 정산 시 기본 포인트에 10%를 추가로 적립해 드려요.',
    color: 'bg-green-50',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100'
  },
  {
    icon: Star,
    title: '추천 크리에이터 1순위 배치',
    description: '새로운 캠페인 오픈 시 브랜드에게 가장 먼저 추천됩니다.',
    color: 'bg-purple-50',
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

  // 슬롯 조회
  const fetchSlots = useCallback(async () => {
    try {
      setLoadingSlots(true)
      const res = await fetch('/.netlify/functions/get-available-slots')
      const data = await res.json()
      if (data.success) {
        setAvailableSlots(data.slots || [])
      } else {
        console.error('슬롯 조회 실패:', data.error)
      }
    } catch (err) {
      console.error('슬롯 조회 오류:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

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
    if (!formData.name.trim()) return '이름을 입력해주세요.'
    if (!formData.phone.trim()) return '연락처를 입력해주세요.'
    const phoneDigits = formData.phone.replace(/-/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return '올바른 연락처를 입력해주세요.'
    if (selectedSlots.length === 0) return '최소 1개의 미팅 희망일을 선택해주세요.'
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
        setError(data.error || '제출 중 오류가 발생했습니다.')
      }
    } catch (err) {
      console.error('제출 오류:', err)
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">신청이 완료되었습니다</h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            담당자가 확인 후 연락드리겠습니다.
          </p>
          <p className="text-sm text-gray-400">
            보통 1~2 영업일 내에 연락드려요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 섹션 1: 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <img
              src={cnecLogo}
              alt="CNEC"
              className="h-7 object-contain"
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        {/* 히어로 섹션 */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-xl font-bold mb-2 leading-snug">
            소속 크리에이터로<br />함께 성장하세요
          </h1>
          <p className="text-sm text-purple-100 leading-relaxed">
            크넥이 크리에이터님의 성장을 전폭 지원합니다
          </p>
        </div>

        {/* 섹션 2: 혜택 카드 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">소속 크리에이터 혜택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${benefit.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${benefit.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 섹션 3: 지원 폼 + 미팅 스케줄 */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">미팅 신청</h2>

          {/* 미팅 장소 안내 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">미팅 장소</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  서울 중구 퇴계로36길 2<br />
                  동국대학교 충무로 영상센터 1009호
                </p>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력해주세요"
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
                  maxLength={13}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유튜브 채널 URL
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  value={formData.youtube_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/@채널명"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인스타그램 URL
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/아이디"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 미팅 희망일 선택 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-900">
                미팅 희망일 선택 <span className="text-red-500">*</span>
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              희망하시는 날짜와 시간을 최대 3개까지 선택해주세요. (선택 순서대로 우선순위)
            </p>

            {loadingSlots ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-sm text-gray-500">가용 일정을 불러오는 중...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">현재 예약 가능한 일정이 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1">잠시 후 다시 확인해주세요.</p>
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
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-base hover:bg-purple-700 active:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                신청 중...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                미팅 신청하기
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            신청 후 담당자가 확인하여 확정된 일정을 안내해드립니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreatorApplication
