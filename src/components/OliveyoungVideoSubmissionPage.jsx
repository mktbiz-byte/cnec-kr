import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle, FileVideo,
  Video, Scissors, Hash, FileText, Copy, ExternalLink, Loader2,
  Check, ChevronDown, ChevronUp
} from 'lucide-react'

export default function OliveyoungVideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingInfo, setUploadingInfo] = useState(null) // { videoNum: 1|2, type: 'clean'|'edited' }

  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)

  // 영상 데이터 (최대 10개)
  const [videos, setVideos] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      number: i + 1,
      cleanFile: null,
      cleanUrl: '',
      editedFile: null,
      editedUrl: '',
      title: '',
      content: '',
      hashtags: '',
      submission: null,
      expanded: i === 0 // 첫 번째만 기본 열림
    }))
  )

  // SNS 업로드 정보
  const [snsForm, setSnsForm] = useState({
    videoUrls: {},
    partnershipCode: ''
  })
  const [showSnsSection, setShowSnsSection] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [campaignId])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (appError) throw appError
      setApplication(appData)

      // 영상 데이터 (1-10) 조회
      const updatedVideos = [...videos]
      const updatedSnsUrls = {}
      let hasSubmittedVideo = false

      for (let i = 1; i <= 10; i++) {
        const { data: videoData } = await supabase
          .from('video_submissions')
          .select('*')
          .eq('application_id', appData.id)
          .eq('video_number', i)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (videoData) {
          updatedVideos[i - 1] = {
            ...updatedVideos[i - 1],
            cleanUrl: videoData.clean_video_url || '',
            editedUrl: videoData.video_file_url || '',
            title: videoData.sns_title || '',
            content: videoData.sns_content || '',
            hashtags: videoData.hashtags || '',
            submission: videoData,
            expanded: !videoData.video_file_url
          }
          updatedSnsUrls[i] = videoData.sns_upload_url || ''
          if (videoData.video_file_url) hasSubmittedVideo = true
        }
      }

      setVideos(updatedVideos)
      setSnsForm(prev => ({ ...prev, videoUrls: updatedSnsUrls }))

      // SNS 섹션 표시 여부
      if (hasSubmittedVideo) {
        setShowSnsSection(true)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (videoNum, type, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 500 * 1024 * 1024) {
      setError('파일 크기는 500MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('영상 파일만 업로드 가능합니다.')
      return
    }

    const key = type === 'clean' ? 'cleanFile' : 'editedFile'
    setVideos(prev => {
      const updated = [...prev]
      updated[videoNum - 1] = { ...updated[videoNum - 1], [key]: file }
      return updated
    })
    setError('')
  }

  const uploadVideoFile = async (file, videoNum, type, version = 1) => {
    try {
      setUploading(true)
      setUploadingInfo({ videoNum, type })
      setUploadProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${campaignId}_video${videoNum}_v${version}_${type}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      const { error } = await supabase.storage
        .from('campaign-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percent))
          }
        })

      if (error) throw error
      setUploadProgress(100)

      const { data: urlData } = supabase.storage
        .from('campaign-videos')
        .getPublicUrl(filePath)

      return urlData.publicUrl

    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    } finally {
      setUploading(false)
      setUploadingInfo(null)
    }
  }

  const handleVideoSubmit = async (videoNum) => {
    const videoData = videos[videoNum - 1]

    if (!videoData.editedFile && !videoData.editedUrl) {
      setError(`영상 ${videoNum} 편집본을 선택해주세요.`)
      return
    }

    if (!videoData.title.trim()) {
      setError(`영상 ${videoNum} 제목을 입력해주세요.`)
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const { data: { user } } = await supabase.auth.getUser()

      // 버전 계산 (제한 없음)
      let nextVersion = 1
      if (videoData.submission) {
        nextVersion = (videoData.submission.version || 0) + 1
      }

      let uploadedCleanUrl = videoData.cleanUrl
      let uploadedEditedUrl = videoData.editedUrl

      if (videoData.cleanFile) {
        uploadedCleanUrl = await uploadVideoFile(videoData.cleanFile, videoNum, 'clean', nextVersion)
      }

      if (videoData.editedFile) {
        uploadedEditedUrl = await uploadVideoFile(videoData.editedFile, videoNum, 'edited', nextVersion)
      }

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        clean_video_url: uploadedCleanUrl || null,
        video_file_url: uploadedEditedUrl,
        sns_title: videoData.title,
        sns_content: videoData.content,
        hashtags: videoData.hashtags,
        video_number: videoNum,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('video_submissions')
        .insert([submissionData])

      if (insertError) throw insertError

      // 알림 발송
      try {
        const companyName = campaign?.company_name || '기업'

        // 1. 캠페인에 저장된 company_phone 먼저 확인
        let companyPhone = campaign?.company_phone

        // 2. 없으면 user_profiles에서 조회
        if (!companyPhone && campaign?.company_id) {
          const { data: companyProfile } = await supabase
            .from('user_profiles')
            .select('phone')
            .eq('id', campaign.company_id)
            .single()
          companyPhone = companyProfile?.phone
        }

        if (companyPhone) {
          const { data: creatorProfile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', user.id)
            .single()

          const creatorName = creatorProfile?.name || '크리에이터'

          await fetch('/.netlify/functions/send-alimtalk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiverNum: companyPhone.replace(/-/g, ''),
              receiverName: companyName,
              templateCode: '025100001008',
              variables: {
                '회사명': companyName,
                '캠페인명': `${campaign.title} - 영상${videoNum}`,
                '크리에이터명': creatorName
              }
            })
          })
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
      }

      setSuccess(`영상 ${videoNum} V${nextVersion}이 제출되었습니다!`)
      setShowSnsSection(true)
      setVideos(prev => {
        const updated = [...prev]
        updated[videoNum - 1] = { ...updated[videoNum - 1], expanded: false }
        return updated
      })
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError(`영상 ${videoNum} 제출 실패: ` + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSnsSubmit = async (e) => {
    e.preventDefault()

    const hasAnyUrl = Object.values(snsForm.videoUrls).some(url => url && url.trim())
    if (!hasAnyUrl) {
      setError('최소 1개의 SNS URL을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      for (let i = 1; i <= 10; i++) {
        const video = videos[i - 1]
        const url = snsForm.videoUrls[i]

        if (video.submission && url && url.trim()) {
          await supabase
            .from('video_submissions')
            .update({
              sns_upload_url: url,
              partnership_code: snsForm.partnershipCode,
              sns_uploaded_at: new Date().toISOString()
            })
            .eq('id', video.submission.id)
        }
      }

      // 기업에게 SNS 업로드 완료 알림톡 발송
      try {
        const companyName = campaign?.company_name || '기업'

        // 1. 캠페인에 저장된 company_phone 먼저 확인
        let companyPhone = campaign?.company_phone

        // 2. 없으면 user_profiles에서 조회
        if (!companyPhone && campaign?.company_id) {
          const { data: companyProfile } = await supabase
            .from('user_profiles')
            .select('phone')
            .eq('id', campaign.company_id)
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
                '캠페인명': campaign?.title || '캠페인'
              }
            })
          })
        } else {
          console.log('기업 전화번호가 없어 알림톡을 발송하지 않습니다.')
        }
      } catch (notificationError) {
        console.error('알림톡 발송 오류:', notificationError)
      }

      setSuccess('SNS 업로드 정보가 저장되었습니다!')
      setTimeout(() => navigate('/my/applications'), 2000)

    } catch (err) {
      console.error('Error updating SNS info:', err)
      setError('SNS 정보 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const getStatusBadge = (submission) => {
    if (!submission) return null

    const statusConfig = {
      submitted: { label: '검토 중', color: 'bg-blue-500' },
      revision_requested: { label: '수정 요청', color: 'bg-yellow-500' },
      approved: { label: '승인됨', color: 'bg-green-500' }
    }

    const config = statusConfig[submission.status] || statusConfig.submitted

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${config.color}`}>
        {config.label} V{submission.version || 1}
      </span>
    )
  }

  const renderVideoSection = (videoNum) => {
    const videoData = videos[videoNum - 1]
    const isUploading = uploadingInfo?.videoNum === videoNum

    const updateVideoData = (updates) => {
      setVideos(prev => {
        const updated = [...prev]
        updated[videoNum - 1] = { ...updated[videoNum - 1], ...updates }
        return updated
      })
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <button
          onClick={() => updateVideoData({ expanded: !videoData.expanded })}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{videoNum}</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">영상 {videoNum}</p>
              {videoData.submission && (
                <p className="text-xs text-gray-500">
                  {new Date(videoData.submission.submitted_at).toLocaleDateString('ko-KR')} 제출
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(videoData.submission)}
            {videoData.expanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* 콘텐츠 */}
        {videoData.expanded && (
          <div className="p-4 space-y-4">
            {/* 피드백 */}
            {videoData.submission?.status === 'revision_requested' && videoData.submission?.feedback && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-yellow-800 mb-1">기업 피드백</p>
                    <p className="text-sm text-yellow-700">{videoData.submission.feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 제출 완료 후 파일 다운로드 */}
            {videoData.submission?.video_file_url && videoData.submission?.status !== 'revision_requested' && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={videoData.submission.clean_video_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 border-dashed ${
                    videoData.submission.clean_video_url
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={(e) => !videoData.submission.clean_video_url && e.preventDefault()}
                >
                  <Video size={20} className={videoData.submission.clean_video_url ? 'text-green-600' : 'text-gray-400'} />
                  <span className={`text-xs font-bold mt-1 ${videoData.submission.clean_video_url ? 'text-gray-900' : 'text-gray-400'}`}>
                    클린본
                  </span>
                </a>
                <a
                  href={videoData.submission.video_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 border-dashed border-green-200 bg-green-50 hover:bg-green-100"
                >
                  <Scissors size={20} className="text-green-600" />
                  <span className="text-xs font-bold mt-1 text-gray-900">편집본</span>
                </a>
              </div>
            )}

            {/* 업로드 폼 - 언제든 재제출 가능 */}
            <>
              {videoData.submission?.video_file_url && videoData.submission?.status !== 'revision_requested' && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-3">
                  <p className="text-xs text-violet-700 font-medium">
                    수정된 영상이 있다면 다시 업로드해주세요. 새 버전으로 제출됩니다.
                  </p>
                </div>
              )}
              {/* 클린본 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    클린본 <span className="text-xs text-gray-400">(선택)</span>
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(videoNum, 'clean', e)}
                    disabled={uploading}
                    className="hidden"
                    id={`clean-video-${videoNum}`}
                  />
                  <label
                    htmlFor={`clean-video-${videoNum}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      videoData.cleanFile || videoData.cleanUrl
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {videoData.cleanFile ? (
                      <>
                        <FileVideo size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium truncate max-w-[150px]">{videoData.cleanFile.name}</span>
                      </>
                    ) : videoData.cleanUrl ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium">기존 파일</span>
                      </>
                    ) : (
                      <>
                        <Video size={16} className="text-gray-400" />
                        <span className="text-gray-500">클린본 선택</span>
                      </>
                    )}
                  </label>
                  {isUploading && uploadingInfo?.type === 'clean' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div className="bg-green-600 h-1 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 편집본 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    편집본 *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(videoNum, 'edited', e)}
                    disabled={uploading}
                    className="hidden"
                    id={`edited-video-${videoNum}`}
                  />
                  <label
                    htmlFor={`edited-video-${videoNum}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      videoData.editedFile || videoData.editedUrl
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {videoData.editedFile ? (
                      <>
                        <FileVideo size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium truncate max-w-[150px]">{videoData.editedFile.name}</span>
                      </>
                    ) : videoData.editedUrl ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium">기존 파일</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={16} className="text-gray-400" />
                        <span className="text-gray-500">편집본 선택</span>
                      </>
                    )}
                  </label>
                  {isUploading && uploadingInfo?.type === 'edited' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div className="bg-green-600 h-1 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 제목 *</label>
                  <input
                    type="text"
                    value={videoData.title}
                    onChange={(e) => updateVideoData({ title: e.target.value })}
                    placeholder="SNS 영상 제목"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 피드글 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 피드글</label>
                  <textarea
                    value={videoData.content}
                    onChange={(e) => updateVideoData({ content: e.target.value })}
                    placeholder="SNS 피드 내용"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                {/* 해시태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Hash size={14} />
                    해시태그
                  </label>
                  <input
                    type="text"
                    value={videoData.hashtags}
                    onChange={(e) => updateVideoData({ hashtags: e.target.value })}
                    placeholder="#해시태그 #올리브영"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 제출 버튼 */}
                <button
                  onClick={() => handleVideoSubmit(videoNum)}
                  disabled={submitting || uploading}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUploading ? '업로드 중...' : '제출 중...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {videoData.submission?.video_file_url ? `영상 ${videoNum} 재제출` : `영상 ${videoNum} 제출`}
                    </>
                  )}
                </button>
            </>

            {/* 현재 상태 */}
            {videoData.submission?.video_file_url && (
              <div className={`rounded-xl p-3 text-center ${videoData.submission.status === 'approved' ? 'bg-green-50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-medium ${videoData.submission.status === 'approved' ? 'text-green-800' : 'text-blue-800'}`}>
                  {videoData.submission.status === 'approved' ? '🎉 승인 완료!' : '✅ 검수 중입니다'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  const creatorCode = application?.partnership_code || campaign?.partnership_code ||
    `OLIVEYOUNG_${application?.id?.slice(0, 6)?.toUpperCase() || 'CODE'}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/my/applications')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">🌸 올리브영 영상 업로드</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 캠페인 정보 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80">{campaign?.brand}</p>
          <p className="font-bold">{campaign?.title}</p>
        </div>

        {/* 알림 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* 파트너 코드 */}
        {campaign?.ad_code_required && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-2">{application?.creator_name || '크리에이터'}님의 파트너 코드</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-800 rounded-xl px-4 py-2">
                <p className="text-white font-mono font-bold">{creatorCode}</p>
              </div>
              <button
                onClick={() => copyToClipboard(creatorCode)}
                className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl text-sm font-bold"
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                {copiedCode ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        )}

        {/* 영상 1-10 */}
        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
          <div key={num}>{renderVideoSection(num)}</div>
        ))}

        {/* 안내 */}
        <div className="bg-green-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-green-900 mb-2">📌 안내 사항</h3>
          <ul className="text-xs text-green-800 space-y-1">
            <li>• 최대 10개의 영상을 제출할 수 있습니다.</li>
            <li>• 클린본은 자막/효과 없는 원본입니다.</li>
            <li>• 각 영상별로 개별 제출 가능합니다.</li>
            <li>• 검수 완료 후 SNS에 업로드해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
