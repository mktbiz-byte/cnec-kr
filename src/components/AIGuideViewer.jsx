import React, { useState } from 'react'

/**
 * 탭 기반 AI 가이드 뷰어 컴포넌트
 * 제품소개 / 필수 포함사항 / 촬영 팁 / 영상컨셉 / 주의사항 탭으로 구분
 */
export default function AIGuideViewer({ guide }) {
  const [activeTab, setActiveTab] = useState('product')

  if (!guide) {
    return null
  }

  // 텍스트 형식인 경우 기존 방식으로 표시
  if (typeof guide === 'string') {
    try {
      // JSON 문자열인 경우 파싱 시도
      const parsed = JSON.parse(guide)
      guide = parsed
    } catch (e) {
      // 일반 텍스트인 경우 그대로 표시
      return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <h5 className="text-sm font-semibold text-purple-800">✨ AI 생성 가이드</h5>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{guide}</p>
          </div>
        </div>
      )
    }
  }

  // 탭 정의
  const tabs = [
    { id: 'product', label: '📝 제품소개' },
    { id: 'must', label: '✅ 필수 포함사항' },
    { id: 'filming', label: '🎥 촬영 팁' },
    { id: 'concept', label: '🎨 영상컨셉' },
    { id: 'caution', label: '⚠️ 주의사항' }
  ]

  // 탭별 컨텐츠 렌더링
  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'product':
        return (
          <div className="space-y-3">
            {guide.brand_info && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">브랜드 정보</h6>
                <div className="bg-gray-50 rounded p-3 space-y-1">
                  {guide.brand_info.brand && <p className="text-sm"><span className="font-medium">브랜드:</span> {guide.brand_info.brand}</p>}
                  {guide.brand_info.product && <p className="text-sm"><span className="font-medium">제품명:</span> {guide.brand_info.product}</p>}
                  {guide.brand_info.product_url && (
                    <p className="text-sm">
                      <span className="font-medium">URL:</span>{' '}
                      <a href={guide.brand_info.product_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {guide.brand_info.product_url}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
            {guide.product_intro && (
              <div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.product_intro}</p>
              </div>
            )}
          </div>
        )

      case 'must':
        return (
          <div className="space-y-3">
            {guide.must_include && Array.isArray(guide.must_include) && (
              <ul className="space-y-2">
                {guide.must_include.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-2 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {guide.must_include && typeof guide.must_include === 'string' && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.must_include}</p>
            )}
            {guide.shooting_scenes && Array.isArray(guide.shooting_scenes) && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">촬영 씬 구성</h6>
                <div className="space-y-2">
                  {guide.shooting_scenes.map((scene, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-purple-600 mb-1">씬 {scene.order}: {scene.scene_type}</p>
                      {scene.dialogue && <p className="text-sm text-gray-700">💬 {scene.dialogue}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'filming':
        return (
          <div className="space-y-3">
            {guide.filming_tips && Array.isArray(guide.filming_tips) && (
              <ul className="space-y-2">
                {guide.filming_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            )}
            {guide.filming_tips && typeof guide.filming_tips === 'string' && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.filming_tips}</p>
            )}
            {guide.shooting_scenes && Array.isArray(guide.shooting_scenes) && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">씬별 촬영 팁</h6>
                <div className="space-y-2">
                  {guide.shooting_scenes.filter(s => s.shooting_tip).map((scene, idx) => (
                    <div key={idx} className="bg-blue-50 rounded p-3">
                      <p className="text-xs font-medium text-blue-600 mb-1">씬 {scene.order}</p>
                      <p className="text-sm text-gray-700">{scene.shooting_tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'concept':
        return (
          <div className="space-y-3">
            {guide.video_concepts && Array.isArray(guide.video_concepts) && (
              <ul className="space-y-2">
                {guide.video_concepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 mr-2 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700 leading-relaxed">{concept}</span>
                  </li>
                ))}
              </ul>
            )}
            {guide.video_concepts && typeof guide.video_concepts === 'string' && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.video_concepts}</p>
            )}
            {guide.video_duration && (
              <div className="bg-pink-50 rounded p-3">
                <p className="text-sm"><span className="font-medium">영상 길이:</span> {guide.video_duration}</p>
              </div>
            )}
            {guide.target_platform && (
              <div className="bg-pink-50 rounded p-3">
                <p className="text-sm"><span className="font-medium">타겟 플랫폼:</span> {guide.target_platform}</p>
              </div>
            )}
          </div>
        )

      case 'caution':
        return (
          <div className="space-y-3">
            {guide.cautions && Array.isArray(guide.cautions) && (
              <ul className="space-y-2">
                {guide.cautions.map((caution, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-2 flex-shrink-0"></span>
                    <span className="text-sm text-gray-700 leading-relaxed">{caution}</span>
                  </li>
                ))}
              </ul>
            )}
            {guide.cautions && typeof guide.cautions === 'string' && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.cautions}</p>
            )}
            
            {/* 필수 사항 (항상 표시) */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h6 className="text-sm font-semibold text-red-800 mb-3">⚠️ 필수 사항</h6>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="text-sm text-red-900">
                  <span className="font-medium">마감일 엄수:</span> 지정된 영상 제출 마감일을 반드시 지켜주세요. 지연 시 패널티가 발생할 수 있습니다.
                </li>
                <li className="text-sm text-red-900">
                  <span className="font-medium">정확한 제품 정보:</span> 브랜드에서 제공한 제품 정보를 100% 정확하게 영상에 반영해야 합니다. 가이드에 맞지 않는 촬영 시 포인트 지급이 거부될 수 있습니다.
                </li>
                <li className="text-sm text-red-900">
                  <span className="font-medium">기업 검수:</span> 제작된 영상은 브랜드의 검수를 거치며, 수정이 가능합니다. 피드백을 명확히 확인하고 반영해주세요.
                </li>
              </ol>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <h5 className="text-sm font-semibold text-purple-800">✨ 당신만을 위한 맞춤형 촬영 가이드</h5>
      </div>

      <p className="text-xs text-purple-700 mb-4">
        이 가이드는 당신의 SNS 스타일과 콘텐츠 특성을 분석하여 맞춤 제작된 촬영 가이드입니다. 아래 가이드를 참고하여 콘텐츠를 제작해주세요.
      </p>

      {/* 탭 네비게이션 */}
      <div className="flex overflow-x-auto mb-4 border-b border-purple-200 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg p-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}
