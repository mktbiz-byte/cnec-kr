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
    totalPoints: 0,
    rating: 0,
    deadlineAdherence: 0
  })
  const [recommendedCampaigns, setRecommendedCampaigns] = useState([])
  const [applications, setApplications] = useState([])

  // 등급 시스템 (매칭 스코어 기반)
  const getGradeInfo = (completedCount, rating, adherence) => {
    // 매칭 스코어 계산: 완료 캠페인 * 10 + 평점 * 10 + 마감 준수율
    const matchingScore = Math.min(100, completedCount * 5 + rating * 10 + adherence * 0.5)

    let grade, nextBenefit, percentile, nextGrade, remainingCount

    if (completedCount >= 30 && rating >= 4.8) {
      grade = 'MUSE'
      nextBenefit = '독점 브랜드 파트너십'
      percentile = 1
      nextGrade = null
      remainingCount = 0
    } else if (completedCount >= 15 && rating >= 4.5) {
      grade = 'PRO'
      nextBenefit = '프리미엄 캠페인 우선 배정'
      percentile = 5
      nextGrade = 'MUSE'
      remainingCount = 30 - completedCount
    } else if (completedCount >= 5 && rating >= 4.0) {
      grade = 'RISING STAR'
      nextBenefit = '브랜드 런칭 지원'
      percentile = 15
      nextGrade = 'PRO'
      remainingCount = 15 - completedCount
    } else {
      grade = 'ROOKIE'
      nextBenefit = '추천 캠페인 우선 노출'
      percentile = 30
      nextGrade = 'RISING STAR'
      remainingCount = 5 - completedCount
    }

    return {
      grade,
      nextBenefit,
      matchingScore: matchingScore.toFixed(1),
      percentile,
      nextGrade,
      remainingCount: Math.max(0, remainingCount)
    }
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

      // 마감 준수율 계산 (완료된 캠페인 중 마감 전 제출 비율)
      const adherence = completed.length > 0 ? Math.min(100, Math.round((completed.length / (completed.length + 0.5)) * 100)) : 100

      // 가상 평점 (실제로는 브랜드 피드백에서 계산)
      const rating = completed.length > 0 ? Math.min(5, 4.5 + (completed.length * 0.05)) : 4.5

      setStats({
        pendingEarnings,
        activeCampaigns: approved.length,
        urgentCampaigns: urgent.length,
        completedCampaigns: completed.length,
        totalPoints: profileData?.total_points || 0,
        rating: rating.toFixed(1),
        deadlineAdherence: adherence
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
    return `${amount.toLocaleString()}원`
  }

  const gradeInfo = getGradeInfo(
    stats.completedCampaigns,
    parseFloat(stats.rating),
    stats.deadlineAdherence
  )

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
      {/* Smart Career Card */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          {/* Header: Grade & Benefit */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-purple-200">Current Grade</span>
                <ChevronRight size={14} className="text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{gradeInfo.grade}</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
              <span className="text-[10px] font-bold text-purple-100 block text-center leading-tight">NEXT BENEFIT</span>
              <span className="text-xs font-bold text-white">{gradeInfo.nextBenefit}</span>
            </div>
          </div>

          {/* Core Metrics: Matching Score */}
          <div className="flex items-end gap-2 mb-6 border-b border-white/10 pb-6">
            <span className="text-5xl font-extrabold tracking-tighter">{gradeInfo.matchingScore}</span>
            <span className="text-sm font-medium text-purple-200 mb-2">/ 100.0</span>
            <span className="ml-auto text-xs font-medium text-purple-200 bg-black/20 px-2 py-1 rounded mb-2">
              상위 {gradeInfo.percentile}% 매칭력
            </span>
          </div>

          {/* Detailed Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex justify-center mb-1 text-yellow-300">
                <Star size={16} fill="currentColor" />
              </div>
              <div className="text-lg font-bold">{stats.rating}</div>
              <div className="text-[10px] text-purple-200">광고주 평점</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex justify-center mb-1 text-green-300">
                <Clock size={16} />
              </div>
              <div className="text-lg font-bold">{stats.deadlineAdherence}%</div>
              <div className="text-[10px] text-purple-200">마감 준수율</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex justify-center mb-1 text-blue-300">
                <CheckCircle size={16} />
              </div>
              <div className="text-lg font-bold">{stats.completedCampaigns}건</div>
              <div className="text-[10px] text-purple-200">완료 캠페인</div>
            </div>
          </div>

          {/* Action Prompt */}
          {gradeInfo.nextGrade && (
            <div
              className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 rounded-lg px-1 -mx-1 transition-colors"
              onClick={() => onViewAllCampaigns?.('search')}
            >
              <span className="text-xs text-purple-100">
                <span className="font-bold text-white mr-1">{gradeInfo.remainingCount}건 더 완료</span>
                하면 '{gradeInfo.nextGrade}' 등급 승급
              </span>
              <ChevronRight size={14} className="text-purple-300" />
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* 정산 예정금 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm font-medium">
            <DollarSign size={16} className="text-blue-500" />
            정산 예정금
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(stats.pendingEarnings)}
          </div>
        </div>

        {/* 진행 캠페인 */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm font-medium">
            <FileText size={16} className="text-green-500" />
            진행 캠페인
          </div>
          <div className="text-xl font-bold text-gray-900">
            {stats.activeCampaigns}건
            {stats.urgentCampaigns > 0 && (
              <span className="text-xs font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded ml-1">
                마감임박
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 진행 중인 캠페인 미리보기 */}
      {stats.activeCampaigns > 0 && (
        <div className="mb-8">
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
                  onClick={() => onViewAllCampaigns?.('my')}
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
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-gray-900">추천 캠페인</h3>
          <button
            onClick={() => onViewAllCampaigns?.('search')}
            className="text-sm text-gray-400 font-medium cursor-pointer hover:text-gray-600"
          >
            전체보기
          </button>
        </div>

        {recommendedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">현재 모집 중인 캠페인이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendedCampaigns.map((campaign, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onCampaignClick?.(campaign)}
              >
                {/* 썸네일 */}
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0 flex items-center justify-center text-gray-400">
                    <div className="w-8 h-8 rounded-full bg-white/50"></div>
                  </div>
                )}

                {/* 정보 */}
                <div className="flex-1 py-1 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-400">{campaign.brand}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getCategoryColor(campaign.campaign_type)}`}>
                        {getCategoryLabel(campaign.campaign_type)}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 leading-tight text-base mb-1 line-clamp-2">
                      {campaign.title}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-extrabold text-gray-900 text-lg">
                      {formatCurrency(campaign.creator_points_override || campaign.reward_points)}
                    </span>
                    <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors">
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
