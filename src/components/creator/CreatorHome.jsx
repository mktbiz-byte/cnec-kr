import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  Star, DollarSign, FileText, Clock, ChevronRight,
  TrendingUp, Award, Zap, Gift, Target, Calendar,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react'

const CreatorHome = ({ onCampaignClick, onViewAllCampaigns }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    pendingEarnings: 0,
    activeCampaigns: 0,
    urgentCampaigns: 0,
    completedCampaigns: 0,
    totalPoints: 0
  })
  const [recommendedCampaigns, setRecommendedCampaigns] = useState([])
  const [applications, setApplications] = useState([])

  // 레벨 시스템
  const getLevelInfo = (points) => {
    if (points >= 5000) return { level: 5, name: '마스터 크리에이터', color: 'from-yellow-500 to-orange-500', next: null }
    if (points >= 2000) return { level: 4, name: '프로 크리에이터', color: 'from-purple-500 to-pink-500', next: 5000 }
    if (points >= 1000) return { level: 3, name: '성장 크리에이터', color: 'from-blue-500 to-indigo-500', next: 2000 }
    if (points >= 500) return { level: 2, name: '새싹 크리에이터', color: 'from-green-500 to-teal-500', next: 1000 }
    return { level: 1, name: '신규 크리에이터', color: 'from-gray-500 to-gray-600', next: 500 }
  }

  // 경험치 계산 (완료 캠페인 수 * 100 + 프로필 완성도 보너스)
  const calculateXP = (completedCount, profileComplete) => {
    let xp = completedCount * 100
    if (profileComplete) xp += 50
    return xp
  }

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // 프로필 가져오기
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // 지원 내역 가져오기
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (
            id, title, brand, image_url, reward_points,
            creator_points_override, application_deadline,
            content_submission_deadline, campaign_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(applicationsData || [])

      // 통계 계산
      const approved = applicationsData?.filter(a => a.status === 'approved' || a.status === 'selected') || []
      const completed = applicationsData?.filter(a => a.status === 'completed' || a.status === 'paid') || []
      const pending = applicationsData?.filter(a => a.status === 'pending') || []

      // 마감 임박 캠페인 (3일 이내)
      const now = new Date()
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const urgent = approved.filter(a => {
        const deadline = a.campaigns?.content_submission_deadline
        if (!deadline) return false
        const deadlineDate = new Date(deadline)
        return deadlineDate <= threeDaysLater && deadlineDate > now
      })

      // 정산 예정금 계산 (승인된 캠페인의 포인트 합계)
      const pendingEarnings = approved.reduce((sum, a) => {
        return sum + (a.campaigns?.creator_points_override || a.campaigns?.reward_points || 0)
      }, 0)

      setStats({
        pendingEarnings,
        activeCampaigns: approved.length,
        urgentCampaigns: urgent.length,
        completedCampaigns: completed.length,
        totalPoints: profileData?.total_points || 0
      })

      // 추천 캠페인 로드
      const campaignsData = await database.campaigns.getAll()
      const activeCampaigns = campaignsData?.filter(campaign => {
        if (campaign.status !== 'active') return false
        if (campaign.approval_status === 'pending_approval') return false

        // 이미 지원한 캠페인 제외
        const alreadyApplied = applicationsData?.some(a => a.campaign_id === campaign.id)
        if (alreadyApplied) return false

        // 마감일 체크
        if (campaign.application_deadline) {
          const deadline = new Date(campaign.application_deadline)
          deadline.setHours(23, 59, 59, 999)
          if (now > deadline) return false
        }

        if (campaign.remaining_slots !== undefined && campaign.remaining_slots <= 0) return false

        return true
      }) || []

      // 최신 캠페인 6개만
      setRecommendedCampaigns(activeCampaigns.slice(0, 6))

    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    if (amount >= 10000) {
      return `${Math.floor(amount / 10000)}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const levelInfo = getLevelInfo(stats.completedCampaigns * 100)
  const currentXP = calculateXP(stats.completedCampaigns, profile?.name && profile?.phone)
  const xpProgress = levelInfo.next ? (currentXP / levelInfo.next) * 100 : 100

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-5 pb-8">
      {/* Growth Card (Gamification) */}
      <div className={`bg-gradient-to-br ${levelInfo.color} rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden`}>
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Star size={100} />
        </div>
        <div className="absolute -bottom-4 -left-4 opacity-10 pointer-events-none">
          <Award size={80} />
        </div>

        <div className="relative z-10">
          {/* 레벨 배지 */}
          <div className="flex justify-between items-start mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              <Zap size={12} />
              LEVEL {levelInfo.level}. {levelInfo.name}
            </span>
          </div>

          {/* 인사말 */}
          <h2 className="text-2xl font-bold mb-1">
            {profile?.name || '크리에이터'}님,
          </h2>
          <p className="text-white/80 mb-5 text-sm">
            {stats.activeCampaigns > 0
              ? `진행 중인 캠페인이 ${stats.activeCampaigns}개 있어요!`
              : '새로운 캠페인에 도전해보세요!'}
          </p>

          {/* 경험치 바 */}
          <div className="w-full bg-black/20 h-2.5 rounded-full mb-2 overflow-hidden">
            <div
              className="bg-white h-2.5 rounded-full relative transition-all duration-500"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/50"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-white/70 font-medium">
            <span>현재 경험치 {currentXP}</span>
            <span>{levelInfo.next ? `목표 ${levelInfo.next}` : '최고 레벨!'}</span>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* 정산 예정금 */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-medium">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign size={14} className="text-blue-600" />
            </div>
            정산 예정금
          </div>
          <div className="text-xl font-extrabold text-gray-900">
            {formatCurrency(stats.pendingEarnings)}
          </div>
        </div>

        {/* 진행 캠페인 */}
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-medium">
            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-green-600" />
            </div>
            진행 캠페인
          </div>
          <div className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            {stats.activeCampaigns}건
            {stats.urgentCampaigns > 0 && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
                마감임박 {stats.urgentCampaigns}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 진행 중인 캠페인 미리보기 */}
      {stats.activeCampaigns > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-gray-900">진행 중인 캠페인</h3>
            <button
              onClick={() => onViewAllCampaigns?.('my')}
              className="text-xs text-purple-600 font-medium flex items-center gap-0.5"
            >
              전체보기 <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {applications
              .filter(a => a.status === 'approved' || a.status === 'selected')
              .slice(0, 2)
              .map((app, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate('/mypage')}
                >
                  {app.campaigns?.image_url ? (
                    <img
                      src={app.campaigns.image_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                      <Target size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {app.campaigns?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status === 'approved' ? '승인됨' : '선정됨'}
                      </span>
                      {app.campaigns?.content_submission_deadline && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(app.campaigns.content_submission_deadline).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })} 마감
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 추천 캠페인 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">추천 캠페인</h3>
          <button
            onClick={() => onViewAllCampaigns?.('search')}
            className="text-sm text-gray-400 font-medium hover:text-gray-600 flex items-center gap-0.5"
          >
            전체보기 <ChevronRight size={16} />
          </button>
        </div>

        {recommendedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">현재 모집 중인 캠페인이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendedCampaigns.map((campaign, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
                onClick={() => onCampaignClick?.(campaign)}
              >
                {/* 썸네일 */}
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <Gift size={24} className="text-gray-300" />
                  </div>
                )}

                {/* 정보 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400 truncate">
                        {campaign.brand}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getCategoryColor(campaign.campaign_type)}`}>
                        {getCategoryLabel(campaign.campaign_type)}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                      {campaign.title}
                    </h4>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-extrabold text-gray-900 text-lg">
                      {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                    </span>
                    <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">
                      지원하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorHome
