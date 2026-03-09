import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle, FileVideo,
  Video, Scissors, Hash, Copy, Loader2,
  Check, ChevronDown, ChevronUp, Calendar, History
} from 'lucide-react'

export default function FourWeekVideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingInfo, setUploadingInfo] = useState(null) // { week: 1-4, type: 'clean'|'edited' }

  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)

  // 주차별 영상 데이터 (4개 슬롯, 각각 버전 관리)
  const [weekVideos, setWeekVideos] = useState({
    1: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, allVersions: [], expanded: true },
    2: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, allVersions: [], expanded: false },
    3: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, allVersions: [], expanded: false },
    4: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, allVersions: [], expanded: false }
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState({ 1: false, 2: false, 3: false, 4: false })

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

      // 주차별 데이터 로드 (각각 모든 버전)
      const newWeekVideos = { ...weekVideos }
      let hasSubmission = false

      for (let week = 1; week <= 4; week++) {
        const { data: allVersionsData } = await supabase
          .from('video_submissions')
          .select('*')
          .eq('application_id', appData.id)
          .eq('week_number', week)
          .order('version', { ascending: false })

        if (allVersionsData && allVersionsData.length > 0) {
          hasSubmission = true
          const latestSubmission = allVersionsData[0]

          // video_review_comments 조회
          const submissionIds = allVersionsData.map(vs => vs.id).filter(Boolean)
          let reviewCommentCount = 0
          let latestReviewSubmissionId = null
          if (submissionIds.length > 0) {
            const { data: commentsData } = await supabase
              .from('video_review_comments')
              .select('id, submission_id')
              .in('submission_id', submissionIds)
            if (commentsData && commentsData.length > 0) {
              reviewCommentCount = commentsData.length
              latestReviewSubmissionId = commentsData[0].submission_id
            }
          }

          newWeekVideos[week] = {
            ...newWeekVideos[week],
            cleanFile: null,
            cleanUrl: latestSubmission.clean_video_url || '',
            editedFile: null,
            editedUrl: latestSubmission.video_file_url || '',
            title: latestSubmission.sns_title || '',
            content: latestSubmission.sns_content || '',
            hashtags: latestSubmission.hashtags || '',
            submission: latestSubmission,
            allVersions: allVersionsData,
            expanded: !latestSubmission.video_file_url || latestSubmission.status === 'revision_requested',
            reviewCommentCount,
            latestReviewSubmissionId
          }

        }
      }

      setWeekVideos(newWeekVideos)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateWeekData = (week, field, value) => {
    setWeekVideos(prev => ({
      ...prev,
      [week]: { ...prev[week], [field]: value }
    }))
  }

  const handleFileChange = (week, type, e) => {
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
    updateWeekData(week, key, file)
    setError('')
  }

  const uploadVideoFile = async (file, week, type, version = 1) => {
    try {
      setUploading(true)
      setUploadingInfo({ week, type })
      setUploadProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${campaignId}_week${week}_v${version}_${type}_${Date.now()}.${fileExt}`
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

  const handleWeekSubmit = async (week) => {
    const weekData = weekVideos[week]

    if (!weekData.editedFile && !weekData.editedUrl) {
      setError(`${week}주차 편집본을 선택해주세요.`)
      return
    }

    if (!weekData.title.trim()) {
      setError(`${week}주차 영상 제목을 입력해주세요.`)
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const { data: { user } } = await supabase.auth.getUser()

      // 버전 계산 (v1 ~ v10)
      let nextVersion = 1
      if (weekData.submission) {
        nextVersion = (weekData.submission.version || 0) + 1
      }

      // 버전 제한 체크 (최대 v10)
      if (nextVersion > 10) {
        setError(`${week}주차는 최대 10번까지만 재제출할 수 있습니다.`)
        return
      }

      let uploadedCleanUrl = weekData.cleanUrl
      let uploadedEditedUrl = weekData.editedUrl

      if (weekData.cleanFile) {
        uploadedCleanUrl = await uploadVideoFile(weekData.cleanFile, week, 'clean', nextVersion)
      }

      if (weekData.editedFile) {
        uploadedEditedUrl = await uploadVideoFile(weekData.editedFile, week, 'edited', nextVersion)
      }

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        clean_video_url: uploadedCleanUrl || null,
        video_file_url: uploadedEditedUrl,
        sns_title: weekData.title,
        sns_content: weekData.content,
        hashtags: weekData.hashtags,
        week_number: week,
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

        let companyPhone = campaign?.company_phone

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
                '캠페인명': `${campaign.title} - ${week}주차`,
                '크리에이터명': creatorName
              }
            })
          })
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
      }

      setSuccess(`${week}주차 영상 V${nextVersion}이 제출되었습니다!`)
      updateWeekData(week, 'expanded', false)
      setWeekVideos(prev => ({
        ...prev,
        [week]: { ...prev[week], cleanFile: null, editedFile: null }
      }))
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      const msg = err.message || ''
      let userMsg = `${week}주차 영상 제출 실패: `
      if (msg.includes('http_request') || msg.includes('supabase_functions')) {
        userMsg += '서버 설정 오류입니다. 관리자에게 문의해주세요.'
      } else if (msg.includes('row-level security')) {
        userMsg += '권한이 없습니다. 다시 로그인해주세요.'
      } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
        userMsg += '네트워크 오류입니다. 인터넷 연결을 확인해주세요.'
      } else {
        userMsg += msg || '알 수 없는 오류가 발생했습니다.'
      }
      setError(userMsg)
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

  const weekColors = {
    1: { bg: 'from-red-500 to-orange-500', light: 'bg-red-50 border-red-100', text: 'text-red-600' },
    2: { bg: 'from-orange-500 to-amber-500', light: 'bg-orange-50 border-orange-100', text: 'text-orange-600' },
    3: { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
    4: { bg: 'from-green-500 to-emerald-500', light: 'bg-green-50 border-green-100', text: 'text-green-600' }
  }

  const renderWeekSection = (week) => {
    const weekData = weekVideos[week]
    const colors = weekColors[week]
    const isUploading = uploadingInfo?.week === week
    const currentVersion = weekData.submission?.version || 0
    const canResubmit = currentVersion < 10

    return (
      <div key={week} className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <button
          onClick={() => updateWeekData(week, 'expanded', !weekData.expanded)}
          className={`w-full p-4 flex items-center justify-between ${colors.light} border-b`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-sm`}>
              <Calendar size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">{week}주차</p>
              {weekData.submission && (
                <p className="text-xs text-gray-500">
                  {new Date(weekData.submission.submitted_at).toLocaleDateString('ko-KR')} 제출
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(weekData.submission)}
            {weekData.expanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </button>

        {/* 콘텐츠 */}
        {weekData.expanded && (
          <div className="p-4 space-y-4">
            {/* 버전 히스토리 */}
            {weekData.allVersions.length > 1 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowVersionHistory(prev => ({ ...prev, [week]: !prev[week] }))}
                  className={`flex items-center gap-2 text-sm ${colors.text} hover:opacity-80`}
                >
                  <History size={14} />
                  버전 히스토리 ({weekData.allVersions.length}개)
                </button>
                {showVersionHistory[week] && (
                  <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-2">
                    {weekData.allVersions.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${colors.text}`}>V{v.version}</span>
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

            {/* video_review_comments 수정 요청 배너 */}
            {weekData.reviewCommentCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold text-red-900">영상 수정 요청이 있습니다!</p>
                </div>
                <button
                  onClick={() => navigate(`/video-review/${weekData.latestReviewSubmissionId}`)}
                  className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  수정 요청 확인하기 ({weekData.reviewCommentCount}개)
                </button>
              </div>
            )}

            {/* 피드백 */}
            {weekData.submission?.status === 'revision_requested' && weekData.submission?.feedback && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-yellow-800 mb-1">기업 피드백</p>
                    <p className="text-sm text-yellow-700">{weekData.submission.feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 제출 완료 후 파일 다운로드 */}
            {weekData.submission?.video_file_url && weekData.submission?.status !== 'revision_requested' && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={weekData.submission.clean_video_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 border-dashed ${
                    weekData.submission.clean_video_url
                      ? `${colors.light} hover:bg-opacity-80`
                      : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={(e) => !weekData.submission.clean_video_url && e.preventDefault()}
                >
                  <Video size={20} className={weekData.submission.clean_video_url ? colors.text : 'text-gray-400'} />
                  <span className={`text-xs font-bold mt-1 ${weekData.submission.clean_video_url ? 'text-gray-900' : 'text-gray-400'}`}>
                    클린본
                  </span>
                </a>
                <a
                  href={weekData.submission.video_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 border-dashed ${colors.light} hover:bg-opacity-80`}
                >
                  <Scissors size={20} className={colors.text} />
                  <span className="text-xs font-bold mt-1 text-gray-900">편집본</span>
                </a>
              </div>
            )}

            {/* 업로드 폼 - 재제출 가능 (v10까지) */}
            {canResubmit && (
              <>
                {weekData.submission?.video_file_url && weekData.submission?.status !== 'revision_requested' && (
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
                    onChange={(e) => handleFileChange(week, 'clean', e)}
                    disabled={uploading}
                    className="hidden"
                    id={`clean-video-week-${week}`}
                  />
                  <label
                    htmlFor={`clean-video-week-${week}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      weekData.cleanFile || weekData.cleanUrl
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {weekData.cleanFile ? (
                      <>
                        <FileVideo size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium truncate max-w-[150px]">{weekData.cleanFile.name}</span>
                      </>
                    ) : weekData.cleanUrl ? (
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
                        <div className={`bg-gradient-to-r ${colors.bg} h-1 rounded-full`} style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 편집본 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">편집본 *</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(week, 'edited', e)}
                    disabled={uploading}
                    className="hidden"
                    id={`edited-video-week-${week}`}
                  />
                  <label
                    htmlFor={`edited-video-week-${week}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
                      weekData.editedFile || weekData.editedUrl
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {weekData.editedFile ? (
                      <>
                        <FileVideo size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium truncate max-w-[150px]">{weekData.editedFile.name}</span>
                      </>
                    ) : weekData.editedUrl ? (
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
                        <div className={`bg-gradient-to-r ${colors.bg} h-1 rounded-full`} style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 제목 *</label>
                  <input
                    type="text"
                    value={weekData.title}
                    onChange={(e) => updateWeekData(week, 'title', e.target.value)}
                    placeholder={`${week}주차 영상 제목`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 피드글 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">영상 피드글</label>
                  <textarea
                    value={weekData.content}
                    onChange={(e) => updateWeekData(week, 'content', e.target.value)}
                    placeholder="SNS 피드 내용"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                    value={weekData.hashtags}
                    onChange={(e) => updateWeekData(week, 'hashtags', e.target.value)}
                    placeholder="#해시태그 #챌린지"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 제출 버튼 */}
                <button
                  onClick={() => handleWeekSubmit(week)}
                  disabled={submitting || uploading}
                  className={`w-full py-3 bg-gradient-to-r ${colors.bg} text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {submitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isUploading ? '업로드 중...' : '제출 중...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {weekData.submission?.video_file_url ? `V${currentVersion + 1} 재제출` : `${week}주차 제출`}
                    </>
                  )}
                </button>
              </>
            )}

            {/* v10 도달 시 */}
            {!canResubmit && weekData.submission && (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">
                  최대 재제출 횟수(V10)에 도달했습니다.
                </p>
              </div>
            )}

            {/* 현재 상태 */}
            {weekData.submission?.video_file_url && (
              <div className={`${colors.light} rounded-xl p-3 text-center border`}>
                <p className={`text-sm font-medium ${weekData.submission.status === 'approved' ? 'text-green-600' : colors.text}`}>
                  {weekData.submission.status === 'approved' ? '🎉 승인 완료!' : '✅ 검수 중입니다'}
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
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  const creatorCode = application?.partnership_code || campaign?.partnership_code ||
    `CHALLENGE_${application?.id?.slice(0, 6)?.toUpperCase() || 'CODE'}`

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
          <h1 className="flex-1 text-center font-bold text-gray-900">4주 챌린지 영상</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 캠페인 정보 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white">
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

        {/* 관리자 메시지 */}
        {application?.individualMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">관리자 메시지</p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{application.individualMessage}</p>
              </div>
            </div>
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

        {/* 주차별 영상 */}
        {[1, 2, 3, 4].map(week => renderWeekSection(week))}

        {/* 안내 */}
        <div className="bg-indigo-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-indigo-900 mb-2">📌 안내 사항</h3>
          <ul className="text-xs text-indigo-800 space-y-1">
            <li>• 1~4주차 편집 영상과 클린본을 각각 제출합니다.</li>
            <li>• 수정이 필요하면 재업로드하세요. (V1 → V2 → ... V10)</li>
            <li>• 클린본은 자막/효과 없는 원본입니다.</li>
            <li>• 검수 완료 후 SNS에 업로드해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
