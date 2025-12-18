import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  X, Calendar, Target, Gift, Instagram, Youtube, Hash,
  MapPin, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Star, FileText, DollarSign
} from 'lucide-react'

const CampaignDetailModal = ({ campaign, isOpen, onClose, onApplySuccess }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [existingApplication, setExistingApplication] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)

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
      loadUserData()
    }
  }, [isOpen, user, campaign])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')

      // 프로필 로드
      const profile = await database.userProfiles.get(user.id)
      setUserProfile(profile)

      // 폼 초기값 설정
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

      // 기존 지원 확인
      const existing = await database.applications.getByUserAndCampaign(user.id, campaign.id)
      setExistingApplication(existing)

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = []

    if (!applicationData.applicant_name.trim()) errors.push('이름을 입력해주세요')
    if (!applicationData.phone_number.trim()) errors.push('연락처를 입력해주세요')
    if (!applicationData.address.trim()) errors.push('주소를 입력해주세요')

    // SNS URL 체크
    if (!applicationData.instagram_url && !applicationData.youtube_url && !applicationData.tiktok_url) {
      errors.push('SNS 계정을 최소 1개 이상 입력해주세요')
    }

    // 질문 답변 체크
    if (campaign?.questions && Array.isArray(campaign.questions)) {
      campaign.questions.forEach((q, idx) => {
        const answerKey = `answer_${idx + 1}`
        if (!applicationData[answerKey]?.trim()) {
          errors.push(`질문 ${idx + 1}에 답변해주세요`)
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
    if (!amount) return '0원'
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올영세일'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      default: return '일반'
    }
  }

  if (!isOpen || !campaign) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">
            {showApplicationForm ? '캠페인 지원' : '캠페인 상세'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
              <p className="text-gray-500">현재 상태: {existingApplication.status === 'pending' ? '검토중' : existingApplication.status}</p>
            </div>
          ) : showApplicationForm ? (
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
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="tel"
                    placeholder="연락처 * (010-0000-0000)"
                    value={applicationData.phone_number}
                    onChange={(e) => setApplicationData({...applicationData, phone_number: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="배송 주소 *"
                    value={applicationData.address}
                    onChange={(e) => setApplicationData({...applicationData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="나이"
                      value={applicationData.age}
                      onChange={(e) => setApplicationData({...applicationData, age: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={applicationData.skin_type}
                      onChange={(e) => setApplicationData({...applicationData, skin_type: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <Youtube size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                    <input
                      type="url"
                      placeholder="유튜브 URL"
                      value={applicationData.youtube_url}
                      onChange={(e) => setApplicationData({...applicationData, youtube_url: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input
                      type="url"
                      placeholder="틱톡 URL"
                      value={applicationData.tiktok_url}
                      onChange={(e) => setApplicationData({...applicationData, tiktok_url: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* 질문 답변 */}
              {campaign.questions && campaign.questions.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">질문 답변</h3>
                  <div className="space-y-4">
                    {campaign.questions.map((question, idx) => (
                      <div key={idx}>
                        <p className="text-sm text-gray-700 mb-2">{question}</p>
                        <textarea
                          placeholder="답변을 입력해주세요"
                          value={applicationData[`answer_${idx + 1}`] || ''}
                          onChange={(e) => setApplicationData({
                            ...applicationData,
                            [`answer_${idx + 1}`]: e.target.value
                          })}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                    ))}
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
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    본 캠페인에서 제작하는 콘텐츠에 포함된 초상(얼굴, 모습, 음성)에 대해
                    브랜드 및 CNEC 플랫폼이 마케팅 목적으로 1년간 사용하는 것에 동의합니다.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* 캠페인 상세 정보 */
            <div className="p-5">
              {/* 썸네일 */}
              {campaign.image_url && (
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-full aspect-video object-cover rounded-2xl mb-5"
                />
              )}

              {/* 기본 정보 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">{campaign.brand}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                    {getCategoryLabel(campaign.campaign_type)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{campaign.title}</h3>
                <p className="text-2xl font-extrabold text-purple-600">
                  {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                </p>
              </div>

              {/* 캠페인 정보 */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-5">
                {campaign.application_deadline && (
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">모집 마감</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(campaign.application_deadline).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                )}
                {campaign.content_submission_deadline && (
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">콘텐츠 제출 마감</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(campaign.content_submission_deadline).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                )}
                {campaign.total_slots && (
                  <div className="flex items-center gap-3">
                    <Target size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">모집 인원</p>
                      <p className="text-sm font-medium text-gray-900">{campaign.total_slots}명</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 설명 */}
              {campaign.description && (
                <div className="mb-5">
                  <h4 className="font-bold text-gray-900 mb-2">캠페인 설명</h4>
                  <p className={`text-sm text-gray-600 leading-relaxed ${
                    !showFullDescription ? 'line-clamp-4' : ''
                  }`}>
                    {campaign.description}
                  </p>
                  {campaign.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-purple-600 text-sm font-medium mt-2 flex items-center gap-1"
                    >
                      {showFullDescription ? (
                        <>접기 <ChevronUp size={16} /></>
                      ) : (
                        <>더보기 <ChevronDown size={16} /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {!loading && !success && !existingApplication && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8">
            {showApplicationForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold"
                >
                  이전
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold disabled:opacity-50"
                >
                  {submitting ? '지원 중...' : '지원하기'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-black transition-colors"
              >
                지원하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignDetailModal
