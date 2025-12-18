import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  X, Calendar, Target, Gift, Instagram, Youtube, Hash,
  MapPin, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Star, FileText, DollarSign,
  Share2, Heart, ArrowLeft, Truck, Camera, Upload,
  HelpCircle, AlertTriangle, ChevronRight
} from 'lucide-react'

// FAQ 데이터
const FAQ_DATA = [
  {
    category: '캠페인 참여',
    items: [
      {
        q: '촬영 크리에이터 선정은 어떻게 하나요?',
        a: '선정기준은 크리에이터 계정 지수, 프로필 사진, 각 캠페인의 리스트에 작성된 내용을 토대로 종합한 객관적인 지표를 토대로 공정성을 기해 선정하고 있습니다. 크넥은 오직 영상의 퀄리티만 보기에 각 기업과의 시너지가 좋으시다면 누구나 참여가 가능합니다.'
      },
      {
        q: '동일 캠페인에 재참여가 가능한가요?',
        a: '동일 캠페인 재참여는 원칙적으로 제한됩니다. 단, 브랜드에서 재협업을 요청하는 경우 예외적으로 가능할 수 있습니다.'
      }
    ]
  },
  {
    category: '캠페인 신청/취소',
    items: [
      {
        q: '지원한 캠페인을 취소하고 싶어요',
        a: '선정 발표 전까지는 마이페이지에서 지원 취소가 가능합니다. 선정 완료 후에는 취소가 불가하니 신중하게 지원해 주세요.'
      },
      {
        q: '선정된 캠페인을 취소하고 싶어요',
        a: '선정 완료 후에는 취소가 불가합니다. 불가피한 사유가 있는 경우 고객센터로 문의해 주세요.'
      }
    ]
  },
  {
    category: '리뷰 등록',
    items: [
      {
        q: '영상 편집은 직접 해야 되나요?',
        a: '네, 영상 촬영 및 기본 편집은 크리에이터님께서 진행해 주시면 됩니다. 단, 색보정 및 최종 보정은 저희 측에서 처리합니다.'
      },
      {
        q: '스마트폰 카메라를 사용해도 되나요?',
        a: '네, 스마트폰 카메라 사용이 가능합니다. 단, 최고 화질 또는 1080p 이상으로 촬영해 주세요.'
      }
    ]
  },
  {
    category: '포인트',
    items: [
      {
        q: '포인트를 받으려면 어떻게 해야 되나요?',
        a: '마이페이지에서 출금신청을 해 주시면 됩니다. 출금신청 후 그 다음 주 월요일에 일괄 지급되며, 각 지급 관련 세금은 공제 후 제공됩니다.'
      },
      {
        q: '캠페인 수행 후 영상은 어떻게 하나요?',
        a: 'SNS 업로드가 기본이며, 업로드 후 링크를 제출해 주시면 됩니다. 업로드가 불가한 경우 지원 시 미리 명시해 주세요.'
      }
    ]
  },
  {
    category: '패널티',
    items: [
      {
        q: '촬영시간이 부족했어요 패널티가 있나요?',
        a: '네, 각 담당자에게 사유 설명 없이 촬영기간을 어길 시 패널티가 부여됩니다.\n• 1일 지각: 10% 적립금 차감\n• 2일 지각: 20% 적립금 차감\n• 3일 지각: 50% 적립금 차감'
      },
      {
        q: '상품만 받고 촬영을 안해서 경고를 받았어요',
        a: '제품 수령 후 촬영을 진행하지 않을 경우 심각한 패널티가 부여되며, 이후 캠페인 참여가 제한될 수 있습니다.'
      }
    ]
  },
  {
    category: '기타',
    items: [
      {
        q: '2차 활용 기간은 언제까지인가요?',
        a: '2차 활용 기간은 1년이며, 이후 마케팅 활동은 제한됩니다.'
      },
      {
        q: 'SNS 업로드 해야 되나요?',
        a: 'SNS 업로드가 기본이며, 불가 시 지원 시 명시해 주세요.'
      }
    ]
  }
]

// 유의사항 데이터
const CAUTIONS = [
  '선정 완료 후에는 취소가 불가합니다.',
  '선정 발표 후 3일 이내에 제품이 배송됩니다.',
  '촬영 기간 미준수 시 패널티(적립금 차감)가 부여됩니다.',
  '영상은 최고 화질 또는 1080p 이상으로 촬영해 주세요.',
  '크넥은 no보정 no필터의 영상만 취합하며, 보정은 저희측에서 처리합니다.',
  'SNS 업로드가 기본이며, 불가 시 지원 시 명시해 주세요.',
  '2차 활용 기간은 1년이며, 이후 마케팅 활동은 제한됩니다.',
  '동일 캠페인 재참여는 원칙적으로 제한됩니다.'
]

