import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePCView } from '../../contexts/PCViewContext'
import { database, supabase } from '../../lib/supabase'
import {
  ArrowLeft, CheckCircle, AlertCircle, Loader2, AlertTriangle,
  Gift, Calendar, Instagram, Info
} from 'lucide-react'

const StoryApplyPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isPCView } = usePCView()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [existingProposal, setExistingProposal] = useState(null)

  // 기획안 폼 데이터
  const [formData, setFormData] = useState({
    video_concept: '',
    tone_mood: '',
    description: '',
    secondary_use_agreed: false,
    no_edit_policy_agreed: false
  })

  const toneMoods = ['밝은', '청량한', '친근한', '고급스러운', '감성적인', '에너지틱', '차분한']

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}/apply-story` } })
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
      if (campaignData.campaign_type !== 'story_short') {
        navigate(`/campaign/${id}/apply`)
        return
      }
      setCampaign(campaignData)

      // 프로필 조회
      const profile = await database.userProfiles.get(user.id)
      setUserProfile(profile)

      // 기존 기획안 확인 (BIZ DB)
      try {
        const res = await fetch(`/.netlify/functions/get-my-story-status?user_id=${user.id}&campaign_id=${id}`)
        const data = await res.json()
        if (data.success && data.proposals && data.proposals.length > 0) {
          setExistingProposal(data.proposals[0])
        }
      } catch (err) {
        console.error('기획안 상태 조회 오류:', err)
      }

    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError('정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = []
    if (!formData.video_concept.trim()) errors.push('영상 컨셉을 입력해주세요')
    if (!formData.description.trim()) errors.push('구성 설명을 입력해주세요')
    if (!formData.secondary_use_agreed) errors.push('2차 활용 동의가 필요합니다')
    if (!formData.no_edit_policy_agreed) errors.push('수정 불가 정책 동의가 필요합니다')
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

      const res = await fetch('/.netlify/functions/apply-story-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.id,
          user_id: user.id,
          creator_name: userProfile?.name || '',
          video_concept: formData.video_concept,
          tone_mood: formData.tone_mood,
          description: formData.description,
          secondary_use_agreed: formData.secondary_use_agreed,
          no_edit_policy_agreed: formData.no_edit_policy_agreed
        })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || '기획안 제출에 실패했습니다.')
      }

      setSuccess(true)
    } catch (err) {
      console.error('기획안 제출 오류:', err)
      setError(err.message || '기획안 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPoints = (amount) => {
    if (!amount) return '-'
    return `${Number(amount).toLocaleString()}P`
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={goBack} className="p-1 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">스토리 숏폼 지원</h1>
              <div className="w-8" />
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">기획안 제출 완료!</h2>
          <p className="text-gray-500 text-center mb-8">
            기획안이 제출되었습니다.<br />
            승인 후 촬영을 진행해주세요.
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
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 이미 기획안 제출한 경우
  if (existingProposal) {
    const statusLabels = {
      pending: '검토 중',
      approved: '승인됨',
      rejected: '반려됨',
      submitted: '제출 완료'
    }
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이미 기획안을 제출했습니다</h2>
          <p className="text-gray-500 text-center mb-2">
            현재 상태: <span className="font-bold text-rose-600">{statusLabels[existingProposal.status] || existingProposal.status}</span>
          </p>
          {existingProposal.status === 'rejected' && existingProposal.reject_reason && (
            <div className="mt-2 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 w-full max-w-sm">
              <p className="text-sm text-red-700">
                <span className="font-bold">반려 사유:</span> {existingProposal.reject_reason}
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate('/my/applications')}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium"
            >
              지원 내역 보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  const reward = campaign?.creator_points_override || campaign?.reward_points || 0
  const canSubmit = formData.secondary_use_agreed && formData.no_edit_policy_agreed && !submitting

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <div className="pb-24">
          {/* 헤더 */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={goBack}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">스토리 숏폼 지원</h1>
              <div className="w-8" />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500 text-white">스토리 숏폼</span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 line-clamp-2">{campaign.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Gift size={14} className="text-violet-500" />
                    <span className="text-sm font-bold text-violet-600">{formatPoints(reward)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 필수 포함사항 안내 */}
          <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-1.5">
              <Info size={14} className="text-blue-600" />
              스토리에 반드시 포함
            </h4>
            <div className="space-y-1.5 text-sm text-blue-800">
              {campaign?.story_swipe_link && (
                <p>링크: <span className="font-medium">{campaign.story_swipe_link}</span></p>
              )}
              {campaign?.story_hashtags && (
                <p>해시태그: <span className="font-medium">{campaign.story_hashtags}</span></p>
              )}
            </div>
          </div>

          {/* 기획안 작성 폼 */}
          <div className="p-4 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">기획안 작성</h3>

            {/* 영상 컨셉 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                영상 컨셉 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.video_concept}
                onChange={(e) => setFormData(prev => ({ ...prev, video_concept: e.target.value }))}
                placeholder="영상에서 보여줄 핵심 아이디어를 입력해주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* 톤/분위기 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                톤/분위기
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {toneMoods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      tone_mood: prev.tone_mood === mood ? '' : mood
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      formData.tone_mood === mood
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.tone_mood}
                onChange={(e) => setFormData(prev => ({ ...prev, tone_mood: e.target.value }))}
                placeholder="직접 입력 (예: 밝은, 청량한, 친근한)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            {/* 구성 설명 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                구성 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="영상 흐름을 간단히 설명해주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                rows={4}
              />
            </div>

            {/* 동의 체크박스 */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.secondary_use_agreed}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_use_agreed: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    본 영상의 2차 활용(광고 소재 등)에 동의합니다.
                  </span>
                  <span className="text-xs text-red-500 font-bold ml-1">(필수)</span>
                  <p className="text-xs text-gray-500 mt-0.5">미동의 시 지원이 불가합니다.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.no_edit_policy_agreed}
                  onChange={(e) => setFormData(prev => ({ ...prev, no_edit_policy_agreed: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    수정 불가 정책을 확인했습니다.
                  </span>
                  <span className="text-xs text-red-500 font-bold ml-1">(필수)</span>
                  <p className="text-xs text-gray-500 mt-0.5">수정 요청 시 20,000원이 추가 과금됩니다.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className={isPCView
          ? "sticky bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-6 z-40"
          : "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 z-40"
        }>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl font-bold transition-colors ${
              canSubmit
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                제출 중...
              </span>
            ) : '기획안 제출하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoryApplyPage
