import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle, FileVideo,
  Video, Scissors, Hash, FileText, Copy, ExternalLink, Loader2,
  X, Check
} from 'lucide-react'

export default function VideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingType, setUploadingType] = useState(null) // 'clean' or 'edited'

  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)
  const [videoSubmission, setVideoSubmission] = useState(null)

  // 영상 제출 정보
  const [cleanVideoFile, setCleanVideoFile] = useState(null)
  const [cleanVideoUrl, setCleanVideoUrl] = useState('')
  const [editedVideoFile, setEditedVideoFile] = useState(null)
  const [editedVideoUrl, setEditedVideoUrl] = useState('')
  const [snsTitle, setSnsTitle] = useState('')
  const [snsContent, setSnsContent] = useState('')
  const [hashtags, setHashtags] = useState('')

  // SNS 업로드 정보
  const [snsUploadUrl, setSnsUploadUrl] = useState('')
  const [partnershipCode, setPartnershipCode] = useState('')
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

      // 4주 챌린지인 경우 리다이렉트
      if (campaignData.campaign_type === '4week_challenge') {
        navigate(`/submit-4week-video/${campaignId}`)
        return
      }

      // 올리브영 캠페인인 경우 리다이렉트
      if (campaignData.campaign_type === 'oliveyoung') {
        navigate(`/submit-oliveyoung-video/${campaignId}`)
        return
      }

      setCampaign(campaignData)

      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (appError) throw appError
      setApplication(appData)

      // 기존 영상 제출 정보
      const { data: videoData } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', appData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (videoData) {
        setVideoSubmission(videoData)
        setCleanVideoUrl(videoData.clean_video_url || '')
        setEditedVideoUrl(videoData.video_file_url || '')
        setSnsTitle(videoData.sns_title || '')
        setSnsContent(videoData.sns_content || '')
        setHashtags(videoData.hashtags || '')
        setSnsUploadUrl(videoData.sns_upload_url || '')
        setPartnershipCode(videoData.partnership_code || '')

        if (videoData.status === 'approved' || videoData.video_file_url) {
          setShowSnsSection(true)
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (type, e) => {
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

    if (type === 'clean') {
      setCleanVideoFile(file)
    } else {
      setEditedVideoFile(file)
    }
    setError('')
  }

  const uploadVideoFile = async (file, type, version = 1) => {
    try {
      setUploading(true)
      setUploadingType(type)
      setUploadProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const fileExt = file.name.split('.').pop()
      const typePrefix = type === 'clean' ? 'clean' : 'edited'
      const fileName = `${user.id}_${campaignId}_v${version}_${typePrefix}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      const { data, error } = await supabase.storage
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
      setUploadingType(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!editedVideoFile && !editedVideoUrl) {
      setError('편집본 영상 파일을 선택해주세요.')
      return
    }

    if (!snsTitle.trim()) {
      setError('영상 제목을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const { data: { user } } = await supabase.auth.getUser()

      // 버전 계산
      let nextVersion = 1
      if (videoSubmission) {
        nextVersion = (videoSubmission.version || 0) + 1
      }

      let uploadedCleanUrl = cleanVideoUrl
      let uploadedEditedUrl = editedVideoUrl

      // 클린본 업로드
      if (cleanVideoFile) {
        uploadedCleanUrl = await uploadVideoFile(cleanVideoFile, 'clean', nextVersion)
      }

      // 편집본 업로드
      if (editedVideoFile) {
        uploadedEditedUrl = await uploadVideoFile(editedVideoFile, 'edited', nextVersion)
      }

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        clean_video_url: uploadedCleanUrl || null,
        video_file_url: uploadedEditedUrl,
        sns_title: snsTitle,
        sns_content: snsContent,
        hashtags: hashtags,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      // 항상 새 레코드로 INSERT (버전별 개별 저장)
      const { error: insertError } = await supabase
        .from('video_submissions')
        .insert([submissionData])

      if (insertError) throw insertError

      // applications 상태 업데이트
      await supabase
        .from('applications')
        .update({ status: 'video_submitted' })
        .eq('id', application.id)

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
                '캠페인명': campaign.title,
                '크리에이터명': creatorName
              }
            })
          })
        } else {
          console.log('기업 전화번호가 없어 알림톡을 발송하지 않습니다.')
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
      }

      setSuccess(`영상 V${nextVersion}이 성공적으로 제출되었습니다!`)
      setShowSnsSection(true)
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError('영상 제출에 실패했습니다: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSnsSubmit = async (e) => {
    e.preventDefault()

    if (!snsUploadUrl.trim()) {
      setError('SNS 업로드 URL을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const { error: updateError } = await supabase
        .from('video_submissions')
        .update({
          sns_upload_url: snsUploadUrl,
          partnership_code: partnershipCode,
          sns_uploaded_at: new Date().toISOString()
        })
        .eq('id', videoSubmission.id)

      if (updateError) throw updateError

      setSuccess('SNS 업로드 정보가 저장되었습니다!')

      setTimeout(() => {
        navigate('/my/applications')
      }, 2000)

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

  const getStatusBadge = () => {
    if (!videoSubmission) return null

    const statusConfig = {
      submitted: { label: '검토 중', color: 'bg-blue-500' },
      revision_requested: { label: '수정 요청', color: 'bg-yellow-500' },
      approved: { label: '승인됨', color: 'bg-green-500' }
    }

    const config = statusConfig[videoSubmission.status] || statusConfig.submitted

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${config.color}`}>
        {config.label} V{videoSubmission.version || 1}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 크리에이터 파트너십 코드 (예시)
  const creatorCode = application?.partnership_code || campaign?.partnership_code || `${campaign?.brand?.toUpperCase()?.replace(/\s/g, '_')}_${application?.id?.slice(0, 6)?.toUpperCase() || 'CODE'}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/my/applications')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">영상 업로드</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 성공/에러 알림 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* 업로드된 게시물 링크 카드 (SNS 업로드 완료 시) */}
        {videoSubmission?.sns_upload_url && (
          <a
            href={videoSubmission.sns_upload_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ExternalLink size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-600 font-medium">업로드된 게시물</p>
                <p className="text-sm font-bold text-gray-900 truncate">SNS 바로가기 ({application?.creator_name || '크리에이터'})</p>
              </div>
              <ArrowLeft size={16} className="text-purple-400 rotate-180" />
            </div>
          </a>
        )}

        {/* 제출 상태 카드 */}
        {videoSubmission && videoSubmission.video_file_url && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">제출 상태</span>
                {getStatusBadge()}
              </div>
            </div>

            {videoSubmission.status === 'revision_requested' && videoSubmission.feedback && (
              <div className="p-4 bg-yellow-50 border-t border-yellow-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-yellow-800 mb-1">기업 피드백 (수정 요청)</p>
                    <p className="text-sm text-yellow-700 whitespace-pre-wrap">{videoSubmission.feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {videoSubmission.status === 'approved' && (
              <div className="p-4 bg-green-50">
                <p className="text-sm text-green-800 font-medium">🎉 영상이 승인되었습니다!</p>
              </div>
            )}
          </div>
        )}

        {/* 파일 다운로드 섹션 - 제출 완료 후 표시 */}
        {videoSubmission && videoSubmission.video_file_url && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium mb-3">파일 다운로드</p>
            <div className="grid grid-cols-2 gap-3">
              {/* 클린본 */}
              <a
                href={videoSubmission.clean_video_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 border-dashed transition-colors ${
                  videoSubmission.clean_video_url
                    ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                    : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
                onClick={(e) => !videoSubmission.clean_video_url && e.preventDefault()}
              >
                <Video size={24} className={videoSubmission.clean_video_url ? 'text-purple-600' : 'text-gray-400'} />
                <span className={`text-sm font-bold mt-2 ${videoSubmission.clean_video_url ? 'text-gray-900' : 'text-gray-400'}`}>
                  클린본
                </span>
              </a>

              {/* 편집본 */}
              <a
                href={videoSubmission.video_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Scissors size={24} className="text-purple-600" />
                <span className="text-sm font-bold mt-2 text-gray-900">편집본</span>
              </a>
            </div>
          </div>
        )}

        {/* 파트너 코드 카드 */}
        {campaign?.ad_code_required && (
          <div className="bg-gray-900 rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-gray-400 font-medium mb-2">
              {application?.creator_name?.toUpperCase() || '크리에이터'}님의 파트너 코드
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-white font-mono text-lg font-bold tracking-wide">
                  {creatorCode}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(creatorCode)}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? '복사됨' : '복사'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <AlertCircle size={12} />
              이 코드를 통해 발생한 매출은 해당 크리에이터의 실적이 됩니다.
            </p>
          </div>
        )}

        {/* 영상 제출 폼 - 언제든 재제출 가능 */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Upload size={18} className="text-purple-600" />
                  {videoSubmission?.video_file_url ? '영상 수정본 재제출' : '영상 파일 업로드'}
                </h2>
                {videoSubmission?.status === 'revision_requested' && (
                  <p className="text-xs text-orange-600 mt-1">피드백을 반영하여 수정한 영상을 다시 업로드해주세요.</p>
                )}
                {videoSubmission?.video_file_url && videoSubmission?.status !== 'revision_requested' && (
                  <p className="text-xs text-violet-600 mt-1">수정된 영상이 있다면 다시 업로드해주세요. 기존 영상을 덮어씁니다.</p>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* 클린본 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    클린본 (자막/효과 없는 원본)
                    <span className="text-xs text-gray-400 ml-1">(선택)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange('clean', e)}
                      disabled={uploading}
                      className="hidden"
                      id="clean-video"
                    />
                    <label
                      htmlFor="clean-video"
                      className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        cleanVideoFile || cleanVideoUrl
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {cleanVideoFile ? (
                        <>
                          <FileVideo size={20} className="text-green-600" />
                          <span className="text-sm text-green-700 font-medium truncate max-w-[200px]">
                            {cleanVideoFile.name}
                          </span>
                        </>
                      ) : cleanVideoUrl ? (
                        <>
                          <CheckCircle size={20} className="text-green-600" />
                          <span className="text-sm text-green-700 font-medium">기존 파일 업로드됨</span>
                        </>
                      ) : (
                        <>
                          <Video size={20} className="text-gray-400" />
                          <span className="text-sm text-gray-500">클린본 선택</span>
                        </>
                      )}
                    </label>
                  </div>
                  {uploadingType === 'clean' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>업로드 중...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 편집본 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    편집본 (자막/효과 포함) *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange('edited', e)}
                      disabled={uploading}
                      className="hidden"
                      id="edited-video"
                    />
                    <label
                      htmlFor="edited-video"
                      className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        editedVideoFile || editedVideoUrl
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {editedVideoFile ? (
                        <>
                          <FileVideo size={20} className="text-green-600" />
                          <span className="text-sm text-green-700 font-medium truncate max-w-[200px]">
                            {editedVideoFile.name}
                          </span>
                        </>
                      ) : editedVideoUrl ? (
                        <>
                          <CheckCircle size={20} className="text-green-600" />
                          <span className="text-sm text-green-700 font-medium">기존 파일 업로드됨</span>
                        </>
                      ) : (
                        <>
                          <Scissors size={20} className="text-gray-400" />
                          <span className="text-sm text-gray-500">편집본 선택</span>
                        </>
                      )}
                    </label>
                  </div>
                  {uploadingType === 'edited' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>업로드 중...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">최대 500MB, MP4/MOV 등</p>
                </div>
              </div>
            </div>

            {/* SNS 업로드 내용 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600" />
                  SNS 업로드 내용
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* 영상 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    영상 제목 *
                  </label>
                  <input
                    type="text"
                    value={snsTitle}
                    onChange={(e) => setSnsTitle(e.target.value)}
                    placeholder="SNS에 올릴 영상 제목을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* 영상 피드글 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    영상 피드글
                  </label>
                  <textarea
                    value={snsContent}
                    onChange={(e) => setSnsContent(e.target.value)}
                    placeholder="SNS에 올릴 피드 내용을 입력하세요"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* 해시태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Hash size={14} />
                    해시태그
                  </label>
                  <textarea
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#해시태그 #광고 #협찬"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? '업로드 중...' : '제출 중...'}
                </>
              ) : (
                <>
                  <Upload size={18} />
                  {videoSubmission ? '재제출하기' : '제출하기'}
                </>
              )}
            </button>
        </form>

        {/* 안내 사항 */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">📌 안내 사항</h3>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li>• 영상은 가이드에 따라 촬영해주세요.</li>
            <li>• 클린본은 자막/효과 없는 원본 영상입니다.</li>
            <li>• 제출 후 기업 검토를 거쳐 승인됩니다.</li>
            <li>• 승인 후 포인트가 자동 지급됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
