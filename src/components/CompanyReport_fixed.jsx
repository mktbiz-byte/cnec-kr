import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { database, supabase } from '../lib/supabase_enhanced'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Download, Eye, BarChart3, PieChart, TrendingUp, 
  Users, Target, Calendar, DollarSign, FileText, 
  ExternalLink, Share2, Instagram, Youtube, Hash,
  CheckCircle, Clock, AlertCircle, Building
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CompanyReport = () => {
  const { campaignId } = useParams()
  const [searchParams] = useSearchParams()
  const accessToken = searchParams.get('token')
  
  const [company, setCompany] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [snsUploads, setSnsUploads] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')

  useEffect(() => {
    if (campaignId) {
      loadCompanyData()
    } else {
      setError('キャンペーンIDが無効です。')
      setLoading(false)
    }
  }, [campaignId, selectedPeriod, selectedCampaign])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 토큰 검증 생략 - 관리자 권한으로 접근
      
      // 회사 전체 보고서 데이터 로드 (향상된 함수 사용)
      const reportData = await database.companies.getCompanyFullReport(campaignId)
      
      setCompany(reportData.company)
      setCampaigns(reportData.campaigns || [])
      setApplications(reportData.applications || [])
      setSnsUploads(reportData.snsUploads || {})
      
      // 분석 데이터 생성
      generateAnalytics(reportData.campaigns || [], reportData.applications || [], reportData.snsUploads || {})
      
    } catch (error) {
      console.error('Load company data error:', error)
      setError(error.message || 'データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const generateAnalytics = (campaignsData, applicationsData, snsUploadsData) => {
    // 기간 필터링
    let filteredApplications = applicationsData
    if (selectedPeriod !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filteredApplications = applicationsData.filter(app => 
        new Date(app.created_at) >= startDate
      )
    }
    
    // 캠페인 필터링
    if (selectedCampaign !== 'all') {
      filteredApplications = filteredApplications.filter(app => 
        app.campaign_id === selectedCampaign
      )
    }
    
    // 기본 통계
    const totalApplications = filteredApplications.length
    const approvedApplications = filteredApplications.filter(app => app.status === 'approved').length
    const completedApplications = filteredApplications.filter(app => app.status === 'completed').length
    const totalRewardPaid = filteredApplications
      .filter(app => app.status === 'completed')
      .reduce((sum, app) => sum + (app.campaigns?.reward_amount || 0), 0)
    
    // 상태별 분포
    const statusDistribution = [
      { name: '待機中', value: filteredApplications.filter(app => app.status === 'pending').length, color: '#fbbf24' },
      { name: '承認済み', value: approvedApplications, color: '#10b981' },
      { name: '完了', value: completedApplications, color: '#3b82f6' },
      { name: '拒否', value: filteredApplications.filter(app => app.status === 'rejected').length, color: '#ef4444' }
    ]
    
    // 일별 신청 추이 (최근 30일)
    const dailyApplications = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayApplications = filteredApplications.filter(app => 
        app.created_at.split('T')[0] === dateStr
      ).length
      
      dailyApplications.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        applications: dayApplications
      })
    }
    
    // 캠페인별 성과
    const campaignPerformance = campaignsData.map(campaign => {
      const campaignApps = filteredApplications.filter(app => app.campaign_id === campaign.id)
      const campaignSnsUploads = snsUploadsData[campaign.id] || []
      
      // SNS 플랫폼별 업로드 수 계산
      const snsStats = {
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        other: 0
      }
      
      campaignSnsUploads.forEach(upload => {
        if (upload.video_links) {
          if (upload.video_links.instagram_url) snsStats.instagram++
          if (upload.video_links.tiktok_url) snsStats.tiktok++
          if (upload.video_links.youtube_url) snsStats.youtube++
          if (upload.video_links.other_url) snsStats.other++
        }
      })
      
      return {
        id: campaign.id,
        title: campaign.title,
        totalApplications: campaignApps.length,
        approvedApplications: campaignApps.filter(app => app.status === 'approved').length,
        completedApplications: campaignApps.filter(app => app.status === 'completed').length,
        conversionRate: campaignApps.length > 0 ? 
          (campaignApps.filter(app => app.status === 'approved').length / campaignApps.length * 100).toFixed(1) : 0,
        snsStats
      }
    })
    
    // 인플루언서 분석
    const influencerAnalysis = filteredApplications
      .filter(app => app.user_profiles)
      .map(app => ({
        userId: app.user_id,
        name: app.user_profiles.name,
        instagramFollowers: app.user_profiles.instagram_followers || 0,
        tiktokFollowers: app.user_profiles.tiktok_followers || 0,
        youtubeFollowers: app.user_profiles.youtube_followers || 0,
        status: app.status,
        campaignTitle: app.campaigns?.title
      }))
    
    // SNS 업로드 통계
    const snsUploadStats = {
      total: 0,
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      other: 0
    }
    
    // 모든 캠페인의 SNS 업로드 집계
    Object.values(snsUploadsData).forEach(uploads => {
      uploads.forEach(upload => {
        if (upload.video_links) {
          if (upload.video_links.instagram_url) {
            snsUploadStats.instagram++
            snsUploadStats.total++
          }
          if (upload.video_links.tiktok_url) {
            snsUploadStats.tiktok++
            snsUploadStats.total++
          }
          if (upload.video_links.youtube_url) {
            snsUploadStats.youtube++
            snsUploadStats.total++
          }
          if (upload.video_links.other_url) {
            snsUploadStats.other++
            snsUploadStats.total++
          }
        }
      })
    })
    
    setAnalytics({
      totalApplications,
      approvedApplications,
      completedApplications,
      totalRewardPaid,
      conversionRate: totalApplications > 0 ? (approvedApplications / totalApplications * 100).toFixed(1) : 0,
      completionRate: approvedApplications > 0 ? (completedApplications / approvedApplications * 100).toFixed(1) : 0,
      statusDistribution,
      dailyApplications,
      campaignPerformance,
      influencerAnalysis,
      snsUploadStats
    })
  }

  const exportReportToExcel = async () => {
    try {
      const data = applications.map(app => ({
        'キャンペーンID': app.campaign_id,
        'キャンペーンタイトル': app.campaigns?.title || '',
        'ユーザーID': app.user_id,
        'ユーザー名': app.user_profiles?.name || '',
        '状態': app.status,
        '応募日': new Date(app.created_at).toLocaleDateString('ko-KR'),
        '更新日': new Date(app.updated_at).toLocaleDateString('ko-KR'),
        'Instagram フォロワー': app.user_profiles?.instagram_followers || 0,
        'TikTok フォロワー': app.user_profiles?.tiktok_followers || 0,
        'YouTube フォロワー': app.user_profiles?.youtube_followers || 0,
        'SNS Instagram': app.video_links?.instagram_url || '',
        'SNS TikTok': app.video_links?.tiktok_url || '',
        'SNS YouTube': app.video_links?.youtube_url || '',
        'SNS その他': app.video_links?.other_url || ''
      }))
      
      const filename = `${company?.name || 'company'}_report_${new Date().toISOString().split('T')[0]}.csv`
      
      // CSV 생성
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      // 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
    } catch (error) {
      console.error('Export error:', error)
      setError('レポートのエクスポートに失敗しました。')
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待機中' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '承認済み' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '拒否' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: '完了' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'キャンセル' }
    }
    
    const style = statusStyles[status] || statusStyles.pending
    
    return (
      <Badge className={`${style.bg} ${style.text}`}>
        {style.label}
      </Badge>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">レポートを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                アクセスエラー
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {company?.name} キャンペーンレポート
              </h1>
              <p className="text-gray-600">
                キャンペーンの成果と分析データを確認できます
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={exportReportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              レポートダウンロード
            </Button>
          </div>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>期間</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全期間</SelectItem>
                    <SelectItem value="7d">過去7日</SelectItem>
                    <SelectItem value="30d">過去30日</SelectItem>
                    <SelectItem value="90d">過去90日</SelectItem>
                    <SelectItem value="1y">過去1年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>キャンペーン</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全キャンペーン</SelectItem>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="campaigns">キャンペーン</TabsTrigger>
              <TabsTrigger value="influencers">インフルエンサー</TabsTrigger>
              <TabsTrigger value="analytics">分析</TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">総応募数</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(analytics.totalApplications)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">承認数</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatNumber(analytics.approvedApplications)}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">承認率</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analytics.conversionRate}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">総報酬額</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(analytics.totalRewardPaid)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* SNS 업로드 통계 */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Share2 className="h-5 w-5" />
                    <span>SNSアップロード統計</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Instagram className="h-8 w-8 text-pink-500" />
                        <div>
                          <p className="font-medium">Instagram</p>
                          <p className="text-sm text-gray-600">リール動画</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-pink-600">
                        {analytics.snsUploadStats.instagram}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Hash className="h-8 w-8 text-black" />
                        <div>
                          <p className="font-medium">TikTok</p>
                          <p className="text-sm text-gray-600">ショート動画</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {analytics.snsUploadStats.tiktok}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Youtube className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="font-medium">YouTube</p>
                          <p className="text-sm text-gray-600">動画</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.snsUploadStats.youtube}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Share2 className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">総アップロード</p>
                          <p className="text-sm text-gray-600">全プラットフォーム</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.snsUploadStats.total}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 상태별 분포 */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>応募状態分布</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip formatter={(value) => [value, '件数']} />
                          <Legend />
                          <Pie
                            data={analytics.statusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>日別応募推移</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analytics.dailyApplications}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [value, '件数']} />
                          <Area type="monotone" dataKey="applications" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 캠페인 탭 */}
            <TabsContent value="campaigns">
              <div className="space-y-6">
                {analytics.campaignPerformance.map((campaign) => (
                  <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle>{campaign.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-600">総応募数</p>
                            <p className="text-lg font-semibold">{campaign.totalApplications}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">承認数</p>
                            <p className="text-lg font-semibold">{campaign.approvedApplications}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Target className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm text-gray-600">承認率</p>
                            <p className="text-lg font-semibold">{campaign.conversionRate}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Share2 className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm text-gray-600">SNSアップロード</p>
                            <p className="text-lg font-semibold">
                              {campaign.snsStats.instagram + campaign.snsStats.tiktok + campaign.snsStats.youtube + campaign.snsStats.other}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">SNSプラットフォーム別アップロード</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            <span className="text-sm">Instagram: <strong>{campaign.snsStats.instagram}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Hash className="h-4 w-4 text-black" />
                            <span className="text-sm">TikTok: <strong>{campaign.snsStats.tiktok}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            <span className="text-sm">YouTube: <strong>{campaign.snsStats.youtube}</strong></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Share2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">その他: <strong>{campaign.snsStats.other}</strong></span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 인플루언서 탭 */}
            <TabsContent value="influencers">
              <Card>
                <CardHeader>
                  <CardTitle>インフルエンサー分析</CardTitle>
                  <CardDescription>
                    キャンペーンに応募したインフルエンサーの統計情報
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">名前</th>
                          <th className="text-right py-3 px-4">Instagram</th>
                          <th className="text-right py-3 px-4">TikTok</th>
                          <th className="text-right py-3 px-4">YouTube</th>
                          <th className="text-left py-3 px-4">状態</th>
                          <th className="text-left py-3 px-4">キャンペーン</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.influencerAnalysis.map((influencer, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{influencer.name}</td>
                            <td className="text-right py-3 px-4">{formatNumber(influencer.instagramFollowers)}</td>
                            <td className="text-right py-3 px-4">{formatNumber(influencer.tiktokFollowers)}</td>
                            <td className="text-right py-3 px-4">{formatNumber(influencer.youtubeFollowers)}</td>
                            <td className="py-3 px-4">{getStatusBadge(influencer.status)}</td>
                            <td className="py-3 px-4">{influencer.campaignTitle}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 분석 탭 */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>キャンペーン効果分析</CardTitle>
                    <CardDescription>
                      キャンペーンの効果と成果の詳細分析
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">キャンペーン効果指標</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>承認率</span>
                            <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${analytics.conversionRate}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">{analytics.conversionRate}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>完了率</span>
                            <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ width: `${analytics.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">{analytics.completionRate}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>SNSアップロード率</span>
                            <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full" 
                                style={{ 
                                  width: `${analytics.approvedApplications > 0 ? 
                                    (analytics.snsUploadStats.total / analytics.approvedApplications * 100).toFixed(1) : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="font-medium">
                              {analytics.approvedApplications > 0 ? 
                                (analytics.snsUploadStats.total / analytics.approvedApplications * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">プラットフォーム分布</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: 'Instagram', value: analytics.snsUploadStats.instagram },
                                { name: 'TikTok', value: analytics.snsUploadStats.tiktok },
                                { name: 'YouTube', value: analytics.snsUploadStats.youtube },
                                { name: 'その他', value: analytics.snsUploadStats.other }
                              ]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default CompanyReport
