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

export default function FourWeekVideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)
  
  // 주차별 영상 데이터
  const [weekVideos, setWeekVideos] = useState({
    1: { file: null, url: '', title: '', caption: '', submission: null },
    2: { file: null, url: '', title: '', caption: '', submission: null },
    3: { file: null, url: '', title: '', caption: '', submission: null },
    4: { file: null, url: '', title: '', caption: '', submission: null }
  })
  
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

      // 주차별 기존 영상 제출 정보
      const newWeekVideos = { ...weekVideos }
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
          newWeekVideos[week] = {
            ...newWeekVideos[week],
            url: weekData.video_file_url || '',
            title: weekData.sns_title || '',
            caption: weekData.sns_content || '',
            submission: weekData
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

  const handleFileChange = (week, e) => {
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

    setWeekVideos(prev => ({
      ...prev,
      [week]: { ...prev[week], file }
    }))
    setError('')
  }

  const updateWeekData = (week, field, value) => {
    setWeekVideos(prev => ({
      ...prev,
      [week]: { ...prev[week], [field]: value }
    }))
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

  const handleSubmit = async (week) => {
    const weekData = weekVideos[week]

    if (!weekData.file && !weekData.url) {
      setError(`${week}주차 영상 파일을 선택해주세요.`)
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

      let uploadedUrl = weekData.url

      if (weekData.file) {
        uploadedUrl = await uploadVideoFile(weekData.file)
      }

      const { data: { user } } = await supabase.auth.getUser()

      // 다음 버전 번호 계산
      let nextVersion = 1
      if (weekData.submission) {
        nextVersion = weekData.submission.version + 1
        if (nextVersion > 3) {
          setError(`${week}주차 영상은 최대 V3까지만 제출 가능합니다.`)
          return
        }
      }

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        video_file_url: uploadedUrl,
        sns_title: weekData.title,
        sns_content: weekData.caption,
        week_number: week,
        version: nextVersion,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('video_submissions')
        .insert([submissionData])

      if (insertError) throw insertError

      setSuccess(`${week}주차 영상 V${nextVersion}이 제출되었습니다!`)
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError(`${week}주차 영상 제출 실패: ` + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderWeekCard = (week) => {
    const weekData = weekVideos[week]
    
    return (
      <Card key={week} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {week}주차 영상 제출
          </CardTitle>
          <CardDescription>
            {week}주차 영상을 업로드해주세요. {weekData.submission && `(현재 버전: V${weekData.submission.version})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`week${week}-file`}>영상 파일 *</Label>
            <Input
              id={`week${week}-file`}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileChange(week, e)}
              disabled={submitting || uploading}
              className="mt-2"
            />
            {weekData.url && (
              <p className="text-sm text-green-600 mt-2">
                ✓ 기존 영상이 있습니다. 새 파일을 선택하면 덮어씁니다.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={`week${week}-title`}>영상 제목 *</Label>
            <Input
              id={`week${week}-title`}
              value={weekData.title}
              onChange={(e) => updateWeekData(week, 'title', e.target.value)}
              placeholder="영상 제목을 입력하세요"
              disabled={submitting}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor={`week${week}-caption`}>영상 캡션</Label>
            <Textarea
              id={`week${week}-caption`}
              value={weekData.caption}
              onChange={(e) => updateWeekData(week, 'caption', e.target.value)}
              placeholder="영상 캡션을 입력하세요"
              disabled={submitting}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            onClick={() => handleSubmit(week)}
            disabled={submitting || uploading || (!weekData.file && !weekData.url)}
            className="w-full"
          >
            {submitting ? '제출 중...' : uploading ? `업로드 중... ${uploadProgress}%` : `${week}주차 영상 제출`}
          </Button>

          {weekData.submission && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold mb-2">제출 상태</p>
              <p className="text-sm">버전: V{weekData.submission.version}</p>
              <p className="text-sm">상태: {weekData.submission.status === 'submitted' ? '검토 중' : weekData.submission.status === 'approved' ? '승인됨' : '수정 요청'}</p>
              {weekData.submission.feedback && (
                <p className="text-sm mt-2 text-orange-600">피드백: {weekData.submission.feedback}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
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
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        뒤로 가기
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🏆 4주 챌린지 영상 제출</h1>
        <p className="text-gray-600">{campaign?.title}</p>
      </div>

      {application?.individualMessage && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">
            <strong>📢 관리자 메시지:</strong>
            <p className="mt-2 whitespace-pre-wrap">{application.individualMessage}</p>
          </AlertDescription>
        </Alert>
      )}

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

      {[1, 2, 3, 4].map(week => renderWeekCard(week))}
    </div>
  )
}
