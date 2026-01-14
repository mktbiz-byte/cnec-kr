import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Send, MessageSquare, Upload, CheckCircle, Play, Clock, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'

export default function VideoReviewView() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const videoContainerRef = useRef(null)
  const fileInputRef = useRef(null)

  const [submission, setSubmission] = useState(null)
  const [allVersions, setAllVersions] = useState([]) // 모든 버전 목록
  const [comments, setComments] = useState([])
  const [replies, setReplies] = useState({})
  const [loading, setLoading] = useState(true)
  const [signedVideoUrl, setSignedVideoUrl] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [selectedComment, setSelectedComment] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})

  useEffect(() => {
    loadSubmission()
    loadComments()
  }, [submissionId])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !signedVideoUrl) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPaused(false)
    const handlePause = () => setIsPaused(true)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [signedVideoUrl])

  const loadSubmission = async () => {
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (submissionError) throw submissionError

      if (submissionData.application_id) {
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .select('applicant_name, campaign_id')
          .eq('id', submissionData.application_id)
          .single()

        if (!applicationError && applicationData) {
          submissionData.applications = applicationData

          if (applicationData.campaign_id) {
            const { data: campaignData, error: campaignError } = await supabase
              .from('campaigns')
              .select('title, company_name, company_id, company_phone, campaign_type')
              .eq('id', applicationData.campaign_id)
              .single()

            if (!campaignError && campaignData) {
              submissionData.applications.campaigns = campaignData
            }
          }
        }

        // 동일 application의 모든 버전 조회
        let versionsQuery = supabase
          .from('video_submissions')
          .select('id, version, status, created_at')
          .eq('application_id', submissionData.application_id)

        // week_number 또는 video_number가 있으면 해당 조건 추가
        if (submissionData.week_number) {
          versionsQuery = versionsQuery.eq('week_number', submissionData.week_number)
        } else if (submissionData.video_number) {
          versionsQuery = versionsQuery.eq('video_number', submissionData.video_number)
        }

        const { data: versions } = await versionsQuery.order('version', { ascending: true })

        if (versions && versions.length > 0) {
          setAllVersions(versions)
        }
      }

      setSubmission(submissionData)
      setSignedVideoUrl(submissionData.video_file_url)
    } catch (error) {
      console.error('Error loading submission:', error)
      alert('영상을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('video_review_comments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setComments(data || [])

      if (data && data.length > 0) {
        const commentIds = data.map(c => c.id)
        const { data: repliesData, error: repliesError } = await supabase
          .from('video_review_comment_replies')
          .select('*')
          .in('comment_id', commentIds)
          .order('created_at', { ascending: true })

        if (!repliesError && repliesData) {
          const repliesByComment = {}
          repliesData.forEach(reply => {
            if (!repliesByComment[reply.comment_id]) {
              repliesByComment[reply.comment_id] = []
            }
            repliesByComment[reply.comment_id].push(reply)
          })
          setReplies(repliesByComment)
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const addReply = async (commentId) => {
    if (!replyText.trim() || !authorName.trim()) {
      alert('이름과 댓글을 입력해주세요.')
      return
    }

    try {
      const { data, error } = await supabase
        .from('video_review_comment_replies')
        .insert({
          comment_id: commentId,
          author_name: authorName,
          reply_text: replyText,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setReplies(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), data]
      }))

      setReplyText('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error adding reply:', error)
      alert('댓글 추가에 실패했습니다.')
    }
  }

  const deleteReply = async (replyId, commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('video_review_comment_replies')
        .delete()
        .eq('id', replyId)

      if (error) throw error

      setReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId].filter(r => r.id !== replyId)
      }))
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert('댓글 삭제에 실패했습니다.')
    }
  }

  const seekToTimestamp = (timestamp, commentId) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.pause()
      setSelectedComment(commentId)
      // 모바일에서 영상으로 스크롤
      videoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드 가능합니다.')
      return
    }

    // 다음 버전 계산 (제한 없음)
    const currentVersion = submission?.version || 1
    const nextVersion = currentVersion + 1

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${submission.campaign_id}_v${nextVersion}_${Date.now()}.${fileExt}`
      const filePath = `video-submissions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('campaign-videos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-videos')
        .getPublicUrl(filePath)

      // 새 버전으로 INSERT (기존 레코드 덮어쓰기 대신)
      const newSubmissionData = {
        application_id: submission.application_id,
        campaign_id: submission.campaign_id,
        user_id: user.id,
        video_file_url: publicUrl,
        clean_video_url: submission.clean_video_url,
        sns_title: submission.sns_title,
        sns_content: submission.sns_content,
        hashtags: submission.hashtags,
        week_number: submission.week_number || null,
        video_number: submission.video_number || null,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      const { data: newSubmission, error: insertError } = await supabase
        .from('video_submissions')
        .insert([newSubmissionData])
        .select()
        .single()

      if (insertError) throw insertError

      // 기존 submission 상태 업데이트
      await supabase
        .from('video_submissions')
        .update({ status: 'superseded' })
        .eq('id', submissionId)

      // 자동으로 알림톡 발송
      try {
        await fetch('/.netlify/functions/send-resubmit-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: newSubmission.id })
        })
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
      }

      alert(`영상 V${nextVersion}이 제출되었습니다! 기업에게 알림이 전송되었습니다.`)

      // 새 submission 페이지로 이동
      navigate(`/video-review/${newSubmission.id}`)
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('영상 업로드에 실패했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const sendReviewCompleteNotification = async () => {
    if (!confirm('수정 완료 알림을 기업에게 전송하시겠습니까?')) return

    setSending(true)

    try {
      const response = await fetch('/.netlify/functions/send-resubmit-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })

      if (!response.ok) {
        throw new Error('알림 전송 실패')
      }

      alert('수정 완료 알림이 전송되었습니다!')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('알림 전송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  const toggleCommentExpand = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  // 영상 라벨 생성
  const getVideoLabel = () => {
    if (!submission) return ''
    const campaignType = submission.applications?.campaigns?.campaign_type
    const version = submission.version ? `V${submission.version}` : ''

    if (campaignType === '4week_challenge' && submission.week_number) {
      return `Week ${submission.week_number} ${version}`.trim()
    } else if (campaignType === 'oliveyoung' && submission.video_number) {
      return `Video ${submission.video_number} ${version}`.trim()
    }
    return version
  }

  // 다음 버전 번호
  const getNextVersion = () => {
    return (submission?.version || 1) + 1
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">영상을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/my/applications')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            지원 내역으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const campaignTitle = submission.applications?.campaigns?.title || '캠페인'
  const companyName = submission.applications?.campaigns?.company_name || '기업'
  const videoLabel = getVideoLabel()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my/applications')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 truncate">영상 수정 요청</h1>
              <p className="text-xs text-gray-500 truncate">{campaignTitle}</p>
            </div>
            {videoLabel && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg flex-shrink-0">
                {videoLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* 버전 탭 네비게이션 */}
        {allVersions.length > 1 && (
          <div className="px-4 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allVersions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    if (v.id !== submissionId) {
                      navigate(`/video-review/${v.id}`)
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    v.id === submissionId
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  V{v.version || 1}
                  {v.status === 'revision_requested' && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 안내 배너 */}
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium">
              💡 수정 요청 사항을 확인하고 영상을 수정한 후 재업로드해 주세요.
            </p>
          </div>
        </div>

        {/* 영상 플레이어 */}
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              ref={videoContainerRef}
              className="aspect-[9/16] sm:aspect-video bg-black relative"
            >
              <video
                ref={videoRef}
                controls
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                src={signedVideoUrl || submission.video_file_url}
              >
                브라우저가 비디오를 지원하지 않습니다.
              </video>

              {/* 피드백 위치 마커 (네모 박스) */}
              {comments.map((comment, index) => {
                const x = comment.box_x || (20 + (comment.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 60))
                const y = comment.box_y || (20 + ((comment.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 7) % 60))
                const width = comment.box_width || 120
                const height = comment.box_height || 120
                const isSelected = selectedComment === comment.id

                const timeDiff = Math.abs(currentTime - comment.timestamp)
                const isVisible = isPaused && timeDiff <= 2

                if (!isVisible) return null

                return (
                  <div
                    key={comment.id}
                    className={`absolute cursor-pointer transition-all ${
                      isSelected ? 'border-4 border-yellow-500 z-20' : 'border-4 border-red-500 z-10'
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${Math.min(width, 100)}px`,
                      height: `${Math.min(height, 100)}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      seekToTimestamp(comment.timestamp, comment.id)
                    }}
                  >
                    <div className={`absolute -top-7 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                      isSelected ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
                    }`}>
                      #{index + 1} {formatTime(comment.timestamp)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 타임라인 마커 */}
            {comments.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">수정 요청 위치</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full">
                  {comments.map((comment, index) => {
                    const position = videoRef.current?.duration
                      ? (comment.timestamp / videoRef.current.duration) * 100
                      : 0
                    const isSelected = selectedComment === comment.id
                    return (
                      <button
                        key={comment.id}
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all ${
                          isSelected
                            ? 'bg-yellow-500 scale-125 z-10'
                            : 'bg-red-500 hover:scale-110'
                        }`}
                        style={{ left: `calc(${position}% - 8px)` }}
                        onClick={() => seekToTimestamp(comment.timestamp, comment.id)}
                      >
                        <span className="sr-only">#{index + 1}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 수정 요청 목록 */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">
              수정 요청 사항
              <span className="ml-2 text-red-500">{comments.length}개</span>
            </h2>
          </div>

          {comments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">수정 요청 사항이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, index) => {
                const isSelected = selectedComment === comment.id
                const isExpanded = expandedComments[comment.id]
                const replyCount = replies[comment.id]?.length || 0

                return (
                  <div
                    key={comment.id}
                    className={`bg-white rounded-2xl overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-2 ring-yellow-400 shadow-lg'
                        : 'shadow-sm'
                    }`}
                  >
                    {/* 메인 컨텐츠 */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => seekToTimestamp(comment.timestamp, comment.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* 번호 뱃지 */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isSelected
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* 타임스탬프 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold ${
                              isSelected ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {formatTime(comment.timestamp)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>

                          {/* 코멘트 내용 */}
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {comment.comment}
                          </p>

                          {/* 첨부파일 */}
                          {comment.attachment_url && (
                            <a
                              href={comment.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                            >
                              <Paperclip className="w-3 h-3" />
                              첨부파일 보기
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 댓글 섹션 */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => toggleCommentExpand(comment.id)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-gray-600 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs font-medium">댓글 {replyCount}개</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-2">
                          {/* 기존 댓글 */}
                          {replies[comment.id]?.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-700">{reply.author_name}</span>
                                <button
                                  onClick={() => deleteReply(reply.id, comment.id)}
                                  className="text-xs text-red-500"
                                >
                                  삭제
                                </button>
                              </div>
                              <p className="text-xs text-gray-600">{reply.reply_text}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(reply.created_at).toLocaleString('ko-KR')}
                              </p>
                            </div>
                          ))}

                          {/* 댓글 작성 */}
                          {replyingTo === comment.id ? (
                            <div className="space-y-2 pt-2">
                              <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                placeholder="이름"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="댓글을 입력하세요..."
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => addReply(comment.id)}
                                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold"
                                >
                                  작성
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }}
                                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              댓글 달기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-4 pb-8">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">수정 완료 후</h3>
              {submission?.version && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  현재 V{submission.version}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              수정 사항을 반영한 영상을 업로드하면 자동으로 기업에게 알림이 전송됩니다.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              {uploading ? '업로드 중...' : `영상 V${getNextVersion()} 업로드`}
            </button>

            <p className="text-xs text-gray-400 text-center">
              * 영상 업로드 시 자동으로 알림톡이 전송됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
