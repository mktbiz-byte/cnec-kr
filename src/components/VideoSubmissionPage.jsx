import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle, FileVideo,
  Video, Scissors, Hash, FileText, Copy, Loader2,
  X, Check, ChevronDown, History
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

  // 영상 데이터 (1개 슬롯, 버전 관리)
  const [videoData, setVideoData] = useState({
    cleanFile: null,
    cleanUrl: '',
    editedFile: null,
    editedUrl: '',
    title: '',
    content: '',
    hashtags: '',
    submission: null, // 최신 제출
    allVersions: [],  // 모든 버전 목록
    expanded: true
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)

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

      // 영상 데이터 조회 (video_number = 1, 모든 버전)
      const { data: allVersionsData } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', appData.id)
        .eq('video_number', 1)
        .order('version', { ascending: false })

      if (allVersionsData && allVersionsData.length > 0) {
        const latestSubmission = allVersionsData[0]
        setVideoData({
          cleanFile: null,
          cleanUrl: latestSubmission.clean_video_url || '',
          editedFile: null,
          editedUrl: latestSubmission.video_file_url || '',
          title: latestSubmission.sns_title || '',
          content: latestSubmission.sns_content || '',
          hashtags: latestSubmission.hashtags || '',
          submission: latestSubmission,
          allVersions: allVersionsData,
          expanded: !latestSubmission.video_file_url || latestSubmission.status === 'revision_requested'
        })
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

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError('파일 크기는 2GB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('영상 파일만 업로드 가능합니다.')
      return
    }

    const key = type === 'clean' ? 'cleanFile' : 'editedFile'
    setVideoData(prev => ({ ...prev, [key]: file }))
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
      const fileName = `${user.id}_${campaignId}_video1_v${version}_${typePrefix}_${Date.now()}.${fileExt}`
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

  const handleVideoSubmit = async () => {
    if (!videoData.editedFile && !videoData.editedUrl) {
      setError('편집본을 선택해주세요.')
      return
    }

    if (!videoData.title.trim()) {
      setError('영상 제목을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const { data: { user } } = await supabase.auth.getUser()

      // 버전 계산 (v1 ~ v10)
      let nextVersion = 1
      if (videoData.submission) {
        nextVersion = (videoData.submission.version || 0) + 1
      }

      // 버전 제한 체크 (최대 v10)
      if (nextVersion > 10) {
        setError('최대 10번까지만 재제출할 수 있습니다.')
        return
      }

      let uploadedCleanUrl = videoData.cleanUrl
      let uploadedEditedUrl = videoData.editedUrl

      // 클린본 업로드
      if (videoData.cleanFile) {
        uploadedCleanUrl = await uploadVideoFile(videoData.cleanFile, 'clean', nextVersion)
      }

      // 편집본 업로드
      if (videoData.editedFile) {
        uploadedEditedUrl = await uploadVideoFile(videoData.editedFile, 'edited', nextVersion)
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
        video_number: 1, // 항상 1 (1개 슬롯)
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

      setSuccess(`영상 V${nextVersion}이 제출되었습니다!`)
      setVideoData(prev => ({ ...prev, expanded: false, cleanFile: null, editedFile: null }))
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError('영상 제출 실패: ' + err.message)
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

  const renderVideoSection = () => {
    const isUploading = uploadingType && uploading
    const currentVersion = videoData.submission?.version || 0
    const canResubmit = currentVersion < 10

    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <button
          onClick={() => setVideoData(prev => ({ ...prev, expanded: !prev.expanded }))}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Video size={16} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">편집 영상</p>
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
              <ChevronDown size={20} className="text-gray-400 rotate-180" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* 콘텐츠 */}
        {videoData.expanded && (
          <div className="p-4 space-y-4">
            {/* 버전 히스토리 */}
            {videoData.allVersions.length > 1 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  <History size={14} />
                  버전 히스토리 ({videoData.allVersions.length}개)
                </button>
                {showVersionHistory && (
                  <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-2">
                    {videoData.allVersions.map((v, idx) => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600">V{v.version}</span>
                          <span className="text-gray-500">
                            {new Date(v.submitted_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                          v.status === 'approved' ? 'bg-green-500' :
                          v.status === 'revision_requested' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {v.status === 'approved' ? '승인' : v.status === 'revision_requested' ? '수정요청' : '검토중'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                      ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={(e) => !videoData.submission.clean_video_url && e.preventDefault()}
                >
                  <Video size={20} className={videoData.submission.clean_video_url ? 'text-purple-600' : 'text-gray-400'} />
                  <span className={`text-xs font-bold mt-1 ${videoData.submission.clean_video_url ? 'text-gray-900' : 'text-gray-400'}`}>
                    클린본
                  </span>
                </a>
                <a
                  href={videoData.submission.video_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100"
                >
                  <Scissors size={20} className="text-purple-600" />
                  <span className="text-xs font-bold mt-1 text-gray-900">편집본</span>
                </a>
              </div>
            )}

            {/* 업로드 폼 - 재제출 가능 (v10까지) */}
            {canResubmit && (
              <>
                {videoData.submission?.video_file_url && videoData.submission?.status !== 'revision_requested' && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-3">
                    <p className="text-xs text-violet-700 font-medium">
                      수정된 영상이 있다면 다시 업로드해주세요. V{currentVersion + 1}로 제출됩니다. (최대 V10)
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
                    onChange={(e) => handleFileChange('clean', e)}
                    disabled={uploading}
                    className="hidden"
                    id="clean-video"
                  />
                  <label
                    htmlFor="clean-video"
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      videoData.cleanFile || videoData.cleanUrl
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {videoData.cleanFile ? (
                      <>
                        <FileVideo size={16} className="text-purple-600" />
                        <span className="text-purple-700 font-medium truncate max-w-[150px]">{videoData.cleanFile.name}</span>
                      </>
                    ) : videoData.cleanUrl ? (
                      <>
                        <CheckCircle size={16} className="text-purple-600" />
                        <span className="text-purple-700 font-medium">기존 파일</span>
                      </>
                    ) : (
                      <>
                        <Video size={16} className="text-gray-400" />
                        <span className="text-gray-500">클린본 선택</span>
                      </>
                    )}
                  </label>
                </div>

                {/* 편집본 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    편집본 *
                  </label>
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
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      videoData.editedFile || videoData.editedUrl
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {videoData.editedFile ? (
                      <>
                        <FileVideo size={16} className="text-purple-600" />
                        <span className="text-purple-700 font-medium truncate max-w-[150px]">{videoData.editedFile.name}</span>
                      </>
                    ) : videoData.editedUrl ? (
                      <>
                        <CheckCircle size={16} className="text-purple-600" />
                        <span className="text-purple-700 font-medium">기존 파일</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={16} className="text-gray-400" />
                        <span className="text-gray-500">편집본 선택</span>
                      </>
                    )}
                  </label>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 제목 *</label>
                  <input
                    type="text"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="SNS 영상 제목"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 피드글 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 피드글</label>
                  <textarea
                    value={videoData.content}
                    onChange={(e) => setVideoData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="SNS 피드 내용"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                    onChange={(e) => setVideoData(prev => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="#해시태그 #광고"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 제출 버튼 */}
                <button
                  onClick={handleVideoSubmit}
                  disabled={submitting || uploading}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUploading ? '업로드 중...' : '제출 중...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {videoData.submission?.video_file_url ? `V${currentVersion + 1} 재제출` : '영상 제출'}
                    </>
                  )}
                </button>
              </>
            )}

            {/* v10 도달 시 */}
            {!canResubmit && videoData.submission && (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">
                  최대 재제출 횟수(V10)에 도달했습니다.
                </p>
              </div>
            )}

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

        {/* 영상 업로드 섹션 (1개) */}
        {renderVideoSection()}

        {/* 안내 사항 */}
        <div className="bg-purple-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-purple-900 mb-2">📌 안내 사항</h3>
          <ul className="text-xs text-purple-800 space-y-1.5">
            <li>• 편집 영상 1개와 클린본 1개를 제출합니다.</li>
            <li>• 수정이 필요하면 재업로드하세요. (V1 → V2 → ... V10)</li>
            <li>• 클린본은 자막/효과 없는 원본 영상입니다.</li>
            <li>• 제출 후 기업 검토를 거쳐 승인됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
