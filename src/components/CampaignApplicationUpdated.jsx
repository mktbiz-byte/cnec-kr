import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'


const CampaignApplicationUpdated = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // URL에서 campaign_id 파라미터 가져오기 (두 가지 방법 모두 지원)
  const campaignId = id || searchParams.get('campaign_id')

  const [campaign, setCampaign] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [existingApplication, setExistingApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // SNS 플랫폼 선택 상태
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: true,  // 인스타그램은 기본 선택
    youtube: false,
    tiktok: false
  })

  // 신청서 폼 데이터 (기존 질문 + 새로운 필수 정보)
  const [applicationData, setApplicationData] = useState({
    // 기존 질문 답변
    answer_1: '',
    answer_2: '',
    answer_3: '',
    answer_4: '',
    additional_info: '',
    
    // 개인정보 (수정 가능)
    applicant_name: '',
    age: '',
    skin_type: '',
    
    // 새로운 필수 정보
    postal_code: '',
    address: '',
    delivery_request: '',
    phone_number: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    
    // 오프라인 방문 관련
    offline_visit_available: false,
    offline_visit_notes: '',
    
    // 메타광고코드 가능 여부
    meta_ad_code_available: false
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '캠페인 신청',
      backToCampaigns: '캠페인 목록으로',
      campaignInfo: '캠페인 정보',
      applicationForm: '신청서 작성',
      personalInfo: '개인정보',
      contactInfo: '연락처 및 배송 정보',
      snsInfo: 'SNS 정보',
      questions: '질문 답변',
      additionalInfo: '지원자 한마디',
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
      brand: '브랜드',
      category: '카테고리',
      profileIncomplete: '프로필을 먼저 완성해주세요',
      goToProfile: '프로필 설정하기',
      campaignNotFound: '캠페인을 찾을 수 없습니다',
      loginRequired: '로그인이 필요합니다',
      
      // 폼 필드
      name: '이름',
      email: '이메일',
      age: '나이',
      skinType: '피부타입',
      postalCode: '우편번호',
      address: '주소',
      deliveryRequest: '배송 시 요청사항',
      phoneNumber: '연락처',
      instagramUrl: '인스타그램 URL',
      youtubeUrl: '유튜브 URL',
      tiktokUrl: '틱톡 URL',
      
      // 플레이스홀더
      postalCodePlaceholder: '예: 123-4567',
      addressPlaceholder: '상세 주소를 입력해주세요',
      deliveryRequestPlaceholder: '배송 시 요청사항이 있으면 입력해주세요 (선택사항)',
      phoneNumberPlaceholder: '예: 010-1234-5678',
      instagramPlaceholder: 'https://instagram.com/username',
      youtubePlaceholder: 'https://youtube.com/@username',
      tiktokPlaceholder: 'https://tiktok.com/@username',
      
      // 검증 메시지
      postalCodeRequired: '우편번호는 필수입니다',
      addressRequired: '주소는 필수입니다',
      phoneRequired: '연락처는 필수입니다',
      atLeastOneSnsRequired: '선택한 플랫폼 중 최소 1개의 SNS URL을 입력해주세요',
      portraitRightsRequired: '초상권 사용 동의가 필요합니다',
      
      // 초상권 사용 동의
      portraitRightsTitle: '초상권 사용 동의',
      portraitRightsConsent: '본 캠페인에서 제작하는 영상 콘텐츠에 포함된 본인의 초상(얼굴, 모습, 음성 포함)에 대해, 브랜드 및 CNEC 플랫폼이 마케팅, 프로모션, 상업적 목적으로 콘텐츠 제출일로부터 1년간 사용하는 것에 동의합니다. 해당 콘텐츠는 소셜미디어, 웹사이트, 광고, 판촉 자료 등 다양한 미디어 채널에서 사용될 수 있음을 이해합니다.',
      portraitRightsConsentShort: '영상 콘텐츠의 초상권을 1년간 사용하는 것에 동의합니다',
      
      // 캠페인 가이드
      campaignGuide: '캠페인 가이드',
      requiredDialogues: '필수 대사',
      requiredScenes: '필수 장면',
      requiredHashtags: '필수 해시태그',
      videoDuration: '영상 시간',
      videoTempo: '영상 템포',
      videoTone: '영상 톤앤매너',
      additionalDetails: '기타 디테일 요청사항',
      shootingScenes: '필수 촬영 장면',
      additionalShootingRequests: '추가 촬영 요청사항',
      
      // 메타광고코드
      metaAdCodeRequired: '메타광고코드 발급 필요',
      metaAdCodeAvailable: '메타광고코드 발급 가능 여부',
      metaAdCodeAvailableConfirm: '메타광고코드 발급이 가능합니다',
      metaAdCodeRequiredWarning: '이 캠페인은 메타광고코드 발급이 필수입니다. 광고코드 발급이 불가능한 경우 지원하실 수 없습니다.',
      metaAdCodeNotAvailableError: '메타광고코드 발급이 필수인 캠페인입니다. 광고코드 발급 가능 여부를 확인해주세요.'
    }
  }

  const t = texts.ko

  useEffect(() => {
    if (!user) {
      setError(t.loginRequired)
      setLoading(false)
      return
    }

    if (!campaignId) {
      setError(t.campaignNotFound)
      setLoading(false)
      return
    }

    loadData()
  }, [user, campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('데이터 로딩 시작:', { campaignId, userId: user?.id })

      // 1. 캠페인 정보 로드
      const campaignData = await database.campaigns.getById(campaignId)
      console.log('캠페인 데이터:', campaignData)
      
      if (!campaignData) {
        throw new Error(t.campaignNotFound)
      }
      setCampaign(campaignData)

      // 2. 사용자 프로필 로드
      const profileData = await database.userProfiles.get(user.id)
      console.log('프로필 데이터:', profileData)
      setUserProfile(profileData)

      // 프로필에서 기존 정보 가져와서 폼에 미리 채우기
      if (profileData) {
        setApplicationData(prev => ({
          ...prev,
          applicant_name: profileData.name || '',
          age: profileData.age || '',
          skin_type: profileData.skin_type || '',
          // 연락처 및 배송 정보
          postal_code: profileData.postcode || '',
          address: profileData.address ? `${profileData.address} ${profileData.detail_address || ''}`.trim() : '',
          phone_number: profileData.phone || '',
          // SNS 정보
          instagram_url: profileData.instagram_url || '',
          youtube_url: profileData.youtube_url || '',
          tiktok_url: profileData.tiktok_url || ''
        }))
      }

      // 3. 기존 신청서 확인
      const existingApp = await database.applications.getByUserAndCampaign(user.id, campaignId)
      console.log('기존 신청서:', existingApp)
      setExistingApplication(existingApp)

      // 기존 신청서가 있으면 데이터 로드
      if (existingApp) {
        setApplicationData(prev => ({
          ...prev,
          applicant_name: existingApp.applicant_name || profileData?.name || '',
          answer_1: existingApp.answer_1 || '',
          answer_2: existingApp.answer_2 || '',
          answer_3: existingApp.answer_3 || '',
          answer_4: existingApp.answer_4 || '',
          additional_info: existingApp.additional_info || '',
          age: existingApp.age || profileData?.age || '',
          skin_type: existingApp.skin_type || profileData?.skin_type || '',
          postal_code: existingApp.postal_code || '',
          address: existingApp.address || '',
          delivery_request: existingApp.delivery_request || '',
          phone_number: existingApp.phone_number || '',
          instagram_url: existingApp.instagram_url || profileData?.instagram_url || '',
          youtube_url: existingApp.youtube_url || profileData?.youtube_url || '',
          tiktok_url: existingApp.tiktok_url || profileData?.tiktok_url || '',
          offline_visit_available: existingApp.offline_visit_available || false,
          offline_visit_notes: existingApp.offline_visit_notes || ''
        }))
      }

    } catch (error) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = []

    // 개인정보 필수 필드 검증
    if (!applicationData.age || applicationData.age.toString().trim() === '' || applicationData.age < 1) {
      errors.push('나이를 올바르게 입력해주세요')
    }
    if (!applicationData.skin_type || applicationData.skin_type.trim() === '') {
      errors.push('피부타입을 선택해주세요')
    }

    // 연락처 및 배송 정보 필수 필드 검증
    if (!applicationData.postal_code.trim()) {
      errors.push(t.postalCodeRequired)
    }
    if (!applicationData.address.trim()) {
      errors.push(t.addressRequired)
    }
    if (!applicationData.phone_number.trim()) {
      errors.push(t.phoneRequired)
    }
    
    // SNS URL 검증: 선택된 플랫폼 중 최소 1개의 URL 필요
    const hasAtLeastOneSnsUrl = 
      (selectedPlatforms.instagram && applicationData.instagram_url.trim()) ||
      (selectedPlatforms.youtube && applicationData.youtube_url.trim()) ||
      (selectedPlatforms.tiktok && applicationData.tiktok_url.trim())
    
    if (!hasAtLeastOneSnsUrl) {
      errors.push(t.atLeastOneSnsRequired)
    }

    // 메타광고코드 검증
    if (campaign?.meta_ad_code_requested && !applicationData.meta_ad_code_available) {
      errors.push(t.metaAdCodeNotAvailableError)
    }

    // 질문 답변 검증 (questions 배열 사용)
    if (campaign?.questions && Array.isArray(campaign.questions)) {
      campaign.questions.forEach((q, index) => {
        const answerKey = `answer_${index + 1}`
        if (!applicationData[answerKey]?.trim()) {
          errors.push(`질문 ${index + 1}은 필수입니다`)
        }
      })
    }


    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      return
    }

    try {
      setSubmitting(true)
      setError('')

      // 申請データの準備 - applicationsテーブル用の構造に合わせる
      const submissionData = {
        user_id: user.id,
        campaign_id: campaignId,
        applicant_name: applicationData.applicant_name,
        age: parseInt(applicationData.age) || null,
        skin_type: applicationData.skin_type,
        postal_code: applicationData.postal_code,
        address: applicationData.address,
        delivery_request: applicationData.delivery_request || null,
        phone_number: applicationData.phone_number,
        instagram_url: applicationData.instagram_url,
        youtube_url: applicationData.youtube_url || null,
        tiktok_url: applicationData.tiktok_url || null,
        answer_1: applicationData.answer_1 || null,
        answer_2: applicationData.answer_2 || null,
        answer_3: applicationData.answer_3 || null,
        answer_4: applicationData.answer_4 || null,
        additional_info: applicationData.additional_info || null,
        offline_visit_available: applicationData.offline_visit_available || false,
        offline_visit_notes: applicationData.offline_visit_notes || null,
        meta_ad_code_available: applicationData.meta_ad_code_available || false,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('申請書提出データ:', submissionData)

      if (existingApplication) {
        // 既存申請書の更新
        console.log('既存申請書を更新:', existingApplication.id)
        await database.applications.update(existingApplication.id, submissionData)
      } else {
        // 新規申請書作成
        console.log('新規申請書を作成')
        await database.applications.create(submissionData)
      }

      setSuccess(t.applicationSuccess)
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (error) {
      console.error('신청서 제출 오류:', error)
      setError('신청서 제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '₩0'
    return `₩${amount.toLocaleString()}`
  }

  const getCampaignTypeBadge = (campaignType) => {
    const badges = {
      regular: { label: '📝 일반 캠페인', color: 'bg-blue-100 text-blue-700' },
      oliveyoung: { label: '🌸 올영세일 캠페인', color: 'bg-pink-100 text-pink-700' },
      '4week_challenge': { label: '💪 4주 챌린지', color: 'bg-purple-100 text-purple-700' }
    }
    const badge = badges[campaignType] || badges.regular
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            {t.backToCampaigns}
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            {success}
          </div>
          <p className="text-gray-600">3초 후 메인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            {t.backToCampaigns}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 캠페인 정보 */}
          <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {t.campaignInfo}
                </h2>
                {getCampaignTypeBadge(campaign.campaign_type)}
              </div>

            {campaign && (
              <div className="space-y-4">
                {/* 캠페인 제목 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{campaign.title}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-sm text-gray-500">{t.brand}:</span>
                    <span className="text-sm font-medium text-gray-700">{campaign.brand}</span>
                    {campaign.category && (
                      <>
                        <span className="text-gray-300">|</span>
                        {(Array.isArray(campaign.category) ? campaign.category : [campaign.category]).map((platform) => {
                          const platformColors = {
                            youtube: 'bg-red-100 text-red-800',
                            instagram: 'bg-pink-100 text-pink-800',
                            tiktok: 'bg-gray-800 text-white'
                          }
                          const color = platformColors[platform.toLowerCase()] || 'bg-purple-100 text-purple-800'
                          return (
                            <span key={platform} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </span>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>

                {/* 캠페인 설명 */}
                {campaign.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t.description}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.description}</p>
                  </div>
                )}

                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">{t.reward}</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(campaign.reward_amount || 0)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">{t.participants}</p>
                      <p className="text-sm font-medium text-gray-900">{campaign.total_slots || campaign.max_participants}명</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4"></path>
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">{t.deadline}</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(campaign.application_deadline)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4"></path>
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">{t.period}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 대상 SNS 플랫폼 */}
                {campaign.target_platforms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">대상 SNS 플랫폼</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // target_platforms가 배열인 경우
                        if (Array.isArray(campaign.target_platforms)) {
                          return campaign.target_platforms.map(p => {
                            return p.charAt(0).toUpperCase() + p.slice(1)
                          })
                        }
                        // target_platforms가 객체인 경우 (레거시 지원)
                        if (campaign.target_platforms && typeof campaign.target_platforms === 'object') {
                          const platforms = []
                          if (campaign.target_platforms.instagram) platforms.push('Instagram')
                          if (campaign.target_platforms.youtube) platforms.push('YouTube')
                          if (campaign.target_platforms.tiktok) platforms.push('TikTok')
                          return platforms
                        }
                        // 기본값
                        return []
                      })().map((platform) => (
                        <span 
                          key={platform} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 참여 조건 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t.requirements}</h4>
                  <div className="space-y-2">
                    {/* 기본 참여 조건 */}
                    {campaign.requirements && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
                    )}
                    
                    {/* 나이 조건 */}
                    {campaign.age_requirement && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">나이:</span>
                        <span>{campaign.age_requirement}</span>
                      </div>
                    )}
                    
                    {/* 피부타입 조건 */}
                    {campaign.skin_type_requirement && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">피부타입:</span>
                        <span>{campaign.skin_type_requirement}</span>
                      </div>
                    )}
                    
                    {/* 오프라인 방문 조건 */}
                    {campaign.offline_visit_requirement && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center text-sm text-blue-800 mb-1">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          <span className="font-medium">오프라인 방문 조건</span>
                        </div>
                        <p className="text-sm text-blue-700 whitespace-pre-wrap">{campaign.offline_visit_requirement}</p>
                      </div>
                    )}  
                  </div>
                </div>

                {/* 캠페인 가이드 */}
                {(campaign.required_dialogues?.length > 0 || campaign.required_scenes?.length > 0 || campaign.required_hashtags?.length > 0 || campaign.video_duration || campaign.video_tempo || campaign.video_tone || campaign.additional_details || campaign.additional_shooting_requests || campaign.meta_ad_code_requested || campaign.ai_generated_guide || campaign.creator_guide) && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">{t.campaignGuide}</h4>
                      {getCampaignTypeBadge(campaign.campaign_type)}
                    </div>
                    
                    {/* 캠페인 유형별 설명 */}
                    {campaign.campaign_type === 'oliveyoung' && (
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-lg p-4 mb-4 shadow-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-base font-bold text-pink-900 mb-2">🌸 올영세일 캠페인</p>
                            <p className="text-sm text-pink-800 leading-relaxed">
                              이 캠페인은 <strong className="text-pink-900">3단계(STEP 1/2/3)로 진행</strong>됩니다. 각 STEP별로 영상을 제작하고 업로드해주세요. <strong className="text-pink-900">상품에 맞는 별도 가이드가 제공</strong>됩니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {campaign.campaign_type === '4week_challenge' && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4 mb-4 shadow-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-base font-bold text-purple-900 mb-2">💪 4주 챌린지 캠페인</p>
                            <p className="text-sm text-purple-800 leading-relaxed">
                              이 캠페인은 <strong className="text-purple-900">4주 동안 진행</strong>됩니다. 매주 영상을 제작하고 업로드하여 제품 사용 경험을 공유해주세요. <strong className="text-purple-900">상품에 맞는 별도 가이드가 제공</strong>됩니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {campaign.campaign_type === 'regular' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>📝 일반 캠페인:</strong> 아래 가이드를 참고하여 영상을 제작해주세요. 필수 대사와 장면을 반드시 포함해주세요.
                        </p>
                      </div>
                    )}
                    {campaign.campaign_type === 'planned' && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-4 shadow-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-base font-bold text-yellow-900 mb-2">📋 기획형 캠페인</p>
                            <p className="text-sm text-yellow-800 leading-relaxed">
                              아래 가이드는 <strong className="text-yellow-900">지원 참고용</strong>이며, 실제 촬영시 <strong className="text-yellow-900">대사와 촬영 장면이 작성 된 별도 가이드로 제공</strong> 됩니다. 필수 대사와 장면을 반드시 포함해주세요.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* AI 생성 가이드 */}
                    {campaign.ai_generated_guide && typeof campaign.ai_generated_guide === 'object' && (
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-3">
                          <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                          </svg>
                          <h5 className="text-sm font-semibold text-purple-800">AI 생성 가이드</h5>
                        </div>
                        <div className="space-y-4">
                          {campaign.ai_generated_guide.product_intro && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-xs font-semibold text-purple-700 mb-2">📝 제품 소개</h6>
                              <p className="text-sm text-gray-700">{campaign.ai_generated_guide.product_intro}</p>
                            </div>
                          )}
                          {campaign.ai_generated_guide.must_include && campaign.ai_generated_guide.must_include.length > 0 && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-xs font-semibold text-red-600 mb-2">✅ 필수 포함 사항</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {campaign.ai_generated_guide.must_include.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {campaign.ai_generated_guide.filming_tips && campaign.ai_generated_guide.filming_tips.length > 0 && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-xs font-semibold text-blue-600 mb-2">🎥 촬영 팁</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {campaign.ai_generated_guide.filming_tips.map((tip, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {campaign.ai_generated_guide.video_concepts && campaign.ai_generated_guide.video_concepts.length > 0 && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-xs font-semibold text-green-600 mb-2">🎨 영상 컨셉</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {campaign.ai_generated_guide.video_concepts.map((concept, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">{concept}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {campaign.ai_generated_guide.cautions && campaign.ai_generated_guide.cautions.length > 0 && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-xs font-semibold text-orange-600 mb-2">⚠️ 주의사항</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {campaign.ai_generated_guide.cautions.map((caution, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">{caution}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* 크리에이터 가이드 */}
                    {campaign.creator_guide && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">크리에이터 가이드</h5>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.creator_guide}</pre>
                      </div>
                    )}
                    <div className="space-y-3">
                      {/* 필수 대사 */}
                      {campaign.required_dialogues && campaign.required_dialogues.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.requiredDialogues}</p>
                          <ul className="list-disc list-inside space-y-1">
                            {campaign.required_dialogues.map((dialogue, idx) => (
                              <li key={idx} className="text-sm text-gray-600">{dialogue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 필수 장면 */}
                      {campaign.required_scenes && campaign.required_scenes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.requiredScenes}</p>
                          <ul className="list-disc list-inside space-y-1">
                            {campaign.required_scenes.map((scene, idx) => (
                              <li key={idx} className="text-sm text-gray-600">{scene}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 필수 촬영 장면 */}
                      {(campaign.shooting_scenes_ba_photo || campaign.shooting_scenes_no_makeup || campaign.shooting_scenes_closeup || campaign.shooting_scenes_product_closeup || campaign.shooting_scenes_product_texture || campaign.shooting_scenes_outdoor || campaign.shooting_scenes_couple || campaign.shooting_scenes_child || campaign.shooting_scenes_troubled_skin || campaign.shooting_scenes_wrinkles) && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.shootingScenes}</p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.shooting_scenes_ba_photo && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">확실한 B&A 촬영</span>}
                            {campaign.shooting_scenes_no_makeup && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">노메이크업</span>}
                            {campaign.shooting_scenes_closeup && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">클로즈업</span>}
                            {campaign.shooting_scenes_product_closeup && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">제품 클로즈업</span>}
                            {campaign.shooting_scenes_product_texture && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">제품 제형 클로즈업</span>}
                            {campaign.shooting_scenes_outdoor && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">외부촬영</span>}
                            {campaign.shooting_scenes_couple && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">커플출연</span>}
                            {campaign.shooting_scenes_child && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">아이출연</span>}
                            {campaign.shooting_scenes_troubled_skin && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">트러블 피부 노출</span>}
                            {campaign.shooting_scenes_wrinkles && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">피부 주름 노출</span>}
                          </div>
                        </div>
                      )}

                      {/* 추가 촬영 요청사항 */}
                      {campaign.additional_shooting_requests && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.additionalShootingRequests}</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.additional_shooting_requests}</p>
                        </div>
                      )}

                      {/* 필수 해시태그 */}
                      {campaign.required_hashtags && campaign.required_hashtags.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.requiredHashtags}</p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.required_hashtags.map((hashtag, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {hashtag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 영상 정보 */}
                      {(campaign.video_duration || campaign.video_tempo || campaign.video_tone) && (
                        <div className="grid grid-cols-3 gap-2">
                          {campaign.video_duration && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t.videoDuration}</p>
                              <p className="text-sm text-gray-700">{campaign.video_duration}</p>
                            </div>
                          )}
                          {campaign.video_tempo && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t.videoTempo}</p>
                              <p className="text-sm text-gray-700">{campaign.video_tempo}</p>
                            </div>
                          )}
                          {campaign.video_tone && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t.videoTone}</p>
                              <p className="text-sm text-gray-700">{campaign.video_tone}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 기타 디테일 요청사항 */}
                      {campaign.additional_details && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">{t.additionalDetails}</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.additional_details}</p>
                        </div>
                      )}

                      {/* 메타광고코드 발급 필요 */}
                      {campaign.meta_ad_code_requested && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="flex items-center text-sm text-yellow-800 mb-1">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <span className="font-medium">{t.metaAdCodeRequired}</span>
                          </div>
                          <p className="text-sm text-yellow-700">{t.metaAdCodeRequiredWarning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 신청서 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              {t.applicationForm}
            </h2>

            {existingApplication && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
                {t.alreadyApplied}
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 whitespace-pre-wrap">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 개인정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.personalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.name} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicationData.applicant_name || userProfile?.name || ''}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, applicant_name: e.target.value }))}
                      placeholder="이름을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.email} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.age} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={applicationData.age || userProfile?.age || ''}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="나이를 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.skinType} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={applicationData.skin_type || userProfile?.skin_type || ''}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, skin_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">피부타입을 선택해주세요</option>
                      <option value="dry">건성 피부</option>
                      <option value="oily">지성 피부</option>
                      <option value="combination">복합성 피부</option>
                      <option value="sensitive">민감성 피부</option>
                      <option value="normal">중성 피부</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 연락처 및 배송 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.contactInfo}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.postalCode} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicationData.postal_code}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, postal_code: e.target.value }))}
                        placeholder={t.postalCodePlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.phoneNumber} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={applicationData.phone_number}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder={t.phoneNumberPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.address} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={applicationData.address}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={t.addressPlaceholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  {/* 배송 시 요청사항 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.deliveryRequest}
                    </label>
                    <textarea
                      value={applicationData.delivery_request}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, delivery_request: e.target.value }))}
                      placeholder={t.deliveryRequestPlaceholder}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* 오프라인 방문 가능 여부 */}
                  {campaign?.offline_visit_requirement && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">오프라인 방문 조건</h4>
                      <p className="text-blue-800 text-sm mb-3">{campaign.offline_visit_requirement}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={applicationData.offline_visit_available || false}
                              onChange={(e) => setApplicationData(prev => ({ 
                                ...prev, 
                                offline_visit_available: e.target.checked 
                              }))}
                              className="mr-2"
                            />
                            <span className="text-sm">위 조건에 따른 오프라인 방문이 가능합니다</span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'ja' ? 'オフライン訪問関連メモ' : '오프라인 방문 관련 메모'}
                          </label>
                          <textarea
                            value={applicationData.offline_visit_notes || ''}
                            onChange={(e) => setApplicationData(prev => ({ 
                              ...prev, 
                              offline_visit_notes: e.target.value 
                            }))}
                            placeholder="訪問可能な時間帯、特記事項などをご記入ください"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 메타광고코드 가능 여부 */}
              {campaign?.meta_ad_code_requested && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-medium text-yellow-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {t.metaAdCodeRequired}
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">{t.metaAdCodeRequiredWarning}</p>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={applicationData.meta_ad_code_available || false}
                      onChange={(e) => setApplicationData(prev => ({ 
                        ...prev, 
                        meta_ad_code_available: e.target.checked 
                      }))}
                      className="mr-2 w-4 h-4"
                      required
                    />
                    <span className="text-sm font-medium text-yellow-900">{t.metaAdCodeAvailableConfirm}</span>
                  </label>
                </div>
              )}

              {/* SNS 정보 섹션 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.snsInfo}</h3>
                
                {/* 플랫폼 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원하는 SNS <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.instagram}
                        onChange={(e) => {
                          setSelectedPlatforms(prev => ({ ...prev, instagram: e.target.checked }))
                          if (!e.target.checked) {
                            setApplicationData(prev => ({ ...prev, instagram_url: '' }))
                          }
                        }}
                        className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">인스타그램</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.youtube}
                        onChange={(e) => {
                          setSelectedPlatforms(prev => ({ ...prev, youtube: e.target.checked }))
                          if (!e.target.checked) {
                            setApplicationData(prev => ({ ...prev, youtube_url: '' }))
                          }
                        }}
                        className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">유튜브</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.tiktok}
                        onChange={(e) => {
                          setSelectedPlatforms(prev => ({ ...prev, tiktok: e.target.checked }))
                          if (!e.target.checked) {
                            setApplicationData(prev => ({ ...prev, tiktok_url: '' }))
                          }
                        }}
                        className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">틱톡</span>
                    </label>
                  </div>
                </div>

                {/* URL 입력 필드 (선택된 플랫폼만 표시) */}
                <div className="space-y-4">
                  {selectedPlatforms.instagram && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.instagramUrl}
                      </label>
                      <input
                        type="url"
                        value={applicationData.instagram_url}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, instagram_url: e.target.value }))}
                        placeholder={t.instagramPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  )}

                  {selectedPlatforms.youtube && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.youtubeUrl}
                      </label>
                      <input
                        type="url"
                        value={applicationData.youtube_url}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, youtube_url: e.target.value }))}
                        placeholder={t.youtubePlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  )}

                  {selectedPlatforms.tiktok && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.tiktokUrl}
                      </label>
                      <input
                        type="url"
                        value={applicationData.tiktok_url}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, tiktok_url: e.target.value }))}
                        placeholder={t.tiktokPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 질문 답변 섹션 */}
              {campaign?.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t.questions}</h3>
                  <div className="space-y-4">
                    {campaign.questions.map((q, index) => {
                      const answerKey = `answer_${index + 1}`
                      return (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {q.question} <span className="text-red-500 ml-1">*</span>
                          </label>
                          {q.type === 'checkbox' && q.options ? (
                            <div className="space-y-2">
                              {q.options.split(',').map((option, idx) => (
                                <label key={idx} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    value={option.trim()}
                                    checked={applicationData[answerKey]?.includes(option.trim()) || false}
                                    onChange={(e) => {
                                      const currentAnswers = applicationData[answerKey]?.split(',').map(a => a.trim()).filter(Boolean) || []
                                      const newAnswers = e.target.checked 
                                        ? [...currentAnswers, option.trim()]
                                        : currentAnswers.filter(a => a !== option.trim())
                                      setApplicationData(prev => ({
                                        ...prev,
                                        [answerKey]: newAnswers.join(', ')
                                      }))
                                    }}
                                    className="mr-2"
                                  />
                                  {option.trim()}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              value={applicationData[answerKey] || ''}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                [answerKey]: e.target.value
                              }))}
                              rows={q.type === 'long' ? 5 : 3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                              placeholder="답변을 입력해주세요"
                              required
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 초상권 동의 섹션 */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {t.portraitRightsTitle}
                </h3>
                <div className="bg-white rounded p-4 mb-4 text-sm text-gray-700 leading-relaxed">
                  {t.portraitRightsConsent}
                </div>
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applicationData.portrait_rights_consent}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      portrait_rights_consent: e.target.checked
                    }))}
                    className="mt-1 mr-3 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    required
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {t.portraitRightsConsentShort} <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* 추가 정보 섹션 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.additionalInfo}
                </label>
                <textarea
                  value={applicationData.additional_info}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, additional_info: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="추가로 전달하고 싶은 내용이 있으면 작성해주세요."
                />
              </div>

              {/* 제출 버튼 */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.submitting}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                      </svg>
                      {t.submit}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>



        </div>
      </div>
    </div>
  )
}

export default CampaignApplicationUpdated
