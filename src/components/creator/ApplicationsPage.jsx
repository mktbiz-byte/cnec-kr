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

// 촬영 장면 구성 카드 렌더링 컴포넌트 (모바일 최적화)
const ShootingScenesTable = ({ scenes }) => {
  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) return null

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-purple-600 p-1.5 rounded-lg">
          <Video size={14} className="text-white" />
        </div>
        <span className="font-bold text-purple-900 text-sm">촬영 장면 구성</span>
        <span className="ml-auto text-xs text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full">
          {scenes.length}개
        </span>
      </div>

      {/* 안내 문구 */}
      <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
        <p className="text-xs text-red-600 font-medium leading-relaxed">
          💡 본 대사와 촬영 장면은 크리에이터님의 스타일에 맞게 자유롭게 변경하여 촬영해 주세요!
        </p>
      </div>

      {/* 장면 카드 리스트 */}
      <div className="space-y-3">
        {scenes.map((scene, idx) => (
          <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-purple-100">
            {/* 장면 헤더 */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-3 py-2 flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">
                {scene.order || idx + 1}
              </span>
              <span className="text-white font-medium text-sm">{scene.scene_type || '장면'}</span>
            </div>

            {/* 장면 내용 */}
            <div className="p-3 space-y-2.5">
              {/* 촬영 장면 설명 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">촬영 장면</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">{scene.scene_description || '-'}</p>
              </div>

              {/* 대사 */}
              {scene.dialogue && (
                <div className="bg-amber-50 rounded-lg p-2.5 border-l-3 border-amber-400">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">💬 대사/자막</span>
                  </div>
                  <p className="text-sm text-amber-900 italic leading-relaxed">"{scene.dialogue}"</p>
                </div>
              )}

              {/* 촬영 팁 */}
              {scene.shooting_tip && (
                <div className="bg-emerald-50 rounded-lg p-2.5 border-l-3 border-emerald-400">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">💡 촬영 팁</span>
                  </div>
                  <p className="text-sm text-emerald-800 leading-relaxed">{scene.shooting_tip}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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
    // 올리브영: step1 URL + 코드, step2 URL + 코드, step3 URL만
    step1_url: '',
    step2_url: '',
    step3_url: '',
    step1_partnership_code: '',
    step2_partnership_code: '',
    // 4주 챌린지
    week1_url: '',
    week2_url: '',
    week3_url: '',
    week4_url: '',
    week1_partnership_code: '',
    week2_partnership_code: '',
    week3_partnership_code: '',
    week4_partnership_code: '',
    // 일반/기획형
    partnership_code: ''
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
        const applicationIds = applicationsData.map(a => a.id).filter(Boolean)

        if (campaignIds.length > 0) {
          // 기본 필드만 먼저 조회 (안전한 쿼리)
          const { data: campaignsData, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIds)

          if (campaignsError) {
            console.error('캠페인 데이터 로드 오류:', campaignsError)
          }

          // video_submissions 데이터 조회
          const { data: videoSubmissionsData, error: videoError } = await supabase
            .from('video_submissions')
            .select('*')
            .in('application_id', applicationIds)
            .order('created_at', { ascending: false })

          if (videoError) {
            console.error('Video submissions 로드 오류:', videoError)
          }

          // video_review_comments 조회 - submission_id와 application_id 모두로 조회
          let videoReviewComments = []
          const submissionIds = (videoSubmissionsData || []).map(vs => vs.id).filter(Boolean)

          // 1. submission_id로 조회
          if (submissionIds.length > 0) {
            const { data: commentsBySubmission, error: err1 } = await supabase
              .from('video_review_comments')
              .select('*')
              .in('submission_id', submissionIds)

            if (!err1 && commentsBySubmission) {
              videoReviewComments = [...commentsBySubmission]
            }
          }

          // 2. application_id로도 조회 (4주/올영 등 week_number, video_number로 매칭 필요)
          const { data: commentsByApplication, error: err2 } = await supabase
            .from('video_review_comments')
            .select('*')
            .in('application_id', applicationIds)

          if (!err2 && commentsByApplication) {
            // 중복 제거하면서 추가
            const existingIds = new Set(videoReviewComments.map(c => c.id))
            commentsByApplication.forEach(c => {
              if (!existingIds.has(c.id)) {
                videoReviewComments.push(c)
              }
            })
          }

          // video_submissions에 video_review_comments 병합
          // submission_id 또는 (application_id + week_number/video_number) 매칭
          const videoSubmissionsWithComments = (videoSubmissionsData || []).map(vs => ({
            ...vs,
            video_review_comments: videoReviewComments.filter(c => {
              // submission_id로 매칭
              if (c.submission_id === vs.id) return true
              // application_id + week_number 매칭 (4주 챌린지)
              if (c.application_id === vs.application_id && c.week_number && c.week_number === vs.week_number) return true
              // application_id + video_number 매칭 (올리브영)
              if (c.application_id === vs.application_id && c.video_number && c.video_number === vs.video_number) return true
              return false
            })
          }))

          // 캠페인 및 비디오 데이터 병합
          applicationsData = applicationsData.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null,
            video_submissions: videoSubmissionsWithComments.filter(v => v.application_id === app.id)
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

  // SNS 업로드 모달 열기 (기존 값 불러오기 - 개별 컬럼에서 직접 읽기)
  const openSnsUploadModal = (app) => {
    setSelectedApplication(app)

    setSnsUploadForm({
      // 일반 캠페인
      sns_upload_url: app.sns_upload_url || '',
      partnership_code: app.partnership_code || '',
      notes: app.notes || '',
      // 올리브영 캠페인: step1 URL+코드, step2 URL+코드, step3 URL만
      step1_url: app.step1_url || '',
      step2_url: app.step2_url || '',
      step3_url: app.step3_url || '',
      step1_partnership_code: app.step1_partnership_code || '',
      step2_partnership_code: app.step2_partnership_code || '',
      // 4주 챌린지
      week1_url: app.week1_url || '',
      week2_url: app.week2_url || '',
      week3_url: app.week3_url || '',
      week4_url: app.week4_url || '',
      week1_partnership_code: app.week1_partnership_code || '',
      week2_partnership_code: app.week2_partnership_code || '',
      week3_partnership_code: app.week3_partnership_code || '',
      week4_partnership_code: app.week4_partnership_code || ''
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
        // 올영세일: 3개 URL + 2개 광고코드 필수 (step1, step2만 광고코드)
        if (!snsUploadForm.step1_url || !snsUploadForm.step2_url || !snsUploadForm.step3_url) {
          setError('STEP 1, 2, 3 URL을 모두 입력해주세요.')
          setProcessing(false)
          return
        }
        if (!snsUploadForm.step1_partnership_code || !snsUploadForm.step2_partnership_code) {
          setError('광고코드를 모두 입력해주세요. (STEP 1용, STEP 2용)')
          setProcessing(false)
          return
        }
      } else if (campaignType === '4week_challenge') {
        // 4주 챌린지: 4개 URL + 4개 광고코드 필수
        if (!snsUploadForm.week1_url || !snsUploadForm.week2_url || !snsUploadForm.week3_url || !snsUploadForm.week4_url) {
          setError('Week 1, 2, 3, 4 URL을 모두 입력해주세요.')
          setProcessing(false)
          return
        }
        if (!snsUploadForm.week1_partnership_code || !snsUploadForm.week2_partnership_code ||
            !snsUploadForm.week3_partnership_code || !snsUploadForm.week4_partnership_code) {
          setError('각 Week별 광고코드를 모두 입력해주세요.')
          setProcessing(false)
          return
        }
      } else {
        // 일반 캠페인: 1개 URL + 1개 광고코드 필수
        if (!snsUploadForm.sns_upload_url) {
          setError('SNS 업로드 URL을 입력해주세요.')
          setProcessing(false)
          return
        }
        if (!snsUploadForm.partnership_code) {
          setError('광고코드(파트너십 코드)를 입력해주세요.')
          setProcessing(false)
          return
        }
      }

      let updateData

      if (campaignType === 'oliveyoung' || isOliveYoungSale) {
        // 올리브영: step1 URL+코드, step2 URL+코드, step3 URL만
        updateData = {
          step1_url: snsUploadForm.step1_url,
          step2_url: snsUploadForm.step2_url,
          step3_url: snsUploadForm.step3_url,
          step1_partnership_code: snsUploadForm.step1_partnership_code || null,
          step2_partnership_code: snsUploadForm.step2_partnership_code || null,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes || null,
          status: 'sns_uploaded'
        }
      } else if (campaignType === '4week_challenge') {
        // 4주 챌린지: 각 컬럼에 개별 저장
        updateData = {
          week1_url: snsUploadForm.week1_url,
          week2_url: snsUploadForm.week2_url,
          week3_url: snsUploadForm.week3_url,
          week4_url: snsUploadForm.week4_url,
          week1_video: snsUploadForm.week1_video || null,
          week2_video: snsUploadForm.week2_video || null,
          week3_video: snsUploadForm.week3_video || null,
          week4_video: snsUploadForm.week4_video || null,
          week1_partnership_code: snsUploadForm.week1_partnership_code || null,
          week2_partnership_code: snsUploadForm.week2_partnership_code || null,
          week3_partnership_code: snsUploadForm.week3_partnership_code || null,
          week4_partnership_code: snsUploadForm.week4_partnership_code || null,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes || null,
          status: 'sns_uploaded'
        }
      } else {
        updateData = {
          sns_upload_url: snsUploadForm.sns_upload_url,
          partnership_code: snsUploadForm.partnership_code || null,
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

      // 기업에게 SNS 업로드 완료 알림톡 발송
      try {
        const companyName = selectedApplication.campaigns?.company_name || '기업'

        // 1. 캠페인에 저장된 company_phone 먼저 확인
        let companyPhone = selectedApplication.campaigns?.company_phone

        // 2. 없으면 user_profiles에서 조회
        if (!companyPhone && selectedApplication.campaigns?.company_id) {
          const { data: companyProfile } = await supabase
            .from('user_profiles')
            .select('phone')
            .eq('id', selectedApplication.campaigns.company_id)
            .single()
          companyPhone = companyProfile?.phone
        }

        if (companyPhone) {
          await fetch('/.netlify/functions/send-alimtalk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverNum: companyPhone.replace(/-/g, ''),
              receiverName: companyName,
              templateCode: '025100001009',
              variables: {
                '회사명': companyName,
                '캠페인명': selectedApplication.campaigns?.title || '캠페인'
              }
            })
          })
        } else {
          console.log('기업 전화번호가 없어 알림톡을 발송하지 않습니다.')
        }
      } catch (notificationError) {
        console.error('알림톡 발송 오류:', notificationError)
      }

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
            onClick={() => navigate('/')}
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

              // 캠페인 유형에 따른 마감일 결정
              let deadline = app.campaigns?.content_submission_deadline
              let deadlineLabel = '마감'

              if (app.campaigns?.campaign_type === '4week_challenge') {
                // 4주 챌린지: 현재 진행 중인 주차의 마감일 또는 가장 가까운 미래 마감일
                const weekDeadlines = [
                  { week: 1, date: app.campaigns?.week1_deadline },
                  { week: 2, date: app.campaigns?.week2_deadline },
                  { week: 3, date: app.campaigns?.week3_deadline },
                  { week: 4, date: app.campaigns?.week4_deadline }
                ].filter(w => w.date)

                const now = new Date()
                const upcomingDeadline = weekDeadlines.find(w => new Date(w.date) >= now)
                if (upcomingDeadline) {
                  deadline = upcomingDeadline.date
                  deadlineLabel = `${upcomingDeadline.week}주차 마감`
                } else if (weekDeadlines.length > 0) {
                  // 모든 마감일이 지났으면 마지막 마감일 표시
                  const lastDeadline = weekDeadlines[weekDeadlines.length - 1]
                  deadline = lastDeadline.date
                  deadlineLabel = `${lastDeadline.week}주차 마감`
                }
              } else if (app.campaigns?.campaign_type === 'oliveyoung' || app.campaigns?.is_oliveyoung_sale) {
                // 올영: 현재 진행 중인 스텝의 마감일 또는 가장 가까운 미래 마감일
                const stepDeadlines = [
                  { step: 1, date: app.campaigns?.step1_deadline },
                  { step: 2, date: app.campaigns?.step2_deadline },
                  { step: 3, date: app.campaigns?.step3_deadline }
                ].filter(s => s.date)

                const now = new Date()
                const upcomingDeadline = stepDeadlines.find(s => new Date(s.date) >= now)
                if (upcomingDeadline) {
                  deadline = upcomingDeadline.date
                  deadlineLabel = `${upcomingDeadline.step}차 마감`
                } else if (stepDeadlines.length > 0) {
                  // 모든 마감일이 지났으면 마지막 마감일 표시
                  const lastDeadline = stepDeadlines[stepDeadlines.length - 1]
                  deadline = lastDeadline.date
                  deadlineLabel = `${lastDeadline.step}차 마감`
                }
              }

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

                      {/* 기본 정보 (포인트, 마감일) */}
                      {!['pending', 'rejected', 'cancelled'].includes(app.status) && (
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {reward > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                              <Gift size={10} />
                              {formatCurrency(reward)}P
                            </span>
                          )}
                          {deadline && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dDay?.urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Calendar size={10} />
                              {deadlineLabel} {formatDate(deadline)}
                            </span>
                          )}
                          {app.campaigns?.product_shipping_date && ['approved', 'selected', 'virtual_selected'].includes(app.status) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                              <Truck size={10} />
                              발송 {formatDate(app.campaigns.product_shipping_date)}
                            </span>
                          )}
                        </div>
                      )}

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
                        <p className="text-xs text-gray-400">
                          선정일: {formatDate(app.updated_at)}
                        </p>
                      )}

                      {['completed', 'paid'].includes(app.status) && (
                        <p className="text-xs text-gray-400">
                          완료일: {formatDate(app.updated_at)}
                        </p>
                      )}

                      {['filming', 'video_submitted'].includes(app.status) && (
                        <p className="text-xs text-gray-400">
                          시작일: {formatDate(app.campaigns?.start_date || app.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 완료 상태일 때 제출 정보 확인 (수정 불가) */}
                  {['completed', 'paid', 'sns_uploaded'].includes(app.status) && (
                    <div className="mt-3 space-y-2">
                      {/* 영상 제출 정보 */}
                      {app.video_submissions && app.video_submissions.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Video size={14} className="text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700">제출한 영상</span>
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">완료됨</span>
                          </div>
                          <div className="space-y-1">
                            {app.video_submissions.slice(0, 1).map((vs, idx) => (
                              <a
                                key={idx}
                                href={vs.video_file_url || vs.clean_video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink size={12} />
                                <span>V{vs.version || 1} 영상 보기</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SNS 업로드 정보 */}
                      {(app.sns_upload_url || app.step1_url || app.week1_url) && (
                        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload size={14} className="text-pink-600" />
                            <span className="text-xs font-semibold text-pink-700">업로드한 SNS</span>
                            <span className="text-[10px] bg-pink-200 text-pink-600 px-1.5 py-0.5 rounded">완료됨</span>
                          </div>
                          <div className="space-y-1">
                            {/* 일반 캠페인 SNS URL */}
                            {app.sns_upload_url && (
                              <a
                                href={app.sns_upload_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800"
                              >
                                <ExternalLink size={12} />
                                <span className="truncate max-w-[200px]">{app.sns_upload_url}</span>
                              </a>
                            )}
                            {/* 올리브영 캠페인 SNS URL */}
                            {app.step1_url && (
                              <a href={app.step1_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>STEP 1 URL 보기</span>
                              </a>
                            )}
                            {app.step2_url && (
                              <a href={app.step2_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>STEP 2 URL 보기</span>
                              </a>
                            )}
                            {app.step3_url && (
                              <a href={app.step3_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>STEP 3 URL 보기</span>
                              </a>
                            )}
                            {/* 4주 챌린지 SNS URL */}
                            {app.week1_url && (
                              <a href={app.week1_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>Week 1 URL 보기</span>
                              </a>
                            )}
                            {app.week2_url && (
                              <a href={app.week2_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>Week 2 URL 보기</span>
                              </a>
                            )}
                            {app.week3_url && (
                              <a href={app.week3_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>Week 3 URL 보기</span>
                              </a>
                            )}
                            {app.week4_url && (
                              <a href={app.week4_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-800">
                                <ExternalLink size={12} />
                                <span>Week 4 URL 보기</span>
                              </a>
                            )}
                          </div>
                          {/* 광고코드 표시 - 개별 컬럼에서 읽기 */}
                          {(app.partnership_code || app.step1_partnership_code || app.week1_partnership_code) && (
                            <div className="mt-2 pt-2 border-t border-pink-200 space-y-1">
                              {/* 일반 캠페인 광고코드 */}
                              {app.partnership_code && typeof app.partnership_code === 'string' && (
                                <span className="text-[10px] text-pink-500">광고코드: {app.partnership_code}</span>
                              )}
                              {/* 올리브영 캠페인 광고코드 (step1, step2만) */}
                              {app.step1_partnership_code && (
                                <div className="text-[10px] text-pink-500">STEP 1 광고코드: {app.step1_partnership_code}</div>
                              )}
                              {app.step2_partnership_code && (
                                <div className="text-[10px] text-pink-500">STEP 2 광고코드: {app.step2_partnership_code}</div>
                              )}
                              {/* 4주 챌린지 광고코드 */}
                              {app.week1_partnership_code && (
                                <div className="text-[10px] text-pink-500">Week 1 광고코드: {app.week1_partnership_code}</div>
                              )}
                              {app.week2_partnership_code && (
                                <div className="text-[10px] text-pink-500">Week 2 광고코드: {app.week2_partnership_code}</div>
                              )}
                              {app.week3_partnership_code && (
                                <div className="text-[10px] text-pink-500">Week 3 광고코드: {app.week3_partnership_code}</div>
                              )}
                              {app.week4_partnership_code && (
                                <div className="text-[10px] text-pink-500">Week 4 광고코드: {app.week4_partnership_code}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SNS URL 미입력 안내 및 입력 버튼 */}
                      {!app.sns_upload_url && !app.step1_url && !app.week1_url && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-700">SNS 업로드가 필요합니다</span>
                          </div>
                          <button
                            onClick={() => openSnsUploadModal(app)}
                            className="w-full py-2 bg-pink-600 text-white rounded-lg text-xs font-bold hover:bg-pink-700 flex items-center justify-center gap-1"
                          >
                            <Upload size={12} /> SNS 업로드하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 선정됨/진행중 상태일 때 가이드 및 액션 버튼 */}
                  {/* sns_uploaded도 포함 - 기업 확정 전까지 수정 가능 */}
                  {['approved', 'selected', 'virtual_selected', 'filming', 'video_submitted', 'sns_uploaded'].includes(app.status) && (
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
                          <button
                            onClick={() => {
                              setSelectedGuide({
                                type: 'oliveyoung',
                                campaigns: app.campaigns
                              })
                              setShowGuideModal(true)
                            }}
                            className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> 가이드 보기
                          </button>
                        </div>
                      )}

                      {/* 올리브영 캠페인 영상 업로드 버튼 (별도 표시) */}
                      {/* 올리브영: sns_uploaded에서도 영상 추가 가능 (영상 2개 모두 제출해야 함) */}
                      {(app.campaigns?.campaign_type === 'oliveyoung' || app.campaigns?.is_oliveyoung_sale) &&
                       ['filming', 'approved', 'selected', 'video_submitted', 'sns_uploaded'].includes(app.status) && (
                        <button
                          onClick={() => handleVideoUpload(app, 'oliveyoung')}
                          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Video size={14} /> {['video_submitted', 'sns_uploaded'].includes(app.status) ? '영상 추가/수정' : '영상 업로드하기'}
                        </button>
                      )}

                      {/* 올리브영 캠페인 SNS 업로드 버튼 (별도 표시) */}
                      {/* sns_uploaded에서도 수정 가능 (기업 확정 전까지) */}
                      {(app.campaigns?.campaign_type === 'oliveyoung' || app.campaigns?.is_oliveyoung_sale) &&
                       (['filming', 'approved', 'selected', 'video_submitted', 'sns_uploaded'].includes(app.status) ||
                        (['completed', 'paid'].includes(app.status) && !app.step1_url)) && (
                        <button
                          onClick={() => openSnsUploadModal(app)}
                          className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Upload size={14} /> {app.step1_url ? 'SNS 정보 수정' : 'SNS 업로드 정보 입력'} (3개 URL + 광고코드 2개)
                        </button>
                      )}

                      {/* 4주 챌린지 캠페인 가이드 */}
                      {app.campaigns?.campaign_type === '4week_challenge' && app.campaigns?.challenge_weekly_guides_ai && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-900">4주 챌린지 가이드</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedGuide({
                                type: '4week_challenge',
                                campaigns: app.campaigns
                              })
                              setShowGuideModal(true)
                            }}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> 가이드 보기
                          </button>
                        </div>
                      )}

                      {/* 4주 챌린지: sns_uploaded에서도 영상 추가 가능 (4주차 영상 모두 제출해야 함) */}
                      {app.campaigns?.campaign_type === '4week_challenge' &&
                       ['filming', 'approved', 'selected', 'video_submitted', 'sns_uploaded'].includes(app.status) && (
                        <button
                          onClick={() => handleVideoUpload(app, '4week')}
                          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Video size={14} /> {['video_submitted', 'sns_uploaded'].includes(app.status) ? '영상 추가/수정' : '영상 업로드하기'}
                        </button>
                      )}

                      {/* 4주 챌린지 캠페인 SNS 업로드 버튼 (별도 표시) */}
                      {/* sns_uploaded에서도 수정 가능 (기업 확정 전까지) */}
                      {app.campaigns?.campaign_type === '4week_challenge' &&
                       (['filming', 'approved', 'selected', 'video_submitted', 'sns_uploaded'].includes(app.status) ||
                        (['completed', 'paid'].includes(app.status) && !app.week1_url)) && (
                        <button
                          onClick={() => openSnsUploadModal(app)}
                          className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Upload size={14} /> {app.week1_url ? 'SNS 정보 수정' : 'SNS 업로드 정보 입력'} (4개 URL + 광고코드 4개)
                        </button>
                      )}

                      {/* 수정 요청 알림 배너 - filming 상태에서도 표시 */}
                      {['filming', 'video_submitted'].includes(app.status) &&
                       app.video_submissions?.filter(vs => vs.video_review_comments?.length > 0).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                            <h4 className="font-semibold text-red-900 text-sm">🎬 영상 수정 요청이 있습니다!</h4>
                          </div>
                          <p className="text-xs text-red-700 mb-3">
                            기업에서 영상 수정 요청을 전달했습니다. 수정 사항을 확인하고 영상을 재업로드해 주세요.
                          </p>
                          <div className="space-y-2">
                            {(() => {
                              // week_number 또는 video_number로 그룹화하여 최신 버전만 표시
                              const submissionsWithComments = app.video_submissions.filter(vs => vs.video_review_comments?.length > 0)
                              const groupedByKey = {}

                              submissionsWithComments.forEach(vs => {
                                const key = vs.week_number ? `week_${vs.week_number}` :
                                            vs.video_number ? `video_${vs.video_number}` : 'default'
                                if (!groupedByKey[key] || (vs.version || 1) > (groupedByKey[key].version || 1)) {
                                  groupedByKey[key] = vs
                                }
                              })

                              return Object.values(groupedByKey).map((vs, idx) => {
                                let label = '영상'
                                if (app.campaigns?.campaign_type === '4week_challenge' && vs.week_number) {
                                  label = `Week ${vs.week_number}`
                                } else if ((app.campaigns?.campaign_type === 'oliveyoung' || app.campaigns?.is_oliveyoung_sale) && vs.video_number) {
                                  label = `Video ${vs.video_number}`
                                } else if (Object.keys(groupedByKey).length > 1) {
                                  label = `영상 ${idx + 1}`
                                }
                                const versionLabel = vs.version ? ` V${vs.version}` : ''
                                return (
                                  <button
                                    key={vs.id}
                                    onClick={() => {
                                      window.location.href = `/video-review/${vs.id}`
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                  >
                                    {label}{versionLabel} 수정 요청 확인하기 ({vs.video_review_comments.length}개)
                                  </button>
                                )
                              })
                            })()}
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

                      {/* 기획형/일반 캠페인 - video_submitted, sns_uploaded 상태일 때 영상 재제출 버튼 */}
                      {/* 올리브영, 4주 챌린지는 위에서 별도 처리 */}
                      {['video_submitted', 'sns_uploaded'].includes(app.status) &&
                       app.campaigns?.campaign_type !== 'oliveyoung' &&
                       app.campaigns?.campaign_type !== '4week_challenge' &&
                       !app.campaigns?.is_oliveyoung_sale && (
                        <button
                          onClick={() => handleVideoUpload(app)}
                          className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Video size={14} /> 영상 수정본 재제출
                        </button>
                      )}

                      {/* 기획형/일반 캠페인 - SNS 업로드 버튼 */}
                      {/* sns_uploaded에서도 수정 가능 (기업 확정 전까지) */}
                      {/* 올리브영, 4주 챌린지는 위에서 별도 처리 */}
                      {app.campaigns?.campaign_type !== 'oliveyoung' &&
                       app.campaigns?.campaign_type !== '4week_challenge' &&
                       !app.campaigns?.is_oliveyoung_sale &&
                       (['filming', 'approved', 'selected', 'video_submitted', 'sns_uploaded'].includes(app.status) ||
                        (['completed', 'paid'].includes(app.status) && !app.sns_upload_url)) && (
                        <button
                          onClick={() => openSnsUploadModal(app)}
                          className="w-full py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Upload size={14} /> {app.sns_upload_url ? 'SNS 정보 수정' : 'SNS 업로드 정보 입력'} (1개 URL + 광고코드 1개)
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
                      let colorIdx = 0
                      return entries.map(([key, value], idx) => {
                        // shooting_scenes는 특별한 테이블로 렌더링
                        if (key === 'shooting_scenes' && Array.isArray(value)) {
                          return <ShootingScenesTable key={key} scenes={value} />
                        }
                        // 다른 섹션은 기존 방식으로 렌더링
                        const color = colorOrder[colorIdx % colorOrder.length]
                        colorIdx++
                        return renderGuideSection(key, value, color)
                      })
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

                  {/* 올리브영 가이드 내 shooting_scenes 테이블 */}
                  {(() => {
                    // 각 스텝 가이드에서 shooting_scenes 찾기
                    const allScenes = []
                    const guides = [
                      selectedGuide.campaigns?.oliveyoung_step1_guide_ai,
                      selectedGuide.campaigns?.oliveyoung_step2_guide_ai,
                      selectedGuide.campaigns?.oliveyoung_step3_guide_ai
                    ]
                    guides.forEach((guideStr) => {
                      if (guideStr) {
                        try {
                          const parsed = typeof guideStr === 'string' ? JSON.parse(guideStr) : guideStr
                          if (parsed?.shooting_scenes && Array.isArray(parsed.shooting_scenes)) {
                            allScenes.push(...parsed.shooting_scenes)
                          }
                        } catch (e) {}
                      }
                    })
                    // ai_generated_guide에서도 확인
                    if (selectedGuide.campaigns?.ai_generated_guide) {
                      try {
                        const aiGuide = typeof selectedGuide.campaigns.ai_generated_guide === 'string'
                          ? JSON.parse(selectedGuide.campaigns.ai_generated_guide)
                          : selectedGuide.campaigns.ai_generated_guide
                        if (aiGuide?.shooting_scenes && Array.isArray(aiGuide.shooting_scenes)) {
                          allScenes.push(...aiGuide.shooting_scenes)
                        }
                      } catch (e) {}
                    }
                    if (allScenes.length > 0) {
                      return <ShootingScenesTable scenes={allScenes} />
                    }
                    return null
                  })()}
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
                      { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-500', title: 'text-red-900', accent: 'text-red-600', accentBg: 'bg-red-100' },
                      { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-500', title: 'text-orange-900', accent: 'text-orange-600', accentBg: 'bg-orange-100' },
                      { bg: 'bg-yellow-50', border: 'border-yellow-100', icon: 'bg-yellow-500', title: 'text-yellow-900', accent: 'text-yellow-600', accentBg: 'bg-yellow-100' },
                      { bg: 'bg-green-50', border: 'border-green-100', icon: 'bg-green-500', title: 'text-green-900', accent: 'text-green-600', accentBg: 'bg-green-100' }
                    ]
                    const weekDeadlines = [
                      selectedGuide.campaigns?.week1_deadline,
                      selectedGuide.campaigns?.week2_deadline,
                      selectedGuide.campaigns?.week3_deadline,
                      selectedGuide.campaigns?.week4_deadline
                    ]

                    // 가이드 객체를 깔끔하게 렌더링하는 함수
                    const renderGuideContent = (guide, style) => {
                      if (typeof guide === 'string') {
                        return <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{guide}</p>
                      }

                      if (typeof guide !== 'object') return null

                      return (
                        <div className="space-y-3">
                          {/* 상품 정보 / 미션 설명 */}
                          {guide.product_info && (
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <h6 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                                <span>📦</span> 상품 정보 / 미션
                              </h6>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{guide.product_info}</p>
                            </div>
                          )}

                          {/* 필수 대사 */}
                          {guide.required_dialogues && (
                            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                              <h6 className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1">
                                <span>💬</span> 필수 대사
                              </h6>
                              {Array.isArray(guide.required_dialogues) ? (
                                <ul className="space-y-1.5">
                                  {guide.required_dialogues.map((dialogue, dIdx) => (
                                    <li key={dIdx} className="flex items-start gap-2">
                                      <span className="w-5 h-5 bg-purple-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{dIdx + 1}</span>
                                      <span className="text-sm text-purple-900">{dialogue}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-purple-900 whitespace-pre-wrap">{guide.required_dialogues}</p>
                              )}
                            </div>
                          )}

                          {/* 필수 촬영 장면 */}
                          {guide.required_scenes && (
                            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                              <h6 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                                <span>🎥</span> 필수 촬영 장면
                              </h6>
                              {Array.isArray(guide.required_scenes) ? (
                                <ul className="space-y-1.5">
                                  {guide.required_scenes.map((scene, sIdx) => (
                                    <li key={sIdx} className="flex items-start gap-2">
                                      <span className="w-5 h-5 bg-green-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{sIdx + 1}</span>
                                      <span className="text-sm text-green-900">{scene}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-green-900 whitespace-pre-wrap">{guide.required_scenes}</p>
                              )}
                            </div>
                          )}

                          {/* 해시태그 */}
                          {guide.hashtags && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                              <h6 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                                <span>#️⃣</span> 필수 해시태그
                              </h6>
                              <div className="flex flex-wrap gap-1.5">
                                {(Array.isArray(guide.hashtags) ? guide.hashtags : guide.hashtags.split(/[,\n•]/).filter(t => t.trim())).map((tag, tIdx) => (
                                  <span key={tIdx} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    {tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 주의사항 */}
                          {guide.cautions && (
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                              <h6 className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                                <span>⚠️</span> 주의사항
                              </h6>
                              <p className="text-sm text-amber-800 whitespace-pre-wrap">{guide.cautions}</p>
                            </div>
                          )}

                          {/* 참고 영상 */}
                          {guide.reference_urls && guide.reference_urls.length > 0 && guide.reference_urls.some(url => url) && (
                            <div className="bg-white rounded-xl p-3 border border-gray-100">
                              <h6 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                                <span>🔗</span> 참고 영상
                              </h6>
                              <ul className="space-y-1">
                                {guide.reference_urls.filter(url => url).map((url, uIdx) => (
                                  <li key={uIdx}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                                      {url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    }

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
                            {renderGuideContent(guide, style)}
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="rounded-3xl bg-indigo-50 border border-indigo-100 p-5">
                        {typeof guides === 'object' ? renderGuideContent(guides, weekStyles[0]) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{renderValue(guides)}</p>
                        )}
                      </div>
                    )
                  })()}

                  {/* 4주 챌린지 가이드 내 shooting_scenes 테이블 */}
                  {(() => {
                    const allScenes = []
                    // 주차별 가이드에서 shooting_scenes 찾기
                    let weeklyGuides = selectedGuide.campaigns?.challenge_weekly_guides_ai
                    if (typeof weeklyGuides === 'string') {
                      try { weeklyGuides = JSON.parse(weeklyGuides) } catch (e) { weeklyGuides = null }
                    }
                    if (Array.isArray(weeklyGuides)) {
                      weeklyGuides.forEach((g) => {
                        if (typeof g === 'object' && g?.shooting_scenes && Array.isArray(g.shooting_scenes)) {
                          allScenes.push(...g.shooting_scenes)
                        }
                      })
                    }
                    // ai_generated_guide에서도 확인
                    if (selectedGuide.campaigns?.ai_generated_guide) {
                      try {
                        const aiGuide = typeof selectedGuide.campaigns.ai_generated_guide === 'string'
                          ? JSON.parse(selectedGuide.campaigns.ai_generated_guide)
                          : selectedGuide.campaigns.ai_generated_guide
                        if (aiGuide?.shooting_scenes && Array.isArray(aiGuide.shooting_scenes)) {
                          allScenes.push(...aiGuide.shooting_scenes)
                        }
                      } catch (e) {}
                    }
                    if (allScenes.length > 0) {
                      return <ShootingScenesTable scenes={allScenes} />
                    }
                    return null
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

                          {/* 촬영 장면 구성 (ai_generated_guide에 포함된 경우) */}
                          {guide.shooting_scenes && Array.isArray(guide.shooting_scenes) && guide.shooting_scenes.length > 0 && (
                            <ShootingScenesTable scenes={guide.shooting_scenes} />
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

              {/* 4주 챌린지: 4개 URL + 4개 광고코드 입력 */}
              {selectedApplication.campaigns?.campaign_type === '4week_challenge' && (
                <>
                  {[1, 2, 3, 4].map(week => (
                    <div key={week} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">Week {week}</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SNS URL *
                        </label>
                        <input
                          type="url"
                          value={snsUploadForm[`week${week}_url`]}
                          onChange={(e) => setSnsUploadForm({...snsUploadForm, [`week${week}_url`]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="https://instagram.com/p/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          광고코드 (파트너십 코드) *
                        </label>
                        <input
                          type="text"
                          value={snsUploadForm[`week${week}_partnership_code`] || ''}
                          onChange={(e) => setSnsUploadForm({...snsUploadForm, [`week${week}_partnership_code`]: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="파트너십 광고 코드"
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 올리브영 캠페인: 3개 URL + 2개 광고코드 입력 */}
              {(selectedApplication.campaigns?.campaign_type === 'oliveyoung' || selectedApplication.campaigns?.is_oliveyoung_sale) && (
                <>
                  {/* STEP 1 릴스 섹션 */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">STEP 1</span>
                      <span className="text-xs text-green-700">릴스 (세일 7일 전)</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        STEP 1 릴스 URL *
                      </label>
                      <input
                        type="url"
                        value={snsUploadForm.step1_url}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, step1_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="https://instagram.com/reel/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        STEP 1 광고코드 (파트너십 코드) *
                      </label>
                      <input
                        type="text"
                        value={snsUploadForm.step1_partnership_code || ''}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, step1_partnership_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="파트너십 광고 코드"
                      />
                    </div>
                  </div>

                  {/* STEP 2 릴스 섹션 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">STEP 2</span>
                      <span className="text-xs text-blue-700">릴스 (세일 1일 전)</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        STEP 2 릴스 URL *
                      </label>
                      <input
                        type="url"
                        value={snsUploadForm.step2_url}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, step2_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://instagram.com/reel/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        STEP 2 광고코드 (파트너십 코드) *
                      </label>
                      <input
                        type="text"
                        value={snsUploadForm.step2_partnership_code || ''}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, step2_partnership_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="파트너십 광고 코드"
                      />
                    </div>
                  </div>

                  {/* STEP 3 스토리 섹션 */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded">STEP 3</span>
                      <span className="text-xs text-orange-700">스토리 (세일 당일)</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        STEP 3 스토리 URL *
                      </label>
                      <input
                        type="url"
                        value={snsUploadForm.step3_url}
                        onChange={(e) => setSnsUploadForm({...snsUploadForm, step3_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="https://instagram.com/stories/..."
                      />
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

              {/* 광고코드 (파트너십 코드) - 일반/기획형 캠페인에서만 표시 */}
              {/* 4주 챌린지와 올리브영은 위에서 각각 별도 입력 */}
              {selectedApplication.campaigns?.campaign_type !== '4week_challenge' &&
               selectedApplication.campaigns?.campaign_type !== 'oliveyoung' &&
               !selectedApplication.campaigns?.is_oliveyoung_sale && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    광고코드 (파트너십 코드) *
                  </label>
                  <input
                    type="text"
                    value={snsUploadForm.partnership_code}
                    onChange={(e) => setSnsUploadForm({...snsUploadForm, partnership_code: e.target.value})}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="인스타그램 파트너십 광고 코드"
                  />
                  <p className="text-xs text-orange-600 mt-2">
                    인스타그램 업로드 시 파트너십 광고 표시에 사용한 코드를 입력해주세요.
                  </p>
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
