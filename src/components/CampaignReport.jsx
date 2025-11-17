import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Eye, Heart, MessageCircle, Share, ExternalLink, Download, BarChart3, TrendingUp, Calendar, Award } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CampaignReport = () => {
  const { campaignId, reportToken } = useParams()
  const { language } = useLanguage()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (campaignId && reportToken) {
      loadReportData()
    }
  }, [campaignId, reportToken])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('レポートデータ読み込み開始:', { campaignId, reportToken })
      
      // レポートトークン検証とキャンペーンデータ読み込み
      let reportData
      try {
        reportData = await database.campaigns.getReport(campaignId, reportToken)
        
        if (!reportData) {
          throw new Error('レポートデータが見つかりません')
        }
        
        console.log('レポートデータ読み込み成功:', reportData)
      } catch (reportError) {
        console.error('レポートデータ読み込みエラー:', reportError)
        
        // フォールバック: 直接キャンペーンと申請データを取得
        try {
          const campaignData = await database.campaigns.get(campaignId)
          if (!campaignData) {
            throw new Error('キャンペーンが見つかりません')
          }
          
          const applicationsData = await database.applications.getByCampaign(campaignId)
          
          reportData = {
            campaign: campaignData,
            applications: applicationsData || [],
            analytics: {}
          }
          
          console.log('フォールバックでデータ取得成功')
        } catch (fallbackError) {
          console.error('フォールバックデータ取得も失敗:', fallbackError)
          setError(language === 'ko' 
            ? '유효하지 않은 보고서 링크입니다.'
            : '無効なレポートリンクです。'
          )
          return
        }
      }
      
      setCampaign(reportData.campaign)
      setApplications(reportData.applications || [])
      
      // 分析データを生成（既存のanalyticsがない場合）
      if (!reportData.analytics || Object.keys(reportData.analytics).length === 0) {
        const generatedAnalytics = generateAnalytics(reportData.applications || [])
        setAnalytics(generatedAnalytics)
      } else {
        setAnalytics(reportData.analytics)
      }
      
    } catch (error) {
      console.error('レポートデータ読み込みエラー:', error)
      setError(language === 'ko' 
        ? '보고서 데이터를 불러올 수 없습니다.'
        : 'レポートデータを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  // 分析データ生成関数
  const generateAnalytics = (applicationsData) => {
    const totalApplications = applicationsData.length
    const approvedApplications = applicationsData.filter(app => app.status === 'approved').length
    const completedApplications = applicationsData.filter(app => app.status === 'completed').length
    
    return {
      totalApplications,
      approvedApplications,
      completedApplications,
      approvalRate: totalApplications > 0 ? (approvedApplications / totalApplications * 100).toFixed(1) : 0,
      completionRate: approvedApplications > 0 ? (completedApplications / approvedApplications * 100).toFixed(1) : 0
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ko-KR').format(num || 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      content_uploaded: '#3b82f6',
      points_requested: '#8b5cf6',
      completed: '#059669',
      cancelled: '#6b7280'
    }
    return colors[status] || colors.pending
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: language === 'ko' ? '검토중' : '審査中',
      approved: language === 'ko' ? '승인됨' : '承認済み',
      rejected: language === 'ko' ? '거절됨' : '拒否',
      content_uploaded: language === 'ko' ? '컨텐츠 업로드됨' : 'コンテンツアップロード済み',
      points_requested: language === 'ko' ? '포인트 요청됨' : 'ポイント要請済み',
      completed: language === 'ko' ? '완료' : '完了',
      cancelled: language === 'ko' ? '취소됨' : 'キャンセル済み'
    }
    return statusMap[status] || status
  }

  // 통계 데이터 계산
  const totalApplications = applications.length
  const approvedApplications = applications.filter(app => app.status === 'approved').length
  const completedApplications = applications.filter(app => app.status === 'completed').length
  const totalReach = applications.reduce((sum, app) => {
    return sum + (app.instagram_followers || 0) + (app.tiktok_followers || 0) + (app.youtube_subscribers || 0)
  }, 0)

  // 상태별 분포 데이터
  const statusDistribution = Object.entries(
    applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({
    name: getStatusText(status),
    value: count,
    color: getStatusColor(status)
  }))

  // 플랫폼별 분포 데이터
  const platformData = [
    {
      platform: 'Instagram',
      users: applications.filter(app => app.instagram_url).length,
      totalFollowers: applications.reduce((sum, app) => sum + (app.instagram_followers || 0), 0)
    },
    {
      platform: 'TikTok',
      users: applications.filter(app => app.tiktok_url).length,
      totalFollowers: applications.reduce((sum, app) => sum + (app.tiktok_followers || 0), 0)
    },
    {
      platform: 'YouTube',
      users: applications.filter(app => app.youtube_url).length,
      totalFollowers: applications.reduce((sum, app) => sum + (app.youtube_subscribers || 0), 0)
    }
  ].filter(item => item.users > 0)

  // 일별 신청 데이터
  const dailyApplications = applications.reduce((acc, app) => {
    const date = new Date(app.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const dailyData = Object.entries(dailyApplications)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR', { month: 'short', day: 'numeric' }),
      applications: count
    }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ko' ? '보고서를 불러오는 중...' : 'レポートを読み込み中...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {language === 'ko' ? '캠페인을 찾을 수 없습니다' : 'キャンペーンが見つかりません'}
          </h2>
          <p className="text-gray-600">
            {language === 'ko' ? '유효하지 않은 보고서 링크입니다.' : '無効なレポートリンクです。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {campaign.title}
              </h1>
              <p className="text-xl text-purple-600 font-medium mb-2">
                {campaign.brand}
              </p>
              <p className="text-gray-600">
                {language === 'ko' ? '캠페인 성과 보고서' : 'キャンペーン成果レポート'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(campaign.reward_amount)}
              </div>
              <p className="text-sm text-gray-500">
                {language === 'ko' ? '보상 금액' : '報酬金額'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(campaign.created_at)}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{totalApplications} {language === 'ko' ? '명 지원' : '人応募'}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>{completedApplications} {language === 'ko' ? '명 완료' : '人完了'}</span>
            </Badge>
          </div>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {language === 'ko' ? '총 지원자' : '総応募者'}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">{formatNumber(totalApplications)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {language === 'ko' ? '승인률' : '承認率'}
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {totalApplications > 0 ? Math.round((approvedApplications / totalApplications) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {language === 'ko' ? '총 리치' : '総リーチ'}
                  </p>
                  <p className="text-3xl font-bold text-purple-600">{formatNumber(totalReach)}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {language === 'ko' ? '완료율' : '完了率'}
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {approvedApplications > 0 ? Math.round((completedApplications / approvedApplications) * 100) : 0}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 일별 신청 추이 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>
                {language === 'ko' ? '일별 신청 추이' : '日別応募推移'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 상태별 분포 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>
                {language === 'ko' ? '지원자 상태 분포' : '応募者ステータス分布'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 플랫폼별 분석 */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>
              {language === 'ko' ? '플랫폼별 분석' : 'プラットフォーム別分析'}
            </CardTitle>
            <CardDescription>
              {language === 'ko' ? '각 SNS 플랫폼별 참여자 수와 총 팔로워 수' : '各SNSプラットフォーム別参加者数と総フォロワー数'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platformData.map((platform) => (
                <div key={platform.platform} className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{platform.platform}</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{platform.users}</p>
                      <p className="text-sm text-gray-500">
                        {language === 'ko' ? '참여자' : '参加者'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-purple-600">{formatNumber(platform.totalFollowers)}</p>
                      <p className="text-sm text-gray-500">
                        {language === 'ko' ? '총 팔로워' : '総フォロワー'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 승인된 크리에이터 목록 */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle>
              {language === 'ko' ? '승인된 크리에이터' : '承認されたクリエイター'}
            </CardTitle>
            <CardDescription>
              {language === 'ko' ? '캠페인에 참여 중인 크리에이터들의 정보' : 'キャンペーンに参加中のクリエイター情報'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.filter(app => app.status === 'approved' || app.status === 'content_uploaded' || app.status === 'completed').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {language === 'ko' ? '승인된 크리에이터가 없습니다' : '承認されたクリエイターはいません'}
              </div>
            ) : (
              <div className="space-y-4">
                {applications
                  .filter(app => app.status === 'approved' || app.status === 'content_uploaded' || app.status === 'completed')
                  .map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{application.user_name}</h3>
                          <Badge variant="outline">
                            {getStatusText(application.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          {application.instagram_url && (
                            <span className="flex items-center space-x-1">
                              <span>IG:</span>
                              <span className="font-medium">{formatNumber(application.instagram_followers || 0)}</span>
                            </span>
                          )}
                          {application.tiktok_url && (
                            <span className="flex items-center space-x-1">
                              <span>TT:</span>
                              <span className="font-medium">{formatNumber(application.tiktok_followers || 0)}</span>
                            </span>
                          )}
                          {application.youtube_url && (
                            <span className="flex items-center space-x-1">
                              <span>YT:</span>
                              <span className="font-medium">{formatNumber(application.youtube_subscribers || 0)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* SNS 링크 표시 */}
                      {application.sns_urls && Object.keys(application.sns_urls).some(key => application.sns_urls[key]) && (
                        <div className="flex space-x-2">
                          {Object.entries(application.sns_urls).map(([platform, url]) => (
                            url && (
                              <Button
                                key={platform}
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(url, '_blank')}
                                className="flex items-center space-x-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="capitalize">{platform}</span>
                              </Button>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 캠페인 정보 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>
              {language === 'ko' ? '캠페인 정보' : 'キャンペーン情報'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ko' ? '캠페인 설명' : 'キャンペーン説明'}
                </h3>
                <p className="text-gray-600">{campaign.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">
                  {language === 'ko' ? '대상 플랫폼' : '対象プラットフォーム'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.platforms && campaign.platforms.map((platform) => (
                    <Badge key={platform} variant="outline">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            {language === 'ko' 
              ? '이 보고서는 CNEC Japan에서 생성되었습니다.'
              : 'このレポートはCNEC Japanで生成されました。'
            }
          </p>
          <p className="mt-1">
            {language === 'ko' 
              ? `생성일: ${formatDate(new Date().toISOString())}`
              : `生成日: ${formatDate(new Date().toISOString())}`
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default CampaignReport
