import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, ArrowLeft, Download, FileText, BarChart3,
  Calendar, DollarSign, Users, Target, TrendingUp,
  Instagram, Youtube, Hash, ExternalLink, Play,
  CheckCircle, Clock, AlertCircle, Eye, Share2,
  Building, Mail, Phone, MapPin, Star, Award,
  PieChart, Activity, Zap, Globe
} from 'lucide-react'

const CampaignFinalReport = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [reportData, setReportData] = useState({
    totalApplications: 0,
    approvedCreators: 0,
    completedCreators: 0,
    totalReward: 0,
    videoStats: {
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      other: 0
    },
    demographics: {},
    performance: {}
  })

  useEffect(() => {
    if (campaignId) {
      loadData()
    }
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 캠페인 정보 로드
      const campaignData = await database.campaigns.getById(campaignId)
      if (!campaignData) {
        setError('キャンペーンが見つかりません。')
        return
      }
      setCampaign(campaignData)
      
      // 해당 캠페인의 신청서들 로드
      const applicationsData = await database.applications.getByCampaignId(campaignId)
      setApplications(applicationsData || [])
      
      // 신청자들의 프로필 정보 로드
      const profiles = {}
      for (const app of applicationsData || []) {
        const profile = await database.userProfiles.getByUserId(app.user_id)
        if (profile) {
          profiles[app.user_id] = profile
        }
      }
      setUserProfiles(profiles)
      
      // 보고서 데이터 계산
      calculateReportData(applicationsData, profiles, campaignData)
      
    } catch (error) {
      console.error('Load data error:', error)
      setError('データの読み込みに실패했습니다。')
    } finally {
      setLoading(false)
    }
  }

  const calculateReportData = (apps, profiles, campaignData) => {
    const totalApplications = apps.length
    const approvedCreators = apps.filter(app => app.status === 'approved' || app.status === 'completed').length
    const completedCreators = apps.filter(app => app.status === 'completed').length
    const totalReward = completedCreators * (campaignData.reward_amount || 0)
    
    // 영상 통계
    const videoStats = {
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      other: 0
    }
    
    apps.forEach(app => {
      if (app.video_links) {
        if (app.video_links.instagram_url) videoStats.instagram++
        if (app.video_links.tiktok_url) videoStats.tiktok++
        if (app.video_links.youtube_url) videoStats.youtube++
        if (app.video_links.other_url) videoStats.other++
      }
    })
    
    // 인구통계학적 데이터
    const demographics = {
      ageGroups: {},
      skinTypes: {},
      prefectures: {},
      totalFollowers: {
        instagram: 0,
        tiktok: 0,
        youtube: 0
      }
    }
    
    apps.forEach(app => {
      const profile = profiles[app.user_id]
      if (profile) {
        // 연령대
        const ageGroup = profile.age ? `${Math.floor(profile.age / 10) * 10}代` : '不明'
        demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1
        
        // 피부타입
        const skinType = profile.skin_type || '不明'
        demographics.skinTypes[skinType] = (demographics.skinTypes[skinType] || 0) + 1
        
        // 지역
        const prefecture = profile.prefecture || '不明'
        demographics.prefectures[prefecture] = (demographics.prefectures[prefecture] || 0) + 1
        
        // 팔로워 수 합계 (완료된 크리에이터만)
        if (app.status === 'completed') {
          demographics.totalFollowers.instagram += profile.instagram_followers || 0
          demographics.totalFollowers.tiktok += profile.tiktok_followers || 0
          demographics.totalFollowers.youtube += profile.youtube_followers || 0
        }
      }
    })
    
    setReportData({
      totalApplications,
      approvedCreators,
      completedCreators,
      totalReward,
      videoStats,
      demographics,
      performance: {
        conversionRate: totalApplications > 0 ? (approvedCreators / totalApplications * 100).toFixed(1) : 0,
        completionRate: approvedCreators > 0 ? (completedCreators / approvedCreators * 100).toFixed(1) : 0,
        avgFollowers: {
          instagram: completedCreators > 0 ? Math.round(demographics.totalFollowers.instagram / completedCreators) : 0,
          tiktok: completedCreators > 0 ? Math.round(demographics.totalFollowers.tiktok / completedCreators) : 0,
          youtube: completedCreators > 0 ? Math.round(demographics.totalFollowers.youtube / completedCreators) : 0
        }
      }
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(num || 0)
  }

  const exportReport = () => {
    // PDF 또는 Excel 형태로 보고서 내보내기
    const reportContent = `
キャンペーン最終報告書

캠페인명: ${campaign?.title}
ブランド: ${campaign?.brand}
期間: ${new Date(campaign?.start_date).toLocaleDateString('ja-JP')} - ${new Date(campaign?.end_date).toLocaleDateString('ja-JP')}

=== 실행 결과 ===
총 응모자 수: ${reportData.totalApplications}명
승인된 크리에이터: ${reportData.approvedCreators}명
완료된 크리에이터: ${reportData.completedCreators}명
총 지급 보상: ${formatCurrency(reportData.totalReward)}

=== 영상 업로드 현황 ===
Instagram: ${reportData.videoStats.instagram}개
TikTok: ${reportData.videoStats.tiktok}개
YouTube: ${reportData.videoStats.youtube}개
기타: ${reportData.videoStats.other}개

=== 성과 지표 ===
승인률: ${reportData.performance.conversionRate}%
완료율: ${reportData.performance.completionRate}%
평균 Instagram 팔로워: ${formatNumber(reportData.performance.avgFollowers.instagram)}명
평균 TikTok 팔로워: ${formatNumber(reportData.performance.avgFollowers.tiktok)}명
평균 YouTube 구독자: ${formatNumber(reportData.performance.avgFollowers.youtube)}명
    `
    
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${campaign?.title || 'campaign'}_final_report.txt`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">보고서を生成中...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">キャンペーンが見つかりません</h3>
        <Button onClick={() => navigate('/campaigns-manage')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          キャンペーン목록に돌아가기
        </Button>
      </div>
    )
  }

  const completedApplications = applications.filter(app => app.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => navigate('/campaigns-manage')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            キャンペーン목록に돌아가기
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            보고서出力
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="h-4 w-4 mr-2" />
            印刷
          </Button>
        </div>
      </div>

      {/* Campaign Header */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{campaign.title}</CardTitle>
              <CardDescription className="text-xl text-purple-600 font-medium">
                {campaign.brand}
              </CardDescription>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(campaign.start_date).toLocaleDateString('ja-JP')} - {new Date(campaign.end_date).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>最終報告書</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(campaign.reward_amount)}
              </div>
              <div className="text-sm text-gray-600">単価보상</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総지원者数</p>
                <p className="text-3xl font-bold text-blue-600">{reportData.totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료크리에이터</p>
                <p className="text-3xl font-bold text-green-600">{reportData.completedCreators}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総支払보상</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(reportData.totalReward)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료率</p>
                <p className="text-3xl font-bold text-orange-600">{reportData.performance.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="creators">크리에이터</TabsTrigger>
          <TabsTrigger value="content">コンテンツ</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>パフォーマンス指標</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">승인率</span>
                  <span className="font-bold">{reportData.performance.conversionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">완료率</span>
                  <span className="font-bold">{reportData.performance.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">平均Instagram フォロワー</span>
                  <span className="font-bold">{formatNumber(reportData.performance.avgFollowers.instagram)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">平均TikTok フォロワー</span>
                  <span className="font-bold">{formatNumber(reportData.performance.avgFollowers.tiktok)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">平均YouTube 登録者</span>
                  <span className="font-bold">{formatNumber(reportData.performance.avgFollowers.youtube)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Video Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>動画配信プラットフォーム</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="text-sm">Instagram</span>
                  </div>
                  <span className="font-bold">{reportData.videoStats.instagram}本</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-black" />
                    <span className="text-sm">TikTok</span>
                  </div>
                  <span className="font-bold">{reportData.videoStats.tiktok}本</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <span className="text-sm">YouTube</span>
                  </div>
                  <span className="font-bold">{reportData.videoStats.youtube}本</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">その他</span>
                  </div>
                  <span className="font-bold">{reportData.videoStats.other}本</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>合計</span>
                  <span>{Object.values(reportData.videoStats).reduce((a, b) => a + b, 0)}本</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>参加者属性</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">年齢層</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.demographics.ageGroups).map(([age, count]) => (
                      <div key={age} className="flex items-center justify-between">
                        <span className="text-sm">{age}</span>
                        <span className="font-medium">{count}名</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">肌タイプ</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.demographics.skinTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type}</span>
                        <span className="font-medium">{count}名</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">地域分布 (上位5位)</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.demographics.prefectures)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([prefecture, count]) => (
                        <div key={prefecture} className="flex items-center justify-between">
                          <span className="text-sm">{prefecture}</span>
                          <span className="font-medium">{count}名</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>완료크리에이터목록</CardTitle>
              <CardDescription>
                キャンペーンを완료した크리에이터の상세情報
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedApplications.map((application) => {
                  const profile = userProfiles[application.user_id]
                  
                  return (
                    <Card key={application.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{profile?.name || 'N/A'}</h3>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{profile?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{profile?.age || 'N/A'}歳 / {profile?.skin_type || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>{profile?.prefecture || 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              {profile?.instagram_url && (
                                <div className="flex items-center space-x-2">
                                  <Instagram className="h-4 w-4 text-pink-500" />
                                  <span>{formatNumber(profile.instagram_followers || 0)} フォロワー</span>
                                </div>
                              )}
                              {profile?.tiktok_url && (
                                <div className="flex items-center space-x-2">
                                  <Hash className="h-4 w-4 text-black" />
                                  <span>{formatNumber(profile.tiktok_followers || 0)} フォロワー</span>
                                </div>
                              )}
                              {profile?.youtube_url && (
                                <div className="flex items-center space-x-2">
                                  <Youtube className="h-4 w-4 text-red-500" />
                                  <span>{formatNumber(profile.youtube_followers || 0)} 登録者</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(campaign.reward_amount)}
                            </div>
                            <div className="text-sm text-gray-600">支払済み</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {completedApplications.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">완료크리에이터がいません</h3>
                    <p className="text-gray-500">まだキャンペーンを완료した크리에이터がいません。</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>업로드済みコンテンツ</CardTitle>
              <CardDescription>
                크리에이터が업로드した動画コンテンツ목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {completedApplications.map((application) => {
                  const profile = userProfiles[application.user_id]
                  const videoLinks = application.video_links
                  
                  if (!videoLinks || !Object.values(videoLinks).some(link => link && link !== videoLinks.notes)) {
                    return null
                  }
                  
                  return (
                    <div key={application.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                          <Activity className="h-3 w-3 mr-1" />
                          완료
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {videoLinks.instagram_url && (
                          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Instagram className="h-6 w-6 text-pink-500" />
                              <div>
                                <p className="font-medium">Instagram</p>
                                <p className="text-sm text-gray-600">リール動画</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={videoLinks.instagram_url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4 mr-2" />
                                視聴
                              </a>
                            </Button>
                          </div>
                        )}
                        
                        {videoLinks.tiktok_url && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Hash className="h-6 w-6 text-black" />
                              <div>
                                <p className="font-medium">TikTok</p>
                                <p className="text-sm text-gray-600">ショート動画</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={videoLinks.tiktok_url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4 mr-2" />
                                視聴
                              </a>
                            </Button>
                          </div>
                        )}
                        
                        {videoLinks.youtube_url && (
                          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Youtube className="h-6 w-6 text-red-500" />
                              <div>
                                <p className="font-medium">YouTube</p>
                                <p className="text-sm text-gray-600">動画</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={videoLinks.youtube_url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4 mr-2" />
                                視聴
                              </a>
                            </Button>
                          </div>
                        )}
                        
                        {videoLinks.other_url && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Globe className="h-6 w-6 text-blue-500" />
                              <div>
                                <p className="font-medium">その他</p>
                                <p className="text-sm text-gray-600">外部リンク</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={videoLinks.other_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                開く
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {videoLinks.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{videoLinks.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {completedApplications.filter(app => app.video_links && Object.values(app.video_links).some(link => link && link !== app.video_links?.notes)).length === 0 && (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">업로드済みコンテンツがありません</h3>
                    <p className="text-gray-500">まだ크리에이터からの動画업로드がありません。</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>キャンペーン成果</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">総リーチ予想</span>
                  <span className="font-bold text-blue-600">
                    {formatNumber(reportData.demographics.totalFollowers.instagram + reportData.demographics.totalFollowers.tiktok + reportData.demographics.totalFollowers.youtube)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">コンテンツ制作数</span>
                  <span className="font-bold text-green-600">
                    {Object.values(reportData.videoStats).reduce((a, b) => a + b, 0)}本
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">参加크리에이터数</span>
                  <span className="font-bold text-purple-600">{reportData.completedCreators}名</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">投資収益率 (ROI)</span>
                  <span className="font-bold text-orange-600">
                    {reportData.totalReward > 0 ? 
                      `${((reportData.demographics.totalFollowers.instagram + reportData.demographics.totalFollowers.tiktok + reportData.demographics.totalFollowers.youtube) / reportData.totalReward * 100).toFixed(1)}%` 
                      : 'N/A'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>推奨事項</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">プラットフォーム戦略</p>
                  <p className="text-sm text-blue-700">
                    {reportData.videoStats.instagram > reportData.videoStats.tiktok ? 
                      'Instagramでの反応が良好です。今後もInstagram重視の戦略を推奨します。' :
                      'TikTokでの参加率が高いです。TikTok向けコンテンツの強化を検討してください。'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">ターゲット層</p>
                  <p className="text-sm text-green-700">
                    {Object.keys(reportData.demographics.ageGroups)[0] || '20代'}の参加が多く、
                    この年齢層への訴求が効果的です。
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">次回改善点</p>
                  <p className="text-sm text-purple-700">
                    완료率{reportData.performance.completionRate}%は
                    {parseFloat(reportData.performance.completionRate) > 80 ? '優秀' : '改善の余地があります'}。
                    {parseFloat(reportData.performance.completionRate) <= 80 && 'フォローアップの強化を推奨します。'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default CampaignFinalReport
