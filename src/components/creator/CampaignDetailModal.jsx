import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  X, Calendar, Target, Gift, Instagram, Youtube, Hash,
  MapPin, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Star, FileText, DollarSign,
  Share2, Heart, ArrowLeft, Truck, Camera, Upload,
  HelpCircle, AlertTriangle, ChevronRight, ExternalLink
} from 'lucide-react'

// FAQ 데이터
const FAQ_DATA = [
  {
    category: '캠페인 참여',
    items: [
      {
        q: '촬영 크리에이터 선정은 어떻게 하나요?',
        a: '선정기준은 크리에이터 계정 지수, 프로필 사진, 각 캠페인의 리스트에 작성된 내용을 토대로 종합한 객관적인 지표를 토대로 공정성을 기해 선정하고 있습니다.'
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
      }
    ]
  },
  {
    category: '포인트',
    items: [
      {
        q: '포인트를 받으려면 어떻게 해야 되나요?',
        a: '마이페이지에서 출금신청을 해 주시면 됩니다. 출금신청 후 그 다음 주 월요일에 일괄 지급됩니다.'
      }
    ]
  }
]

// 유의사항 데이터
const CAUTIONS = [
  '선정 완료 후에는 취소가 불가합니다.',
  '촬영 기간 미준수 시 패널티(적립금 차감)가 부여됩니다.',
  '영상은 최고 화질 또는 1080p 이상으로 촬영해 주세요.',
  '2차 활용 기간은 1년이며, 이후 마케팅 활동은 제한됩니다.'
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
  const [viewMode, setViewMode] = useState('detail') // detail, apply
  const [showDetailImages, setShowDetailImages] = useState(false)
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
      setViewMode('detail')
      setShowDetailImages(false)
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

  // 프로필 완성 여부 체크 (누락 항목도 반환)
  const getProfileStatus = () => {
    if (!userProfile) {
      return {
        isComplete: false,
        missing: ['프로필 미등록'],
        missingDetails: { all: true }
      }
    }

    const missing = []
    const missingDetails = {}

    if (!userProfile.skin_type) {
      missing.push('피부타입 미입력')
      missingDetails.skinType = true
    }
    if (!userProfile.address) {
      missing.push('주소 미입력')
      missingDetails.address = true
    }
    if (!userProfile.instagram_url && !userProfile.youtube_url && !userProfile.tiktok_url) {
      missing.push('SNS 미등록')
      missingDetails.sns = true
    }
    if (!userProfile.phone) {
      missing.push('연락처 미입력')
      missingDetails.phone = true
    }

    return {
      isComplete: missing.length === 0,
      missing,
      missingDetails
    }
  }

  const isProfileComplete = () => getProfileStatus().isComplete

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

  const formatPrice = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올리브영'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      default: return '기획형'
    }
  }

  const getCategoryStyle = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-emerald-500 text-white'
      case '4week_challenge': return 'bg-violet-500 text-white'
      case 'planned': return 'bg-blue-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  if (!isOpen || !campaign) return null

  const reward = campaign.creator_points_override || campaign.reward_points || 0

  // D-Day 계산
  const getDDay = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return '마감'
    if (diff === 0) return 'D-Day'
    return `D-${diff}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  // 프로필 필요 알림 모달
  if (showProfileAlert) {
    const profileStatus = getProfileStatus()

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">프로필 완성 후 지원 가능</h3>
          <p className="text-sm text-gray-500 mb-4">
            캠페인 지원을 위해 아래 항목을 완성해 주세요.
          </p>

          {/* 누락 항목 뱃지 */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {profileStatus.missing.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-medium"
              >
                <AlertCircle size={12} />
                {item}
              </span>
            ))}
          </div>

          <button
            onClick={handleProfileAlertConfirm}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            프로필 완성하기
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {viewMode === 'apply' ? (
            <button
              onClick={() => setViewMode('detail')}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          ) : (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}

          <h2 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {viewMode === 'apply' ? '캠페인 지원' : campaign.title}
          </h2>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Share2 size={18} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Heart size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : success ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">지원 완료!</h3>
              <p className="text-gray-500 text-sm">캠페인 지원이 완료되었습니다.</p>
            </div>
          ) : existingApplication ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">이미 지원한 캠페인입니다</h3>
              <p className="text-gray-500 text-sm">현재 상태: {
                existingApplication.status === 'pending' ? '검토중' :
                existingApplication.status === 'selected' ? '선정됨' :
                existingApplication.status === 'approved' ? '승인됨' :
                existingApplication.status === 'rejected' ? '미선정' :
                String(existingApplication.status || '확인중')
              }</p>
            </div>
          ) : viewMode === 'apply' ? (
            /* 지원 폼 */
            <div className="p-4 space-y-5 pb-32">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* 기본 정보 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">기본 정보</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="이름 *"
                    value={applicationData.applicant_name}
                    onChange={(e) => setApplicationData({...applicationData, applicant_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="연락처 * (010-0000-0000)"
                    value={applicationData.phone_number}
                    onChange={(e) => setApplicationData({...applicationData, phone_number: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="배송 주소 *"
                    value={applicationData.address}
                    onChange={(e) => setApplicationData({...applicationData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="나이"
                      value={applicationData.age}
                      onChange={(e) => setApplicationData({...applicationData, age: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={applicationData.skin_type}
                      onChange={(e) => setApplicationData({...applicationData, skin_type: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <h3 className="font-bold text-gray-900 mb-3 text-sm">SNS 계정 (최소 1개)</h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                    <input
                      type="url"
                      placeholder="인스타그램 URL"
                      value={applicationData.instagram_url}
                      onChange={(e) => setApplicationData({...applicationData, instagram_url: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Youtube size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                    <input
                      type="url"
                      placeholder="유튜브 URL"
                      value={applicationData.youtube_url}
                      onChange={(e) => setApplicationData({...applicationData, youtube_url: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input
                      type="url"
                      placeholder="틱톡 URL"
                      value={applicationData.tiktok_url}
                      onChange={(e) => setApplicationData({...applicationData, tiktok_url: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 질문 답변 */}
              {campaign.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">질문 답변</h3>
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
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
                    className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    본 캠페인에서 제작하는 콘텐츠에 포함된 초상에 대해 브랜드 및 CNEC 플랫폼이 마케팅 목적으로 1년간 사용하는 것에 동의합니다.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* 캠페인 상세 정보 */
            <div className="pb-32">
              {/* 히어로 이미지 */}
              <div className="relative">
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                    <Gift size={48} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* 카테고리 뱃지 */}
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded mb-3 ${getCategoryStyle(campaign.campaign_type)}`}>
                  {getCategoryLabel(campaign.campaign_type)}
                </span>

                {/* 제목 */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                  {campaign.title}
                </h3>

                {/* 미션 설명 */}
                {campaign.mission && (
                  <p className="text-sm text-blue-600 font-medium mb-4">
                    {campaign.mission}
                  </p>
                )}

                {/* 캠페인 정보 박스 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  {/* 브랜드 */}
                  {campaign.brand && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">브랜드</span>
                      <span className="text-sm font-medium text-gray-900">{campaign.brand}</span>
                    </div>
                  )}

                  {/* 원고료 */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">원고료</span>
                    <span className="text-lg font-bold text-violet-600">{formatPrice(reward)}</span>
                  </div>

                  {/* 지원 마감일 */}
                  {campaign.application_deadline && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">지원 마감</span>
                      <span className="text-sm text-gray-900 flex items-center gap-2">
                        {formatDate(campaign.application_deadline)}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          getDDay(campaign.application_deadline) === '마감'
                            ? 'bg-gray-200 text-gray-500'
                            : getDDay(campaign.application_deadline) === 'D-Day' || parseInt(getDDay(campaign.application_deadline)?.replace('D-', '')) <= 3
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getDDay(campaign.application_deadline)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* 선정 발표일 */}
                  {campaign.selection_date && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">선정 발표</span>
                      <span className="text-sm text-gray-900">{formatDate(campaign.selection_date)}</span>
                    </div>
                  )}

                  {/* 제품 발송일 */}
                  {campaign.product_shipping_date && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Truck size={14} />
                        제품 발송
                      </span>
                      <span className="text-sm text-gray-900">{formatDate(campaign.product_shipping_date)}</span>
                    </div>
                  )}

                  {/* 촬영/업로드 마감일 */}
                  {campaign.content_submission_deadline && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Camera size={14} />
                        촬영 마감
                      </span>
                      <span className="text-sm text-gray-900 flex items-center gap-2">
                        {formatDate(campaign.content_submission_deadline)}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          getDDay(campaign.content_submission_deadline) === '마감'
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {getDDay(campaign.content_submission_deadline)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* 상품 상세 이미지 - 더보기 버튼 */}
                {(campaign.detail_images || campaign.product_detail_url || campaign.description) && (
                  <div className="mb-4">
                    {!showDetailImages ? (
                      <button
                        onClick={() => setShowDetailImages(true)}
                        className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        더보기
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* 브랜드 소개 */}
                        {campaign.brand && (
                          <div className="bg-gradient-to-b from-gray-50 to-white p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">브랜드</p>
                            <p className="font-bold text-gray-900 text-lg">{campaign.brand}</p>
                            {campaign.description && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{campaign.description}</p>
                            )}
                          </div>
                        )}

                        {/* 상세 이미지들 */}
                        {campaign.detail_images && Array.isArray(campaign.detail_images) && campaign.detail_images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`상세 이미지 ${idx + 1}`}
                            className="w-full rounded-xl"
                          />
                        ))}

                        {/* 외부 상품 링크 */}
                        {campaign.product_detail_url && (
                          <a
                            href={campaign.product_detail_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <ExternalLink size={16} />
                            상품 상세 보기
                          </a>
                        )}

                        {/* FAQ 섹션 */}
                        <div className="mt-6">
                          <h4 className="font-bold text-gray-900 mb-3 text-sm">자주 묻는 질문</h4>
                          <div className="space-y-2">
                            {FAQ_DATA.flatMap(cat => cat.items).slice(0, 5).map((item, idx) => {
                              const isExpanded = expandedFaq === idx
                              return (
                                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-white"
                                  >
                                    <span className="text-sm text-gray-900 pr-2">{item.q}</span>
                                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                      <p className="text-sm text-gray-600">{item.a}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* 유의사항 */}
                        <div className="mt-6">
                          <h4 className="font-bold text-gray-900 mb-3 text-sm">유의사항</h4>
                          <div className="bg-amber-50 rounded-xl p-4">
                            <ul className="space-y-2">
                              {CAUTIONS.map((caution, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-amber-800">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{caution}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 접기 버튼 */}
                        <button
                          onClick={() => setShowDetailImages(false)}
                          className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          접기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 - 고정 */}
        {!loading && !success && !existingApplication && (
          <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 pb-6">
            {viewMode === 'apply' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {submitting ? '지원 중...' : '참가하기'}
              </button>
            ) : (
              <div className="flex gap-3">
                {campaign.product_detail_url && (
                  <a
                    href={campaign.product_detail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-center hover:bg-gray-50"
                  >
                    제품 바로가기
                  </a>
                )}
                <button
                  onClick={handleApplyClick}
                  className={`py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors ${
                    campaign.product_detail_url ? 'flex-1' : 'w-full'
                  }`}
                >
                  참가하기
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
