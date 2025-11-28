import { useState } from 'react'

/**
 * 4주 챌린지 캠페인 가이드 뷰어 컴포넌트
 * 주차별 탭으로 구분하여 표시
 */
export default function FourWeekGuideViewer({ guides, individualMessages, currentWeek }) {
  const [activeWeek, setActiveWeek] = useState(currentWeek || 'week1')

  if (!guides) {
    return null
  }

  // 문자열인 경우 파싱 시도
  let parsedGuides = guides
  if (typeof guides === 'string') {
    try {
      parsedGuides = JSON.parse(guides)
    } catch (e) {
      console.error('Failed to parse guides:', e)
      return null
    }
  }

  // 개별 메시지 파싱
  let parsedMessages = individualMessages || {}
  if (typeof individualMessages === 'string') {
    try {
      parsedMessages = JSON.parse(individualMessages)
    } catch (e) {
      parsedMessages = {}
    }
  }

  const currentGuide = parsedGuides[activeWeek]
  const currentMessage = parsedMessages[activeWeek]

  if (!currentGuide) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 주차 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['week1', 'week2', 'week3', 'week4'].map((week, idx) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeWeek === week
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {idx + 1}주차
          </button>
        ))}
      </div>

      {/* 개별 전달사항 - 최상단 */}
      {currentMessage && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h5 className="text-sm font-bold text-yellow-800">📢 {activeWeek.replace('week', '')}주차 개별 전달사항</h5>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{currentMessage}</p>
          </div>
        </div>
      )}

      {/* AI 생성 가이드 */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h5 className="text-sm font-semibold text-purple-800">🏆 {activeWeek.replace('week', '')}주차 챌린지 가이드</h5>
        </div>

        <div className="space-y-4">
          {/* 상품 정보 */}
          {currentGuide.product_info && (
            <div className="bg-white rounded-lg p-3">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">📦 상품 정보</h6>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentGuide.product_info}</p>
            </div>
          )}

          {/* 미션 */}
          {currentGuide.mission && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg p-3">
              <h6 className="text-sm font-semibold text-purple-800 mb-2">🎯 이번 주 미션</h6>
              <p className="text-sm text-purple-900 font-medium whitespace-pre-wrap">{currentGuide.mission}</p>
            </div>
          )}

          {/* 해시태그 */}
          {currentGuide.hashtags && currentGuide.hashtags.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">#️⃣ 필수 해시태그</h6>
              <div className="flex flex-wrap gap-2">
                {currentGuide.hashtags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    #{tag.replace('#', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 필수 대사 */}
          {currentGuide.required_dialogues && currentGuide.required_dialogues.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">💬 필수 대사</h6>
              <ul className="space-y-2">
                {currentGuide.required_dialogues.map((dialogue, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{dialogue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 필수 촬영 장면 */}
          {currentGuide.required_scenes && currentGuide.required_scenes.length > 0 && (
            <div className="bg-white rounded-lg p-3">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">🎥 필수 촬영 장면</h6>
              <ul className="space-y-2">
                {currentGuide.required_scenes.map((scene, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{scene}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 주의사항 */}
          {currentGuide.cautions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h6 className="text-sm font-semibold text-amber-800 mb-2">⚠️ 주의사항</h6>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{currentGuide.cautions}</p>
            </div>
          )}

          {/* 참고 영상 URL */}
          {currentGuide.reference_urls && currentGuide.reference_urls.length > 0 && currentGuide.reference_urls.some(url => url) && (
            <div className="bg-white rounded-lg p-3">
              <h6 className="text-sm font-semibold text-gray-800 mb-2">🔗 참고 영상</h6>
              <ul className="space-y-2">
                {currentGuide.reference_urls.filter(url => url).map((url, idx) => (
                  <li key={idx}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
