import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language } = useLanguage()

  // URL에서 campaign_id 파라미터 가져오기 (두 가지 방법 모두 지원)
  const campaignId = id || searchParams.get('campaign_id')

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
      goToProfile: '프로필 설정하기',
      campaignNotFound: '캠페인을 찾을 수 없습니다',
      loginRequired: '로그인이 필요합니다'
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
      goToProfile: 'プロフィール設定',
      campaignNotFound: 'キャンペーンが見つかりません',
      loginRequired: 'ログインが必要です'
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    console.log('CampaignApplicationUpdated 마운트:', { campaignId, user: !!user })
    
    if (!campaignId) {
      setError('캠페인 ID가 없습니다.')
      setLoading(false)
      return
    }

    if (!user) {
      setError(t.loginRequired)
      setLoading(false)
      return
    }

    loadData()
  }, [campaignId, user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('데이터 로드 시작 - 캠페인 ID:', campaignId, '사용자 ID:', user?.id)

      // 단계별 데이터 로딩으로 무한 로딩 방지
      
      // 1단계: 캠페인 데이터 로드 (가장 중요)
      console.log('1단계: 캠페인 데이터 로드 시작...')
      try {
        const campaignData = await database.campaigns.getById(campaignId)
        
        if (campaignData) {
          setCampaign(campaignData)
          console.log('캠페인 데이터 로드 성공:', campaignData.title)
        } else {
          throw new Error('캠페인을 찾을 수 없습니다')
        }
      } catch (error) {
        console.error('캠페인 로드 실패:', error)
        setError(t.campaignNotFound)
        setLoading(false)
        return
      }

      // 2단계: 프로필 데이터 로드 (실패해도 계속 진행)
      console.log('2단계: 프로필 데이터 로드 시작...')
      try {
        const profileData = await database.userProfiles.get(user.id)
        
        if (profileData) {
          setUserProfile(profileData)
          console.log('프로필 데이터 로드 성공')
        } else {
          console.log('프로필 데이터 없음 - 기본값 사용')
          setUserProfile({ 
            name: user.user_metadata?.name || '', 
            email: user.email || '' 
          })
        }
      } catch (error) {
        console.warn('프로필 로드 실패 (계속 진행):', error)
        setUserProfile({ 
          name: user.user_metadata?.name || '', 
          email: user.email || '' 
        })
      }

      // 3단계: 기존 신청서 확인 (실패해도 계속 진행)
      console.log('3단계: 기존 신청서 확인 시작...')
      try {
        const applicationData = await database.applications.getByUserAndCampaign(user.id, campaignId)
        
        if (applicationData) {
          setExistingApplication(applicationData)
          console.log('기존 신청서 발견')
        } else {
          console.log('기존 신청서 없음 - 새로 신청 가능')
          setExistingApplication(null)
        }
      } catch (error) {
        console.warn('기존 신청서 확인 실패 (계속 진행):', error)
        setExistingApplication(null)
      }

      console.log('모든 데이터 로드 완료')

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
      setError(t.loginRequired)
      return
    }

    if (existingApplication) {
      setError(t.alreadyApplied)
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
        campaign_id: campaignId,
        user_id: user.id,
        user_name: userProfile?.name || user.user_metadata?.name || '',
        user_email: user.email,
        user_age: userProfile?.age || null,
        user_skin_type: userProfile?.skin_type || '',
        user_bio: userProfile?.bio || '',
        user_instagram_url: userProfile?.instagram_url || '',
        user_youtube_url: userProfile?.youtube_url || '',
        user_tiktok_url: userProfile?.tiktok_url || '',
        question_1: campaign?.question_1 || '',
        answer_1: applicationData.answer_1.trim(),
        question_2: campaign?.question_2 || '',
        answer_2: applicationData.answer_2.trim(),
        question_3: campaign?.question_3 || '',
        answer_3: applicationData.answer_3.trim(),
        question_4: campaign?.question_4 || '',
        answer_4: applicationData.answer_4.trim(),
        additional_info: applicationData.additional_info.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('신청서 데이터:', submissionData)

      // 신청서 제출
      const result = await database.applications.create(submissionData)
      
      if (result) {
        console.log('신청서 제출 성공:', result)
        setSuccess(t.applicationSuccess)
        
        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } else {
        throw new Error('신청서 제출에 실패했습니다')
      }

    } catch (error) {
      console.error('신청서 제출 오류:', error)
      setError(`신청서 제출에 실패했습니다: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'KRW'
    }).format(amount)
  }

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">캠페인 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 오류 발생 시 표시
  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            메인으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  // 성공 메시지 표시
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.applicationSuccess}</h2>
          <p className="text-gray-600 mb-4">잠시 후 메인 페이지로 이동합니다...</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            지금 이동하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToCampaigns}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-2">
            {campaign?.title || '캠페인 정보를 불러오는 중...'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 이미 신청한 경우 */}
        {existingApplication && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {t.alreadyApplied}
              <br />
              신청일: {formatDate(existingApplication.created_at)}
              <br />
              상태: {existingApplication.status === 'pending' ? '검토 중' : 
                     existingApplication.status === 'approved' ? '승인됨' : 
                     existingApplication.status === 'rejected' ? '거절됨' : '알 수 없음'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 캠페인 정보 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {t.campaignInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{campaign.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{campaign.brand}</p>
                      {campaign.description && (
                        <p className="text-sm text-gray-700">{campaign.description}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.reward}:</span>
                        <span className="font-medium">{formatCurrency(campaign.reward_amount)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.participants}:</span>
                        <span className="font-medium">{campaign.max_participants || '-'}명</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.deadline}:</span>
                        <span className="font-medium">{formatDate(campaign.application_deadline)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t.period}:</span>
                        <span className="font-medium text-xs">
                          {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                        </span>
                      </div>
                    </div>

                    {campaign.requirements && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-sm mb-2">{t.requirements}:</h4>
                          <p className="text-sm text-gray-700">{campaign.requirements}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 신청서 폼 */}
          <div className="lg:col-span-2">
            {!existingApplication && campaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    {t.applicationForm}
                  </CardTitle>
                  <CardDescription>
                    모든 정보를 정확히 입력해주세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 개인정보 섹션 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        {t.personalInfo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">이름</Label>
                          <Input
                            id="name"
                            value={userProfile?.name || ''}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">이메일</Label>
                          <Input
                            id="email"
                            value={userProfile?.email || user?.email || ''}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 질문 답변 섹션 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        {t.questions}
                      </h3>
                      <div className="space-y-4">
                        {/* 질문 1 */}
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
                              placeholder="답변을 입력해주세요..."
                              rows={3}
                              required={campaign.question_1_required}
                            />
                          </div>
                        )}

                        {/* 질문 2 */}
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
                              placeholder="답변을 입력해주세요..."
                              rows={3}
                              required={campaign.question_2_required}
                            />
                          </div>
                        )}

                        {/* 질문 3 */}
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
                              placeholder="답변을 입력해주세요..."
                              rows={3}
                              required={campaign.question_3_required}
                            />
                          </div>
                        )}

                        {/* 질문 4 */}
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
                              placeholder="답변을 입력해주세요..."
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
                        placeholder="추가로 전달하고 싶은 내용이 있다면 입력해주세요..."
                        rows={3}
                      />
                    </div>

                    {/* 제출 버튼 */}
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="min-w-[120px]"
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
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignApplicationUpdated
