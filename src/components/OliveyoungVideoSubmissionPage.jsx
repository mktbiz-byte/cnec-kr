import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Video, Upload, CheckCircle, AlertCircle, ArrowLeft, FileVideo } from 'lucide-react'

export default function OliveyoungVideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)
  
  // 영상 1
  const [video1File, setVideo1File] = useState(null)
  const [video1Url, setVideo1Url] = useState('')
  const [video1Title, setVideo1Title] = useState('')
  const [video1Caption, setVideo1Caption] = useState('')
  const [video1Submission, setVideo1Submission] = useState(null)
  
  // 영상 2
  const [video2File, setVideo2File] = useState(null)
  const [video2Url, setVideo2Url] = useState('')
  const [video2Title, setVideo2Title] = useState('')
  const [video2Caption, setVideo2Caption] = useState('')
  const [video2Submission, setVideo2Submission] = useState(null)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

      // 캠페인 정보
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 지원 정보
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single()

      if (appError) throw appError
      setApplication(appData)

      // 기존 영상 제출 정보 (영상 1)
      const { data: video1Data } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', appData.id)
        .eq('video_number', 1)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (video1Data) {
        setVideo1Submission(video1Data)
        setVideo1Url(video1Data.video_file_url || '')
        setVideo1Title(video1Data.sns_title || '')
        setVideo1Caption(video1Data.sns_content || '')
      }

      // 기존 영상 제출 정보 (영상 2)
      const { data: video2Data } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('application_id', appData.id)
        .eq('video_number', 2)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (video2Data) {
        setVideo2Submission(video2Data)
        setVideo2Url(video2Data.video_file_url || '')
        setVideo2Title(video2Data.sns_title || '')
        setVideo2Caption(video2Data.sns_content || '')
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (videoNumber, e) => {
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

    if (videoNumber === 1) {
      setVideo1File(file)
    } else {
      setVideo2File(file)
    }
    setError('')
  }

  const uploadVideoFile = async (file) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${campaignId}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      const CHUNK_SIZE = 50 * 1024 * 1024
      
      if (file.size > CHUNK_SIZE) {
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
      } else {
        const { data, error } = await supabase.storage
          .from('campaign-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error
        setUploadProgress(100)
      }

      const { data: urlData } = supabase.storage
        .from('campaign-videos')
        .getPublicUrl(filePath)

      return urlData.publicUrl

    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (videoNumber) => {
    const isVideo1 = videoNumber === 1
    const file = isVideo1 ? video1File : video2File
    const url = isVideo1 ? video1Url : video2Url
    const title = isVideo1 ? video1Title : video2Title
    const caption = isVideo1 ? video1Caption : video2Caption
    const existingSubmission = isVideo1 ? video1Submission : video2Submission

    if (!file && !url) {
      setError(`영상 ${videoNumber} 파일을 선택해주세요.`)
      return
    }

    if (!title.trim()) {
      setError(`영상 ${videoNumber} 제목을 입력해주세요.`)
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      let uploadedUrl = url

      if (file) {
        uploadedUrl = await uploadVideoFile(file)
      }

      const { data: { user } } = await supabase.auth.getUser()

      // 다음 버전 번호 계산
      let nextVersion = 1
      if (existingSubmission) {
        nextVersion = existingSubmission.version + 1
        if (nextVersion > 3) {
          setError(`영상 ${videoNumber}은 최대 V3까지만 제출 가능합니다.`)
          return
        }
      }

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        video_file_url: uploadedUrl,
        sns_title: title,
        sns_content: caption,
        video_number: videoNumber,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('video_submissions')
        .insert([submissionData])

      if (insertError) throw insertError

      // 기업에게 알림톡 및 이메일 발송
      try {
        // 기업 정보 가져오기
        const { data: companyProfile } = await supabase
          .from('user_profiles')
          .select('company_name, email, phone')
          .eq('id', campaign.company_id)
          .single()

        if (companyProfile) {
          // 크리에이터 정보
          const { data: creatorProfile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', user.id)
            .single()

          const creatorName = creatorProfile?.name || application.creator_name || application.applicant_name || '크리에이터'
          const videoLabel = `${videoNumber}차 영상`

          // 알림톡 발송
          if (companyProfile.phone) {
            await fetch('/.netlify/functions/send-alimtalk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                receiver: companyProfile.phone,
                template_code: '025100001008',
                variables: {
                  '회사명': companyProfile.company_name || '기업',
                  '캐페인명': `${campaign.title} - ${videoLabel}`,
                  '크리에이터명': creatorName
                }
              })
            })
          }

          // 이메일 발송
          if (companyProfile.email) {
            await fetch('https://cnectotal.netlify.app/.netlify/functions/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: companyProfile.email,
                subject: '[CNEC] 신청하신 캐페인 영상 제출',
                html: `
                  <h2>영상 제출 알림</h2>
                  <p>${companyProfile.company_name || '기업'}님, 신청하신 캐페인의 크리에이터가 촬영 영상을 제출했습니다.</p>
                  <ul>
                    <li><strong>캐페인:</strong> ${campaign.title}</li>
                    <li><strong>영상:</strong> ${videoLabel}</li>
                    <li><strong>크리에이터:</strong> ${creatorName}</li>
                    <li><strong>버전:</strong> V${nextVersion}</li>
                  </ul>
                  <p>관리자 페이지에서 영상을 검토하시고, 수정 사항이 있으면 피드백을 남겨주세요.</p>
                  <p>검수 완료 후 SNS 업로드 될 예정입니다.</p>
                  <p>문의: 1833-6025</p>
                `
              })
            })
          }
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
        // 알림 실패해도 영상 제출은 성공으로 처리
      }

      setSuccess(`영상 ${videoNumber} V${nextVersion}이 제출되었습니다!`)
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError(`영상 ${videoNumber} 제출 실패: ` + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/mypage')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        마이페이지로 돌아가기
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🌸 올리브영 영상 제출</h1>
        <p className="text-gray-600">{campaign?.title}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* 영상 1 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            영상 1 제출
          </CardTitle>
          <CardDescription>
            첫 번째 영상을 업로드해주세요. {video1Submission && `(현재 버전: V${video1Submission.version})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video1-file">영상 파일 *</Label>
            <Input
              id="video1-file"
              type="file"
              accept="video/*"
              onChange={(e) => handleFileChange(1, e)}
              disabled={submitting || uploading}
              className="mt-2"
            />
            {video1Url && (
              <p className="text-sm text-green-600 mt-2">
                ✓ 기존 영상이 있습니다. 새 파일을 선택하면 덮어씁니다.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="video1-title">영상 제목 *</Label>
            <Input
              id="video1-title"
              value={video1Title}
              onChange={(e) => setVideo1Title(e.target.value)}
              placeholder="영상 제목을 입력하세요"
              disabled={submitting}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="video1-caption">영상 캡션</Label>
            <Textarea
              id="video1-caption"
              value={video1Caption}
              onChange={(e) => setVideo1Caption(e.target.value)}
              placeholder="영상 캡션을 입력하세요"
              disabled={submitting}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            onClick={() => handleSubmit(1)}
            disabled={submitting || uploading || (!video1File && !video1Url)}
            className="w-full"
          >
            {submitting ? '제출 중...' : uploading ? `업로드 중... ${uploadProgress}%` : '영상 1 제출'}
          </Button>

          {video1Submission && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">제출 상태</p>
              <p className="text-sm">버전: V{video1Submission.version}</p>
              <p className="text-sm">상태: {video1Submission.status === 'submitted' ? '검토 중' : video1Submission.status === 'approved' ? '승인됨' : '수정 요청'}</p>
              {video1Submission.feedback && (
                <p className="text-sm mt-2 text-orange-600">피드백: {video1Submission.feedback}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 영상 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            영상 2 제출
          </CardTitle>
          <CardDescription>
            두 번째 영상을 업로드해주세요. {video2Submission && `(현재 버전: V${video2Submission.version})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video2-file">영상 파일 *</Label>
            <Input
              id="video2-file"
              type="file"
              accept="video/*"
              onChange={(e) => handleFileChange(2, e)}
              disabled={submitting || uploading}
              className="mt-2"
            />
            {video2Url && (
              <p className="text-sm text-green-600 mt-2">
                ✓ 기존 영상이 있습니다. 새 파일을 선택하면 덮어씁니다.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="video2-title">영상 제목 *</Label>
            <Input
              id="video2-title"
              value={video2Title}
              onChange={(e) => setVideo2Title(e.target.value)}
              placeholder="영상 제목을 입력하세요"
              disabled={submitting}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="video2-caption">영상 캡션</Label>
            <Textarea
              id="video2-caption"
              value={video2Caption}
              onChange={(e) => setVideo2Caption(e.target.value)}
              placeholder="영상 캡션을 입력하세요"
              disabled={submitting}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            onClick={() => handleSubmit(2)}
            disabled={submitting || uploading || (!video2File && !video2Url)}
            className="w-full"
          >
            {submitting ? '제출 중...' : uploading ? `업로드 중... ${uploadProgress}%` : '영상 2 제출'}
          </Button>

          {video2Submission && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">제출 상태</p>
              <p className="text-sm">버전: V{video2Submission.version}</p>
              <p className="text-sm">상태: {video2Submission.status === 'submitted' ? '검토 중' : video2Submission.status === 'approved' ? '승인됨' : '수정 요청'}</p>
              {video2Submission.feedback && (
                <p className="text-sm mt-2 text-orange-600">피드백: {video2Submission.feedback}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
