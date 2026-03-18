import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePCView } from '../../contexts/PCViewContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, CheckCircle, AlertCircle, Loader2, AlertTriangle,
  Upload, Image, Video, Info, X, Calendar
} from 'lucide-react'

const StorySubmissionPage = () => {
  const { id } = useParams() // campaign_id
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isPCView } = usePCView()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ screenshot: 0, video: 0 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 기획안 & 제출 상태
  const [proposal, setProposal] = useState(null)
  const [existingSubmission, setExistingSubmission] = useState(null)

  // 수정 요청 관련
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionAgreed, setRevisionAgreed] = useState(false)

  // 업로드 폼
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [cleanVideoFile, setCleanVideoFile] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}/submit-story` } })
      return
    }
    loadData()
  }, [id, user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // 캠페인 조회
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 기획안 & 제출 상태 조회 (BIZ DB)
      const res = await fetch(`/.netlify/functions/get-my-story-status?user_id=${user.id}&campaign_id=${id}`)
      const data = await res.json()

      if (data.success) {
        if (data.proposals && data.proposals.length > 0) {
          setProposal(data.proposals[0])
        }
        if (data.submissions && data.submissions.length > 0) {
          setExistingSubmission(data.submissions[0])
        }
      }

    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError('정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleScreenshotSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('이미지 크기는 20MB 이하여야 합니다.')
      return
    }

    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('영상 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('영상 크기는 100MB 이하여야 합니다.')
      return
    }

    setCleanVideoFile(file)
    setError('')
  }

  const uploadFile = async (file, bucket, folder) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!screenshotFile && !existingSubmission?.screenshot_url) {
      setError('스토리 스크린샷을 업로드해주세요.')
      return
    }
    if (!cleanVideoFile && !existingSubmission?.clean_video_url) {
      setError('클린본 영상을 업로드해주세요.')
      return
    }

    // 수정 제출인 경우
    const isRevision = proposal?.status === 'revision_requested' || (existingSubmission && existingSubmission.status !== 'submitted')
    if (isRevision && !revisionAgreed) {
      setShowRevisionModal(true)
      return
    }

    try {
      setSubmitting(true)
      setUploading(true)
      setError('')

      let screenshotUrl = existingSubmission?.screenshot_url || ''
      let cleanVideoUrl = existingSubmission?.clean_video_url || ''

      // 스크린샷 업로드
      if (screenshotFile) {
        setUploadProgress(prev => ({ ...prev, screenshot: 10 }))
        screenshotUrl = await uploadFile(screenshotFile, 'campaign-videos', 'story-screenshots')
        setUploadProgress(prev => ({ ...prev, screenshot: 100 }))
      }

      // 클린본 업로드
      if (cleanVideoFile) {
        setUploadProgress(prev => ({ ...prev, video: 10 }))
        cleanVideoUrl = await uploadFile(cleanVideoFile, 'campaign-videos', 'story-clean-videos')
        setUploadProgress(prev => ({ ...prev, video: 100 }))
      }

      setUploading(false)

      // BIZ DB에 제출
      const res = await fetch('/.netlify/functions/upload-story-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposal.id,
          campaign_id: id,
          user_id: user.id,
          screenshot_url: screenshotUrl,
          clean_video_url: cleanVideoUrl,
          is_revision: isRevision,
          revision_agreed: isRevision ? true : false
        })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || '제출에 실패했습니다.')
      }

      setSuccess(true)
    } catch (err) {
      console.error('제출 오류:', err)
      setError(err.message || '제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={goBack} className="p-1 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">스토리 업로드 제출</h1>
              <div className="w-8" />
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
        </div>
      </div>
    )
  }

  // 성공 화면
  if (success) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">제출 완료!</h2>
          <p className="text-gray-500 text-center mb-8">
            스토리 업로드가 제출되었습니다.<br />
            관리자 확인 후 포인트가 지급됩니다.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my/applications')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium"
            >
              지원 내역 보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 기획안이 없거나 승인 전
  if (!proposal || (proposal.status !== 'approved' && proposal.status !== 'revision_requested')) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={48} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {!proposal ? '기획안을 먼저 제출해주세요' : '기획안이 아직 승인되지 않았습니다'}
          </h2>
          <p className="text-gray-500 text-center mb-6">
            {!proposal
              ? '스토리 업로드를 위해서는 먼저 기획안을 제출해야 합니다.'
              : proposal.status === 'pending'
                ? '기획안 검토 중입니다. 승인 후 업로드해주세요.'
                : proposal.status === 'rejected'
                  ? '기획안이 반려되었습니다.'
                  : '기획안이 아직 승인되지 않았습니다.'
            }
          </p>
          {proposal?.status === 'rejected' && proposal?.reject_reason && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 w-full max-w-sm">
              <p className="text-sm text-red-700">
                <span className="font-bold">반려 사유:</span> {proposal.reject_reason}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my/applications')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium"
            >
              지원 내역 보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <div className="pb-24">
          {/* 헤더 */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={goBack}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">스토리 업로드 제출</h1>
              <div className="w-8" />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {/* 수정 요청 알림 */}
          {proposal?.status === 'revision_requested' && (
            <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">수정이 요청되었습니다</p>
                  {proposal.admin_note && (
                    <p className="text-sm text-amber-800 mt-1">관리자 메모: {proposal.admin_note}</p>
                  )}
                  <p className="text-xs text-amber-700 mt-2 font-medium">
                    수정 시 20,000원이 추가 과금됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 승인된 기획안 표시 (읽기 전용) */}
          <div className="mx-4 mt-4 bg-rose-50 border border-rose-100 rounded-xl p-4">
            <h4 className="font-bold text-rose-900 mb-3 text-sm">승인된 기획안</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">컨셉:</span>
                <p className="text-gray-900 font-medium">{proposal.video_concept}</p>
              </div>
              {proposal.tone_mood && (
                <div>
                  <span className="text-gray-500">톤:</span>
                  <p className="text-gray-900 font-medium">{proposal.tone_mood}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">구성:</span>
                <p className="text-gray-900 font-medium">{proposal.description}</p>
              </div>
            </div>
          </div>

          {/* 필수 포함사항 */}
          <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-1.5">
              <Info size={14} className="text-blue-600" />
              스토리에 반드시 포함
            </h4>
            <div className="space-y-1.5 text-sm text-blue-800">
              {campaign?.story_swipe_link && (
                <p>링크: <span className="font-medium">{campaign.story_swipe_link}</span></p>
              )}
              {campaign?.story_hashtags && (
                <p>해시태그: <span className="font-medium">{campaign.story_hashtags}</span></p>
              )}
            </div>
          </div>

          {/* 업로드 마감일 */}
          {campaign?.end_date && (
            <div className="mx-4 mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-600" />
                <span className="text-sm font-bold text-amber-900">업로드 마감일: {new Date(campaign.end_date).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          )}

          {/* 업로드 폼 */}
          <div className="p-4 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">첨부파일 업로드</h3>

            {/* 스크린샷 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                스토리 스크린샷 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">PNG/JPG 형식</p>

              {screenshotPreview ? (
                <div className="relative w-full">
                  <img
                    src={screenshotPreview}
                    alt="스크린샷 미리보기"
                    className="w-full max-h-60 object-contain rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setScreenshotFile(null)
                      setScreenshotPreview(null)
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-rose-400 transition-colors">
                  <Image size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">이미지 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotSelect}
                    className="hidden"
                  />
                </label>
              )}

              {uploading && uploadProgress.screenshot > 0 && uploadProgress.screenshot < 100 && (
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress.screenshot}%` }}
                  />
                </div>
              )}
            </div>

            {/* 클린본 영상 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                클린본 영상 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">MP4 형식, 최대 100MB</p>

              {cleanVideoFile ? (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <Video size={24} className="text-rose-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cleanVideoFile.name}</p>
                    <p className="text-xs text-gray-500">{(cleanVideoFile.size / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                  <button
                    onClick={() => setCleanVideoFile(null)}
                    className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-rose-400 transition-colors">
                  <Video size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">동영상 업로드</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              )}

              {uploading && uploadProgress.video > 0 && uploadProgress.video < 100 && (
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress.video}%` }}
                  />
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
              광고코드 제출은 필요 없습니다.
            </div>
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className={isPCView
          ? "sticky bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-6 z-40"
          : "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 z-40"
        }>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className={`w-full py-3.5 rounded-xl font-bold transition-colors ${
              submitting || uploading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {submitting || uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {uploading ? '업로드 중...' : '제출 중...'}
              </span>
            ) : proposal?.status === 'revision_requested' ? '수정 동의 및 재제출' : '제출하기'}
          </button>
        </div>

        {/* 수정 과금 동의 모달 */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">수정 재제출 확인</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                수정 재제출 시 <span className="font-bold text-red-600">20,000원</span>이 추가 과금됩니다.
                동의하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setRevisionAgreed(true)
                    setShowRevisionModal(false)
                    // 동의 후 바로 제출
                    setTimeout(() => handleSubmit(), 100)
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold"
                >
                  동의 및 재제출
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StorySubmissionPage
