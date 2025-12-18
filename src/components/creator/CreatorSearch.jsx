import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  Search, Filter, Target, Gift, Calendar, TrendingUp,
  Loader2, X, ChevronDown, Instagram, Youtube, Hash
} from 'lucide-react'

const CreatorSearch = ({ onCampaignClick }) => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [appliedCampaignIds, setAppliedCampaignIds] = useState([])

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'planned', label: '기획형' },
    { id: 'oliveyoung', label: '올영세일' },
    { id: '4week_challenge', label: '4주챌린지' }
  ]

  const platforms = [
    { id: 'all', label: '전체' },
    { id: 'instagram', label: '인스타그램' },
    { id: 'youtube', label: '유튜브' },
    { id: 'tiktok', label: '틱톡' }
  ]

  useEffect(() => {
    loadCampaigns()
  }, [user])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, searchQuery, selectedCategory, selectedPlatform, sortBy, appliedCampaignIds])

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
    if (!amount) return '0원'
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const getCategoryColor = (type) => {
    switch (type) {
      case 'oliveyoung': return 'bg-green-100 text-green-700'
      case '4week_challenge': return 'bg-purple-100 text-purple-700'
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
      case 'instagram': return <Instagram size={12} />
      case 'youtube': return <Youtube size={12} />
      case 'tiktok': return <Hash size={12} />
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
    <div className="px-5 pt-4 pb-8">
      {/* 검색 바 */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="브랜드, 캠페인명으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
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

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 필터/정렬 바 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{filteredCampaigns.length}</span>개 캠페인
        </p>

        <div className="flex items-center gap-2">
          {/* 플랫폼 필터 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPlatform !== 'all' || showFilters
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter size={14} />
            필터
            {selectedPlatform !== 'all' && (
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
            )}
          </button>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 focus:outline-none"
          >
            <option value="latest">최신순</option>
            <option value="reward_high">보상 높은순</option>
            <option value="deadline">마감임박순</option>
          </select>
        </div>
      </div>

      {/* 추가 필터 패널 */}
      {showFilters && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">플랫폼</p>
          <div className="flex flex-wrap gap-2">
            {platforms.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedPlatform === platform.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 캠페인 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-base font-bold text-gray-700 mb-2">
            {searchQuery ? '검색 결과가 없습니다' : '모집 중인 캠페인이 없습니다'}
          </h3>
          <p className="text-sm text-gray-400">
            {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 캠페인이 곧 등록됩니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign, idx) => {
            const isApplied = appliedCampaignIds.includes(campaign.id)
            const daysLeft = getDaysUntilDeadline(campaign.application_deadline)

            return (
              <div
                key={campaign.id || idx}
                className={`bg-white p-4 rounded-2xl shadow-sm border transition-all ${
                  isApplied
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-100 hover:shadow-md hover:border-purple-200 cursor-pointer'
                }`}
                onClick={() => !isApplied && onCampaignClick?.(campaign)}
              >
                <div className="flex gap-4">
                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Gift size={28} className="text-gray-300" />
                      </div>
                    )}
                    {isApplied && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xs font-bold">지원완료</span>
                      </div>
                    )}
                    {!isApplied && daysLeft !== null && daysLeft <= 3 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        D-{daysLeft}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      {/* 브랜드 & 카테고리 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-400 truncate">
                          {campaign.brand}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getCategoryColor(campaign.campaign_type)}`}>
                          {getCategoryLabel(campaign.campaign_type)}
                        </span>
                      </div>

                      {/* 제목 */}
                      <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                        {campaign.title}
                      </h4>

                      {/* 플랫폼 & 마감일 */}
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        {Array.isArray(campaign.target_platforms) && campaign.target_platforms.slice(0, 2).map((p, i) => (
                          <span key={i} className="flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.5 rounded">
                            {getPlatformIcon(p)}
                            <span className="capitalize">{p}</span>
                          </span>
                        ))}
                        {campaign.application_deadline && (
                          <span className="flex items-center gap-0.5">
                            <Calendar size={11} />
                            {new Date(campaign.application_deadline).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric'
                            })} 마감
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 보상 & 버튼 */}
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-extrabold text-gray-900 text-lg">
                        {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                      </span>
                      {!isApplied && (
                        <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">
                          지원하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CreatorSearch
