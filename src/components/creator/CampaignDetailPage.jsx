import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  ArrowLeft, Calendar, Gift, Instagram, Youtube, Hash,
  CheckCircle, AlertCircle, Loader2, Star, FileText,
  Share2, Heart, Truck, Camera, ExternalLink, Users,
  Clock, Package, DollarSign, ChevronDown, ChevronUp,
  AlertTriangle, Info
} from 'lucide-react'

const CampaignDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [existingApplication, setExistingApplication] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showAllDetails, setShowAllDetails] = useState(false)
  const [liked, setLiked] = useState(false)

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

  const formatPrice = (amount) => {
    if (!amount) return '-'
    return `${Number(amount).toLocaleString()}원`
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

  const handleApply = () => {
    if (!user) {
      navigate('/login', { state: { from: `/campaign/${id}` } })
      return
    }
    navigate(`/campaign/${id}/apply`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">{error || '캠페인을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  const reward = campaign.creator_points_override || campaign.reward_points || 0
  const dDay = getDDay(campaign.application_deadline)
  const isDeadlinePassed = dDay === '마감'
  const isFull = campaign.remaining_slots !== null && campaign.remaining_slots <= 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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

      {/* 메인 콘텐츠 */}
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
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {campaign.title}
          </h2>

          {/* 상품명 */}
          {campaign.product_name && (
            <p className="text-sm text-gray-600 mb-3">{campaign.product_name}</p>
          )}

          {/* 원고료 & 모집인원 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-violet-500" />
              <span className="text-2xl font-bold text-violet-600">{formatPrice(reward)}</span>
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
            {/* 상품 상세 이미지 */}
            {campaign.product_detail_file_url && (
              <img
                src={campaign.product_detail_file_url}
                alt="상품 상세"
                className="w-full rounded-xl"
              />
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

        {/* 제품 특징 / 핵심 포인트 (AI 가이드) */}
        {(campaign.product_features || campaign.product_key_points) && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={18} />
                촬영 가이드
              </h3>

              {campaign.product_features && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">제품 특징</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {campaign.product_features}
                    </p>
                  </div>
                </div>
              )}

              {campaign.product_key_points && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">핵심 소구 포인트</p>
                  <div className="bg-violet-50 rounded-xl p-4">
                    <p className="text-sm text-violet-800 leading-relaxed whitespace-pre-line">
                      {campaign.product_key_points}
                    </p>
                  </div>
                </div>
              )}

              {campaign.creator_autonomy && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  <span>크리에이터 자율 촬영 가능</span>
                </div>
              )}
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* AI 생성 가이드 */}
        {campaign.ai_generated_guide && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={18} />
                AI 촬영 가이드
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {campaign.ai_generated_guide}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-100" />
          </>
        )}

        {/* 올리브영 전용 정보 */}
        {campaign.campaign_type === 'oliveyoung' && (
          <>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Gift size={18} />
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

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 z-40">
        <div className="max-w-md mx-auto">
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
      </div>
    </div>
  )
}

export default CampaignDetailPage
