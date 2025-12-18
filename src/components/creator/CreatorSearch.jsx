import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  Search, Filter, Target, Gift, Calendar,
  Loader2, X, ChevronDown, Instagram, Youtube, Hash,
  Clock, Users, Flame, Heart, ChevronRight
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

const CreatorSearch = ({ onCampaignClick }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [visibleCampaigns, setVisibleCampaigns] = useState([])
  const [appliedCampaignIds, setAppliedCampaignIds] = useState([])
  const [hasMore, setHasMore] = useState(true)

  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  // 카테고리 탭 (고정형, 스크롤 없음)
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'planned', label: '기획형' },
    { id: 'oliveyoung', label: '올영세일' },
    { id: '4week_challenge', label: '4주챌린지' }
  ]

  useEffect(() => {
    loadCampaigns()
  }, [user])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, searchQuery, selectedCategory, sortBy, appliedCampaignIds])

  useEffect(() => {
    setVisibleCampaigns(filteredCampaigns.slice(0, ITEMS_PER_PAGE))
    setHasMore(filteredCampaigns.length > ITEMS_PER_PAGE)
  }, [filteredCampaigns])

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

      if (user) {
        const { data: apps } = await supabase
          .from('applications')
          .select('campaign_id')
          .eq('user_id', user.id)

        setAppliedCampaignIds(apps?.map(a => a.campaign_id) || [])
      }

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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.title?.toLowerCase().includes(query) ||
        c.brand?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'all') {
      result = result.filter(c => c.campaign_type === selectedCategory)
    }

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

  const formatPrice = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'oliveyoung': return '올리브영'
      case '4week_challenge': return '4주챌린지'
      case 'planned': return '기획형'
      case 'jasaMall': return '자사몰'
      default: return '기획형'
    }
  }

  const getCategoryStyle = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-emerald-500 text-white'
      case '4week_challenge': return 'bg-violet-500 text-white'
      case 'planned': return 'bg-blue-500 text-white'
      case 'jasaMall': return 'bg-cyan-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  const isUrgent = (deadline) => {
    const days = getDaysUntilDeadline(deadline)
    return days !== null && days <= 3 && days >= 0
  }

  const formatDeadlineRange = (deadline) => {
    if (!deadline) return ''
    const date = new Date(deadline)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="pb-20">
      {/* 카테고리 탭 - 고정형 (스크롤 없음) */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex justify-between px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedCategory === cat.id
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          선착순 마감 제외
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
        >
          <option value="latest">추천순</option>
          <option value="reward_high">보상 높은순</option>
          <option value="deadline">마감임박순</option>
        </select>
      </div>

      {/* 캠페인 목록 - 컴팩트 리스트 */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <Target size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">모집 중인 캠페인이 없습니다</p>
          </div>
        ) : (
          visibleCampaigns.map((campaign, idx) => {
            const isApplied = appliedCampaignIds.includes(campaign.id)
            const reward = campaign.creator_points_override || campaign.reward_points || 0
            const originalPrice = campaign.product_price || reward * 1.5
            const paybackPercent = originalPrice > 0 ? Math.round((reward / originalPrice) * 100) : 0

            return (
              <div
                key={campaign.id || idx}
                className={`flex gap-3 p-4 bg-white ${
                  isApplied ? 'opacity-60' : 'active:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => !isApplied && onCampaignClick?.(campaign)}
              >
                {/* 썸네일 - 정사각형 */}
                <div className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                  {campaign.image_url ? (
                    <img
                      src={campaign.image_url}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift size={32} className="text-gray-300" />
                    </div>
                  )}
                  {/* 하트 버튼 */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* 캠페인 정보 */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* 카테고리 태그 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getCategoryStyle(campaign.campaign_type)}`}>
                      {getCategoryLabel(campaign.campaign_type)}
                    </span>
                  </div>

                  {/* 마감임박 + 남은 인원 */}
                  {(isUrgent(campaign.application_deadline) || campaign.remaining_slots) && (
                    <div className="flex items-center gap-2 mb-1">
                      {isUrgent(campaign.application_deadline) && (
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                          <Flame size={12} className="text-orange-500" />
                          마감임박
                        </span>
                      )}
                      {campaign.remaining_slots && (
                        <span className="text-xs text-orange-500 font-medium">
                          • {campaign.remaining_slots}명 남음
                        </span>
                      )}
                    </div>
                  )}

                  {/* 제목 */}
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug">
                    {campaign.title}
                  </h4>

                  {/* 페이백 정보 */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-bold text-blue-600">{paybackPercent}%</span>
                    <span className="text-xs text-gray-400">페이백</span>
                  </div>

                  {/* 가격 */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(reward)}
                    </span>
                    {originalPrice > reward && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(Math.round(originalPrice))}
                      </span>
                    )}
                  </div>

                  {/* 기간 */}
                  {campaign.application_deadline && (
                    <p className="text-xs text-gray-400 mt-1">
                      ~{formatDeadlineRange(campaign.application_deadline)}까지
                    </p>
                  )}

                  {/* 지원완료 표시 */}
                  {isApplied && (
                    <span className="mt-2 text-xs text-gray-500 font-medium">지원완료</span>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* 무한 스크롤 트리거 */}
        <div ref={loadMoreRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          )}
          {!hasMore && visibleCampaigns.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-4">
              모든 캠페인을 확인했습니다
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreatorSearch
