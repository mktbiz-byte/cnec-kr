import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePCView } from '../../contexts/PCViewContext'
import { database, supabase } from '../../lib/supabase'
import {
  ArrowLeft, Calendar, Gift, Instagram, Youtube, Hash,
  CheckCircle, AlertCircle, Loader2, Star, FileText,
  Share2, Heart, Truck, Camera, ExternalLink, Users,
  Clock, Package, DollarSign, ChevronDown, ChevronUp,
  AlertTriangle, Info, Play, Ban, Tag, Video, Zap,
  MessageSquare, ShoppingBag, Store, Sparkles, X, Lock
} from 'lucide-react'

const CampaignDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isPCView, setExpandedContent } = usePCView()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [existingApplication, setExistingApplication] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [liked, setLiked] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [showDetailImage, setShowDetailImage] = useState(false)
  const [isPrivateBlocked, setIsPrivateBlocked] = useState(false)

  useEffect(() => {
    if (id) {
      loadCampaignData()
    }
  }, [id, user])

  const loadCampaignData = async () => {
    try {
      setLoading(true)
      setError('')

      // 캠페인 상세 조회
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // 비공개 캠페인 접근 제어
      if (campaignData.is_private) {
        if (user) {
          // 초대받은 크리에이터인지 확인 (applications 테이블에 source='invitation'으로 존재)
          const { data: invitationApp } = await supabase
            .from('applications')
            .select('id, status, source')
            .eq('user_id', user.id)
            .eq('campaign_id', id)
            .single()

          if (!invitationApp) {
            setIsPrivateBlocked(true)
          }
        } else {
          setIsPrivateBlocked(true)
        }
      }

      // 로그인한 경우 추가 데이터 조회
      if (user) {
        const profile = await database.userProfiles.get(user.id)
        setUserProfile(profile)

        const existing = await database.applications.getByUserAndCampaign(user.id, id)
        setExistingApplication(existing)
      }

    } catch (err) {
      console.error('캠페인 로드 오류:', err)
      setError('캠페인 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatPoints = (amount) => {
    if (!amount) return '-'
    return `${Number(amount).toLocaleString()}P`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

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

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올리브영'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      case 'story_short': return '스토리 숏폼'
      default: return '기획형'
    }
  }

  const getCategoryStyle = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-emerald-500 text-white'
      case '4week_challenge': return 'bg-violet-500 text-white'
      case 'planned': return 'bg-blue-500 text-white'
      case 'story_short': return 'bg-rose-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return <Instagram size={16} className="text-pink-500" />
      case 'youtube': return <Youtube size={16} className="text-red-500" />
      case 'tiktok': return <Hash size={16} className="text-gray-700" />
      default: return null
    }
  }

  const getPlatformLabel = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return '인스타그램'
      case 'youtube': return '유튜브'
      case 'tiktok': return '틱톡'
      default: return platform
    }
  }

  const getVideoLengthLabel = (length) => {
    switch (length) {
      case '30sec': return '30초'
      case '45sec': return '45초'
      case '60sec': return '60초'
      case '90sec': return '90초'
      default: return length || '-'
    }
  }

  const getVideoTempoLabel = (tempo) => {
    switch (tempo) {
      case 'slow': return '느림'
      case 'normal': return '보통'
      case 'fast': return '빠름'
      default: return tempo || '-'
    }
  }

  const handleApply = () => {
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}` } })
      return
    }
    if (campaign?.campaign_type === 'story_short') {
      navigate(`/campaign/${id}/apply-story`)
    } else {
      navigate(`/campaign/${id}/apply`)
    }
  }

  // PC 확장 보기: 캠페인 상세 정보를 넓은 화면으로 표시
  useEffect(() => {
    if (!isPCView || !campaign) {
      setExpandedContent(null)
      return
    }
    const reward = campaign.creator_points_override || campaign.reward_points || 0
    setExpandedContent(
      <div className="space-y-6">
        {/* 캠페인 이미지 크게 */}
        {campaign.image_url && (
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={campaign.image_url} alt={campaign.title} className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* 캠페인 기본 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {campaign.brand && (
            <p className="text-sm text-blue-600 font-medium mb-2">{campaign.brand}</p>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{campaign.title}</h2>
          {campaign.product_name && (
            <p className="text-base text-gray-600 mb-4">{campaign.product_name}</p>
          )}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Gift size={20} className="text-violet-500" />
              <span className="text-2xl font-bold text-violet-600">{formatPoints(reward)}</span>
            </div>
            {campaign.total_slots && (
              <div className="flex items-center gap-2 text-gray-500">
                <Users size={18} />
                <span>{campaign.total_slots}명 모집</span>
              </div>
            )}
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-purple-600" />
            캠페인 일정
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">모집 마감</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(campaign.application_deadline)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">선정 발표</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(campaign.announcement_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">촬영 기간</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(campaign.shooting_start)} ~ {formatDate(campaign.shooting_end)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">업로드 마감</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(campaign.upload_deadline)}</p>
            </div>
          </div>
        </div>

        {/* 캠페인 설명 */}
        {campaign.description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">캠페인 소개</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          </div>
        )}
      </div>
    )
    return () => setExpandedContent(null)
  }, [isPCView, campaign])

  if (loading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">{error || '캠페인을 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 비공개 캠페인 - 초대받지 않은 경우
  if (isPrivateBlocked) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Lock size={40} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">비공개 캠페인입니다</h2>
          <p className="text-gray-500 text-center mb-6">
            이 캠페인은 초대된 크리에이터만 참여할 수 있습니다.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const reward = campaign.creator_points_override || campaign.reward_points || 0
  const dDay = getDDay(campaign.application_deadline)
  const isDeadlinePassed = dDay === '마감'
  const isFull = campaign.remaining_slots !== null && campaign.remaining_slots <= 0

  // ai_generated_guide 파싱
  const guide = campaign.ai_generated_guide || {}

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <div className="pb-24">
          {/* 헤더 */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-base font-medium text-gray-900 truncate max-w-[200px]">
            캠페인 상세
          </h1>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Share2 size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Heart size={20} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
            </button>
          </div>
        </div>
      </div>

      {/* 스토리 숏폼 전용 콘텐츠 */}
      {campaign.campaign_type === 'story_short' ? (
      <div className="bg-white">
        {/* 상품 이미지 */}
        <div className="relative">
          {campaign.image_url ? (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
              <Gift size={64} className="text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-rose-500 text-white">
              스토리 숏폼
            </span>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="p-4">
          {campaign.brand && (
            <p className="text-sm text-blue-600 font-medium mb-1">{campaign.brand}</p>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {campaign.title}
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-violet-500" />
              <span className="text-2xl font-bold text-violet-600">{formatPoints(reward)}</span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-gray-100" />

        {/* 스토리 숏폼 상세 정보 */}
        <div className="p-4 space-y-4">
          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
            <h3 className="font-bold text-rose-900 mb-3 text-base">스토리 숏폼 캠페인</h3>
            <div className="space-y-3">
              {campaign.story_type && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">스토리 유형</span>
                  <span className="text-sm font-bold text-gray-900">
                    {campaign.story_type === 'single_story'
                      ? '1장 (15초) · 영상 10초 이상 1개'
                      : campaign.story_type === 'multi_story'
                        ? '2~3장 연속 · 스토리 카드(사진형)'
                        : campaign.story_type}
                  </span>
                </div>
              )}
              {(!campaign.story_type || campaign.story_type === 'single_story') && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">영상 길이</span>
                  <span className="text-sm font-bold text-gray-900">최소 10초 이상</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">업로드 채널</span>
                <span className="text-sm font-bold text-gray-900">인스타그램 스토리</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">보상</span>
                <span className="text-sm font-bold text-violet-600">{formatPoints(reward)}</span>
              </div>
            </div>
          </div>

          {/* 필수사항 */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-1.5">
              <Info size={14} className="text-blue-600" />
              필수사항
            </h4>
            <div className="space-y-2">
              {campaign.story_required_keyword && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-600 font-bold mt-0.5">필수 키워드</span>
                  <span className="text-sm text-blue-800 font-semibold">"{campaign.story_required_keyword}"</span>
                </div>
              )}
              {campaign.story_swipe_link && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-600 font-bold mt-0.5">구매 링크</span>
                  <a href={campaign.story_swipe_link} target="_blank" rel="noopener noreferrer"
                     className="text-sm text-blue-700 underline break-all">
                    {campaign.story_swipe_link}
                  </a>
                </div>
              )}
              {campaign.story_exposure_type && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-600 font-bold mt-0.5">노출 방식</span>
                  <span className="text-sm text-blue-800">
                    {campaign.story_exposure_type === 'unboxing' ? '언박싱' :
                     campaign.story_exposure_type === 'usage_scene' ? '사용 장면' :
                     campaign.story_exposure_type === 'before_after' ? '비포애프터' :
                     campaign.story_exposure_type}
                  </span>
                </div>
              )}
              {campaign.story_slide_count && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-600 font-bold mt-0.5">스토리 장수</span>
                  <span className="text-sm text-blue-800">
                    {campaign.story_slide_count === '1' ? '1장 (15초)' :
                     campaign.story_slide_count === '2_3' ? '2~3장 연속' :
                     campaign.story_slide_count}
                  </span>
                </div>
              )}
              {campaign.story_reference_image_url && (
                <div className="mt-2">
                  <span className="text-xs text-blue-600 font-bold">레퍼런스 이미지</span>
                  <img src={campaign.story_reference_image_url} alt="레퍼런스"
                       className="mt-1 rounded-xl max-h-48 object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* 톤/분위기 */}
          {campaign.story_tone_guide && (
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <h4 className="font-bold text-purple-900 mb-2 text-sm">
                {campaign.story_type === 'multi_story' ? '사진 톤/분위기' : '영상 톤/분위기'}
              </h4>
              <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">
                {campaign.story_tone_guide}
              </p>
            </div>
          )}

          {/* 금지사항 */}
          {campaign.story_restrictions && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <h4 className="font-bold text-red-900 mb-2 text-sm flex items-center gap-1.5">
                <Ban size={14} className="text-red-600" />
                금지사항
              </h4>
              <p className="text-sm text-red-800 leading-relaxed whitespace-pre-line">
                {campaign.story_restrictions}
              </p>
            </div>
          )}

          {/* 캠페인 설명 */}
          {campaign.description && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2 text-sm">캠페인 소개</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>
            </div>
          )}

          {/* 주의사항 */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-3 text-sm flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              주의사항
            </h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                <span>수정 불가 — 수정 시 20,000원 추가 과금</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                <span>2차 활용 동의 필수 (지원 시 동의)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                <span>광고코드 제출 불필요</span>
              </li>
            </ul>
          </div>

          {/* 일정 정보 */}
          {campaign.application_deadline && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-600" />
                일정
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">지원 마감</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {formatDate(campaign.application_deadline)}
                    {dDay && !isDeadlinePassed && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        dDay === 'D-Day' || parseInt(dDay?.replace('D-', '')) <= 3
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {dDay}
                      </span>
                    )}
                  </span>
                </div>
                {campaign.content_submission_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">업로드 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.content_submission_deadline)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="bg-white">
        {/* 상품 이미지 */}
        <div className="relative">
          {campaign.image_url ? (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
              <Gift size={64} className="text-gray-300" />
            </div>
          )}

          {/* 뱃지 오버레이 */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {campaign.is_private && (
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-gray-800 text-white flex items-center gap-1">
                <Lock size={12} />
                비공개
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded ${getCategoryStyle(campaign.campaign_type)}`}>
              {getCategoryLabel(campaign.campaign_type)}
            </span>
            {dDay && !isDeadlinePassed && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                dDay === 'D-Day' || parseInt(dDay?.replace('D-', '')) <= 3
                  ? 'bg-red-500 text-white'
                  : 'bg-black/70 text-white'
              }`}>
                {dDay}
              </span>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="p-4">
          {/* 브랜드 */}
          {campaign.brand && (
            <p className="text-sm text-blue-600 font-medium mb-1">{campaign.brand}</p>
          )}

          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {campaign.title}
          </h2>

          {/* 상품명 */}
          {campaign.product_name && (
            <p className="text-sm text-gray-600 mb-3">{campaign.product_name}</p>
          )}

          {/* 포인트 & 모집인원 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-violet-500" />
              <span className="text-2xl font-bold text-violet-600">{formatPoints(reward)}</span>
            </div>
            {campaign.total_slots && (
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Users size={16} />
                <span>
                  {campaign.remaining_slots !== null
                    ? `${campaign.remaining_slots}/${campaign.total_slots}명 남음`
                    : `${campaign.total_slots}명 모집`
                  }
                </span>
              </div>
            )}
          </div>

          {/* 모집 채널 */}
          {campaign.category && Array.isArray(campaign.category) && campaign.category.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {campaign.category.map((platform, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {getPlatformIcon(platform)}
                  {getPlatformLabel(platform)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-gray-100" />

        {/* 일정 정보 */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={18} />
            캠페인 일정
          </h3>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {/* 지원 마감 */}
            {campaign.application_deadline && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">지원 마감</span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {formatDate(campaign.application_deadline)}
                  {dDay && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isDeadlinePassed ? 'bg-gray-200 text-gray-500' :
                      dDay === 'D-Day' || parseInt(dDay?.replace('D-', '')) <= 3
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {dDay}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* 제품 발송일 */}
            {campaign.shipping_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Truck size={14} />
                  제품 발송
                </span>
                <span className="text-sm font-medium text-gray-900">{formatDate(campaign.shipping_date)}</span>
              </div>
            )}

            {/* 촬영 시작일 */}
            {campaign.start_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Camera size={14} />
                  촬영 시작
                </span>
                <span className="text-sm font-medium text-gray-900">{formatDate(campaign.start_date)}</span>
              </div>
            )}

            {/* 촬영 마감일 */}
            {campaign.content_submission_deadline && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Camera size={14} />
                  촬영 마감
                </span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {formatDate(campaign.content_submission_deadline)}
                  {getDDay(campaign.content_submission_deadline) && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-600">
                      {getDDay(campaign.content_submission_deadline)}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* 업로드 마감일 */}
            {campaign.end_date && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">업로드 마감</span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {formatDate(campaign.end_date)}
                  {getDDay(campaign.end_date) && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-600">
                      {getDDay(campaign.end_date)}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* 4주 챌린지 일정 */}
            {campaign.campaign_type === '4week_challenge' && (
              <>
                {campaign.week1_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">1주차 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.week1_deadline)}</span>
                  </div>
                )}
                {campaign.week2_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">2주차 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.week2_deadline)}</span>
                  </div>
                )}
                {campaign.week3_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">3주차 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.week3_deadline)}</span>
                  </div>
                )}
                {campaign.week4_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">4주차 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.week4_deadline)}</span>
                  </div>
                )}
              </>
            )}

            {/* 올리브영 단계별 일정 */}
            {campaign.campaign_type === 'oliveyoung' && (
              <>
                {campaign.step1_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">1단계 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.step1_deadline)}</span>
                  </div>
                )}
                {campaign.step2_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">2단계 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.step2_deadline)}</span>
                  </div>
                )}
                {campaign.step3_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">3단계 마감</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(campaign.step3_deadline)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-gray-100" />

        {/* 상품 정보 */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={18} />
            상품 정보
          </h3>

          <div className="space-y-4">
            {/* 상품 상세 이미지 - 미리보기 */}
            {campaign.product_detail_file_url && (
              <div className="relative">
                <div className="overflow-hidden rounded-xl max-h-48">
                  <img
                    src={campaign.product_detail_file_url}
                    alt="상품 상세"
                    className="w-full object-cover object-top"
                  />
                  {/* 그라데이션 오버레이 */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
                </div>
                <button
                  onClick={() => setShowDetailImage(true)}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white shadow-sm"
                >
                  상세 이미지 더보기
                </button>
              </div>
            )}

            {/* 상품 설명 */}
            {campaign.product_description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {campaign.product_description}
                </p>
              </div>
            )}

            {/* 상품 가격 */}
            {campaign.product_price && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">상품 가격</span>
                <span className="text-sm font-medium text-gray-900">{campaign.product_price}</span>
              </div>
            )}

            {/* 상품 링크 */}
            {campaign.product_link && (
              <a
                href={campaign.product_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink size={16} />
                상품 상세 보기
              </a>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-gray-100" />

        {/* 참여 조건 */}
        {campaign.requirements && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} />
                참여 조건
              </h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">
                  {campaign.requirements}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* 크리에이터 가이드 (ai_generated_guide) */}
        {guide && (guide.hookingPoint || guide.coreMessage || guide.missions) && (
          <>
            <div className="p-4">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-500" />
                  크리에이터 촬영 가이드
                </h3>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
              </button>

              {showGuide && (
                <div className="mt-4 space-y-4">
                  {/* 후킹 포인트 */}
                  {guide.hookingPoint && (
                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={16} className="text-violet-600" />
                        <span className="text-sm font-bold text-violet-600">⚡ 1초 후킹 포인트</span>
                      </div>
                      <p className="text-base font-medium text-gray-900">"{guide.hookingPoint}"</p>
                    </div>
                  )}

                  {/* 핵심 메시지 */}
                  {guide.coreMessage && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-600">💬 핵심 메시지</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{guide.coreMessage}</p>
                    </div>
                  )}

                  {/* 영상 설정 */}
                  {(guide.videoLength || guide.videoTempo) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Video size={16} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-700">🎬 영상 설정</span>
                      </div>
                      <div className="flex gap-4">
                        {guide.videoLength && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">길이: <strong>{getVideoLengthLabel(guide.videoLength)}</strong></span>
                          </div>
                        )}
                        {guide.videoTempo && (
                          <div className="flex items-center gap-2">
                            <Play size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">템포: <strong>{getVideoTempoLabel(guide.videoTempo)}</strong></span>
                          </div>
                        )}
                      </div>
                      {guide.hasNarration !== undefined && (
                        <p className="text-sm text-gray-600 mt-2">
                          나레이션: <strong>{guide.hasNarration ? '포함' : '미포함'}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* 필수 촬영 미션 */}
                  {guide.missions && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-700">✅ 필수 촬영 미션</span>
                      </div>
                      <ul className="space-y-2">
                        {guide.missions.beforeAfter && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-green-500" />
                            Before & After 보여주기
                          </li>
                        )}
                        {guide.missions.productCloseup && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-green-500" />
                            제품 사용 장면 클로즈업
                          </li>
                        )}
                        {guide.missions.productTexture && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-green-500" />
                            제품 텍스처 보여주기
                          </li>
                        )}
                        {guide.missions.storeVisit && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Store size={14} className="text-green-500" />
                            올리브영 매장 방문 인증
                          </li>
                        )}
                        {guide.missions.weeklyReview && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar size={14} className="text-green-500" />
                            7일 사용 후기 기록
                          </li>
                        )}
                        {guide.missions.priceInfo && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Tag size={14} className="text-green-500" />
                            가격/혜택 정보 언급
                          </li>
                        )}
                        {guide.missions.purchaseLink && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <ShoppingBag size={14} className="text-green-500" />
                            구매 링크 유도
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 금지 사항 */}
                  {guide.prohibitions && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Ban size={16} className="text-red-600" />
                        <span className="text-sm font-bold text-red-700">🚫 금지 사항</span>
                      </div>
                      <ul className="space-y-2">
                        {guide.prohibitions.competitorMention && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            경쟁사 제품 언급 금지
                          </li>
                        )}
                        {guide.prohibitions.exaggeratedClaims && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            과장된 효능/효과 표현 금지
                          </li>
                        )}
                        {guide.prohibitions.medicalMisrepresentation && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            의약품 오인 표현 금지
                          </li>
                        )}
                        {guide.prohibitions.priceOutOfSale && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            세일 기간 외 가격 언급 금지
                          </li>
                        )}
                        {guide.prohibitions.negativeExpression && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            부정적 표현 사용 금지
                          </li>
                        )}
                        {guide.prohibitions.other && guide.prohibitionOtherText && (
                          <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Ban size={14} className="text-red-500" />
                            {guide.prohibitionOtherText}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 필수 해시태그 */}
                  {guide.hashtags && guide.hashtags.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash size={16} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-700">#️⃣ 필수 해시태그</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {guide.hashtags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 참고 영상 URL */}
                  {guide.referenceUrl && (
                    <a
                      href={guide.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <Play size={16} />
                      참고 영상 보기
                    </a>
                  )}

                  {/* 유료광고 표시 */}
                  {guide.needsPartnershipCode && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
                      <AlertTriangle size={16} />
                      <span>유료광고 표시 필요</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* 올리브영 전용 정보 */}
        {campaign.campaign_type === 'oliveyoung' && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Store size={18} className="text-emerald-500" />
                올리브영 정보
              </h3>
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                {campaign.oliveyoung_subtype && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">타입</span>
                    <span className="text-sm font-medium text-emerald-700 capitalize">
                      {campaign.oliveyoung_subtype}
                    </span>
                  </div>
                )}
                {campaign.is_oliveyoung_sale && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle size={16} />
                    <span>올리브영 세일 진행</span>
                  </div>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* 지원 질문 미리보기 */}
        {campaign.questions && Array.isArray(campaign.questions) && campaign.questions.length > 0 && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} />
                지원 시 질문 ({campaign.questions.length}개)
              </h3>
              <div className="space-y-2">
                {campaign.questions.map((question, idx) => {
                  const questionText = typeof question === 'string'
                    ? question
                    : (question?.text || question?.question || question?.content || '')
                  return (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-blue-600">Q{idx + 1}.</span> {questionText}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* 유의사항 */}
        <div className="p-4 pb-8">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            유의사항
          </h3>
          <div className="bg-amber-50 rounded-xl p-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>선정 완료 후에는 취소가 불가합니다.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>촬영 기간 미준수 시 패널티(적립금 차감)가 부여됩니다.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>영상은 최고 화질 또는 1080p 이상으로 촬영해 주세요.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-amber-800">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>2차 활용 기간은 1년이며, 이후 마케팅 활동은 제한됩니다.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
        )}
        </div>

        {/* 하단 고정 버튼 */}
        <div className={isPCView
          ? "sticky bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-6 z-40"
          : "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 p-4 pb-6 z-40"
        }>
          {existingApplication ? (
            <div className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-center">
              {existingApplication.status === 'pending' ? '검토중' :
               existingApplication.status === 'selected' ? '선정됨' :
               existingApplication.status === 'approved' ? '승인됨' :
               existingApplication.status === 'rejected' ? '미선정' :
               '지원 완료'}
            </div>
          ) : isDeadlinePassed ? (
            <div className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-center">
              모집 마감
            </div>
          ) : isFull ? (
            <div className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-center">
              모집 완료
            </div>
          ) : (
            <button
              onClick={handleApply}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              지원하기
            </button>
          )}
        </div>

        {/* 상품 상세 이미지 모달 */}
        {showDetailImage && campaign.product_detail_file_url && (
          <div
            className={isPCView
              ? "absolute inset-0 z-50 bg-black/90 flex items-center justify-center"
              : "fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            }
            onClick={() => setShowDetailImage(false)}
          >
            <button
              onClick={() => setShowDetailImage(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full z-10"
            >
              <X size={24} className="text-white" />
            </button>
            <div className="w-full h-full overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={campaign.product_detail_file_url}
                alt="상품 상세 이미지"
                className="w-full max-w-lg mx-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignDetailPage
