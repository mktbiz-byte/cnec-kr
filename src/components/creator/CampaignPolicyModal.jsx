import React, { useState } from 'react'
import {
  X, AlertTriangle, Clock, FileText, ShieldAlert, Ban,
  ArrowDown, CheckCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react'

const STORAGE_KEY = 'campaign_policy_dismissed_until'

/** 24시간 보지 않기 체크 유틸 (컴포넌트 외부에서도 호출 가능) */
export function shouldShowPolicyPopup() {
  const dismissedUntil = localStorage.getItem(STORAGE_KEY)
  if (dismissedUntil && Date.now() < Number(dismissedUntil)) return false
  return true
}

/**
 * 캠페인 정책 및 패널티 안내 팝업
 * - autoMode=true: 메인 페이지에서 자동으로 뜸 (24시간 보지 않기 가능)
 * - autoMode=false: 마이페이지 배너 클릭 등으로 수동으로 열 때
 */
export default function CampaignPolicyModal({ isOpen, onClose, autoMode = false }) {
  const [expandedSection, setExpandedSection] = useState(null)

  if (!isOpen) return null

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleDismiss24h = () => {
    const until = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(STORAGE_KEY, String(until))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/60 z-[99998]" onClick={onClose} />

        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto z-[99999]">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={22} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">캠페인 활동 정책</h2>
                  <p className="text-xs text-gray-500">반드시 숙지해주세요</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* 1. 마감일 미준수 패널티 */}
            <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('deadline')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-900 text-sm">마감일 미준수 패널티</p>
                    <p className="text-xs text-red-600">영상 공유 마감일을 꼭 지켜주세요</p>
                  </div>
                </div>
                {expandedSection === 'deadline' ? (
                  <ChevronUp size={18} className="text-red-400" />
                ) : (
                  <ChevronDown size={18} className="text-red-400" />
                )}
              </button>

              {expandedSection === 'deadline' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-black text-yellow-700">1일</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">1일 지연</p>
                        <p className="text-sm text-red-600 font-semibold">보상금의 10% 차감</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown size={16} className="text-red-300" />
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-black text-orange-700">3일</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">3일 지연</p>
                        <p className="text-sm text-red-600 font-semibold">보상금의 30% 차감</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown size={16} className="text-red-300" />
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-black text-red-700">5일</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">5일 이상 지연</p>
                        <p className="text-sm text-red-700 font-bold">캠페인 취소 및 제품값 배상</p>
                        <p className="text-xs text-red-500 mt-0.5">제공된 제품 비용 전액 환수 조치</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. 가이드 미준수 */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('guide')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-amber-900 text-sm">촬영 가이드 미준수</p>
                    <p className="text-xs text-amber-600">가이드를 정확히 따라주세요</p>
                  </div>
                </div>
                {expandedSection === 'guide' ? (
                  <ChevronUp size={18} className="text-amber-400" />
                ) : (
                  <ChevronDown size={18} className="text-amber-400" />
                )}
              </button>

              {expandedSection === 'guide' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-amber-100">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">가이드 미준수 시</p>
                        <p className="text-sm text-amber-700 mt-1">기업 측에서 <span className="font-bold text-red-600">재촬영을 요구</span>할 수 있습니다.</p>
                        <p className="text-xs text-gray-500 mt-1">필수 멘트, 해시태그, 촬영 방법 등 가이드 내용을 반드시 확인 후 촬영해주세요.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-gray-500 font-medium mb-2">주요 확인 사항</p>
                    <ul className="space-y-1.5">
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        필수 멘트 및 브랜드명 정확히 노출
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        지정된 해시태그 모두 포함
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        영상 길이 및 형식 준수
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        제품 노출 시간 및 방법 확인
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 누적 미준수 제재 */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('penalty')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                    <Ban size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-violet-900 text-sm">누적 미준수 제재</p>
                    <p className="text-xs text-violet-600">반복 위반 시 활동이 제한됩니다</p>
                  </div>
                </div>
                {expandedSection === 'penalty' ? (
                  <ChevronUp size={18} className="text-violet-400" />
                ) : (
                  <ChevronDown size={18} className="text-violet-400" />
                )}
              </button>

              {expandedSection === 'penalty' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-amber-700">2회</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">2회 미준수</p>
                        <p className="text-sm text-amber-700 font-semibold">크리에이터 등급 강등 조치</p>
                        <p className="text-xs text-gray-500 mt-0.5">현재 등급에서 한 단계 아래로 강등됩니다.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown size={16} className="text-violet-300" />
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-red-700">3회</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">3회 이상 미준수</p>
                        <p className="text-sm text-red-700 font-bold">캠페인 지원 자격 박탈</p>
                        <p className="text-xs text-gray-500 mt-0.5">모든 캠페인 지원이 영구 제한됩니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 기타 주의사항 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('etc')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <Info size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-sm">기타 주의사항</p>
                    <p className="text-xs text-gray-500">꼭 확인해주세요</p>
                  </div>
                </div>
                {expandedSection === 'etc' ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === 'etc' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">1.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">SNS 업로드 전 검수 필수</p>
                        <p className="text-xs text-gray-600 mt-0.5">촬영 완료 후 SNS에 바로 올리지 마세요. 반드시 영상을 먼저 제출하고 기업의 검수 승인 후 업로드해야 합니다.</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">2.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">무단 영상 삭제 금지</p>
                        <p className="text-xs text-gray-600 mt-0.5">업로드된 캠페인 영상은 최소 30일간 유지해야 합니다. 기간 내 삭제 시 보상금 환수 및 패널티가 부과됩니다.</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">3.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">타사 경쟁 제품 노출 금지</p>
                        <p className="text-xs text-gray-600 mt-0.5">캠페인 영상 내 동일 카테고리의 경쟁 브랜드 제품 노출은 금지됩니다.</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">4.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">광고 표시 의무</p>
                        <p className="text-xs text-gray-600 mt-0.5">공정거래위원회 규정에 따라 "유료광고 포함" 또는 "협찬" 문구를 반드시 표기해야 합니다.</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">5.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">제품 수령 후 지원 취소 불가</p>
                        <p className="text-xs text-gray-600 mt-0.5">제품을 수령한 이후에는 캠페인 지원을 취소할 수 없으며, 취소 시 제품값을 배상해야 합니다.</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 flex items-start gap-2">
                      <span className="text-red-500 font-bold text-sm mt-0.5">6.</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">개인정보 및 영상 권리</p>
                        <p className="text-xs text-gray-600 mt-0.5">캠페인 영상은 브랜드 마케팅 목적으로 2차 활용될 수 있습니다. 이에 동의한 것으로 간주합니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 안내 문구 */}
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">
                위 정책을 위반할 경우 별도 통보 없이 즉시 조치될 수 있습니다.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                문의사항은 카카오톡 채널로 연락해주세요.
              </p>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-3xl space-y-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              확인했습니다
            </button>
            {autoMode && (
              <button
                onClick={handleDismiss24h}
                className="w-full py-2.5 text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
              >
                24시간 동안 보지 않기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
