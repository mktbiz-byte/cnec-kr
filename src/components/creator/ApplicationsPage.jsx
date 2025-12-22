import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle, FileText,
  Upload, Target, Loader2, Calendar, Truck, Camera,
  Eye, X, BookOpen, Video, CheckCircle2, AlertCircle,
  Play, Copy, Gift, Zap, MessageSquare, Ban, Hash, Tag,
  ShoppingBag, Store, ExternalLink
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

  // SNS 업로드 관련 상태 (레거시 코드 기반)
  const [showSnsUploadModal, setShowSnsUploadModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [snsUploadForm, setSnsUploadForm] = useState({
    sns_upload_url: '',
    notes: '',
    step1_url: '',
    step2_url: '',
    step3_url: '',
    step1_2_video_folder: '',
    step3_video_folder: '',
    week1_url: '',
    week2_url: '',
    week3_url: '',
    week4_url: '',
    week1_video: '',
    week2_video: '',
    week3_video: '',
    week4_video: ''
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  // 지원 취소 (레거시 코드 기반)
  const handleCancelApplication = async (applicationId) => {
    if (!confirm('정말로 지원을 취소하시겠습니까?')) return
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id) // 보안: 자신의 지원만 삭제 가능
      if (error) throw error
      alert('지원이 취소되었습니다.')
      loadApplications() // 데이터 새로고침
    } catch (error) {
      console.error('Error canceling application:', error)
      alert('지원 취소에 실패했습니다.')
    }
  }

  // SNS 업로드 모달 열기
  const openSnsUploadModal = (app) => {
    setSelectedApplication(app)
    setSnsUploadForm({
      sns_upload_url: '',
      notes: '',
      step1_url: '',
      step2_url: '',
      step3_url: '',
      step1_2_video_folder: '',
      step3_video_folder: '',
      week1_url: '',
      week2_url: '',
      week3_url: '',
      week4_url: '',
      week1_video: '',
      week2_video: '',
      week3_video: '',
      week4_video: ''
    })
    setError('')
    setShowSnsUploadModal(true)
  }

  // 영상 파일 업로드 핸들러 (레거시 코드 기반)
  const handleSnsVideoUpload = async (e, step) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      setProcessing(true)
      setError('')

      // 폴더 경로 생성: creator-videos/{user_id}/{campaign_id}/{step}/
      const folderPath = `${user.id}/${selectedApplication.campaign_id}/${step}`

      // 각 파일 업로드
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${folderPath}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('creator-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError
        return filePath
      })

      await Promise.all(uploadPromises)

      // 업로드 성공 시 폴더 경로 저장
      if (step === 'step1_2') {
        setSnsUploadForm(prev => ({...prev, step1_2_video_folder: folderPath}))
      } else if (step === 'step3') {
        setSnsUploadForm(prev => ({...prev, step3_video_folder: folderPath}))
      } else if (step.startsWith('week')) {
        setSnsUploadForm(prev => ({...prev, [`${step}_video`]: folderPath}))
      }

      setSuccess(`영상이 업로드되었습니다.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('영상 업로드 오류:', err)
      setError('영상 업로드 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  // SNS 업로드 제출 (레거시 코드 기반)
  const handleSnsUploadSubmit = async () => {
    try {
      setProcessing(true)
      setError('')

      // 캠페인 타입 확인
      const campaignType = selectedApplication?.campaigns?.campaign_type || 'regular'
      const isOliveYoungSale = selectedApplication?.campaigns?.is_oliveyoung_sale

      if (campaignType === 'oliveyoung' || isOliveYoungSale) {
        // 올영세일: 3개 URL 모두 필수
        if (!snsUploadForm.step1_url || !snsUploadForm.step2_url || !snsUploadForm.step3_url) {
          setError('STEP 1, 2, 3 URL을 모두 입력해주세요.')
          setProcessing(false)
          return
        }
      } else if (campaignType === '4week_challenge') {
        // 4주 챌린지: 4개 URL 모두 필수
        if (!snsUploadForm.week1_url || !snsUploadForm.week2_url || !snsUploadForm.week3_url || !snsUploadForm.week4_url) {
          setError('Week 1, 2, 3, 4 URL을 모두 입력해주세요.')
          setProcessing(false)
          return
        }
      } else {
        // 일반 캠페인: 1개 URL 필수
        if (!snsUploadForm.sns_upload_url) {
          setError('SNS 업로드 URL을 입력해주세요.')
          setProcessing(false)
          return
        }
      }

      let updateData

      if (campaignType === 'oliveyoung' || isOliveYoungSale) {
        updateData = {
          step1_url: snsUploadForm.step1_url,
          step2_url: snsUploadForm.step2_url,
          step3_url: snsUploadForm.step3_url,
          step1_2_video_folder: snsUploadForm.step1_2_video_folder || null,
          step3_video_folder: snsUploadForm.step3_video_folder || null,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes || null,
          status: 'sns_uploaded'
        }
      } else if (campaignType === '4week_challenge') {
        updateData = {
          week1_url: snsUploadForm.week1_url,
          week2_url: snsUploadForm.week2_url,
          week3_url: snsUploadForm.week3_url,
          week4_url: snsUploadForm.week4_url,
          week1_video: snsUploadForm.week1_video || null,
          week2_video: snsUploadForm.week2_video || null,
          week3_video: snsUploadForm.week3_video || null,
          week4_video: snsUploadForm.week4_video || null,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes || null,
          status: 'sns_uploaded'
        }
      } else {
        updateData = {
          sns_upload_url: snsUploadForm.sns_upload_url,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes || null,
          status: 'sns_uploaded'
        }
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', selectedApplication.id)

      if (updateError) throw updateError

      setSuccess('SNS 업로드가 완료되었습니다. 관리자 승인 후 포인트가 지급됩니다.')
      setShowSnsUploadModal(false)
      setSelectedApplication(null)

      await loadApplications()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('SNS 업로드 오류:', err)
      setError('SNS 업로드 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
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
            onClick={() => navigate('/mypage')}
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            지원일: {formatDate(app.created_at)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelApplication(app.id)
                            }}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                          >
                            지원취소
                          </button>
                        </div>
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

                      {/* video_submitted 상태일 때 SNS 업로드 버튼 */}
                      {app.status === 'video_submitted' && (
                        <button
                          onClick={() => openSnsUploadModal(app)}
                          className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Upload size={14} /> SNS 업로드하기
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

              {/* 일반 가이드 내용 - ai_generated_guide JSONB 구조 */}
              {selectedGuide.type === 'general' && selectedGuide.ai_generated_guide && (
                <div className="space-y-4">
                  {(() => {
                    let guide = selectedGuide.ai_generated_guide
                    if (typeof guide === 'string') {
                      try { guide = JSON.parse(guide) } catch(e) {}
                    }

                    if (typeof guide === 'object' && guide !== null) {
                      return (
                        <>
                          {/* 1초 후킹 포인트 */}
                          {guide.hookingPoint && (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 shadow-lg">
                              <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Zap size={60} className="text-white" />
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                    <Zap size={18} className="text-white" />
                                  </div>
                                  <span className="font-bold text-white text-sm">⚡ 1초 후킹 포인트</span>
                                </div>
                                <p className="text-lg font-bold text-white leading-snug">"{guide.hookingPoint}"</p>
                              </div>
                            </div>
                          )}

                          {/* 핵심 메시지 */}
                          {guide.coreMessage && (
                            <div className="relative overflow-hidden rounded-2xl bg-blue-50 border border-blue-100 p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-blue-500 p-2 rounded-lg">
                                  <MessageSquare size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-blue-900 text-sm">💬 핵심 메시지</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{guide.coreMessage}</p>
                            </div>
                          )}

                          {/* 영상 설정 */}
                          {(guide.videoLength || guide.videoTempo) && (
                            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="bg-gray-700 p-2 rounded-lg">
                                  <Video size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-gray-900 text-sm">🎬 영상 설정</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {guide.videoLength && (
                                  <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">영상 길이</p>
                                    <p className="font-bold text-gray-900">
                                      {guide.videoLength === '30sec' ? '30초' :
                                       guide.videoLength === '45sec' ? '45초' :
                                       guide.videoLength === '60sec' ? '60초' :
                                       guide.videoLength === '90sec' ? '90초' : guide.videoLength}
                                    </p>
                                  </div>
                                )}
                                {guide.videoTempo && (
                                  <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">영상 템포</p>
                                    <p className="font-bold text-gray-900">
                                      {guide.videoTempo === 'slow' ? '느림' :
                                       guide.videoTempo === 'normal' ? '보통' :
                                       guide.videoTempo === 'fast' ? '빠름' : guide.videoTempo}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {guide.hasNarration !== undefined && (
                                <p className="text-sm text-gray-600 mt-3 text-center">
                                  나레이션: <strong>{guide.hasNarration ? '포함' : '미포함'}</strong>
                                </p>
                              )}
                            </div>
                          )}

                          {/* 필수 촬영 미션 */}
                          {guide.missions && Object.values(guide.missions).some(v => v) && (
                            <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="bg-green-500 p-2 rounded-lg">
                                  <CheckCircle2 size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-green-900 text-sm">✅ 필수 촬영 미션</span>
                              </div>
                              <ul className="space-y-2.5">
                                {guide.missions.beforeAfter && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                    <span>Before & After 보여주기</span>
                                  </li>
                                )}
                                {guide.missions.productCloseup && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                    <span>제품 사용 장면 클로즈업</span>
                                  </li>
                                )}
                                {guide.missions.productTexture && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                    <span>제품 텍스처 보여주기</span>
                                  </li>
                                )}
                                {guide.missions.storeVisit && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <Store size={16} className="text-green-500 flex-shrink-0" />
                                    <span>올리브영 매장 방문 인증</span>
                                  </li>
                                )}
                                {guide.missions.weeklyReview && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <Calendar size={16} className="text-green-500 flex-shrink-0" />
                                    <span>7일 사용 후기 기록</span>
                                  </li>
                                )}
                                {guide.missions.priceInfo && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <Tag size={16} className="text-green-500 flex-shrink-0" />
                                    <span>가격/혜택 정보 언급</span>
                                  </li>
                                )}
                                {guide.missions.purchaseLink && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-green-100">
                                    <ShoppingBag size={16} className="text-green-500 flex-shrink-0" />
                                    <span>구매 링크 유도</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* 금지 사항 */}
                          {guide.prohibitions && Object.values(guide.prohibitions).some(v => v) && (
                            <div className="rounded-2xl bg-red-50 border border-red-100 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="bg-red-500 p-2 rounded-lg">
                                  <Ban size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-red-900 text-sm">🚫 금지 사항</span>
                              </div>
                              <ul className="space-y-2.5">
                                {guide.prohibitions.competitorMention && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>경쟁사 제품 언급 금지</span>
                                  </li>
                                )}
                                {guide.prohibitions.exaggeratedClaims && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>과장된 효능/효과 표현 금지</span>
                                  </li>
                                )}
                                {guide.prohibitions.medicalMisrepresentation && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>의약품 오인 표현 금지</span>
                                  </li>
                                )}
                                {guide.prohibitions.priceOutOfSale && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>세일 기간 외 가격 언급 금지</span>
                                  </li>
                                )}
                                {guide.prohibitions.negativeExpression && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>부정적 표현 사용 금지</span>
                                  </li>
                                )}
                                {guide.prohibitions.other && guide.prohibitionOtherText && (
                                  <li className="flex items-center gap-3 text-sm text-gray-700 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                                    <Ban size={16} className="text-red-500 flex-shrink-0" />
                                    <span>{guide.prohibitionOtherText}</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* 필수 해시태그 */}
                          {guide.hashtags && guide.hashtags.length > 0 && (
                            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-500 p-2 rounded-lg">
                                  <Hash size={16} className="text-white" />
                                </div>
                                <span className="font-bold text-indigo-900 text-sm">#️⃣ 필수 해시태그</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {guide.hashtags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-medium border border-indigo-200"
                                  >
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 참고 영상 */}
                          {guide.referenceUrl && (
                            <a
                              href={guide.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-100 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              <ExternalLink size={16} />
                              참고 영상 보기
                            </a>
                          )}

                          {/* 유료광고 표시 */}
                          {guide.needsPartnershipCode && (
                            <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                              <AlertCircle size={18} className="flex-shrink-0" />
                              <span className="font-medium">유료광고 표시 필요</span>
                            </div>
                          )}
                        </>
                      )
                    }
                    return (
                      <div className="rounded-2xl bg-gray-100 border border-gray-200 p-5">
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

      {/* SNS 업로드 모달 (레거시 코드 기반) */}
      {showSnsUploadModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">SNS 업로드</h3>
              <button
                onClick={() => {
                  setShowSnsUploadModal(false)
                  setSelectedApplication(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 캠페인 정보 */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">{selectedApplication.campaigns?.brand}</p>
                <p className="font-semibold text-gray-900 text-sm">{selectedApplication.campaigns?.title}</p>
              </div>

              {/* 4주 챌린지: 4개 URL 입력 */}
              {selectedApplication.campaigns?.campaign_type === '4week_challenge' && (
                <>
                  {[1, 2, 3, 4].map(week => (
                    <div key={week}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Week {week} URL *
                      </label>
                      <input
                        type="url"
                        value={snsUploadForm[`week${week}_url`]}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, [`week${week}_url`]: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="https://instagram.com/p/..."
                      />
                      <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          Week {week} 영상 파일 (선택)
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleSnsVideoUpload(e, `week${week}`)}
                          className="w-full text-xs"
                        />
                        {snsUploadForm[`week${week}_video`] && (
                          <p className="text-xs text-green-600 mt-1">✓ 업로드 완료</p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 올리브영 캠페인: 3개 URL 입력 */}
              {(selectedApplication.campaigns?.campaign_type === 'oliveyoung' || selectedApplication.campaigns?.is_oliveyoung_sale) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STEP 1 릴스 URL (세일 7일 전) *
                    </label>
                    <input
                      type="url"
                      value={snsUploadForm.step1_url}
                      onChange={(e) => setSnsUploadForm({...snsUploadForm, step1_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="https://instagram.com/reel/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STEP 2 릴스 URL (세일 1일 전) *
                    </label>
                    <input
                      type="url"
                      value={snsUploadForm.step2_url}
                      onChange={(e) => setSnsUploadForm({...snsUploadForm, step2_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="https://instagram.com/reel/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STEP 3 스토리 URL (세일 당일) *
                    </label>
                    <input
                      type="url"
                      value={snsUploadForm.step3_url}
                      onChange={(e) => setSnsUploadForm({...snsUploadForm, step3_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="https://instagram.com/stories/..."
                    />
                  </div>

                  {/* 올리브영 영상 폴더 업로드 */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">영상 파일 제출 (선택)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          STEP 1&2 영상 폴더 (릴스 2개)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleSnsVideoUpload(e, 'step1_2')}
                          className="w-full text-xs"
                        />
                        {snsUploadForm.step1_2_video_folder && (
                          <p className="text-xs text-green-600 mt-1">✓ 업로드 완료</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          STEP 3 영상 폴더 (스토리 1개)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleSnsVideoUpload(e, 'step3')}
                          className="w-full text-xs"
                        />
                        {snsUploadForm.step3_video_folder && (
                          <p className="text-xs text-green-600 mt-1">✓ 업로드 완료</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 일반 캠페인: 1개 URL 입력 */}
              {selectedApplication.campaigns?.campaign_type !== '4week_challenge' &&
               selectedApplication.campaigns?.campaign_type !== 'oliveyoung' &&
               !selectedApplication.campaigns?.is_oliveyoung_sale && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SNS 업로드 URL *
                  </label>
                  <input
                    type="url"
                    value={snsUploadForm.sns_upload_url}
                    onChange={(e) => setSnsUploadForm({...snsUploadForm, sns_upload_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
              )}

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 <span className="text-xs text-gray-400">(선택사항)</span>
                </label>
                <textarea
                  value={snsUploadForm.notes}
                  onChange={(e) => setSnsUploadForm({...snsUploadForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  rows="3"
                  placeholder="추가 메모를 입력하세요"
                />
              </div>

              {/* 에러/성공 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  {success}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSnsUploadModal(false)
                    setSelectedApplication(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSnsUploadSubmit}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      처리중...
                    </>
                  ) : (
                    '제출하기'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationsPage
