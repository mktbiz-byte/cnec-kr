import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle, FileText,
  Upload, Target, Loader2, Calendar, Truck, Camera,
  Eye, X, BookOpen, Video
} from 'lucide-react'

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

      // 캠페인 정보 별도 조회 (가이드 관련 필드 포함)
      let applicationsData = appsData || []
      if (applicationsData.length > 0) {
        const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select(`
              id, title, brand, image_url, reward_points, creator_points_override,
              application_deadline, content_submission_deadline, campaign_type, product_shipping_date,
              ai_generated_guide, oliveyoung_step1_guide_ai, oliveyoung_step2_guide_ai, oliveyoung_step3_guide_ai,
              challenge_weekly_guides_ai, step1_deadline, step2_deadline, step3_deadline,
              week1_deadline, week2_deadline, week3_deadline, week4_deadline,
              start_date, end_date
            `)
            .in('id', campaignIds)

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
                                onClick={() => navigate(`/submit-video/${app.campaigns?.id}`)}
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
                                onClick={() => navigate(`/submit-oliveyoung-video/${app.campaigns?.id}?step=1`)}
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
                                onClick={() => navigate(`/submit-video/${app.campaigns?.id}`)}
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
                                onClick={() => navigate(`/submit-video/${app.campaigns?.id}`)}
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
                          onClick={() => navigate(`/submit-video/${app.campaigns?.id}`)}
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

      {/* 가이드 모달 */}
      {showGuideModal && selectedGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {selectedGuide.type === 'planned' && '📝 기획형 촬영 가이드'}
                {selectedGuide.type === 'oliveyoung' && '🛒 올리브영 촬영 가이드'}
                {selectedGuide.type === '4week_challenge' && '📅 4주 챌린지 가이드'}
                {selectedGuide.type === 'general' && '📋 촬영 가이드'}
              </h3>
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 캠페인 정보 */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">캠페인</p>
                <p className="font-semibold text-gray-900">{selectedGuide.campaigns?.title}</p>
                <p className="text-sm text-gray-600">{selectedGuide.campaigns?.brand}</p>
              </div>

              {/* 기획형 가이드 내용 */}
              {selectedGuide.type === 'planned' && selectedGuide.personalized_guide && (
                <div className="space-y-3">
                  {typeof selectedGuide.personalized_guide === 'object' ? (
                    Object.entries(selectedGuide.personalized_guide).map(([key, value]) => (
                      <div key={key} className="bg-purple-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-purple-700 mb-1">{key}</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedGuide.personalized_guide}</p>
                    </div>
                  )}
                  {selectedGuide.additional_message && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-yellow-700 mb-1">💬 추가 메시지</p>
                      <p className="text-sm text-gray-800">{selectedGuide.additional_message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 올리브영 가이드 내용 */}
              {selectedGuide.type === 'oliveyoung' && (
                <div className="space-y-3">
                  {selectedGuide.campaigns?.oliveyoung_step1_guide_ai && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">📹 1차 촬영 가이드</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedGuide.campaigns.oliveyoung_step1_guide_ai}</p>
                      {selectedGuide.campaigns?.step1_deadline && (
                        <p className="text-xs text-red-600 mt-2">마감: {new Date(selectedGuide.campaigns.step1_deadline).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  )}
                  {selectedGuide.campaigns?.oliveyoung_step2_guide_ai && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">📱 2차 촬영 가이드</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedGuide.campaigns.oliveyoung_step2_guide_ai}</p>
                      {selectedGuide.campaigns?.step2_deadline && (
                        <p className="text-xs text-red-600 mt-2">마감: {new Date(selectedGuide.campaigns.step2_deadline).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  )}
                  {selectedGuide.campaigns?.oliveyoung_step3_guide_ai && (
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-purple-700 mb-1">📱 3차 촬영 가이드</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedGuide.campaigns.oliveyoung_step3_guide_ai}</p>
                      {selectedGuide.campaigns?.step3_deadline && (
                        <p className="text-xs text-red-600 mt-2">마감: {new Date(selectedGuide.campaigns.step3_deadline).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4주 챌린지 가이드 내용 */}
              {selectedGuide.type === '4week_challenge' && selectedGuide.campaigns?.challenge_weekly_guides_ai && (
                <div className="space-y-3">
                  {(() => {
                    let guides = selectedGuide.campaigns.challenge_weekly_guides_ai
                    if (typeof guides === 'string') {
                      try { guides = JSON.parse(guides) } catch(e) { guides = null }
                    }
                    if (!guides) return <p className="text-sm text-gray-500">가이드 정보를 불러올 수 없습니다.</p>

                    const weekColors = ['bg-red-50 text-red-700', 'bg-orange-50 text-orange-700', 'bg-yellow-50 text-yellow-700', 'bg-green-50 text-green-700']
                    const weekDeadlines = [
                      selectedGuide.campaigns?.week1_deadline,
                      selectedGuide.campaigns?.week2_deadline,
                      selectedGuide.campaigns?.week3_deadline,
                      selectedGuide.campaigns?.week4_deadline
                    ]

                    return Array.isArray(guides) ? guides.map((guide, idx) => (
                      <div key={idx} className={`${weekColors[idx]?.split(' ')[0] || 'bg-gray-50'} rounded-xl p-3`}>
                        <p className={`text-xs font-semibold ${weekColors[idx]?.split(' ')[1] || 'text-gray-700'} mb-1`}>
                          📅 {idx + 1}주차 가이드
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{guide}</p>
                        {weekDeadlines[idx] && (
                          <p className="text-xs text-red-600 mt-2">마감: {new Date(weekDeadlines[idx]).toLocaleDateString('ko-KR')}</p>
                        )}
                      </div>
                    )) : (
                      <div className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{JSON.stringify(guides)}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 일반 가이드 내용 */}
              {selectedGuide.type === 'general' && selectedGuide.ai_generated_guide && (
                <div className="space-y-3">
                  {(() => {
                    let guide = selectedGuide.ai_generated_guide
                    if (typeof guide === 'string') {
                      try { guide = JSON.parse(guide) } catch(e) {}
                    }

                    if (typeof guide === 'object' && guide !== null) {
                      return Object.entries(guide).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1">{key}</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {Array.isArray(value) ? value.join('\n• ') : value}
                          </p>
                        </div>
                      ))
                    }
                    return (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{guide}</p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 마감일 정보 */}
              {(selectedGuide.campaigns?.start_date || selectedGuide.campaigns?.end_date) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-2">⏰ 마감일 안내</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedGuide.campaigns?.start_date && (
                      <div>
                        <p className="text-gray-500 text-xs">영상 촬영 마감</p>
                        <p className="font-semibold text-red-600">{new Date(selectedGuide.campaigns.start_date).toLocaleDateString('ko-KR')}</p>
                      </div>
                    )}
                    {selectedGuide.campaigns?.end_date && (
                      <div>
                        <p className="text-gray-500 text-xs">SNS 업로드 마감</p>
                        <p className="font-semibold text-orange-600">{new Date(selectedGuide.campaigns.end_date).toLocaleDateString('ko-KR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationsPage
