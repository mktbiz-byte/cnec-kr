import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  DollarSign, FileText, ChevronRight,
  Gift, Target, Loader2, Sparkles
} from 'lucide-react'

// 등급 설정 (PRD 기준)
export const GRADE_CONFIG = {
  1: {
    name: 'FRESH',
    label: '새싹 크리에이터',
    color: '#10B981',
    bgGradient: 'from-emerald-500 to-teal-600',
    minScore: 0,
    minCampaigns: 0,
    benefit: '첫 캠페인 가이드 제공'
  },
  2: {
    name: 'GLOW',
    label: '빛나기 시작하는 단계',
    color: '#3B82F6',
    bgGradient: 'from-blue-500 to-indigo-600',
    minScore: 40,
    minCampaigns: 3,
    benefit: '캠페인 추천 알림'
  },
  3: {
    name: 'BLOOM',
    label: '본격적으로 피어나는 중',
    color: '#8B5CF6',
    bgGradient: 'from-violet-500 to-purple-600',
    minScore: 60,
    minCampaigns: 10,
    benefit: '원고비 +10% 프리미엄'
  },
  4: {
    name: 'ICONIC',
    label: '브랜드가 먼저 찾는 크리에이터',
    color: '#EC4899',
    bgGradient: 'from-pink-500 to-rose-600',
    minScore: 80,
    minCampaigns: 30,
    benefit: '원고비 +20% & 직접 제안'
  },
  5: {
    name: 'MUSE',
    label: '크넥 대표 뮤즈',
    color: '#F59E0B',
    bgGradient: 'from-amber-400 to-orange-500',
    minScore: 95,
    minCampaigns: 50,
    benefit: '전담 매니저 & +30%'
  }
}

// 종합 점수 산정 함수 (PRD 기준) - export for reuse
export const calculateScores = (data) => {
  const {
    completedCampaigns,
    avgRating = 4.5,
    recollabRate = 0,
    guidelineRate = 100,
    deadlineRate = 100,
    avgResponseTime = 2,
    revisionCount = 0,
    engagementRate = 5,
    qualityScore = 4,
    brandFeedback = 4,
    followerGrowth = 10,
    engagementChange = 0,
    monthsActive = 1,
    communityActivity = 0
  } = data

  // 1. 브랜드 신뢰 점수 (40점)
  const brandRatingScore = (avgRating / 5) * 15
  const recollabScore = Math.min((recollabRate / 50) * 15, 15)
  const guidelineScore = (guidelineRate / 100) * 10
  const brandTrustScore = brandRatingScore + recollabScore + guidelineScore

  // 2. 콘텐츠 퀄리티 (25점)
  const uploadQualityScore = qualityScore * 2
  const engagementScore = Math.min((engagementRate / 10) * 10, 10)
  const feedbackScore = (brandFeedback / 5) * 5
  const contentQualityScore = uploadQualityScore + engagementScore + feedbackScore

  // 3. 프로페셔널리즘 (20점)
  const deadlineScore = (deadlineRate / 100) * 10
  let responseScore = 1
  if (avgResponseTime <= 2) responseScore = 5
  else if (avgResponseTime <= 6) responseScore = 4
  else if (avgResponseTime <= 12) responseScore = 3
  else if (avgResponseTime <= 24) responseScore = 2
  const revisionScore = Math.max(5 - revisionCount, 0)
  const professionalismScore = deadlineScore + responseScore + revisionScore

  // 4. 영향력 성장률 (10점)
  const followerScore = Math.min((followerGrowth / 20) * 5, 5)
  const engagementChangeScore = 2.5 + Math.min(Math.max(engagementChange * 5, -2.5), 2.5)
  const growthScore = followerScore + engagementChangeScore

  // 5. 크넥 기여도 (5점)
  const activityScore = Math.min((monthsActive / 12) * 3, 3)
  const communityScore = Math.min((communityActivity / 10) * 2, 2)
  const contributionScore = activityScore + communityScore

  // 총점
  const totalScore = brandTrustScore + contentQualityScore + professionalismScore + growthScore + contributionScore

  return {
    brandTrustScore: Math.round(brandTrustScore * 10) / 10,
    contentQualityScore: Math.round(contentQualityScore * 10) / 10,
    professionalismScore: Math.round(professionalismScore * 10) / 10,
    growthScore: Math.round(growthScore * 10) / 10,
    contributionScore: Math.round(contributionScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10
  }
}

// 등급 결정 함수 - export for reuse
export const determineGrade = (totalScore, completedCampaigns, recollabRate = 0) => {
  if (totalScore >= 80 && completedCampaigns >= 30 && recollabRate >= 30) {
    return GRADE_CONFIG[4] // ICONIC
  }
  if (totalScore >= 60 && completedCampaigns >= 10) {
    return GRADE_CONFIG[3] // BLOOM
  }
  if (totalScore >= 40 && completedCampaigns >= 3) {
    return GRADE_CONFIG[2] // GLOW
  }
  return GRADE_CONFIG[1] // FRESH
}

// 다음 등급 정보 계산 - export for reuse
export const getNextGradeInfo = (currentGrade, totalScore, completedCampaigns) => {
  const gradeLevel = Object.keys(GRADE_CONFIG).find(
    key => GRADE_CONFIG[key].name === currentGrade.name
  )
  const nextLevel = parseInt(gradeLevel) + 1

  if (nextLevel > 4) return null // MUSE는 초대제

  const nextGrade = GRADE_CONFIG[nextLevel]
  return {
    ...nextGrade,
    scoreGap: Math.max(0, nextGrade.minScore - totalScore),
    campaignGap: Math.max(0, nextGrade.minCampaigns - completedCampaigns)
  }
}

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
    totalScore: 0
  })
  const [gradeInfo, setGradeInfo] = useState(null)
  const [recommendedCampaigns, setRecommendedCampaigns] = useState([])
  const [applications, setApplications] = useState([])

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

      // 지원 내역 가져오기 (조인 대신 별도 쿼리로 수정)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (appsError) {
        console.error('Applications 로드 오류:', appsError)
      }

      // 캠페인 정보 별도 조회
      let applicationsData = appsData || []
      if (applicationsData.length > 0) {
        const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('id, title, brand, brand_id, image_url, reward_points, creator_points_override, application_deadline, content_submission_deadline, campaign_type, category')
            .in('id', campaignIds)

          // 캠페인 데이터 병합
          applicationsData = applicationsData.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null
          }))
        }
      }

      setApplications(applicationsData)

      // 통계 계산
      const approved = applicationsData?.filter(a => a.status === 'approved' || a.status === 'selected') || []
      const completed = applicationsData?.filter(a => a.status === 'completed' || a.status === 'paid') || []

      // 마감 임박 캠페인 (3일 이내)
      const now = new Date()
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const urgent = approved.filter(a => {
        const deadline = a.campaigns?.content_submission_deadline
        if (!deadline) return false
        const deadlineDate = new Date(deadline)
        return deadlineDate <= threeDaysLater && deadlineDate > now
      })

      // 정산 예정금 계산
      const pendingEarnings = approved.reduce((sum, a) => {
        return sum + (a.campaigns?.creator_points_override || a.campaigns?.reward_points || 0)
      }, 0)

      // 재협업률 계산
      const brandIds = completed.map(c => c.campaigns?.brand_id).filter(Boolean)
      const uniqueBrands = [...new Set(brandIds)]
      const recollabBrands = uniqueBrands.filter(brandId =>
        brandIds.filter(id => id === brandId).length >= 2
      )
      const recollabRate = uniqueBrands.length > 0
        ? (recollabBrands.length / uniqueBrands.length) * 100
        : 0

      // 가입 후 경과 개월 수
      const createdAt = profileData?.created_at ? new Date(profileData.created_at) : now
      const monthsActive = Math.max(1, Math.floor((now - createdAt) / (30 * 24 * 60 * 60 * 1000)))

      // 점수 계산
      const scoreData = {
        completedCampaigns: completed.length,
        avgRating: profileData?.avg_rating || 4.5,
        recollabRate,
        guidelineRate: 100,
        deadlineRate: completed.length > 0 ? 95 : 100,
        avgResponseTime: profileData?.avg_response_time || 2,
        revisionCount: 0,
        engagementRate: 5,
        qualityScore: 4,
        brandFeedback: 4,
        followerGrowth: 10,
        engagementChange: 0,
        monthsActive,
        communityActivity: 0
      }

      const scores = calculateScores(scoreData)

      // DB에 저장된 등급이 있으면 우선 사용, 없으면 계산된 등급 사용
      let grade
      if (profileData?.cnec_grade_level && GRADE_CONFIG[profileData.cnec_grade_level]) {
        grade = GRADE_CONFIG[profileData.cnec_grade_level]
      } else {
        grade = determineGrade(scores.totalScore, completed.length, recollabRate)
      }
      const nextGrade = getNextGradeInfo(grade, scores.totalScore, completed.length)

      setGradeInfo({ current: grade, next: nextGrade })

      setStats({
        pendingEarnings,
        activeCampaigns: approved.length,
        urgentCampaigns: urgent.length,
        completedCampaigns: completed.length,
        totalPoints: profileData?.points || 0,
        totalScore: scores.totalScore
      })

      // 추천 캠페인 로드
      const campaignsData = await database.campaigns.getAll()
      const activeCampaigns = campaignsData?.filter(campaign => {
        if (campaign.status !== 'active') return false
        if (campaign.approval_status === 'pending_approval') return false
        const alreadyApplied = applicationsData?.some(a => a.campaign_id === campaign.id)
        if (alreadyApplied) return false
        if (campaign.application_deadline) {
          const deadline = new Date(campaign.application_deadline)
          deadline.setHours(23, 59, 59, 999)
          if (now > deadline) return false
        }
        // remaining_slots이 숫자이고 0 이하인 경우에만 필터링 (null/undefined는 무제한으로 처리)
        if (typeof campaign.remaining_slots === 'number' && campaign.remaining_slots <= 0) return false
        return true
      }) || []

      setRecommendedCampaigns(activeCampaigns.slice(0, 6))

    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0P'
    return `${amount.toLocaleString()}P`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const currentGrade = gradeInfo?.current || GRADE_CONFIG[1]
  const nextGrade = gradeInfo?.next

  // 프로그레스 바 계산
  const progressPercent = nextGrade
    ? Math.min(100, (stats.totalScore / nextGrade.minScore) * 100)
    : 100

  return (
    <div className="px-5 pt-5 pb-8">
      {/* 간소화된 등급 카드 */}
      <div
        className={`bg-gradient-to-br ${currentGrade.bgGradient} rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
        onClick={() => navigate('/my/grade')}
      >
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          {/* Header: Grade */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-white/70" />
            <span className="text-sm font-medium text-white/70">Current Grade</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-1">{currentGrade.name}</h2>
          <p className="text-sm text-white/60">{currentGrade.label}</p>

          {/* Total Score + Progress Bar */}
          <div className="mt-5 mb-4">
            <div className="flex items-end justify-between mb-2">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold tracking-tighter">{stats.totalScore}</span>
                <span className="text-base font-medium text-white/50 mb-1">/ 100</span>
              </div>
              {nextGrade && (
                <span className="text-xs text-white/70">
                  다음 등급까지 <span className="font-bold text-white">{nextGrade.scoreGap}점</span>
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 승급 안내 */}
          {nextGrade && (
            <p className="text-sm text-white/80 mb-4">
              <span className="font-bold text-white">
                {nextGrade.campaignGap > 0
                  ? `${nextGrade.campaignGap}건 더 완료`
                  : `${nextGrade.scoreGap}점 더 획득`
                }
              </span>
              하면 <span className="font-bold text-white">'{nextGrade.name}'</span> 승급
            </p>
          )}

          {/* 등급 상세보기 버튼 */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 text-sm font-medium text-white/90 bg-white/10 px-3 py-1.5 rounded-lg">
              등급 상세보기 <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats - 클릭 이벤트 추가 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* 정산 예정금 카드 - 클릭 시 /my/points로 이동 */}
        <div
          className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
          onClick={() => navigate('/my/points')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm font-medium">
                <DollarSign size={16} className="text-blue-500" />
                정산 예정금
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.pendingEarnings)}
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </div>

        {/* 진행 캠페인 카드 - 클릭 시 /my/applications로 이동 */}
        <div
          className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
          onClick={() => navigate('/my/applications')}
        >
          <div className="flex items-center justify-between">
            <div>
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
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </div>
      </div>

      {/* 진행 중인 캠페인 미리보기 */}
      {stats.activeCampaigns > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-gray-900">진행 중인 캠페인</h3>
            <button
              onClick={() => navigate('/my/applications')}
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
                  onClick={() => navigate('/my/applications')}
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
            onClick={() => navigate('/campaigns')}
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
                onClick={() => navigate(`/campaign/${campaign.id}`)}
              >
                {campaign.image_url ? (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0 flex items-center justify-center text-gray-400">
                    <Gift size={24} />
                  </div>
                )}

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
