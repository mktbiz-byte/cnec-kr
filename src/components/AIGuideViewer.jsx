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
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h5 className="text-sm font-semibold text-purple-800">AI 생성 가이드</h5>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{guide}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'product', label: '📝 제품소개', field: 'product_intro' },
    { id: 'must', label: '✅ 필수 포함사항', field: 'must_include' },
    { id: 'filming', label: '🎥 촬영 팁', field: 'filming_tips' },
    { id: 'concept', label: '🎨 영상컨셉', field: 'video_concepts' },
    { id: 'caution', label: '⚠️ 주의사항', field: 'cautions' }
  ]

  // 데이터가 있는 탭만 필터링
  const availableTabs = tabs.filter(tab => {
    const data = guide[tab.field]
    return data && (typeof data === 'string' ? data.trim() : data.length > 0)
  })

  // 첫 번째 사용 가능한 탭을 기본값으로 설정
  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id)
    }
  }, [availableTabs, activeTab])

  if (availableTabs.length === 0) {
    return null
  }

  const renderContent = (tab) => {
    const data = guide[tab.field]
    
    if (!data) return null

    // 문자열인 경우
    if (typeof data === 'string') {
      return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data}</p>
    }

    // 배열인 경우
    if (Array.isArray(data)) {
      return (
        <ul className="space-y-2">
          {data.map((item, idx) => (
            <li key={idx} className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
    }

    return null
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg overflow-hidden mb-4">
      {/* 헤더 */}
      <div className="bg-white border-b border-purple-200 px-4 py-3">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h5 className="text-sm font-semibold text-purple-800">AI 생성 가이드</h5>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-purple-200 overflow-x-auto">
        <div className="flex min-w-max">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white border-b-2 border-purple-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white p-4">
        {availableTabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            {renderContent(tab)}
          </div>
        ))}
      </div>

      {/* 필수 사항 (항상 표시) */}
      <div className="bg-red-50 border-t-2 border-red-200 p-4">
        <h6 className="text-xs font-bold text-red-700 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          필수 사항
        </h6>
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-start">
            <span className="font-bold text-red-600 mr-2">1.</span>
            <span><span className="font-bold">마감일 엄수:</span> 지정된 영상 제출 마감일을 반드시 지켜주세요. 지연 시 패널티가 발생할 수 있습니다.</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-red-600 mr-2">2.</span>
            <span><span className="font-bold">정확한 제품 정보:</span> 브랜드에서 제공한 제품 정보를 100% 정확하게 영상에 반영해야 합니다. 가이드에 맞지 않는 촬영 시 포인트 지급이 거부될 수 있습니다.</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-red-600 mr-2">3.</span>
            <span><span className="font-bold">기업 검수:</span> 제작된 영상은 브랜드의 검수를 거치며, 수정이 가능합니다. 피드백을 명확히 확인하고 반영해주세요.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
