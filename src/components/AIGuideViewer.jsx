import React, { useState } from 'react'

/**
 * 탭 기반 가이드 뷰어 컴포넌트
 * 기업이 등록한 크리에이터 가이드 내용을 표시
 * shooting_scenes 배열 구조를 파싱하여 탭별로 표시
 */
export default function AIGuideViewer({ guide, campaign }) {
  const [activeTab, setActiveTab] = useState('scenes')

  // guide나 campaign 둘 다 없으면 렌더링 하지 않음
  if (!guide && !campaign) {
    return null
  }

  // 텍스트 형식인 경우 JSON 파싱 시도
  if (typeof guide === 'string') {
    try {
      guide = JSON.parse(guide)
    } catch (e) {
      // 파싱 실패시 null로 설정 (raw text 표시 안 함)
      guide = null
    }
  }

  // guide가 없으면 빈 객체로 초기화
  guide = guide || {}

  // shooting_scenes 추출
  const scenes = guide.shooting_scenes || []

  // 후킹 장면 찾기 (scene_type에 "후킹" 포함)
  const hookingScenes = scenes.filter(s => s.scene_type?.includes('후킹'))

  // 대사(dialogue) 추출
  const dialogues = scenes.filter(s => s.dialogue).map(s => ({
    scene: s.scene_type,
    dialogue: s.dialogue
  }))

  // 촬영 팁 추출
  const shootingTips = scenes.filter(s => s.shooting_tip).map(s => ({
    scene: s.scene_type,
    tip: s.shooting_tip
  }))

  // 탭 정의
  const tabs = [
    { id: 'scenes', label: '🎬 촬영 씬' },
    { id: 'dialogues', label: '💬 필수 대사' },
    { id: 'tips', label: '📸 촬영 팁' },
    { id: 'settings', label: '⚙️ 영상 설정' }
  ]

  // 탭별 컨텐츠 렌더링
  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'scenes':
        // 촬영 씬 구성
        return (
          <div className="space-y-4">
            {scenes.length > 0 ? (
              scenes.map((scene, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">
                      {scene.order || idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-purple-800">
                      {scene.scene_type || `씬 ${idx + 1}`}
                    </span>
                  </div>

                  {scene.scene_description && (
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                      {scene.scene_description}
                    </p>
                  )}

                  {scene.dialogue && (
                    <div className="bg-blue-50 rounded p-2 mt-2 border-l-4 border-blue-400">
                      <p className="text-xs text-blue-600 font-medium mb-1">대사</p>
                      <p className="text-sm text-blue-900">"{scene.dialogue}"</p>
                    </div>
                  )}

                  {scene.shooting_tip && (
                    <div className="bg-amber-50 rounded p-2 mt-2 border-l-4 border-amber-400">
                      <p className="text-xs text-amber-600 font-medium mb-1">촬영 팁</p>
                      <p className="text-sm text-amber-900">{scene.shooting_tip}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">등록된 촬영 씬이 없습니다.</p>
            )}
          </div>
        )

      case 'dialogues':
        // 필수 대사
        return (
          <div className="space-y-3">
            {/* 후킹 포인트 대사 */}
            {hookingScenes.length > 0 && (
              <div>
                <h6 className="text-sm font-semibold text-purple-800 mb-2">🎯 후킹 포인트</h6>
                <div className="space-y-2">
                  {hookingScenes.map((scene, idx) => (
                    <div key={idx} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      {scene.scene_description && (
                        <p className="text-sm text-purple-900 mb-2">{scene.scene_description}</p>
                      )}
                      {scene.dialogue && (
                        <p className="text-sm font-medium text-purple-800">💬 "{scene.dialogue}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 모든 대사 목록 */}
            {dialogues.length > 0 ? (
              <div>
                <h6 className="text-sm font-semibold text-blue-800 mb-2">📝 전체 대사</h6>
                <ul className="space-y-2">
                  {dialogues.map((item, idx) => (
                    <li key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">{item.scene}</p>
                      <p className="text-sm text-blue-900">"{item.dialogue}"</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">등록된 필수 대사가 없습니다.</p>
            )}

            {/* campaign에서 required_dialogues */}
            {campaign?.required_dialogues && campaign.required_dialogues.length > 0 && (
              <div>
                <h6 className="text-sm font-semibold text-green-800 mb-2">✅ 추가 필수 대사</h6>
                <ul className="space-y-2 bg-green-50 rounded-lg p-3 border border-green-200">
                  {campaign.required_dialogues.map((dialogue, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm text-green-900">"{dialogue}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'tips':
        // 촬영 팁
        return (
          <div className="space-y-3">
            {shootingTips.length > 0 ? (
              <div className="space-y-2">
                {shootingTips.map((item, idx) => (
                  <div key={idx} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium mb-1">{item.scene}</p>
                    <p className="text-sm text-amber-900">{item.tip}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">등록된 촬영 팁이 없습니다.</p>
            )}

            {/* 필수 준수 사항 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h6 className="text-sm font-semibold text-red-800 mb-3">⚠️ 필수 준수 사항</h6>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="text-sm text-red-900">
                  <span className="font-medium">마감일 엄수:</span> 지정된 영상 제출 마감일을 반드시 지켜주세요.
                </li>
                <li className="text-sm text-red-900">
                  <span className="font-medium">정확한 제품 정보:</span> 가이드에 맞게 제품 정보를 정확하게 반영해야 합니다.
                </li>
                <li className="text-sm text-red-900">
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
            {/* 영상 설정 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 영상 길이 */}
              {(guide.video_duration || campaign?.video_duration) && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <h6 className="text-xs font-semibold text-purple-800 mb-1">⏱️ 영상 길이</h6>
                  <p className="text-sm font-medium text-purple-900">
                    {guide.video_duration || campaign?.video_duration}
                  </p>
                </div>
              )}

              {/* 타겟 플랫폼 */}
              {(guide.target_platform || campaign?.target_platforms) && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <h6 className="text-xs font-semibold text-indigo-800 mb-1">📱 타겟 플랫폼</h6>
                  <p className="text-sm font-medium text-indigo-900">
                    {guide.target_platform ||
                      (Array.isArray(campaign?.target_platforms)
                        ? campaign.target_platforms.join(', ')
                        : campaign?.target_platforms)}
                  </p>
                </div>
              )}

              {/* 영상 속도 */}
              {(guide.video_tempo || campaign?.video_tempo) && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h6 className="text-xs font-semibold text-green-800 mb-1">🎵 영상 속도</h6>
                  <p className="text-sm font-medium text-green-900">
                    {guide.video_tempo || campaign?.video_tempo}
                  </p>
                </div>
              )}

              {/* 나레이션 여부 */}
              {(guide.narration_required !== undefined || campaign?.narration_required !== undefined) && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h6 className="text-xs font-semibold text-orange-800 mb-1">🎙️ 나레이션</h6>
                  <p className="text-sm font-medium text-orange-900">
                    {(guide.narration_required ?? campaign?.narration_required) ? '필요' : '불필요'}
                  </p>
                </div>
              )}
            </div>

            {/* 해시태그 */}
            {(guide.hashtags || campaign?.required_hashtags) && (
              <div>
                <h6 className="text-sm font-semibold text-blue-800 mb-2">🏷️ 해시태그</h6>
                <div className="flex flex-wrap gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  {(Array.isArray(guide.hashtags) ? guide.hashtags :
                    Array.isArray(campaign?.required_hashtags) ? campaign.required_hashtags :
                    []).map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!guide.video_duration && !campaign?.video_duration &&
             !guide.target_platform && !campaign?.target_platforms &&
             !guide.hashtags && !campaign?.required_hashtags && (
              <p className="text-sm text-gray-500 italic">등록된 영상 설정이 없습니다.</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // 데이터가 전혀 없으면 렌더링 안 함
  const hasAnyData = scenes.length > 0 ||
    guide.video_duration ||
    guide.target_platform ||
    campaign?.required_dialogues?.length > 0 ||
    campaign?.video_duration ||
    campaign?.required_hashtags?.length > 0

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