const CampaignDetailModal = ({ campaign, isOpen, onClose, onApplySuccess }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [existingApplication, setExistingApplication] = useState(null)

  // UI 상태
  const [viewMode, setViewMode] = useState('summary') // summary, detail, apply
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [showProfileAlert, setShowProfileAlert] = useState(false)

  // 지원서 폼
  const [applicationData, setApplicationData] = useState({
    answer_1: '',
    answer_2: '',
    answer_3: '',
    answer_4: '',
    additional_info: '',
    applicant_name: '',
    age: '',
    skin_type: '',
    postal_code: '',
    address: '',
    phone_number: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    portrait_rights_consent: false
  })

  const skinTypes = ['건성', '지성', '복합성', '민감성', '중성']

  useEffect(() => {
    if (isOpen && user && campaign) {
      setViewMode('summary')
      loadUserData()
    }
  }, [isOpen, user, campaign])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')

      const profile = await database.userProfiles.get(user.id)
      setUserProfile(profile)

      if (profile) {
        setApplicationData(prev => ({
          ...prev,
          applicant_name: profile.name || '',
          age: profile.age || '',
          skin_type: profile.skin_type || '',
          postal_code: profile.postcode || '',
          address: profile.address ? `${profile.address} ${profile.detail_address || ''}`.trim() : '',
          phone_number: profile.phone || '',
          instagram_url: profile.instagram_url || '',
          youtube_url: profile.youtube_url || '',
          tiktok_url: profile.tiktok_url || ''
        }))
      }

      const existing = await database.applications.getByUserAndCampaign(user.id, campaign.id)
      setExistingApplication(existing)

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 프로필 완성 여부 체크
  const isProfileComplete = () => {
    if (!userProfile) return false
    const hasSkinType = !!userProfile.skin_type
    const hasAddress = !!userProfile.address
    const hasSNS = !!(userProfile.instagram_url || userProfile.youtube_url || userProfile.tiktok_url)
    return hasSkinType && hasAddress && hasSNS
  }

  const handleApplyClick = () => {
    if (!isProfileComplete()) {
      setShowProfileAlert(true)
      return
    }
    setViewMode('apply')
  }

  const handleProfileAlertConfirm = () => {
    setShowProfileAlert(false)
    onClose()
    navigate('/profile')
  }

  const validateForm = () => {
    const errors = []

    if (!applicationData.applicant_name.trim()) errors.push('이름을 입력해주세요')
    if (!applicationData.phone_number.trim()) errors.push('연락처를 입력해주세요')
    if (!applicationData.address.trim()) errors.push('주소를 입력해주세요')

    if (!applicationData.instagram_url && !applicationData.youtube_url && !applicationData.tiktok_url) {
      errors.push('SNS 계정을 최소 1개 이상 입력해주세요')
    }

    if (campaign?.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0) {
      campaign.questions.forEach((q, idx) => {
        const answerKey = `answer_${idx + 1}`
        if (!applicationData[answerKey]?.trim()) {
          const questionText = typeof q === 'string' ? q : (q?.text || q?.question || `질문 ${idx + 1}`)
          errors.push(`"${questionText.substring(0, 20)}..." 에 답변해주세요`)
        }
      })
    }

    if (!applicationData.portrait_rights_consent) {
      errors.push('초상권 사용 동의가 필요합니다')
    }

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const submissionData = {
        user_id: user.id,
        campaign_id: campaign.id,
        applicant_name: applicationData.applicant_name,
        age: parseInt(applicationData.age) || null,
        skin_type: applicationData.skin_type,
        postal_code: applicationData.postal_code,
        address: applicationData.address,
        phone_number: applicationData.phone_number,
        instagram_url: applicationData.instagram_url,
        youtube_url: applicationData.youtube_url || null,
        tiktok_url: applicationData.tiktok_url || null,
        answer_1: applicationData.answer_1 || null,
        answer_2: applicationData.answer_2 || null,
        answer_3: applicationData.answer_3 || null,
        answer_4: applicationData.answer_4 || null,
        additional_info: applicationData.additional_info || null,
        portrait_rights_consent: true,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('applications')
        .insert([submissionData])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        onApplySuccess?.()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('지원 오류:', error)
      setError('지원 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0P'
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만P`
    }
    return `${amount.toLocaleString()}P`
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올영세일'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      default: return '일반'
    }
  }

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-emerald-100 text-emerald-700'
      case '4week_challenge': return 'bg-violet-100 text-violet-700'
      case 'planned': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isOpen || !campaign) return null

  // 프로필 필요 알림 모달
  if (showProfileAlert) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">프로필 등록 필요</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            프로필이 등록되어야<br/>캠페인에 지원할 수 있습니다.
          </p>
          <button
            onClick={handleProfileAlertConfirm}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 transition-colors"
          >
            프로필 등록하기
          </button>
          <button
            onClick={() => setShowProfileAlert(false)}
            className="w-full py-3 text-gray-500 text-sm mt-2"
          >
            나중에 하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div
        className={`w-full max-w-md bg-white overflow-hidden transition-all duration-300 ${
          viewMode === 'summary'
            ? 'rounded-t-3xl max-h-[70vh]'
            : 'rounded-t-3xl max-h-[95vh]'
        }`}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          {viewMode !== 'summary' ? (
            <button
              onClick={() => setViewMode(viewMode === 'apply' ? 'detail' : 'summary')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <h2 className="font-bold text-base text-gray-900">
            {viewMode === 'apply' ? '캠페인 지원' : '캠페인 상세'}
          </h2>

          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className={`overflow-y-auto ${viewMode === 'apply' ? 'max-h-[calc(95vh-160px)]' : 'max-h-[calc(70vh-140px)]'} pb-24`}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : success ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">지원 완료!</h3>
              <p className="text-gray-500">캠페인 지원이 완료되었습니다.<br/>결과는 알림으로 안내드립니다.</p>
            </div>
          ) : existingApplication ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">이미 지원한 캠페인입니다</h3>
              <p className="text-gray-500">현재 상태: {
                existingApplication.status === 'pending' ? '검토중' :
                existingApplication.status === 'selected' ? '선정됨' :
                existingApplication.status === 'approved' ? '승인됨' :
                existingApplication.status === 'rejected' ? '미선정' :
                existingApplication.status === 'completed' ? '완료' :
                String(existingApplication.status || '확인중')
              }</p>
            </div>
          ) : viewMode === 'apply' ? (
            /* 지원 폼 */
            <div className="p-5 space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* 기본 정보 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">기본 정보</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={applicationData.applicant_name}
                    onChange={(e) => setApplicationData({...applicationData, applicant_name: e.target.value})}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <input
                    type="tel"
                    placeholder="연락처 * (010-0000-0000)"
                    value={applicationData.phone_number}
                    onChange={(e) => setApplicationData({...applicationData, phone_number: e.target.value})}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <input
                    type="text"
                    placeholder="배송 주소 *"
                    value={applicationData.address}
                    onChange={(e) => setApplicationData({...applicationData, address: e.target.value})}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="나이"
                      value={applicationData.age}
                      onChange={(e) => setApplicationData({...applicationData, age: e.target.value})}
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <select
                      value={applicationData.skin_type}
                      onChange={(e) => setApplicationData({...applicationData, skin_type: e.target.value})}
                      className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">피부타입</option>
                      {skinTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SNS 정보 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">SNS 계정 (최소 1개)</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                    <input
                      type="url"
                      placeholder="인스타그램 URL"
                      value={applicationData.instagram_url}
                      onChange={(e) => setApplicationData({...applicationData, instagram_url: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="relative">
                    <Youtube size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                    <input
                      type="url"
                      placeholder="유튜브 URL"
                      value={applicationData.youtube_url}
                      onChange={(e) => setApplicationData({...applicationData, youtube_url: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input
                      type="url"
                      placeholder="틱톡 URL"
                      value={applicationData.tiktok_url}
                      onChange={(e) => setApplicationData({...applicationData, tiktok_url: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* 질문 답변 */}
              {campaign.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">질문 답변</h3>
                  <div className="space-y-4">
                    {campaign.questions.map((question, idx) => {
                      const questionText = typeof question === 'string'
                        ? question
                        : (question?.text || question?.question || question?.content || JSON.stringify(question))

                      return (
                        <div key={idx}>
                          <p className="text-sm text-gray-700 mb-2">{questionText}</p>
                          <textarea
                            placeholder="답변을 입력해주세요"
                            value={applicationData[`answer_${idx + 1}`] || ''}
                            onChange={(e) => setApplicationData({
                              ...applicationData,
                              [`answer_${idx + 1}`]: e.target.value
                            })}
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 추가 메시지 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">추가 메시지 (선택)</h3>
                <textarea
                  placeholder="브랜드에 전달하고 싶은 메시지가 있다면 작성해주세요"
                  value={applicationData.additional_info}
                  onChange={(e) => setApplicationData({...applicationData, additional_info: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* 초상권 동의 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applicationData.portrait_rights_consent}
                    onChange={(e) => setApplicationData({
                      ...applicationData,
                      portrait_rights_consent: e.target.checked
                    })}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    본 캠페인에서 제작하는 콘텐츠에 포함된 초상(얼굴, 모습, 음성)에 대해
                    브랜드 및 CNEC 플랫폼이 마케팅 목적으로 1년간 사용하는 것에 동의합니다.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* 캠페인 상세 정보 (Summary & Detail) */
            <div>
              {/* 히어로 이미지 */}
              <div className="relative">
                {campaign.image_url && (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full aspect-video object-cover"
                  />
                )}
                {/* 액션 버튼 */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                    <Share2 size={18} className="text-gray-700" />
                  </button>
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                    <Heart size={18} className="text-gray-700" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                {/* 캠페인 유형 뱃지 */}
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${getCategoryColor(campaign.campaign_type)}`}>
                  {getCategoryLabel(campaign.campaign_type)}
                </span>

                {/* 브랜드 + 제목 */}
                <p className="text-sm text-gray-500 mb-1">{campaign.brand}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{campaign.title}</h3>

                {/* 보상 정보 */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 mb-5">
                  <p className="text-xs text-violet-600 font-medium mb-1">리워드</p>
                  <p className="text-3xl font-extrabold text-violet-600">
                    {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                  </p>
                </div>

                {/* 일정 정보 */}
                <div className="space-y-3 mb-5">
                  {campaign.application_deadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Calendar size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">지원 마감</p>
                        <p className="font-medium text-gray-900">
                          {new Date(campaign.application_deadline).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.product_shipping_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Truck size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">제품 발송</p>
                        <p className="font-medium text-gray-900">
                          {new Date(campaign.product_shipping_date).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.content_submission_deadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Camera size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">콘텐츠 제출 마감</p>
                        <p className="font-medium text-gray-900">
                          {new Date(campaign.content_submission_deadline).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.sns_upload_deadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">SNS 업로드 마감</p>
                        <p className="font-medium text-gray-900">
                          {new Date(campaign.sns_upload_deadline).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {campaign.total_slots && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Target size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">모집 인원</p>
                        <p className="font-medium text-gray-900">{campaign.total_slots}명</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 상세 보기 전환 (Summary 모드에서만) */}
                {viewMode === 'summary' && (
                  <button
                    onClick={() => setViewMode('detail')}
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors mb-4"
                  >
                    <span>상세 정보 더보기</span>
                    <ChevronDown size={16} />
                  </button>
                )}

                {/* Detail 모드: 캠페인 설명, FAQ, 유의사항 */}
                {viewMode === 'detail' && (
                  <>
                    {/* 캠페인 설명 */}
                    {campaign.description && (
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-900 mb-3">캠페인 설명</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {campaign.description}
                        </p>
                      </div>
                    )}

                    {/* FAQ 아코디언 */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <HelpCircle size={18} className="text-violet-600" />
                        자주 묻는 질문
                      </h4>
                      <div className="space-y-2">
                        {FAQ_DATA.map((category, catIdx) => (
                          <div key={catIdx}>
                            {category.items.map((item, itemIdx) => {
                              const faqKey = `${catIdx}-${itemIdx}`
                              const isExpanded = expandedFaq === faqKey
                              return (
                                <div key={itemIdx} className="border border-gray-100 rounded-xl overflow-hidden mb-2">
                                  <button
                                    onClick={() => setExpandedFaq(isExpanded ? null : faqKey)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="text-sm font-medium text-gray-900 pr-4">{item.q}</span>
                                    <ChevronDown
                                      size={16}
                                      className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{item.a}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 유의사항 */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        유의사항
                      </h4>
                      <div className="bg-amber-50 rounded-xl p-4">
                        <ul className="space-y-2">
                          {CAUTIONS.map((caution, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>{caution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {!loading && !success && !existingApplication && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8">
            {viewMode === 'apply' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base disabled:opacity-50 hover:bg-violet-700 transition-colors"
              >
                {submitting ? '지원 중...' : '지원하기'}
              </button>
            ) : (
              <div className="flex gap-3">
                {viewMode === 'summary' && (
                  <button
                    onClick={() => setViewMode('detail')}
                    className="flex-1 py-4 border border-gray-200 text-gray-700 rounded-2xl font-bold"
                  >
                    더보기
                  </button>
                )}
                <button
                  onClick={handleApplyClick}
                  className={`py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-black transition-colors ${
                    viewMode === 'summary' ? 'flex-1' : 'w-full'
                  }`}
                >
                  지원하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignDetailModal
