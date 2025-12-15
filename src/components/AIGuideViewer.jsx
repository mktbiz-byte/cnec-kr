import React, { useState } from 'react'

/**
 * 탭 기반 가이드 뷰어 컴포넌트
 * 기업이 CampaignGuideEditor에서 입력한 크리에이터 가이드를 표시
 * ai_generated_guide JSON 구조에 맞게 파싱하여 표시
 */
export default function AIGuideViewer({ guide, campaign }) {
  const [activeTab, setActiveTab] = useState('essential')

  // guide나 campaign 둘 다 없으면 렌더링 하지 않음
  if (!guide && !campaign) {
    return null
  }

  // 텍스트 형식인 경우 JSON 파싱 시도
  let parsedGuide = guide
  if (typeof guide === 'string') {
    try {
      parsedGuide = JSON.parse(guide)
    } catch (e) {
      parsedGuide = null
    }
  }

  // parsedGuide가 없으면 빈 객체로 초기화
  parsedGuide = parsedGuide || {}

  // shooting_scenes 구조 (레거시 지원)
  const hasShootingScenes = parsedGuide.shooting_scenes && parsedGuide.shooting_scenes.length > 0

  // 새로운 가이드 구조 (CampaignGuideEditor에서 저장된 데이터)
  const hasNewGuideStructure = parsedGuide.hookingPoint || parsedGuide.coreMessage || parsedGuide.missions

  // 미션 라벨 매핑
  const missionLabels = {
    beforeAfter: 'Before & After 보여주기',
    productCloseup: '제품 사용 장면 클로즈업',
    productTexture: '제품 텍스처 보여주기',
    storeVisit: '올리브영 매장 방문 인증',
    weeklyReview: '7일 사용 후기 기록',
    priceInfo: '가격/혜택 정보 언급',
    purchaseLink: '구매 링크 유도'
  }

  // 금지 사항 라벨 매핑
  const prohibitionLabels = {
    competitorMention: '경쟁사 제품 언급 금지',
    exaggeratedClaims: '과장된 효능/효과 표현 금지',
    medicalMisrepresentation: '의약품 오인 표현 금지',
    priceOutOfSale: '세일 기간 외 가격 언급 금지',
    negativeExpression: '부정적 표현 사용 금지',
    other: '기타'
  }

  // 영상 길이 라벨 매핑
  const videoLengthLabels = {
    '15sec': '15초 이내',
    '30sec': '30초 내외',
    '45sec': '45초 내외',
    '60sec': '60초 내외'
  }

  // 영상 속도 라벨 매핑
  const videoTempoLabels = {
    'fast': '빠른 전개',
    'normal': '보통',
    'slow': '느림'
  }

  // 선택된 미션 가져오기
  const getSelectedMissions = () => {
    if (!parsedGuide.missions) return []
    return Object.entries(parsedGuide.missions)
      .filter(([key, value]) => value === true)
      .map(([key]) => missionLabels[key] || key)
  }

  // 선택된 금지 사항 가져오기
  const getSelectedProhibitions = () => {
    if (!parsedGuide.prohibitions) return []
    const prohibitions = Object.entries(parsedGuide.prohibitions)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => prohibitionLabels[key] || key)

    // 기타 금지 사항 추가
    if (parsedGuide.prohibitions.other && parsedGuide.prohibitionOtherText) {
      prohibitions.push(`기타: ${parsedGuide.prohibitionOtherText}`)
    }

    return prohibitions
  }

  // 탭 정의
  const tabs = [
    { id: 'essential', label: '🎯 필수 입력' },
    { id: 'mission', label: '✅ 필수 미션' },
    { id: 'prohibited', label: '🚫 금지 사항' },
    { id: 'settings', label: '⚙️ 영상 설정' }
  ]

  // 탭별 컨텐츠 렌더링
  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'essential':
        // 필수 입력 = 1초 후킹 포인트 / 핵심 메시지
        return (
          <div className="space-y-4">
            {/* 1초 후킹 포인트 */}
            {parsedGuide.hookingPoint && (
              <div>
                <h6 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <span>⚡</span> 1초 후킹 포인트
                </h6>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-base text-purple-900 font-medium">"{parsedGuide.hookingPoint}"</p>
                </div>
              </div>
            )}

            {/* 핵심 메시지 */}
            {parsedGuide.coreMessage && (
              <div>
                <h6 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <span>💬</span> 핵심 메시지
                </h6>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-sm text-indigo-900 leading-relaxed">{parsedGuide.coreMessage}</p>
                </div>
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!parsedGuide.hookingPoint && !parsedGuide.coreMessage && (
              <p className="text-sm text-gray-500 italic">등록된 필수 입력 사항이 없습니다.</p>
            )}
          </div>
        )

      case 'mission':
        // 필수 미션
        const selectedMissions = getSelectedMissions()
        return (
          <div className="space-y-3">
            {selectedMissions.length > 0 ? (
              <div>
                <h6 className="text-sm font-semibold text-green-800 mb-3">크리에이터가 반드시 수행해야 할 미션</h6>
                <ul className="space-y-2">
                  {selectedMissions.map((mission, idx) => (
                    <li key={idx} className="flex items-center bg-green-50 rounded-lg p-3 border border-green-200">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold mr-3">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-green-900">{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">등록된 필수 미션이 없습니다.</p>
            )}
          </div>
        )

      case 'prohibited':
        // 금지 사항
        const selectedProhibitions = getSelectedProhibitions()
        return (
          <div className="space-y-3">
            {selectedProhibitions.length > 0 ? (
              <div>
                <h6 className="text-sm font-semibold text-red-800 mb-3">크리에이터가 절대 하면 안 되는 것들</h6>
                <ul className="space-y-2">
                  {selectedProhibitions.map((prohibition, idx) => (
                    <li key={idx} className="flex items-center bg-red-50 rounded-lg p-3 border border-red-200">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-3"></span>
                      <span className="text-sm text-red-900">{prohibition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">등록된 금지 사항이 없습니다.</p>
            )}

            {/* 필수 준수 사항 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <h6 className="text-sm font-semibold text-amber-800 mb-3">⚠️ 필수 준수 사항</h6>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="text-sm text-amber-900">
                  <span className="font-medium">마감일 엄수:</span> 지정된 영상 제출 마감일을 반드시 지켜주세요.
                </li>
                <li className="text-sm text-amber-900">
                  <span className="font-medium">정확한 제품 정보:</span> 가이드에 맞게 제품 정보를 정확하게 반영해야 합니다.
                </li>
                <li className="text-sm text-amber-900">
                  <span className="font-medium">기업 검수:</span> 제작된 영상은 브랜드의 검수를 거칩니다.
                </li>
              </ol>
            </div>
          </div>
        )

      case 'settings':
        // 영상 설정
        return (
          <div className="space-y-4">
            {/* 해시태그 */}
            {parsedGuide.hashtags && parsedGuide.hashtags.filter(h => h).length > 0 && (
              <div>
                <h6 className="text-sm font-semibold text-blue-800 mb-2">🏷️ 해시태그</h6>
                <div className="flex flex-wrap gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  {parsedGuide.hashtags.filter(h => h).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 영상 설정 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 영상 길이 */}
              {parsedGuide.videoLength && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <h6 className="text-xs font-semibold text-purple-800 mb-1">⏱️ 영상 길이</h6>
                  <p className="text-sm font-medium text-purple-900">
                    {videoLengthLabels[parsedGuide.videoLength] || parsedGuide.videoLength}
                  </p>
                </div>
              )}

              {/* 영상 속도 */}
              {parsedGuide.videoTempo && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h6 className="text-xs font-semibold text-green-800 mb-1">🎵 영상 속도</h6>
                  <p className="text-sm font-medium text-green-900">
                    {videoTempoLabels[parsedGuide.videoTempo] || parsedGuide.videoTempo}
                  </p>
                </div>
              )}

              {/* 나레이션 여부 */}
              {parsedGuide.hasNarration !== undefined && parsedGuide.hasNarration !== null && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h6 className="text-xs font-semibold text-orange-800 mb-1">🎙️ 나레이션</h6>
                  <p className="text-sm font-medium text-orange-900">
                    {parsedGuide.hasNarration ? '있음' : '없음'}
                  </p>
                </div>
              )}

              {/* 파트너십 코드 */}
              {parsedGuide.needsPartnershipCode !== undefined && parsedGuide.needsPartnershipCode !== null && (
                <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                  <h6 className="text-xs font-semibold text-pink-800 mb-1">📢 파트너십 광고 코드</h6>
                  <p className="text-sm font-medium text-pink-900">
                    {parsedGuide.needsPartnershipCode ? '필요' : '불필요'}
                  </p>
                </div>
              )}
            </div>

            {/* 레퍼런스 URL */}
            {parsedGuide.referenceUrl && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h6 className="text-xs font-semibold text-gray-800 mb-1">🔗 레퍼런스 영상</h6>
                <a
                  href={parsedGuide.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {parsedGuide.referenceUrl}
                </a>
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!parsedGuide.hashtags?.filter(h => h).length &&
             !parsedGuide.videoLength &&
             !parsedGuide.videoTempo &&
             parsedGuide.hasNarration === undefined &&
             !parsedGuide.referenceUrl && (
              <p className="text-sm text-gray-500 italic">등록된 영상 설정이 없습니다.</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // 데이터가 전혀 없으면 렌더링 안 함
  const hasAnyData = hasNewGuideStructure || hasShootingScenes ||
    parsedGuide.videoLength ||
    parsedGuide.hashtags?.filter(h => h).length > 0

  if (!hasAnyData) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3 md:p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <h5 className="text-sm font-semibold text-purple-800">맞춤형 촬영 가이드</h5>
      </div>

      <p className="text-xs text-purple-700 mb-4">
        이 가이드는 기업에서 등록한 촬영 가이드입니다. 아래 가이드를 참고하여 콘텐츠를 제작해주세요.
      </p>

      {/* 탭 네비게이션 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-purple-200 hover:bg-purple-50 hover:border-purple-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg p-3 md:p-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}
