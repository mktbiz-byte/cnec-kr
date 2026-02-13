import { useState, useEffect } from 'react'
import { X, Clock, Phone, Monitor, Calendar } from 'lucide-react'

const HolidayNoticePopup = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 한국시간(KST) 기준 2월 18일 23:59:59까지 노출
    const now = new Date()
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000))
    const expiry = new Date(2026, 1, 18, 23, 59, 59) // 2026-02-18 23:59:59 KST

    if (kstNow <= expiry) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-white/90" />
            <h2 className="text-white font-bold text-base">설 연휴 안내</h2>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">2월 13일(금) 단축 영업</p>
              <p className="text-xs text-gray-500 mt-0.5">고객 서포트 16:00 업무 종료</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">2월 14일(토) ~ 18일(수) 휴업</p>
              <p className="text-xs text-gray-500 mt-0.5">고객 서포트 휴업 — 문의 대응·메일 회신 중단</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Monitor size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">시스템 정상 가동</p>
              <p className="text-xs text-gray-500 mt-0.5">영상 업로드·채널·캠페인 기능 스케줄대로 진행</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">연휴 후 순차 대응</p>
              <p className="text-xs text-gray-500 mt-0.5">2월 19일(목)부터 문의 순차 대응</p>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="px-5 pb-4">
          <button
            onClick={() => setVisible(false)}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default HolidayNoticePopup
