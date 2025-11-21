import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Video, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function VideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)
  const [videoSubmission, setVideoSubmission] = useState(null)
  
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [campaignId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // 캠페인 정보 가져오기
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 지원 정보 가져오기
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (appError) throw appError
      setApplication(appData)

      // 기존 영상 제출 정보 가져오기
      const { data: videoData, error: videoError } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', appData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (videoData) {
        setVideoSubmission(videoData)
        setVideoUrl(videoData.video_url || '')
        setVideoTitle(videoData.video_title || '')
        setVideoDescription(videoData.video_description || '')
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!videoUrl.trim()) {
      setError('영상 URL을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        video_url: videoUrl,
        video_title: videoTitle,
        video_description: videoDescription,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      if (videoSubmission) {
        // 재제출
        const { error: updateError } = await supabase
          .from('video_submissions')
          .update({
            ...submissionData,
            resubmitted_at: new Date().toISOString()
          })
          .eq('id', videoSubmission.id)

        if (updateError) throw updateError
      } else {
        // 첫 제출
        const { error: insertError } = await supabase
          .from('video_submissions')
          .insert([submissionData])

        if (insertError) throw insertError
      }

      // applications 테이블 상태 업데이트
      const { error: appUpdateError } = await supabase
        .from('applications')
        .update({
          creator_status: 'video_submitted',
          video_submitted_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (appUpdateError) throw appUpdateError

      setSuccess('영상이 성공적으로 제출되었습니다! 기업의 검토를 기다려주세요.')
      
      setTimeout(() => {
        navigate('/mypage')
      }, 2000)

    } catch (err) {
      console.error('Error submitting video:', err)
      setError('영상 제출에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (!videoSubmission) return null
    
    const statusConfig = {
      submitted: { label: '검토 중', className: 'bg-blue-100 text-blue-800' },
      revision_requested: { label: '수정 요청됨', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800' }
    }
    
    const config = statusConfig[videoSubmission.status] || statusConfig.submitted
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-6 h-6 text-purple-600" />
                영상 제출
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {campaign?.title}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/mypage')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              마이페이지
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 상태 알림 */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* 현재 상태 */}
        {videoSubmission && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>제출 상태</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">제출일:</span>
                  <span className="font-semibold">
                    {new Date(videoSubmission.submitted_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                {videoSubmission.status === 'revision_requested' && videoSubmission.feedback && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-semibold text-yellow-900 mb-2">수정 요청 사항:</p>
                    <p className="text-yellow-800 whitespace-pre-wrap">{videoSubmission.feedback}</p>
                  </div>
                )}
                {videoSubmission.status === 'approved' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-semibold text-green-900">🎉 영상이 승인되었습니다!</p>
                    <p className="text-green-800 text-sm mt-1">포인트가 지급되었습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 영상 제출 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {videoSubmission?.status === 'revision_requested' ? '영상 재제출' : '영상 제출'}
            </CardTitle>
            <CardDescription>
              촬영한 영상의 URL을 입력해주세요. (YouTube, Instagram, TikTok 등)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="videoUrl">영상 URL *</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                  disabled={videoSubmission?.status === 'approved'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  YouTube, Instagram, TikTok 등의 영상 링크를 입력해주세요
                </p>
              </div>

              <div>
                <Label htmlFor="videoTitle">영상 제목</Label>
                <Input
                  id="videoTitle"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="영상 제목을 입력해주세요"
                  disabled={videoSubmission?.status === 'approved'}
                />
              </div>

              <div>
                <Label htmlFor="videoDescription">영상 설명</Label>
                <Textarea
                  id="videoDescription"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="영상에 대한 간단한 설명을 입력해주세요"
                  rows={4}
                  disabled={videoSubmission?.status === 'approved'}
                />
              </div>

              {videoSubmission?.status !== 'approved' && (
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {videoSubmission ? '재제출하기' : '제출하기'}
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">📌 안내 사항</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>• 영상은 가이드에 따라 촬영해주세요.</p>
            <p>• 제출 후 기업의 검토를 거쳐 승인 또는 수정 요청이 전달됩니다.</p>
            <p>• 수정 요청 시 피드백을 확인하고 영상을 수정하여 재제출해주세요.</p>
            <p>• 승인 후 포인트가 자동으로 지급됩니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
