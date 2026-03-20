import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePCView } from '../../contexts/PCViewContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, CheckCircle, AlertCircle, Loader2,
  Upload, Image, Info, Gift, Calendar, ExternalLink
} from 'lucide-react'

const TextPostSubmitPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isPCView } = usePCView()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [existingSubmission, setExistingSubmission] = useState(null)

  // 업로드 상태
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)

  // 폼 데이터
  const [formData, setFormData] = useState({
    post_url: '',
    post_text: '',
    has_product_image: false,
    has_brand_tag: false,
    has_ad_disclosure: false,
    has_profile_link: false
  })

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}/submit-text-post` } })
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

      if (campaignData.campaign_type !== 'threads_post' && campaignData.campaign_type !== 'x_post') {
        navigate(`/campaign/${id}`)
        return
      }
      setCampaign(campaignData)

      // 기존 제출물 확인 (BIZ DB)
      try {
        const res = await fetch(`/.netlify/functions/get-my-text-status?user_id=${user.id}&campaign_id=${id}`)
        const data = await res.json()
        if (data.success && data.submissions && data.submissions.length > 0) {
          setExistingSubmission(data.submissions[0])
        }
      } catch (err) {
        console.error('제출물 상태 조회 오류:', err)
      }

    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError('정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setError('이미지 크기는 20MB 이하여야 합니다.')
      return
    }

    setScreenshotFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setScreenshotPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('campaign-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('campaign-videos')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const validateForm = () => {
    const errors = []
    if (!formData.post_url.trim()) errors.push('포스트 URL을 입력해주세요.')
    if (!formData.post_text.trim()) errors.push('포스트 텍스트를 입력해주세요.')
    if (!screenshotFile) errors.push('포스트 스크린샷을 업로드해주세요.')
    if (!formData.has_product_image) errors.push('제품 사진 포함을 확인해주세요.')
    if (!formData.has_brand_tag) errors.push('브랜드 태그 포함을 확인해주세요.')
    if (!formData.has_ad_disclosure) errors.push('광고 표시 포함을 확인해주세요.')
    if (!formData.has_profile_link) errors.push('프로필 링크 설정을 확인해주세요.')
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

      // 스크린샷 업로드
      const screenshotUrl = await uploadFile(screenshotFile, 'text-post-screenshots')

      // 플랫폼 결정
      const platform = campaign.campaign_type === 'threads_post' ? 'threads' : 'x'

      // 제출
      const res = await fetch('/.netlify/functions/submit-text-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: id,
          user_id: user.id,
          platform,
          post_url: formData.post_url,
          post_text: formData.post_text,
          screenshot_url: screenshotUrl,
          has_product_image: formData.has_product_image,
          has_brand_tag: formData.has_brand_tag,
          has_ad_disclosure: formData.has_ad_disclosure,
          has_profile_link: formData.has_profile_link
        })
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || '제출에 실패했습니다.')
      }

      setSuccess(true)
    } catch (err) {
      console.error('포스트 제출 오류:', err)
      setError(err.message || '제출 중 오류가 발생했습니다.')
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

  const platformLabel = campaign?.campaign_type === 'threads_post' ? '스레드' : 'X'
  const platformColor = campaign?.campaign_type === 'threads_post' ? 'orange' : 'gray'

  if (loading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={goBack} className="p-1 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">포스트 제출</h1>
              <div className="w-8" />
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">포스트 제출 완료!</h2>
          <p className="text-gray-500 text-center mb-8">
            {platformLabel} 포스트가 제출되었습니다.<br />
            검수 후 승인됩니다.
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
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 이미 제출한 경우
  if (existingSubmission) {
    const statusLabels = {
      pending: '검수 중',
      approved: '승인됨',
      rejected: '반려됨',
      revision_requested: '수정 요청'
    }
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">이미 포스트를 제출했습니다</h2>
          <p className="text-gray-500 text-center mb-2">
            현재 상태: <span className="font-bold text-orange-600">{statusLabels[existingSubmission.status] || existingSubmission.status}</span>
          </p>
          {existingSubmission.status === 'rejected' && existingSubmission.admin_note && (
            <div className="mt-2 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 w-full max-w-sm">
              <p className="text-sm text-red-700">
                <span className="font-bold">반려 사유:</span> {existingSubmission.admin_note}
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
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-medium"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  const reward = campaign?.creator_points_override || campaign?.reward_points || 0
  const allChecked = formData.has_product_image && formData.has_brand_tag && formData.has_ad_disclosure && formData.has_profile_link
  const canSubmit = formData.post_url.trim() && formData.post_text.trim() && screenshotFile && allChecked && !submitting

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <div className="pb-24">
          {/* 헤더 */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={goBack} className="p-1 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
              <h1 className="text-base font-medium text-gray-900">{platformLabel} 포스트 제출</h1>
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      campaign.campaign_type === 'threads_post' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-white'
                    }`}>
                      {platformLabel}
                    </span>
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

          {/* 콘텐츠 가이드 미리보기 */}
          {campaign?.text_content_guide && (
            <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
              <h4 className="font-bold text-orange-900 mb-2 text-sm flex items-center gap-1.5">
                <Info size={14} className="text-orange-600" />
                콘텐츠 가이드
              </h4>
              <div className="space-y-1.5 text-sm text-orange-800">
                {campaign.text_content_guide.hook && (
                  <p><span className="font-semibold">Hook:</span> {campaign.text_content_guide.hook}</p>
                )}
                {campaign.text_content_guide.value && (
                  <p><span className="font-semibold">Value:</span> {campaign.text_content_guide.value}</p>
                )}
                {campaign.text_content_guide.offer && (
                  <p><span className="font-semibold">Offer:</span> {campaign.text_content_guide.offer}</p>
                )}
                {campaign.text_content_guide.ad_disclosure && (
                  <p className="mt-1 font-semibold text-red-700">광고 표시: {campaign.text_content_guide.ad_disclosure}</p>
                )}
              </div>
            </div>
          )}

          {/* 제출 폼 */}
          <div className="p-4 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">포스트 제출</h3>

            {/* 포스트 URL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                포스트 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.post_url}
                onChange={(e) => setFormData(prev => ({ ...prev, post_url: e.target.value }))}
                placeholder={campaign?.campaign_type === 'threads_post'
                  ? 'https://threads.net/@username/post/...'
                  : 'https://x.com/username/status/...'
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* 포스트 텍스트 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                포스트 텍스트 전문 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.post_text}
                onChange={(e) => setFormData(prev => ({ ...prev, post_text: e.target.value }))}
                placeholder="게시한 포스트의 전체 텍스트를 붙여넣어주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={5}
              />
            </div>

            {/* 스크린샷 업로드 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                포스트 스크린샷 <span className="text-red-500">*</span>
              </label>
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="스크린샷" className="w-full rounded-xl border border-gray-200" />
                  <button
                    onClick={() => {
                      setScreenshotFile(null)
                      setScreenshotPreview(null)
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <span className="text-xs font-bold">✕</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">클릭하여 스크린샷 업로드</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 20MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 체크리스트 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                필수 확인사항 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">모든 항목을 확인해야 제출이 가능합니다.</p>
              <div className="space-y-3">
                {[
                  { key: 'has_product_image', label: '제품 사진 1장 이상 포함' },
                  { key: 'has_brand_tag', label: '브랜드 태그 (@계정) 포함' },
                  { key: 'has_ad_disclosure', label: '광고 표시 (#광고) 포함' },
                  { key: 'has_profile_link', label: '프로필 링크 → 크넥샵 설정 완료' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 flex-shrink-0"
                    />
                    <span className={`text-sm ${formData[key] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 참고 콘텐츠 */}
            {campaign?.reference_urls && campaign.reference_urls.length > 0 && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2 text-sm flex items-center gap-1.5">
                  <ExternalLink size={14} className="text-indigo-600" />
                  참고 콘텐츠
                </h4>
                <div className="space-y-1.5">
                  {campaign.reference_urls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                       className="block text-sm text-indigo-700 underline break-all">
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
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
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                제출 중...
              </span>
            ) : '포스트 제출하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextPostSubmitPage
