import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Upload, CheckCircle, AlertCircle, FileVideo,
  Video, Scissors, Hash, Copy, ExternalLink, Loader2,
  Check, ChevronDown, ChevronUp, Calendar
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

  // 주차별 영상 데이터
  const [weekVideos, setWeekVideos] = useState({
    1: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, expanded: true },
    2: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, expanded: false },
    3: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, expanded: false },
    4: { cleanFile: null, cleanUrl: '', editedFile: null, editedUrl: '', title: '', content: '', hashtags: '', submission: null, expanded: false }
  })

  // SNS 업로드 정보
  const [snsForm, setSnsForm] = useState({
    week1_url: '',
    week2_url: '',
    week3_url: '',
    week4_url: '',
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

      // 주차별 데이터 로드
      const newWeekVideos = { ...weekVideos }
      let hasSubmission = false

      for (let week = 1; week <= 4; week++) {
        const { data: weekData } = await supabase
          .from('video_submissions')
          .select('*')
          .eq('application_id', appData.id)
          .eq('week_number', week)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (weekData) {
          hasSubmission = true
          newWeekVideos[week] = {
            ...newWeekVideos[week],
            cleanUrl: weekData.clean_video_url || '',
            editedUrl: weekData.video_file_url || '',
            title: weekData.sns_title || '',
            content: weekData.sns_content || '',
            hashtags: weekData.hashtags || '',
            submission: weekData,
            expanded: !weekData.video_file_url || weekData.status === 'revision_requested'
          }

          setSnsForm(prev => ({
            ...prev,
            [`week${week}_url`]: weekData.sns_upload_url || ''
          }))
        }
      }

      setWeekVideos(newWeekVideos)
      if (hasSubmission) setShowSnsSection(true)

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

    if (file.size > 500 * 1024 * 1024) {
      setError('파일 크기는 500MB 이하여야 합니다.')
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

      // 버전 계산 (제한 없음)
      let nextVersion = 1
      if (weekData.submission) {
        nextVersion = (weekData.submission.version || 0) + 1
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
        const { data: companyProfile } = await supabase
          .from('user_profiles')
          .select('company_name, email, phone')
          .eq('id', campaign.company_id)
          .single()

        if (companyProfile?.phone) {
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
              receiverNum: companyProfile.phone.replace(/-/g, ''),
              receiverName: companyProfile.company_name || '기업',
              templateCode: '025100001008',
              variables: {
                '회사명': companyProfile.company_name || '기업',
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
      setShowSnsSection(true)
      updateWeekData(week, 'expanded', false)
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError(`${week}주차 영상 제출 실패: ` + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSnsSubmit = async (e) => {
    e.preventDefault()

    const hasAnyUrl = Object.keys(snsForm).some(key => key.includes('url') && snsForm[key])
    if (!hasAnyUrl) {
      setError('최소 1개의 SNS URL을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      for (let week = 1; week <= 4; week++) {
        const weekData = weekVideos[week]
        const snsUrl = snsForm[`week${week}_url`]

        if (weekData.submission && snsUrl) {
          await supabase
            .from('video_submissions')
            .update({
              sns_upload_url: snsUrl,
              partnership_code: snsForm.partnershipCode,
              sns_uploaded_at: new Date().toISOString()
            })
            .eq('id', weekData.submission.id)
        }
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

            {/* 업로드 폼 - 언제든 재제출 가능 */}
            <>
              {weekData.submission?.video_file_url && weekData.submission?.status !== 'revision_requested' && (
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
                      {weekData.submission?.video_file_url ? `${week}주차 재제출` : `${week}주차 제출`}
                    </>
                  )}
                </button>
            </>

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

  const hasAnySubmission = Object.values(weekVideos).some(w => w.submission)

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
          <h1 className="flex-1 text-center font-bold text-gray-900">🏆 4주 챌린지 영상</h1>
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
                <p className="text-xs font-bold text-blue-800 mb-1">📢 관리자 메시지</p>
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

        {/* SNS 업로드 섹션 */}
        {showSnsSection && hasAnySubmission && (
          <form onSubmit={handleSnsSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ExternalLink size={18} className="text-indigo-600" />
                  SNS 업로드 정보
                </h2>
              </div>

              <div className="p-4 bg-red-50 border-b border-red-100">
                <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                  <AlertCircle size={12} />
                  검수 완료 후 SNS에 업로드해주세요!
                </p>
              </div>

              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(week => (
                  weekVideos[week].submission && (
                    <div key={week}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{week}주차 SNS URL</label>
                      <input
                        type="url"
                        value={snsForm[`week${week}_url`]}
                        onChange={(e) => setSnsForm(prev => ({ ...prev, [`week${week}_url`]: e.target.value }))}
                        placeholder="https://instagram.com/reel/..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )
                ))}

                {/* 광고코드 (파트너십) - 모든 캠페인에서 표시 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">광고코드 (파트너십)</label>
                  <input
                    type="text"
                    value={snsForm.partnershipCode}
                    onChange={(e) => setSnsForm(prev => ({ ...prev, partnershipCode: e.target.value }))}
                    placeholder="광고 코드 입력"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장하기'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/my/applications')}
                className="px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-700"
              >
                나중에
              </button>
            </div>
          </form>
        )}

        {/* 안내 */}
        <div className="bg-indigo-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-indigo-900 mb-2">📌 안내 사항</h3>
          <ul className="text-xs text-indigo-800 space-y-1">
            <li>• 1~4주차 영상을 순차적으로 제출해주세요.</li>
            <li>• 클린본은 자막/효과 없는 원본입니다.</li>
            <li>• 각 주차별로 개별 제출 가능합니다.</li>
            <li>• 검수 완료 후 SNS에 업로드해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
