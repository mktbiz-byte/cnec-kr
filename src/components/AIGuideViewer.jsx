import React, { useState } from 'react'

/**
 * 탭 기반 가이드 뷰어 컴포넌트
 * 기업이 등록한 가이드 내용을 표시
 * 제품소개 / 필수 입력 / 필수 미션 / 금지 사항 / 영상 설정 탭으로 구분
 */
export default function AIGuideViewer({ guide, campaign }) {
  const [activeTab, setActiveTab] = useState('product')

  // guide나 campaign 둘 다 없으면 렌더링 하지 않음
  if (!guide && !campaign) {
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
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3 md:p-4 mb-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <h5 className="text-sm font-semibold text-purple-800">촬영 가이드</h5>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{guide}</p>
          </div>
        </div>
      )
    }
  }

  // guide가 없으면 빈 객체로 초기화
  guide = guide || {}

  // 영상 길이 변환 함수
  const translateVideoDuration = (duration) => {
    const durationMap = {
      'under_30s': '30초 미만',
      '30s_1min': '30초 ~ 1분',
      '1min_3min': '1분 ~ 3분',
      '3min_5min': '3분 ~ 5분',
      'over_5min': '5분 이상'
    }
    return durationMap[duration] || duration
  }

  // 영상 속도 변환 함수
  const translateVideoTempo = (tempo) => {
    const tempoMap = {
      'slow': '느리게',
      'normal': '보통',
      'fast': '빠르게',
      'very_fast': '매우 빠르게'
    }
    return tempoMap[tempo] || tempo
  }

  // 탭 정의 - 기업 등록 가이드 구조에 맞게 변경
  const tabs = [
    { id: 'product', label: '📝 제품소개' },
    { id: 'hooking', label: '🎯 필수 입력' },
    { id: 'mission', label: '✅ 필수 미션' },
    { id: 'prohibited', label: '🚫 금지 사항' },
    { id: 'video_settings', label: '🎬 영상 설정' }
  ]

  // 탭별 컨텐츠 렌더링
  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'product':
        // 제품소개 = 상품 정보 입력
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
            {(guide.product_intro || guide.product_info) && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">제품 소개</h6>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-3">
                  {guide.product_intro || guide.product_info}
                </p>
              </div>
            )}
            {campaign?.description && !guide.product_intro && !guide.product_info && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">캠페인 설명</h6>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-3">
                  {campaign.description}
                </p>
              </div>
            )}
            {!guide.product_intro && !guide.product_info && !campaign?.description && (
              <p className="text-sm text-gray-500 italic">등록된 제품소개가 없습니다.</p>
            )}
          </div>
        )

      case 'hooking':
        // 필수 입력 = 1초 후킹 포인트 / 핵심 메시지
        return (
          <div className="space-y-4">
            {/* 후킹 포인트 */}
            {(guide.hooking_point || guide.hooking_points) && (
              <div>
                <h6 className="text-sm font-semibold text-purple-800 mb-2">🎯 1초 후킹 포인트</h6>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  {Array.isArray(guide.hooking_point || guide.hooking_points) ? (
                    <ul className="space-y-2">
                      {(guide.hooking_point || guide.hooking_points).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-2 flex-shrink-0"></span>
                          <span className="text-sm text-purple-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-purple-900 whitespace-pre-wrap">{guide.hooking_point || guide.hooking_points}</p>
                  )}
                </div>
              </div>
            )}

            {/* 핵심 메시지 */}
            {(guide.core_message || guide.key_message) && (
              <div>
                <h6 className="text-sm font-semibold text-indigo-800 mb-2">💬 핵심 메시지</h6>
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  {Array.isArray(guide.core_message || guide.key_message) ? (
                    <ul className="space-y-2">
                      {(guide.core_message || guide.key_message).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2 flex-shrink-0"></span>
                          <span className="text-sm text-indigo-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-indigo-900 whitespace-pre-wrap">{guide.core_message || guide.key_message}</p>
                  )}
                </div>
              </div>
            )}

            {/* 필수 포함 사항 (must_include) */}
            {guide.must_include && (
              <div>
                <h6 className="text-sm font-semibold text-gray-800 mb-2">필수 포함 사항</h6>
                {Array.isArray(guide.must_include) ? (
                  <ul className="space-y-2 bg-gray-50 rounded-lg p-3">
                    {guide.must_include.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{guide.must_include}</p>
                )}
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!guide.hooking_point && !guide.hooking_points && !guide.core_message && !guide.key_message && !guide.must_include && (
              <p className="text-sm text-gray-500 italic">등록된 필수 입력 사항이 없습니다.</p>
            )}
          </div>
        )

      case 'mission':
        // 필수 미션
        return (
          <div className="space-y-3">
            {/* 미션 (가이드에서) */}
            {(guide.mission || guide.required_missions || campaign?.mission) && (
              <div>
                <h6 className="text-sm font-semibold text-green-800 mb-2">필수 미션</h6>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  {Array.isArray(guide.required_missions || guide.mission) ? (
                    <ul className="space-y-2">
                      {(guide.required_missions || guide.mission).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold mr-2 flex-shrink-0">{idx + 1}</span>
                          <span className="text-sm text-green-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-900 whitespace-pre-wrap">{guide.mission || guide.required_missions || campaign?.mission}</p>
                  )}
                </div>
              </div>
            )}

            {/* 필수 대사 */}
            {campaign?.required_dialogues && campaign.required_dialogues.length > 0 && (
              <div>
                <h6 className="text-sm font-semibold text-blue-800 mb-2">필수 대사</h6>
                <ul className="space-y-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  {campaign.required_dialogues.map((dialogue, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">💬</span>
                      <span className="text-sm text-blue-900">"{dialogue}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 필수 장면 */}
            {campaign?.required_scenes && campaign.required_scenes.length > 0 && (
              <div>
                <h6 className="text-sm font-semibold text-purple-800 mb-2">필수 장면</h6>
                <ul className="space-y-2 bg-purple-50 rounded-lg p-3 border border-purple-200">
                  {campaign.required_scenes.map((scene, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-purple-600 mr-2">🎬</span>
                      <span className="text-sm text-purple-900">{scene}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!guide.mission && !guide.required_missions && !campaign?.mission &&
             (!campaign?.required_dialogues || campaign.required_dialogues.length === 0) &&
             (!campaign?.required_scenes || campaign.required_scenes.length === 0) && (
              <p className="text-sm text-gray-500 italic">등록된 필수 미션이 없습니다.</p>
            )}
          </div>
        )

      case 'prohibited':
        // 금지 사항
        return (
          <div className="space-y-3">
            {(guide.prohibited_items || guide.cautions || guide.prohibited) && (
              <div>
                <h6 className="text-sm font-semibold text-red-800 mb-2">금지 사항</h6>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  {Array.isArray(guide.prohibited_items || guide.cautions || guide.prohibited) ? (
                    <ul className="space-y-2">
                      {(guide.prohibited_items || guide.cautions || guide.prohibited).map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-2 flex-shrink-0"></span>
                          <span className="text-sm text-red-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-900 whitespace-pre-wrap">{guide.prohibited_items || guide.cautions || guide.prohibited}</p>
                  )}
                </div>
              </div>
            )}

            {/* 필수 사항 (항상 표시) */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <h6 className="text-sm font-semibold text-amber-800 mb-3">⚠️ 필수 준수 사항</h6>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="text-sm text-amber-900">
                  <span className="font-medium">마감일 엄수:</span> 지정된 영상 제출 마감일을 반드시 지켜주세요.
                </li>
                <li className="text-sm text-amber-900">
                  <span className="font-medium">정확한 제품 정보:</span> 브랜드에서 제공한 제품 정보를 정확하게 반영해야 합니다.
                </li>
                <li className="text-sm text-amber-900">
                  <span className="font-medium">기업 검수:</span> 제작된 영상은 브랜드의 검수를 거치며, 수정 요청이 있을 수 있습니다.
                </li>
              </ol>
            </div>

            {!guide.prohibited_items && !guide.cautions && !guide.prohibited && (
              <p className="text-sm text-gray-500 italic">등록된 금지 사항이 없습니다.</p>
            )}
          </div>
        )

      case 'video_settings':
        // 영상 설정 = 해시태그, 영상 길이, 영상 속도, 나레이션 여부
        return (
          <div className="space-y-4">
            {/* 해시태그 */}
            {(guide.hashtags || campaign?.required_hashtags) && (
              <div>
                <h6 className="text-sm font-semibold text-blue-800 mb-2">🏷️ 자동 생성 해시태그</h6>
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

            {/* 영상 설정 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 영상 길이 */}
              {(guide.video_duration || campaign?.video_duration) && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <h6 className="text-xs font-semibold text-purple-800 mb-1">⏱️ 영상 길이</h6>
                  <p className="text-sm font-medium text-purple-900">
                    {translateVideoDuration(guide.video_duration || campaign?.video_duration)}
                  </p>
                </div>
              )}

              {/* 영상 속도 */}
              {(guide.video_tempo || guide.video_speed || campaign?.video_tempo) && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h6 className="text-xs font-semibold text-green-800 mb-1">🎵 영상 속도</h6>
                  <p className="text-sm font-medium text-green-900">
                    {translateVideoTempo(guide.video_tempo || guide.video_speed || campaign?.video_tempo)}
                  </p>
                </div>
              )}

              {/* 나레이션 여부 */}
              {(guide.narration_required !== undefined || guide.narration !== undefined || campaign?.narration_required !== undefined) && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h6 className="text-xs font-semibold text-orange-800 mb-1">🎙️ 나레이션 여부</h6>
                  <p className="text-sm font-medium text-orange-900">
                    {(guide.narration_required ?? guide.narration ?? campaign?.narration_required) ? '필요' : '불필요'}
                  </p>
                </div>
              )}
            </div>

            {/* 영상 톤 */}
            {(guide.video_tone || campaign?.video_tone) && (
              <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                <h6 className="text-xs font-semibold text-pink-800 mb-1">🎨 영상 톤</h6>
                <p className="text-sm font-medium text-pink-900">{guide.video_tone || campaign?.video_tone}</p>
              </div>
            )}

            {/* 타겟 플랫폼 */}
            {(guide.target_platform || campaign?.target_platforms) && (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <h6 className="text-xs font-semibold text-indigo-800 mb-1">📱 타겟 플랫폼</h6>
                <p className="text-sm font-medium text-indigo-900">{guide.target_platform ||
                  (Array.isArray(campaign?.target_platforms) ? campaign.target_platforms.join(', ') : campaign?.target_platforms)}</p>
              </div>
            )}

            {/* 데이터가 없을 경우 */}
            {!guide.hashtags && !campaign?.required_hashtags &&
             !guide.video_duration && !campaign?.video_duration &&
             !guide.video_tempo && !guide.video_speed && !campaign?.video_tempo &&
             guide.narration_required === undefined && guide.narration === undefined && campaign?.narration_required === undefined && (
              <p className="text-sm text-gray-500 italic">등록된 영상 설정이 없습니다.</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3 md:p-4 mb-4">
      {/* 헤더 */}
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <h5 className="text-sm font-semibold text-purple-800">맞춤형 촬영 가이드</h5>
      </div>

      <p className="text-xs text-purple-700 mb-4">
        이 가이드는 기업에서 등록한 촬영 가이드입니다. 아래 가이드를 참고하여 콘텐츠를 제작해주세요.
      </p>

      {/* 탭 네비게이션 - 그리드 레이아웃 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
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
