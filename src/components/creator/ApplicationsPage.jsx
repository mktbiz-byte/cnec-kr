import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle, FileText,
  Upload, Target, Loader2, Calendar, Truck, Camera,
  Eye, X, BookOpen, Video, CheckCircle2, AlertCircle,
  Play, Copy, Gift
} from 'lucide-react'

// 안전하게 값을 문자열로 변환하는 헬퍼 함수
const renderValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(item => renderValue(item)).join('\n• ')
  }
  if (typeof value === 'object') {
    // 객체인 경우 각 키-값을 문자열로 변환
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${renderValue(v)}`)
      .join('\n')
  }
  return String(value)
}

const ApplicationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0
  })
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState(null)

  const filters = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '신청중' },
    { id: 'approved', label: '선정됨' },
    { id: 'inProgress', label: '진행중' },
    { id: 'completed', label: '완료' }
  ]

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    try {
      setLoading(true)

      // 지원 내역 가져오기 (조인 대신 별도 쿼리)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (appsError) {
        console.error('Applications 로드 오류:', appsError)
      }

      // 캠페인 정보 별도 조회
      let applicationsData = appsData || []
      if (applicationsData.length > 0) {
        const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          // 기본 필드만 먼저 조회 (안전한 쿼리)
          const { data: campaignsData, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIds)

          if (campaignsError) {
            console.error('캠페인 데이터 로드 오류:', campaignsError)
          }

          // 캠페인 데이터 병합
          applicationsData = applicationsData.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null
          }))
        }
      }

      setApplications(applicationsData)

      // 카운트 계산
      const all = applicationsData?.length || 0
      const pending = applicationsData?.filter(a => a.status === 'pending').length || 0
      const approved = applicationsData?.filter(a =>
        ['approved', 'selected', 'virtual_selected'].includes(a.status)
      ).length || 0
      const inProgress = applicationsData?.filter(a =>
        ['filming', 'video_submitted'].includes(a.status)
      ).length || 0
      const completed = applicationsData?.filter(a =>
        ['completed', 'paid'].includes(a.status)
      ).length || 0

      setCounts({ all, pending, approved, inProgress, completed })

    } catch (error) {
      console.error('지원 내역 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredApplications = () => {
    switch (activeFilter) {
      case 'pending':
        return applications.filter(a => a.status === 'pending')
      case 'approved':
        return applications.filter(a =>
          ['approved', 'selected', 'virtual_selected'].includes(a.status)
        )
      case 'inProgress':
        return applications.filter(a =>
          ['filming', 'video_submitted'].includes(a.status)
        )
      case 'completed':
        return applications.filter(a =>
          ['completed', 'paid'].includes(a.status)
        )
      default:
        return applications
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: '선정 대기중', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'approved':
      case 'selected':
        return { label: '선정됨', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'virtual_selected':
        return { label: '가선정', color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
      case 'filming':
        return { label: '촬영 진행중', color: 'bg-orange-100 text-orange-700', icon: Camera }
      case 'video_submitted':
        return { label: '영상 제출됨', color: 'bg-purple-100 text-purple-700', icon: Upload }
      case 'completed':
        return { label: '완료', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
      case 'paid':
        return { label: '정산완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
      case 'rejected':
        return { label: '미선정', color: 'bg-red-100 text-red-700', icon: null }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: null }
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDDay = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))

    if (diff < 0) return { text: '마감', urgent: true }
    if (diff === 0) return { text: 'D-Day', urgent: true }
    if (diff <= 3) return { text: `D-${diff}`, urgent: true }
    return { text: `D-${diff}`, urgent: false }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  // 영상 업로드 페이지 이동 (캠페인 데이터 검증 포함)
  const handleVideoUpload = (app, type = 'regular') => {
    if (!app.campaigns?.id) {
      alert('캠페인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    switch (type) {
      case 'oliveyoung':
        navigate(`/submit-oliveyoung-video/${app.campaigns.id}?step=1`)
        break
      case '4week':
        navigate(`/submit-4week-video/${app.campaigns.id}`)
        break
      default:
        navigate(`/submit-video/${app.campaigns.id}`)
    }
  }

  const filteredApps = getFilteredApplications()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">지원 내역</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* 상태 플로우 시각화 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
              <p className="text-xs text-gray-500 mt-1">신청</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-violet-600">{counts.approved}</p>
              <p className="text-xs text-gray-500 mt-1">선정</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-amber-500">{counts.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">진행중</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-emerald-500">{counts.completed}</p>
              <p className="text-xs text-gray-500 mt-1">완료</p>
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter.label}
              {filter.id !== 'all' && (
                <span className="ml-1 opacity-70">
                  {counts[filter.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 캠페인 목록 */}
        <div className="space-y-3">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                {activeFilter === 'all'
                  ? '아직 지원한 캠페인이 없습니다'
                  : '해당 상태의 캠페인이 없습니다'
                }
              </p>
            </div>
          ) : (
            filteredApps.map((app, idx) => {
              const statusInfo = getStatusInfo(app.status)
              const StatusIcon = statusInfo.icon
              const deadline = app.campaigns?.content_submission_deadline
              const dDay = getDDay(deadline)
              const reward = app.campaigns?.creator_points_override || app.campaigns?.reward_points

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    {/* 썸네일 */}
                    {app.campaigns?.image_url ? (
                      <img
                        src={app.campaigns.image_url}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <Target size={24} className="text-gray-300" />
                      </div>
                    )}

                    {/* 캠페인 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {dDay && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            dDay.urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {dDay.text}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mb-0.5">{app.campaigns?.brand}</p>
                      <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                        {app.campaigns?.title}
                      </p>

                      {/* 상태별 추가 정보 */}
                      {app.status === 'pending' && (
                        <p className="text-xs text-gray-400">
                          지원일: {formatDate(app.created_at)}
                        </p>
                      )}

                      {['approved', 'selected', 'virtual_selected'].includes(app.status) && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {app.campaigns?.product_shipping_date && (
                            <span className="flex items-center gap-1">
                              <Truck size={12} />
                              발송: {formatDate(app.campaigns.product_shipping_date)}
                            </span>
                          )}
                          {deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              마감: {formatDate(deadline)}
                            </span>
                          )}
                        </div>
                      )}

                      {['filming', 'video_submitted'].includes(app.status) && deadline && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Clock size={12} />
                          촬영 마감: {formatDate(deadline)}
                        </div>
                      )}

                      {['completed', 'paid'].includes(app.status) && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            완료일: {formatDate(app.updated_at)}
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            +{formatCurrency(reward)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 선정됨/진행중 상태일 때 가이드 및 액션 버튼 */}
                  {['approved', 'selected', 'virtual_selected', 'filming', 'video_submitted'].includes(app.status) && (
                    <div className="mt-3 space-y-2">
                      {/* 기획형 캠페인 가이드 */}
                      {app.campaigns?.campaign_type === 'planned' && app.personalized_guide && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-purple-600" />
                            <span className="text-xs font-semibold text-purple-900">촬영 가이드가 전달되었습니다</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                let guideData = app.personalized_guide
                                if (typeof guideData === 'string') {
                                  try { guideData = JSON.parse(guideData) } catch(e) {}
                                }
                                setSelectedGuide({
                                  type: 'planned',
                                  personalized_guide: guideData,
                                  additional_message: app.additional_message,
                                  campaigns: app.campaigns
                                })
                                setShowGuideModal(true)
                              }}
                              className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center justify-center gap-1"
                            >
                              <Eye size={12} /> 가이드 보기
                            </button>
                            {app.status === 'filming' && (
                              <button
                                onClick={() => handleVideoUpload(app)}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                              >
                                <Video size={12} /> 영상 업로드
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 올리브영 캠페인 가이드 */}
                      {app.campaigns?.campaign_type === 'oliveyoung' && (app.campaigns?.oliveyoung_step1_guide_ai || app.campaigns?.oliveyoung_step2_guide_ai) && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-900">올리브영 촬영 가이드</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedGuide({
                                  type: 'oliveyoung',
                                  campaigns: app.campaigns
                                })
                                setShowGuideModal(true)
                              }}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                            >
                              <Eye size={12} /> 가이드 보기
                            </button>
                            {['filming', 'approved', 'selected'].includes(app.status) && (
                              <button
                                onClick={() => handleVideoUpload(app, 'oliveyoung')}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                              >
                                영상 업로드
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4주 챌린지 캠페인 가이드 */}
                      {app.campaigns?.campaign_type === '4week_challenge' && app.campaigns?.challenge_weekly_guides_ai && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-900">4주 챌린지 가이드</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedGuide({
                                  type: '4week_challenge',
                                  campaigns: app.campaigns
                                })
                                setShowGuideModal(true)
                              }}
                              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1"
                            >
                              <Eye size={12} /> 가이드 보기
                            </button>
                            {['filming', 'approved', 'selected'].includes(app.status) && (
                              <button
                                onClick={() => handleVideoUpload(app)}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                              >
                                <Video size={12} /> 영상 업로드
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 일반 캠페인 - 가이드가 없는 경우 기본 버튼 */}
                      {!app.personalized_guide &&
                       !app.campaigns?.oliveyoung_step1_guide_ai &&
                       !app.campaigns?.challenge_weekly_guides_ai &&
                       app.campaigns?.ai_generated_guide && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-gray-600" />
                            <span className="text-xs font-semibold text-gray-900">촬영 가이드</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedGuide({
                                  type: 'general',
                                  ai_generated_guide: app.campaigns?.ai_generated_guide,
                                  campaigns: app.campaigns
                                })
                                setShowGuideModal(true)
                              }}
                              className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-gray-800 flex items-center justify-center gap-1"
                            >
                              <Eye size={12} /> 가이드 보기
                            </button>
                            {app.status === 'filming' && (
                              <button
                                onClick={() => handleVideoUpload(app)}
                                className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 flex items-center justify-center gap-1"
                              >
                                <Video size={12} /> 영상 업로드
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 가이드 없이 filming 상태인 경우 기본 업로드 버튼 */}
                      {app.status === 'filming' &&
                       !app.personalized_guide &&
                       !app.campaigns?.oliveyoung_step1_guide_ai &&
                       !app.campaigns?.challenge_weekly_guides_ai &&
                       !app.campaigns?.ai_generated_guide && (
                        <button
                          onClick={() => handleVideoUpload(app)}
                          className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Video size={14} /> 영상 업로드하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 가이드 모달 - 새로운 디자인 */}
      {showGuideModal && selectedGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">

            {/* 히어로 헤더 */}
            <div className="relative bg-gradient-to-br from-purple-600 to-indigo-700 p-6 pb-8">
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white">
                  {selectedGuide.type === 'planned' && '기획형'}
                  {selectedGuide.type === 'oliveyoung' && '올리브영'}
                  {selectedGuide.type === '4week_challenge' && '4주 챌린지'}
                  {selectedGuide.type === 'general' && '일반'}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white leading-tight mb-1">
                촬영 가이드
              </h2>
              <p className="text-white/70 text-sm">{selectedGuide.campaigns?.brand}</p>

              {/* 캠페인 제목 뱃지 */}
              <div className="mt-4 inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1 pr-4">
                <div className="bg-gradient-to-br from-purple-300 to-purple-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                  <Video size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-white/60 font-medium">캠페인</span>
                  <p className="text-sm font-bold text-white truncate">{selectedGuide.campaigns?.title}</p>
                </div>
              </div>
            </div>

            {/* 스크롤 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-gray-50">

              {/* 기획형 가이드 내용 */}
              {selectedGuide.type === 'planned' && selectedGuide.personalized_guide && (
                <>
                  {(() => {
                    const guideData = selectedGuide.personalized_guide
                    const isObject = typeof guideData === 'object' && guideData !== null

                    // 가이드 섹션들을 카드로 분리
                    const renderGuideSection = (key, value, colorScheme) => {
                      const colors = {
                        blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-500', title: 'text-blue-900', bullet: 'bg-blue-400' },
                        green: { bg: 'bg-green-50', border: 'border-green-100', icon: 'bg-green-500', title: 'text-green-900', bullet: 'bg-green-400' },
                        purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-500', title: 'text-purple-900', bullet: 'bg-purple-400' },
                        orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-500', title: 'text-orange-900', bullet: 'bg-orange-400' },
                      }
                      const c = colors[colorScheme] || colors.purple
                      const valueStr = renderValue(value)
                      const lines = valueStr.split('\n').filter(l => l.trim())

                      return (
                        <div key={key} className={`relative group overflow-hidden rounded-3xl ${c.bg} border ${c.border} p-5`}>
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Video size={80} className="text-gray-900" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`${c.icon} text-white p-1.5 rounded-lg shadow-sm`}>
                                <CheckCircle2 size={16} strokeWidth={3} />
                              </div>
                              <span className={`font-bold ${c.title} text-base`}>{key}</span>
                            </div>
                            <ul className="space-y-2.5">
                              {lines.map((line, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                                  <span className={`mt-1.5 w-1.5 h-1.5 ${c.bullet} rounded-full flex-shrink-0`} />
                                  <span className="whitespace-pre-wrap">{line.replace(/^[•\-]\s*/, '')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    }

                    if (isObject) {
                      const entries = Object.entries(guideData)
                      const colorOrder = ['blue', 'green', 'purple', 'orange']
                      return entries.map(([key, value], idx) =>
                        renderGuideSection(key, value, colorOrder[idx % colorOrder.length])
                      )
                    }

                    return (
                      <div className="relative overflow-hidden rounded-3xl bg-purple-50 border border-purple-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-purple-500 text-white p-1.5 rounded-lg shadow-sm">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                          <span className="font-bold text-purple-900 text-base">촬영 가이드</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(guideData)}</p>
                      </div>
                    )
                  })()}

                  {/* 추가 메시지 */}
                  {selectedGuide.additional_message && (
                    <div className="rounded-3xl bg-yellow-50 border border-yellow-200 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-yellow-500 text-white p-1.5 rounded-lg shadow-sm">
                          <AlertCircle size={16} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-yellow-900 text-base">추가 메시지</span>
                      </div>
                      <p className="text-sm text-yellow-800/80 font-medium">{renderValue(selectedGuide.additional_message)}</p>
                    </div>
                  )}
                </>
              )}

              {/* 올리브영 가이드 내용 */}
              {selectedGuide.type === 'oliveyoung' && (
                <div className="space-y-4">
                  {selectedGuide.campaigns?.oliveyoung_step1_guide_ai && (
                    <div className="relative overflow-hidden rounded-3xl bg-green-50 border border-green-100 p-5">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Video size={80} className="text-green-900" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-green-500 text-white p-1.5 rounded-lg shadow-sm">
                              <Play size={16} fill="white" />
                            </div>
                            <span className="font-bold text-green-900 text-base">1차 촬영 가이드</span>
                          </div>
                          {selectedGuide.campaigns?.step1_deadline && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                              ~ {new Date(selectedGuide.campaigns.step1_deadline).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(selectedGuide.campaigns.oliveyoung_step1_guide_ai)}</p>
                      </div>
                    </div>
                  )}

                  {selectedGuide.campaigns?.oliveyoung_step2_guide_ai && (
                    <div className="relative overflow-hidden rounded-3xl bg-blue-50 border border-blue-100 p-5">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Video size={80} className="text-blue-900" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm">
                              <Play size={16} fill="white" />
                            </div>
                            <span className="font-bold text-blue-900 text-base">2차 촬영 가이드</span>
                          </div>
                          {selectedGuide.campaigns?.step2_deadline && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                              ~ {new Date(selectedGuide.campaigns.step2_deadline).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(selectedGuide.campaigns.oliveyoung_step2_guide_ai)}</p>
                      </div>
                    </div>
                  )}

                  {selectedGuide.campaigns?.oliveyoung_step3_guide_ai && (
                    <div className="relative overflow-hidden rounded-3xl bg-purple-50 border border-purple-100 p-5">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Video size={80} className="text-purple-900" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-500 text-white p-1.5 rounded-lg shadow-sm">
                              <Play size={16} fill="white" />
                            </div>
                            <span className="font-bold text-purple-900 text-base">3차 촬영 가이드</span>
                          </div>
                          {selectedGuide.campaigns?.step3_deadline && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                              ~ {new Date(selectedGuide.campaigns.step3_deadline).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(selectedGuide.campaigns.oliveyoung_step3_guide_ai)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4주 챌린지 가이드 내용 */}
              {selectedGuide.type === '4week_challenge' && selectedGuide.campaigns?.challenge_weekly_guides_ai && (
                <div className="space-y-4">
                  {(() => {
                    let guides = selectedGuide.campaigns.challenge_weekly_guides_ai
                    if (typeof guides === 'string') {
                      try { guides = JSON.parse(guides) } catch(e) { guides = null }
                    }
                    if (!guides) return <p className="text-sm text-gray-500 text-center py-8">가이드 정보를 불러올 수 없습니다.</p>

                    const weekStyles = [
                      { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-500', title: 'text-red-900' },
                      { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-500', title: 'text-orange-900' },
                      { bg: 'bg-yellow-50', border: 'border-yellow-100', icon: 'bg-yellow-500', title: 'text-yellow-900' },
                      { bg: 'bg-green-50', border: 'border-green-100', icon: 'bg-green-500', title: 'text-green-900' }
                    ]
                    const weekDeadlines = [
                      selectedGuide.campaigns?.week1_deadline,
                      selectedGuide.campaigns?.week2_deadline,
                      selectedGuide.campaigns?.week3_deadline,
                      selectedGuide.campaigns?.week4_deadline
                    ]

                    return Array.isArray(guides) ? guides.map((guide, idx) => {
                      const style = weekStyles[idx] || weekStyles[3]
                      return (
                        <div key={idx} className={`relative overflow-hidden rounded-3xl ${style.bg} border ${style.border} p-5`}>
                          <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Calendar size={80} className="text-gray-900" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`${style.icon} text-white p-1.5 rounded-lg shadow-sm`}>
                                  <span className="text-xs font-black">{idx + 1}</span>
                                </div>
                                <span className={`font-bold ${style.title} text-base`}>{idx + 1}주차 가이드</span>
                              </div>
                              {weekDeadlines[idx] && (
                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                                  ~ {new Date(weekDeadlines[idx]).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(guide)}</p>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="rounded-3xl bg-indigo-50 border border-indigo-100 p-5">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{renderValue(guides)}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 일반 가이드 내용 */}
              {selectedGuide.type === 'general' && selectedGuide.ai_generated_guide && (
                <div className="space-y-4">
                  {(() => {
                    let guide = selectedGuide.ai_generated_guide
                    if (typeof guide === 'string') {
                      try { guide = JSON.parse(guide) } catch(e) {}
                    }

                    if (typeof guide === 'object' && guide !== null) {
                      const colorOrder = ['blue', 'green', 'purple', 'orange']
                      const colors = {
                        blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'bg-blue-500', title: 'text-blue-900' },
                        green: { bg: 'bg-green-50', border: 'border-green-100', icon: 'bg-green-500', title: 'text-green-900' },
                        purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-500', title: 'text-purple-900' },
                        orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-500', title: 'text-orange-900' },
                      }

                      return Object.entries(guide).map(([key, value], idx) => {
                        const c = colors[colorOrder[idx % colorOrder.length]]
                        return (
                          <div key={key} className={`relative overflow-hidden rounded-3xl ${c.bg} border ${c.border} p-5`}>
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Video size={80} className="text-gray-900" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`${c.icon} text-white p-1.5 rounded-lg shadow-sm`}>
                                  <CheckCircle2 size={16} strokeWidth={3} />
                                </div>
                                <span className={`font-bold ${c.title} text-base`}>{key}</span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderValue(value)}</p>
                            </div>
                          </div>
                        )
                      })
                    }
                    return (
                      <div className="rounded-3xl bg-gray-100 border border-gray-200 p-5">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{renderValue(guide)}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 마감일 정보 카드 */}
              {(selectedGuide.campaigns?.content_submission_deadline || selectedGuide.campaigns?.start_date || selectedGuide.campaigns?.end_date) && (
                <div className="rounded-3xl bg-red-50 border border-red-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-500 text-white p-1.5 rounded-lg shadow-sm">
                      <AlertCircle size={16} strokeWidth={3} />
                    </div>
                    <span className="font-bold text-red-900 text-base">마감일 안내</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedGuide.campaigns?.content_submission_deadline && (
                      <div className="bg-white rounded-2xl p-3 text-center border border-red-100">
                        <div className="text-red-400 mb-1"><Calendar size={18} className="mx-auto" /></div>
                        <div className="text-xs text-gray-500 mb-0.5">콘텐츠 제출</div>
                        <div className="text-sm font-bold text-red-600">
                          {new Date(selectedGuide.campaigns.content_submission_deadline).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                        </div>
                      </div>
                    )}
                    {selectedGuide.campaigns?.start_date && (
                      <div className="bg-white rounded-2xl p-3 text-center border border-red-100">
                        <div className="text-orange-400 mb-1"><Video size={18} className="mx-auto" /></div>
                        <div className="text-xs text-gray-500 mb-0.5">영상 촬영</div>
                        <div className="text-sm font-bold text-orange-600">
                          {new Date(selectedGuide.campaigns.start_date).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                        </div>
                      </div>
                    )}
                    {selectedGuide.campaigns?.end_date && (
                      <div className="bg-white rounded-2xl p-3 text-center border border-red-100">
                        <div className="text-purple-400 mb-1"><Upload size={18} className="mx-auto" /></div>
                        <div className="text-xs text-gray-500 mb-0.5">SNS 업로드</div>
                        <div className="text-sm font-bold text-purple-600">
                          {new Date(selectedGuide.campaigns.end_date).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 고정 버튼 */}
            <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom">
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="w-full bg-gray-900 text-white font-bold text-base py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                확인했어요
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationsPage
