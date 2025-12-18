import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  Search, Filter, Target, Gift, Calendar, TrendingUp,
  Loader2, X, ChevronDown, Instagram, Youtube, Hash,
  Clock, Users, Flame, Sparkles, Gem
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

// 특별 태그 로직
const getSpecialTags = (campaign, applicationCounts = {}) => {
  const tags = []
  const now = new Date()

  // 마감임박: 24시간 이내
  if (campaign.application_deadline) {
    const deadline = new Date(campaign.application_deadline)
    const hoursLeft = (deadline - now) / (1000 * 60 * 60)
    if (hoursLeft <= 24 && hoursLeft > 0) {
      tags.push({ id: 'urgent', label: '마감임박', color: 'bg-red-500 text-white', icon: Flame })
    }
  }

  // 신규: 48시간 이내 생성
  if (campaign.created_at) {
    const created = new Date(campaign.created_at)
    const hoursAgo = (now - created) / (1000 * 60 * 60)
    if (hoursAgo <= 48) {
      tags.push({ id: 'new', label: '신규', color: 'bg-violet-500 text-white', icon: Sparkles })
    }
  }

  // 프리미엄: 보상 50만원 이상
  const reward = campaign.creator_points_override || campaign.reward_points || 0
  if (reward >= 500000) {
    tags.push({ id: 'premium', label: '프리미엄', color: 'bg-pink-500 text-white', icon: Gem })
  }

  // HOT: 지원자 수 상위 (임시로 total_slots 대비 남은 슬롯 기준)
  if (campaign.total_slots && campaign.remaining_slots !== undefined) {
    const filled = campaign.total_slots - campaign.remaining_slots
    if (filled >= campaign.total_slots * 0.8) {
      tags.push({ id: 'hot', label: 'HOT', color: 'bg-amber-500 text-white', icon: Flame })
    }
  }

  return tags.slice(0, 2) // 최대 2개 태그
}

