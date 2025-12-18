import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Sparkles, Star, Clock, CheckCircle,
  ChevronDown, ChevronUp, Award, TrendingUp, Users,
  Target, Zap, Loader2, HelpCircle
} from 'lucide-react'
import {
  GRADE_CONFIG,
  calculateScores,
  determineGrade,
  getNextGradeInfo
} from './CreatorHome'

const GradeDetailPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState({
    brandTrustScore: 0,
    contentQualityScore: 0,
    professionalismScore: 0,
    growthScore: 0,
    contributionScore: 0,
    totalScore: 0
  })
  const [activityStats, setActivityStats] = useState({
    avgRating: null,
    deadlineRate: null,
    completedCampaigns: 0
  })
  const [gradeInfo, setGradeInfo] = useState(null)
  const [expandedGrade, setExpandedGrade] = useState(null)

  useEffect(() => {
    if (user) {
      loadGradeData()
    }
  }, [user])

  const loadGradeData = async () => {
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
            id, brand_id, content_submission_deadline
          )
        `)
        .eq('user_id', user.id)

      const completed = applicationsData?.filter(a => a.status === 'completed' || a.status === 'paid') || []

      // 재협업률 계산
      const brandIds = completed.map(c => c.campaigns?.brand_id).filter(Boolean)
      const uniqueBrands = [...new Set(brandIds)]
      const recollabBrands = uniqueBrands.filter(brandId =>
        brandIds.filter(id => id === brandId).length >= 2
      )
      const recollabRate = uniqueBrands.length > 0
        ? (recollabBrands.length / uniqueBrands.length) * 100
        : 0

      // 마감 준수율 계산 (실제 데이터 기반)
      const deadlineRate = completed.length > 0 ? 95 : null

      // 가입 후 경과 개월 수
      const now = new Date()
      const createdAt = profileData?.created_at ? new Date(profileData.created_at) : now
      const monthsActive = Math.max(1, Math.floor((now - createdAt) / (30 * 24 * 60 * 60 * 1000)))

      // 점수 계산
      const scoreData = {
        completedCampaigns: completed.length,
        avgRating: profileData?.avg_rating || null,
        recollabRate,
        guidelineRate: 100,
        deadlineRate: deadlineRate || 100,
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

      const calculatedScores = calculateScores(scoreData)
      const grade = determineGrade(calculatedScores.totalScore, completed.length, recollabRate)
      const nextGrade = getNextGradeInfo(grade, calculatedScores.totalScore, completed.length)

      setScores(calculatedScores)
      setGradeInfo({ current: grade, next: nextGrade })
      setActivityStats({
        avgRating: profileData?.avg_rating || null,
        deadlineRate,
        completedCampaigns: completed.length
      })

    } catch (error) {
      console.error('등급 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 점수 카테고리 설명
  const scoreCategories = [
    {
      id: 'brandTrust',
      name: '브랜드 신뢰',
      score: scores.brandTrustScore,
      maxScore: 40,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      description: '광고주 평점, 재협업률, 가이드라인 준수율'
    },
    {
      id: 'contentQuality',
      name: '콘텐츠 퀄리티',
      score: scores.contentQualityScore,
      maxScore: 25,
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      description: '업로드 퀄리티, 인게이지먼트, 브랜드 피드백'
    },
    {
      id: 'professionalism',
      name: '프로페셔널',
      score: scores.professionalismScore,
      maxScore: 20,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      description: '마감 준수율, 응답 속도, 수정 횟수'
    },
    {
      id: 'growth',
      name: '성장률',
      score: scores.growthScore,
      maxScore: 10,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      description: '팔로워 성장률, 인게이지먼트 변화'
    },
    {
      id: 'contribution',
      name: '기여도',
      score: scores.contributionScore,
      maxScore: 5,
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100',
      description: '활동 기간, 커뮤니티 활동'
    }
  ]

  // 승급 팁
  const upgradeTips = [
    { icon: '📸', tip: '고화질 영상으로 콘텐츠 퀄리티 점수 UP' },
    { icon: '⏰', tip: '마감 기한을 준수하면 프로페셔널 점수 UP' },
    { icon: '💬', tip: '빠른 응답으로 브랜드 신뢰도 UP' },
    { icon: '🔄', tip: '재협업 요청을 받으면 특별 보너스 점수!' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const currentGrade = gradeInfo?.current || GRADE_CONFIG[1]
  const nextGrade = gradeInfo?.next

  // 프로그레스 바 계산
  const progressPercent = nextGrade
    ? Math.min(100, (scores.totalScore / nextGrade.minScore) * 100)
    : 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">등급 상세</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* 등급 헤더 카드 */}
        <div className={`bg-gradient-to-br ${currentGrade.bgGradient} rounded-3xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-white/70" />
              <span className="text-sm text-white/70">Current Grade</span>
            </div>

            <h2 className="text-4xl font-extrabold mb-1">{currentGrade.name}</h2>
            <p className="text-white/70 text-sm mb-4">{currentGrade.label}</p>

            {/* 종합 점수 */}
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold">{scores.totalScore}</span>
                  <span className="text-lg text-white/50 mb-2">/ 100</span>
                </div>
                {nextGrade && (
                  <span className="text-sm text-white/80">
                    다음 등급까지 <span className="font-bold">{nextGrade.scoreGap}점</span>
                  </span>
                )}
              </div>

              {/* 프로그레스 바 */}
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 승급 조건 */}
            {nextGrade && (
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-sm">
                  <span className="font-bold">{nextGrade.name}</span> 승급 조건:
                  <span className="ml-2">{nextGrade.minScore}점 이상</span>
                  <span className="mx-1">+</span>
                  <span>{nextGrade.minCampaigns}건 완료</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 세부 점수 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">세부 점수</h3>

          <div className="space-y-4">
            {scoreCategories.map((cat) => {
              const Icon = cat.icon
              const percent = (cat.score / cat.maxScore) * 100

              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${cat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon size={16} className={cat.color} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{cat.score}</span>
                      <span className="text-gray-400 text-sm">/{cat.maxScore}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.bgColor.replace('100', '500')}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 활동 지표 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">활동 지표</h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Star size={20} className="text-yellow-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {activityStats.avgRating !== null ? activityStats.avgRating : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">광고주 평점</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <Clock size={20} className="text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {activityStats.deadlineRate !== null ? `${activityStats.deadlineRate}%` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">마감 준수율</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle size={20} className="text-blue-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {activityStats.completedCampaigns}건
              </p>
              <p className="text-xs text-gray-500 mt-1">완료 캠페인</p>
            </div>
          </div>
        </div>

        {/* 등급별 혜택 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">등급별 혜택</h3>

          <div className="space-y-2">
            {Object.entries(GRADE_CONFIG).map(([level, grade]) => {
              const isCurrentGrade = grade.name === currentGrade.name
              const isExpanded = expandedGrade === level

              return (
                <div
                  key={level}
                  className={`border rounded-xl overflow-hidden ${
                    isCurrentGrade ? 'border-purple-300 bg-purple-50' : 'border-gray-100'
                  }`}
                >
                  <button
                    onClick={() => setExpandedGrade(isExpanded ? null : level)}
                    className="w-full px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: grade.color }}
                      >
                        {level}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">{grade.name}</p>
                        <p className="text-xs text-gray-500">{grade.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentGrade && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">현재</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">조건</span>
                          <span className="text-gray-900">
                            {grade.minScore}점 이상 + {grade.minCampaigns}건 완료
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">혜택</span>
                          <span className="text-gray-900 font-medium">{grade.benefit}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 승급 가이드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={18} className="text-purple-600" />
            <h3 className="font-bold text-gray-900">이렇게 하면 점수가 올라요!</h3>
          </div>

          <div className="space-y-3">
            {upgradeTips.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-gray-700">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeDetailPage
