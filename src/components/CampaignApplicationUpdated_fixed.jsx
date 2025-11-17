import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, ArrowLeft, Send, CheckCircle, AlertCircle, 
  Calendar, DollarSign, Users, FileText, ExternalLink,
  User, Mail, Phone, MapPin, Instagram, Youtube, Hash
} from 'lucide-react'

const CampaignApplicationUpdated = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language } = useLanguage()

  const [campaign, setCampaign] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [existingApplication, setExistingApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 신청서 폼 데이터
  const [applicationData, setApplicationData] = useState({
    answer_1: '',
    answer_2: '',
    answer_3: '',
    answer_4: '',
    additional_info: ''
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '캠페인 신청',
      backToCampaigns: '캠페인 목록으로',
      campaignInfo: '캠페인 정보',
      applicationForm: '신청서 작성',
      personalInfo: '개인정보',
      questions: '질문 답변',
      additionalInfo: '추가 정보',
      submit: '신청하기',
      submitting: '신청 중...',
      alreadyApplied: '이미 신청한 캠페인입니다',
      applicationSuccess: '캠페인 신청이 완료되었습니다!',
      requiredField: '필수 항목',
      optionalField: '선택 항목',
      reward: '보상금',
      participants: '모집 인원',
      deadline: '신청 마감',
      period: '캠페인 기간',
      requirements: '참여 조건',
      description: '캠페인 설명',
      profileIncomplete: '프로필을 먼저 완성해주세요',
      goToProfile: '프로필 설정하기'
    },
    ja: {
      title: 'キャンペーン応募',
      backToCampaigns: 'キャンペーン一覧へ',
      campaignInfo: 'キャンペーン情報',
      applicationForm: '応募フォーム',
      personalInfo: '個人情報',
      questions: '質問回答',
      additionalInfo: '追加情報',
      submit: '応募する',
      submitting: '応募中...',
      alreadyApplied: '既に応募済みのキャンペーンです',
      applicationSuccess: 'キャンペーン応募が完了しました！',
      requiredField: '必須項目',
      optionalField: '任意項目',
      reward: '報酬金',
      participants: '募集人数',
      deadline: '応募締切',
      period: 'キャンペーン期間',
      requirements: '参加条件',
      description: 'キャンペーン説明',
      profileIncomplete: 'プロフィールを先に完成させてください',
      goToProfile: 'プロフィール設定'
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    if (user && id) {
      loadData()
    }
  }, [user, id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('데이터 로드 시작 - 캠페인 ID:', id, '사용자 ID:', user?.id)

      // 병렬로 데이터 로드
      const [campaignResult, profileResult, applicationResult] = await Promise.allSettled([
        database.campaigns.getById(id),
        database.userProfiles.get(user.id),
        database.applications.getByUserAndCampaign(user.id, id)
      ])

      // 캠페인 데이터 처리
      if (campaignResult.status === 'fulfilled' && campaignResult.value) {
        setCampaign(campaignResult.value)
        console.log('캠페인 데이터 로드 성공:', campaignResult.value)
      } else {
        console.error('캠페인 로드 실패:', campaignResult.reason)
        setError('캠페인 정보를 불러올 수 없습니다.')
        return
      }

      // 프로필 데이터 처리
      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setUserProfile(profileResult.value)
        console.log('프로필 데이터 로드 성공:', profileResult.value)
      } else {
        console.warn('프로필 로드 실패 또는 프로필 없음:', profileResult.reason)
        // 프로필이 없어도 계속 진행 (기본값 사용)
      }

      // 기존 신청서 확인
      if (applicationResult.status === 'fulfilled' && applicationResult.value) {
        setExistingApplication(applicationResult.value)
        console.log('기존 신청서 발견:', applicationResult.value)
      } else {
        console.log('기존 신청서 없음 - 새로 신청 가능')
      }

    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`데이터를 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (existingApplication) {
      setError('이미 신청한 캠페인입니다.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      console.log('신청서 제출 시작')

      // 필수 질문 검증
      const requiredAnswers = []
      if (campaign?.question_1_required && !applicationData.answer_1.trim()) {
        requiredAnswers.push('질문 1')
      }
      if (campaign?.question_2_required && !applicationData.answer_2.trim()) {
        requiredAnswers.push('질문 2')
      }
      if (campaign?.question_3_required && !applicationData.answer_3.trim()) {
        requiredAnswers.push('질문 3')
      }
      if (campaign?.question_4_required && !applicationData.answer_4.trim()) {
        requiredAnswers.push('질문 4')
      }

      if (requiredAnswers.length > 0) {
        setError(`다음 필수 질문에 답변해주세요: ${requiredAnswers.join(', ')}`)
        return
      }

      // 신청서 데이터 준비
      const submissionData = {
        user_id: user.id,
        campaign_id: parseInt(id),
        status: 'pending',
        answer_1: applicationData.answer_1.trim() || null,
        answer_2: applicationData.answer_2.trim() || null,
        answer_3: applicationData.answer_3.trim() || null,
        answer_4: applicationData.answer_4.trim() || null,
        additional_info: applicationData.additional_info.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('제출할 신청서 데이터:', submissionData)

      // 신청서 제출
      const result = await database.applications.create(submissionData)
      console.log('신청서 제출 결과:', result)

      setSuccess('캠페인 신청이 완료되었습니다!')
      
      // 3초 후 캠페인 목록으로 이동
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (error) {
      console.error('신청서 제출 오류:', error)
      setError(`응募の送信に失敗しました。もう一度お試しください。: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return ''
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'KRW'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToCampaigns}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 이미 신청한 경우 */}
        {existingApplication && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {t.alreadyApplied}
              <div className="mt-2">
                <Badge variant="secondary">
                  상태: {existingApplication.status}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 캠페인 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>{t.campaignInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {campaign.title}
                </h3>
                <p className="text-gray-600 mb-4">{campaign.brand}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t.reward}: {formatCurrency(campaign.reward_amount)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {t.participants}: {campaign.max_participants}명
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t.deadline}: {formatDate(campaign.application_deadline)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t.period}: {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                  </div>
                </div>

                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t.description}</h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t.requirements}</h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  {campaign.requirements}
                </p>
              </div>

              {/* 외부 링크들 */}
              {(campaign.google_drive_url || campaign.google_slides_url) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">관련 자료</h4>
                  <div className="space-y-2">
                    {campaign.google_drive_url && (
                      <a
                        href={campaign.google_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Google Drive 자료
                      </a>
                    )}
                    {campaign.google_slides_url && (
                      <a
                        href={campaign.google_slides_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Google Slides 자료
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 신청서 폼 */}
          {!existingApplication && (
            <Card>
              <CardHeader>
                <CardTitle>{t.applicationForm}</CardTitle>
                <CardDescription>
                  모든 필수 항목을 작성해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 개인정보 확인 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {t.personalInfo}
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p className="text-sm">
                        <strong>이름:</strong> {userProfile?.name || '미설정'}
                      </p>
                      <p className="text-sm">
                        <strong>이메일:</strong> {user?.email || '미설정'}
                      </p>
                      {!userProfile?.name && (
                        <div className="mt-2">
                          <Alert className="border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                              {t.profileIncomplete}
                              <Button
                                variant="link"
                                className="p-0 h-auto text-yellow-800 underline ml-2"
                                onClick={() => navigate('/profile')}
                              >
                                {t.goToProfile}
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* 질문 답변 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t.questions}
                    </h4>
                    <div className="space-y-4">
                      {campaign.question_1 && (
                        <div>
                          <Label htmlFor="answer_1" className="flex items-center">
                            {campaign.question_1}
                            {campaign.question_1_required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {t.requiredField}
                              </Badge>
                            )}
                          </Label>
                          <Textarea
                            id="answer_1"
                            value={applicationData.answer_1}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, answer_1: e.target.value }))}
                            placeholder="답변을 입력해주세요"
                            rows={3}
                            required={campaign.question_1_required}
                          />
                        </div>
                      )}

                      {campaign.question_2 && (
                        <div>
                          <Label htmlFor="answer_2" className="flex items-center">
                            {campaign.question_2}
                            {campaign.question_2_required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {t.requiredField}
                              </Badge>
                            )}
                          </Label>
                          <Textarea
                            id="answer_2"
                            value={applicationData.answer_2}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, answer_2: e.target.value }))}
                            placeholder="답변을 입력해주세요"
                            rows={3}
                            required={campaign.question_2_required}
                          />
                        </div>
                      )}

                      {campaign.question_3 && (
                        <div>
                          <Label htmlFor="answer_3" className="flex items-center">
                            {campaign.question_3}
                            {campaign.question_3_required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {t.requiredField}
                              </Badge>
                            )}
                          </Label>
                          <Textarea
                            id="answer_3"
                            value={applicationData.answer_3}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, answer_3: e.target.value }))}
                            placeholder="답변을 입력해주세요"
                            rows={3}
                            required={campaign.question_3_required}
                          />
                        </div>
                      )}

                      {campaign.question_4 && (
                        <div>
                          <Label htmlFor="answer_4" className="flex items-center">
                            {campaign.question_4}
                            {campaign.question_4_required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {t.requiredField}
                              </Badge>
                            )}
                          </Label>
                          <Textarea
                            id="answer_4"
                            value={applicationData.answer_4}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, answer_4: e.target.value }))}
                            placeholder="답변을 입력해주세요"
                            rows={3}
                            required={campaign.question_4_required}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* 추가 정보 */}
                  <div>
                    <Label htmlFor="additional_info" className="flex items-center">
                      {t.additionalInfo}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t.optionalField}
                      </Badge>
                    </Label>
                    <Textarea
                      id="additional_info"
                      value={applicationData.additional_info}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, additional_info: e.target.value }))}
                      placeholder="추가로 전달하고 싶은 내용이 있다면 작성해주세요"
                      rows={4}
                    />
                  </div>

                  {/* 제출 버튼 */}
                  <Button
                    type="submit"
                    disabled={submitting || !userProfile?.name}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t.submit}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignApplicationUpdated
