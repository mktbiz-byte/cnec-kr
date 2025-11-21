import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Checkbox } from './ui/checkbox'
import { Video, Upload, CheckCircle, AlertCircle, ArrowLeft, FileVideo } from 'lucide-react'

export default function VideoSubmissionPage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [campaign, setCampaign] = useState(null)
  const [application, setApplication] = useState(null)
  const [videoSubmission, setVideoSubmission] = useState(null)
  
  // 영상 제출 정보
  const [videoFile, setVideoFile] = useState(null)
  const [videoFileUrl, setVideoFileUrl] = useState('')
  const [snsTitle, setSnsTitle] = useState('')
  const [snsContent, setSnsContent] = useState('')
  
  // SNS 업로드 정보
  const [snsUploadUrl, setSnsUploadUrl] = useState('')
  const [partnershipCode, setPartnershipCode] = useState('')
  const [showSnsUploadForm, setShowSnsUploadForm] = useState(false)
  
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
        setVideoFileUrl(videoData.video_file_url || '')
        setSnsTitle(videoData.sns_title || '')
        setSnsContent(videoData.sns_content || '')
        setSnsUploadUrl(videoData.sns_upload_url || '')
        setPartnershipCode(videoData.partnership_code || '')
        
        // 영상이 이미 제출되었고 SNS 업로드 정보가 없으면 폼 표시
        if (videoData.status === 'submitted' && !videoData.sns_upload_url) {
          setShowSnsUploadForm(true)
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 파일 크기 체크 (500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('파일 크기는 500MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('video/')) {
      setError('영상 파일만 업로드 가능합니다.')
      return
    }

    setVideoFile(file)
    setError('')
  }

  const uploadVideoFile = async (file) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // 파일명 생성 (user_id_campaignId_timestamp.확장자)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${campaignId}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      // 50MB 이상의 파일은 Resumable Upload 사용
      const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB
      
      if (file.size > CHUNK_SIZE) {
        // Resumable Upload
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
        // 일반 Upload
        const { data, error } = await supabase.storage
          .from('campaign-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error
        setUploadProgress(100)
      }

      // 공개 URL 가져오기
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!videoFile && !videoFileUrl) {
      setError('영상 파일을 선택해주세요.')
      return
    }

    if (!snsTitle.trim()) {
      setError('SNS 업로드 제목을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      let uploadedUrl = videoFileUrl

      // 새 파일이 선택된 경우 업로드
      if (videoFile) {
        uploadedUrl = await uploadVideoFile(videoFile)
      }

      const { data: { user } } = await supabase.auth.getUser()

      const submissionData = {
        application_id: application.id,
        campaign_id: campaignId,
        user_id: user.id,
        video_file_url: uploadedUrl,
        sns_title: snsTitle,
        sns_content: snsContent,
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
                  '캠페인명': campaign.title,
                  '크리에이터명': creatorName
                }
              })
            })
          }

          // 이메일 발송 (cnectotal API 호출)
          if (companyProfile.email) {
            await fetch('https://cnectotal.netlify.app/.netlify/functions/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: companyProfile.email,
                subject: '[CNEC] 신청하신 캠페인 영상 제출',
                html: `
                  <h2>영상 제출 알림</h2>
                  <p>${companyProfile.company_name || '기업'}님, 신청하신 캠페인의 크리에이터가 촬영 영상을 제출했습니다.</p>
                  <ul>
                    <li><strong>캠페인:</strong> ${campaign.title}</li>
                    <li><strong>크리에이터:</strong> ${creatorName}</li>
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

      setSuccess('영상이 성공적으로 제출되었습니다!')
      setShowSnsUploadForm(true)
      
      // 데이터 새로고침
      await fetchData()

    } catch (err) {
      console.error('Error submitting video:', err)
      setError('영상 제출에 실패했습니다: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSnsUploadSubmit = async (e) => {
    e.preventDefault()

    // 광고코드 체크박스가 있고 인스타그램인 경우 파트너십 코드 필수
    const isInstagram = application?.creator_platform?.toLowerCase().includes('instagram')
    const hasAdCode = campaign?.ad_code_required || false

    if (hasAdCode && isInstagram && !partnershipCode.trim()) {
      setError('인스타그램 업로드 시 파트너십 광고 코드를 입력해주세요.')
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
        navigate('/mypage')
      }, 2000)

    } catch (err) {
      console.error('Error updating SNS info:', err)
      setError('SNS 정보 저장에 실패했습니다.')
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

  const isInstagram = application?.creator_platform?.toLowerCase().includes('instagram')
  const hasAdCode = campaign?.ad_code_required || false

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
        {(!videoSubmission || videoSubmission.status === 'revision_requested') && !showSnsUploadForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {videoSubmission?.status === 'revision_requested' ? '영상 재제출' : '영상 제출'}
              </CardTitle>
              <CardDescription>
                촬영한 영상 파일을 업로드해주세요. (MP4, MOV 등)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="videoFile">영상 파일 *</Label>
                  <div className="mt-2">
                    <input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-purple-50 file:text-purple-700
                        hover:file:bg-purple-100"
                      disabled={videoSubmission?.status === 'approved' || uploading}
                    />
                  </div>
                  {videoFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <FileVideo className="w-4 h-4" />
                      <span>{videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                  {videoFileUrl && !videoFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ 영상이 이미 업로드되어 있습니다.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    최대 500MB, MP4/MOV/AVI 등 영상 파일
                  </p>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>업로드 중...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="snsTitle">SNS 업로드 제목 *</Label>
                  <Input
                    id="snsTitle"
                    type="text"
                    value={snsTitle}
                    onChange={(e) => setSnsTitle(e.target.value)}
                    placeholder="SNS에 업로드할 게시물 제목을 입력해주세요"
                    required
                    disabled={videoSubmission?.status === 'approved' || uploading}
                  />
                </div>

                <div>
                  <Label htmlFor="snsContent">SNS 업로드 내용 (피드)</Label>
                  <Textarea
                    id="snsContent"
                    value={snsContent}
                    onChange={(e) => setSnsContent(e.target.value)}
                    placeholder="SNS에 업로드할 게시물 내용을 입력해주세요"
                    rows={6}
                    disabled={videoSubmission?.status === 'approved' || uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    해시태그, 멘션 등을 포함한 전체 내용을 작성해주세요.
                  </p>
                </div>

                {videoSubmission?.status !== 'approved' && (
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={submitting || uploading}
                  >
                    {submitting || uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {uploading ? '업로드 중...' : '제출 중...'}
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
        )}

        {/* SNS 업로드 정보 제출 폼 */}
        {showSnsUploadForm && videoSubmission && videoSubmission.status !== 'approved' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>SNS 업로드 정보 제출</CardTitle>
              <CardDescription>
                영상을 SNS에 업로드한 후 URL과 광고 코드를 입력해주세요. (선택사항)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSnsUploadSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="snsUploadUrl">SNS 업로드 URL</Label>
                  <Input
                    id="snsUploadUrl"
                    type="url"
                    value={snsUploadUrl}
                    onChange={(e) => setSnsUploadUrl(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    YouTube, Instagram, TikTok 등에 업로드한 게시물 링크
                  </p>
                </div>

                {hasAdCode && (
                  <div>
                    <Label htmlFor="partnershipCode">
                      파트너십 광고 코드 {isInstagram && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="partnershipCode"
                      type="text"
                      value={partnershipCode}
                      onChange={(e) => setPartnershipCode(e.target.value)}
                      placeholder="광고 코드를 입력해주세요"
                      required={isInstagram}
                    />
                    {isInstagram && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ 인스타그램 업로드 시 파트너십 광고 코드 입력이 필수입니다.
                      </p>
                    )}
                    {!isInstagram && (
                      <p className="text-xs text-gray-500 mt-1">
                        YouTube, TikTok의 경우 제출이 불가능하므로 선택사항입니다.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        저장 중...
                      </>
                    ) : (
                      '저장하기'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/mypage')}
                  >
                    나중에 하기
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
            <p>• SNS 업로드 정보는 영상 제출 후 언제든지 입력 가능합니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