const CreatorSearch = ({ onCampaignClick }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [visibleCampaigns, setVisibleCampaigns] = useState([])
  const [appliedCampaignIds, setAppliedCampaignIds] = useState([])
  const [hasMore, setHasMore] = useState(true)

  // 무한 스크롤용 ref
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: 'all', label: '전체', emoji: '🎯' },
    { id: 'planned', label: '기획형', emoji: '🎬' },
    { id: 'oliveyoung', label: '올영세일', emoji: '💚' },
    { id: '4week_challenge', label: '4주챌린지', emoji: '🔥' }
  ]

  const platforms = [
    { id: 'all', label: '전체' },
    { id: 'instagram', label: '인스타그램', icon: Instagram },
    { id: 'youtube', label: '유튜브', icon: Youtube },
    { id: 'tiktok', label: '틱톡', icon: Hash }
  ]

  useEffect(() => {
    loadCampaigns()
  }, [user])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, searchQuery, selectedCategory, selectedPlatform, sortBy, appliedCampaignIds])

  // 필터 변경 시 visibleCampaigns 리셋
  useEffect(() => {
    setVisibleCampaigns(filteredCampaigns.slice(0, ITEMS_PER_PAGE))
    setHasMore(filteredCampaigns.length > ITEMS_PER_PAGE)
  }, [filteredCampaigns])

  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreCampaigns()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading, visibleCampaigns.length])

  const loadMoreCampaigns = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    setTimeout(() => {
      const currentLength = visibleCampaigns.length
      const nextItems = filteredCampaigns.slice(currentLength, currentLength + ITEMS_PER_PAGE)

      if (nextItems.length > 0) {
        setVisibleCampaigns(prev => [...prev, ...nextItems])
        setHasMore(currentLength + nextItems.length < filteredCampaigns.length)
      } else {
        setHasMore(false)
      }

      setLoadingMore(false)
    }, 300)
  }, [loadingMore, hasMore, visibleCampaigns.length, filteredCampaigns])

  const loadCampaigns = async () => {
    try {
      setLoading(true)

      // 사용자 지원 내역 가져오기
      if (user) {
        const { data: apps } = await supabase
          .from('applications')
          .select('campaign_id')
          .eq('user_id', user.id)

        setAppliedCampaignIds(apps?.map(a => a.campaign_id) || [])
      }

      // 모든 캠페인 로드
      const campaignsData = await database.campaigns.getAll()
      const now = new Date()

      const activeCampaigns = campaignsData?.filter(campaign => {
        if (campaign.status !== 'active') return false
        if (campaign.approval_status === 'pending_approval') return false

        if (campaign.application_deadline) {
          const deadline = new Date(campaign.application_deadline)
          deadline.setHours(23, 59, 59, 999)
          if (now > deadline) return false
        }

        if (campaign.remaining_slots !== undefined && campaign.remaining_slots <= 0) return false

        return true
      }) || []

      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error('캠페인 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCampaigns = () => {
    let result = [...campaigns]

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.title?.toLowerCase().includes(query) ||
        c.brand?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.campaign_type === selectedCategory)
    }

    // 플랫폼 필터
    if (selectedPlatform !== 'all') {
      result = result.filter(c => {
        if (Array.isArray(c.target_platforms)) {
          return c.target_platforms.includes(selectedPlatform)
        }
        return true
      })
    }

    // 정렬
    switch (sortBy) {
      case 'reward_high':
        result.sort((a, b) => {
          const rewardA = a.creator_points_override || a.reward_points || 0
          const rewardB = b.creator_points_override || b.reward_points || 0
          return rewardB - rewardA
        })
        break
      case 'deadline':
        result.sort((a, b) => {
          const deadlineA = a.application_deadline ? new Date(a.application_deadline) : new Date('2099-12-31')
          const deadlineB = b.application_deadline ? new Date(b.application_deadline) : new Date('2099-12-31')
          return deadlineA - deadlineB
        })
        break
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
    }

    setFilteredCampaigns(result)
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0P'
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만P`
    }
    return `${amount.toLocaleString()}P`
  }

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-emerald-100 text-emerald-700'
      case '4week_challenge': return 'bg-violet-100 text-violet-700'
      case 'planned': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올영세일'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      default: return '일반'
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return <Instagram size={14} className="text-pink-500" />
      case 'youtube': return <Youtube size={14} className="text-red-500" />
      case 'tiktok': return <Hash size={14} className="text-gray-800" />
      default: return null
    }
  }

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="pb-8">
      {/* 헤더 섹션 */}
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900 mb-1">캠페인 찾기</h2>
        <p className="text-sm text-gray-500">나에게 맞는 캠페인을 찾아보세요</p>
      </div>

      {/* 검색 바 */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="브랜드, 캠페인명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 탭 - 상단 고정 스타일 */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 필터/정렬 바 */}
      <div className="px-5 flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{filteredCampaigns.length}</span>개 캠페인
        </p>

        <div className="flex items-center gap-2">
          {/* 플랫폼 필터 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedPlatform !== 'all' || showFilters
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter size={14} />
            필터
            {selectedPlatform !== 'all' && (
              <span className="w-1.5 h-1.5 bg-violet-600 rounded-full"></span>
            )}
          </button>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <option value="latest">최신순</option>
            <option value="reward_high">보상 높은순</option>
            <option value="deadline">마감임박순</option>
          </select>
        </div>
      </div>

      {/* 추가 필터 패널 */}
      {showFilters && (
        <div className="mx-5 bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">플랫폼 선택</p>
          <div className="flex flex-wrap gap-2">
            {platforms.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedPlatform === platform.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                }`}
              >
                {platform.icon && <platform.icon size={14} />}
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 캠페인 목록 - 카드형 UI */}
      <div className="px-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <Target size={56} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '모집 중인 캠페인이 없습니다'}
            </h3>
            <p className="text-sm text-gray-400">
              {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 캠페인이 곧 등록됩니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCampaigns.map((campaign, idx) => {
              const isApplied = appliedCampaignIds.includes(campaign.id)
              const daysLeft = getDaysUntilDeadline(campaign.application_deadline)
              const specialTags = getSpecialTags(campaign)
              const reward = campaign.creator_points_override || campaign.reward_points

              return (
                <div
                  key={campaign.id || idx}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                    isApplied
                      ? 'border-gray-200 opacity-70'
                      : 'border-gray-100 hover:shadow-lg hover:border-violet-200 cursor-pointer active:scale-[0.99]'
                  }`}
                  onClick={() => !isApplied && onCampaignClick?.(campaign)}
                >
                  {/* 썸네일 - 16:9 비율 */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Gift size={48} className="text-gray-300" />
                      </div>
                    )}

                    {/* 상단 뱃지 영역 */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      {/* 특별 태그 */}
                      <div className="flex gap-1.5">
                        {specialTags.map(tag => (
                          <span
                            key={tag.id}
                            className={`${tag.color} text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}
                          >
                            <tag.icon size={10} />
                            {tag.label}
                          </span>
                        ))}
                      </div>

                      {/* D-Day 뱃지 */}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                          daysLeft <= 3
                            ? 'bg-red-500 text-white'
                            : 'bg-black/60 text-white backdrop-blur-sm'
                        }`}>
                          {daysLeft === 0 ? '오늘 마감' : `D-${daysLeft}`}
                        </span>
                      )}
                    </div>

                    {/* 지원완료 오버레이 */}
                    {isApplied && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full">
                          지원완료
                        </span>
                      </div>
                    )}

                    {/* 모집 인원 */}
                    {campaign.total_slots && (
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Users size={12} />
                        {campaign.remaining_slots || campaign.total_slots}명 모집
                      </div>
                    )}
                  </div>

                  {/* 캠페인 정보 */}
                  <div className="p-4">
                    {/* 브랜드 & 카테고리 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400">
                        {campaign.brand}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryColor(campaign.campaign_type)}`}>
                        {getCategoryLabel(campaign.campaign_type)}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h4 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-3">
                      {campaign.title}
                    </h4>

                    {/* 플랫폼 & 마감일 */}
                    <div className="flex items-center gap-3 mb-4">
                      {Array.isArray(campaign.target_platforms) && campaign.target_platforms.slice(0, 3).map((p, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
                          {getPlatformIcon(p)}
                        </span>
                      ))}
                      {campaign.application_deadline && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {new Date(campaign.application_deadline).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })} 마감
                        </span>
                      )}
                    </div>

                    {/* 보상 & 지원 버튼 */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">리워드</p>
                        <p className="text-xl font-extrabold text-violet-600">
                          {formatCurrency(reward)}
                        </p>
                      </div>
                      {!isApplied && (
                        <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-sm">
                          지원하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 무한 스크롤 트리거 */}
            <div ref={loadMoreRef} className="py-4">
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                  <span className="ml-2 text-sm text-gray-500">더 불러오는 중...</span>
                </div>
              )}
              {!hasMore && visibleCampaigns.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  모든 캠페인을 확인했습니다
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorSearch
