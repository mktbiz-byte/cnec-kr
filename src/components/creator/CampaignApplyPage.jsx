import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  ArrowLeft, Instagram, Youtube, Hash,
  CheckCircle, AlertCircle, Loader2, AlertTriangle,
  Gift, DollarSign, Calendar
} from 'lucide-react'

const CampaignApplyPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [existingApplication, setExistingApplication] = useState(null)

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
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}/apply` } })
      return
    }
    loadData()
  }, [id, user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // 캠페인 조회
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 프로필 조회
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

      // 기존 지원 확인
      const existing = await database.applications.getByUserAndCampaign(user.id, id)
      setExistingApplication(existing)

    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError('정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getProfileStatus = () => {
    if (!userProfile) {
      return { isComplete: false, missing: ['프로필 미등록'] }
    }

    const missing = []

    // 기본 정보 (필수)
    if (!userProfile.profile_image) missing.push('프로필 사진')
    if (!userProfile.name) missing.push('이름')
    if (!userProfile.phone) missing.push('연락처')

    // 뷰티 정보 (필수)
    if (!userProfile.skin_type) missing.push('피부타입')
    if (!userProfile.skin_concerns || userProfile.skin_concerns.length === 0) missing.push('피부고민')
    if (!userProfile.hair_type) missing.push('헤어타입')
    if (!userProfile.hair_concerns || userProfile.hair_concerns.length === 0) missing.push('헤어고민')

    // SNS 정보 (필수 - 각 채널별 URL 또는 없음 체크)
    const instagramOk = userProfile.instagram_url || userProfile.no_instagram
    const youtubeOk = userProfile.youtube_url || userProfile.no_youtube
    const tiktokOk = userProfile.tiktok_url || userProfile.no_tiktok
    if (!instagramOk || !youtubeOk || !tiktokOk) {
      missing.push('SNS 채널 설정')
    }

    // 영상 스타일 (필수)
    if (!userProfile.video_length_style) missing.push('영상 스타일')

    // 상세 정보 (필수)
    if (!userProfile.gender) missing.push('성별')

    return { isComplete: missing.length === 0, missing }
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

    } catch (err) {
      console.error('지원 오류:', err)
      setError('지원 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPoints = (amount) => {
    if (!amount) return '-'
    return `${Number(amount).toLocaleString()}P`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  if (loading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  // 성공 화면
  if (success) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">지원 완료!</h2>
          <p className="text-gray-500 text-center mb-8">
            캠페인 지원이 완료되었습니다.<br />
            선정 결과는 마이페이지에서 확인해주세요.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my/applications')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium"
            >
              지원 내역 보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 이미 지원한 경우
  if (existingApplication) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이미 지원한 캠페인입니다</h2>
          <p className="text-gray-500 text-center mb-2">
            현재 상태: {
              existingApplication.status === 'pending' ? '검토중' :
              existingApplication.status === 'selected' ? '선정됨' :
              existingApplication.status === 'approved' ? '승인됨' :
              existingApplication.status === 'rejected' ? '미선정' :
              '확인중'
            }
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/my/applications')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium"
            >
              지원 내역 보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 프로필 미완성
  const profileStatus = getProfileStatus()
  if (!profileStatus.isComplete) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={48} className="text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">프로필 완성 필요</h2>
          <p className="text-gray-500 text-center mb-4">
            캠페인 지원을 위해 프로필을 완성해주세요.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {profileStatus.missing.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium"
              >
                <AlertCircle size={14} />
                {item}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate('/profile/settings')}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold"
          >
            프로필 완성하기
          </button>
        </div>
      </div>
    )
  }

  const reward = campaign?.creator_points_override || campaign?.reward_points || 0

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <div className="pb-24">
          {/* 헤더 */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(`/campaign/${id}`)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-base font-medium text-gray-900">캠페인 지원</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* 캠페인 미니 정보 */}
      {campaign && (
        <div className="bg-white border-b border-gray-100 p-4">
          <div className="flex gap-3">
            {campaign.image_url ? (
              <img
                src={campaign.image_url}
                alt={campaign.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Gift size={24} className="text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-medium">{campaign.brand}</p>
              <h2 className="text-sm font-bold text-gray-900 line-clamp-2">{campaign.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-bold text-violet-600 flex items-center gap-1">
                  <Gift size={14} />
                  {formatPoints(reward)}
                </span>
                {campaign.application_deadline && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(campaign.application_deadline)} 마감
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 지원 폼 */}
      <div className="p-4 space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl whitespace-pre-line">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">이름 *</label>
              <input
                type="text"
                placeholder="이름을 입력해주세요"
                value={applicationData.applicant_name}
                onChange={(e) => setApplicationData({...applicationData, applicant_name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">연락처 *</label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={applicationData.phone_number}
                onChange={(e) => setApplicationData({...applicationData, phone_number: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">배송 주소 *</label>
              <input
                type="text"
                placeholder="주소를 입력해주세요"
                value={applicationData.address}
                onChange={(e) => setApplicationData({...applicationData, address: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">나이</label>
                <input
                  type="number"
                  placeholder="나이"
                  value={applicationData.age}
                  onChange={(e) => setApplicationData({...applicationData, age: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">피부타입</label>
                <select
                  value={applicationData.skin_type}
                  onChange={(e) => setApplicationData({...applicationData, skin_type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  {skinTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SNS 정보 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">SNS 계정 (최소 1개) *</h3>
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
        {campaign?.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-4">질문 답변</h3>
            <div className="space-y-4">
              {campaign.questions.map((question, idx) => {
                const questionText = typeof question === 'string'
                  ? question
                  : (question?.text || question?.question || question?.content || '')

                return (
                  <div key={idx}>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                      Q{idx + 1}. {questionText} *
                    </label>
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

        {/* 추가 메시지 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">추가 메시지 (선택)</h3>
          <textarea
            placeholder="브랜드에게 전달하고 싶은 메시지가 있다면 작성해주세요"
            value={applicationData.additional_info}
            onChange={(e) => setApplicationData({...applicationData, additional_info: e.target.value})}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 필수 제출 사항 안내 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-blue-600" />
            필수 제출 사항 안내
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            선정 시 다음 항목을 필수로 제출해야 합니다:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>영상 편집본</strong> - 자막, 효과 등이 포함된 완성된 콘텐츠</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>클린본</strong> - 자막/텍스트가 없는 원본 영상</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span><strong>광고코드</strong> - 브랜드에서 제공하는 파트너십 코드</span>
            </li>
          </ul>
        </div>

        {/* 초상권 및 콘텐츠 사용 동의 */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">초상권 및 콘텐츠 사용 동의 *</h3>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 leading-relaxed space-y-2">
            <p>
              본인은 본 캠페인을 통해 제작되는 모든 콘텐츠(영상, 이미지, 음성 등)에 포함된
              본인의 초상, 성명, 음성에 대하여 아래와 같이 사용권을 부여합니다.
            </p>
            <ul className="space-y-1 pl-2">
              <li>• <strong>사용권자:</strong> 해당 브랜드사 및 CNEC 플랫폼</li>
              <li>• <strong>사용 목적:</strong> 광고, 마케팅, 홍보 등 상업적 목적</li>
              <li>• <strong>사용 기간:</strong> SNS 업로드일로부터 1년간</li>
              <li>• <strong>사용 범위:</strong> 온·오프라인 매체, SNS, 홈페이지, 광고물 등</li>
            </ul>
            <p className="text-gray-500">
              ※ 사용 기간 종료 후 콘텐츠 사용 연장 시 별도 협의가 진행됩니다.
            </p>
          </div>
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
            <span className="text-sm text-gray-700 leading-relaxed">
              위 내용을 충분히 이해하였으며, 초상권 및 콘텐츠 사용에 동의합니다.
            </span>
          </label>
        </div>
      </div>
        </div>

        {/* 하단 버튼 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 z-40">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                지원 중...
              </span>
            ) : (
              '지원하기'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CampaignApplyPage
