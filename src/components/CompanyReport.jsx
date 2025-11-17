import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { database, supabase } from '../lib/supabase'
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
  const { companyId } = useParams()
  const [searchParams] = useSearchParams()
  const accessToken = searchParams.get('token')
  
  const [company, setCompany] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')

  useEffect(() => {
    if (companyId) {
      loadCompanyData()
    } else {
      setError('キャンペーンIDが無効です。')
      setLoading(false)
    }
  }, [companyId, selectedPeriod, selectedCampaign])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('会社データ読み込み開始:', companyId)
      
      // 会社情報の読み込み - Supabaseライブラリを使用
      let companyData
      try {
        companyData = await database.companies.get(companyId)
        if (!companyData) {
          throw new Error('会社情報が見つかりません')
        }
        setCompany(companyData)
        console.log('会社データ読み込み成功:', companyData)
      } catch (companyError) {
        console.error('会社データ読み込みエラー:', companyError)
        // フォールバック: 直接Supabaseクエリ
        const { data: fallbackCompanyData, error: fallbackError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()
        
        if (fallbackError) throw new Error(`会社情報の取得に失敗: ${fallbackError.message}`)
        companyData = fallbackCompanyData
        setCompany(companyData)
      }
      
      // 会社のキャンペーン読み込み - Supabaseライブラリを使用
      let campaignsData = []
      try {
        campaignsData = await database.campaigns.getByCompany(companyId)
        setCampaigns(campaignsData || [])
        console.log('キャンペーンデータ読み込み成功:', campaignsData?.length || 0, '件')
      } catch (campaignsError) {
        console.error('キャンペーンデータ読み込みエラー:', campaignsError)
        // フォールバック: 直接Supabaseクエリ
        const { data: fallbackCampaignsData, error: fallbackCampaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
        
        if (fallbackCampaignsError) {
          console.warn('キャンペーンデータのフォールバック読み込みも失敗:', fallbackCampaignsError)
          campaignsData = []
        } else {
          campaignsData = fallbackCampaignsData || []
        }
        setCampaigns(campaignsData)
      }
      
      // キャンペーン申請履歴の読み込み
      let applicationsData = []
      const campaignIds = campaignsData?.map(c => c.id) || []
      
      if (campaignIds.length > 0) {
        try {
          // 各キャンペーンの申請を個別に取得
          const allApplications = []
          for (const campaignId of campaignIds) {
            try {
              const campaignApplications = await database.applications.getByCampaign(campaignId)
              if (campaignApplications && campaignApplications.length > 0) {
                allApplications.push(...campaignApplications)
              }
            } catch (appError) {
              console.warn(`キャンペーン ${campaignId} の申請データ取得に失敗:`, appError)
            }
          }
          
          applicationsData = allApplications
          console.log('申請データ読み込み成功:', applicationsData.length, '件')
        } catch (applicationsError) {
          console.error('申請データ読み込みエラー:', applicationsError)
          
          // フォールバック: 直接Supabaseクエリ
          try {
            const { data: fallbackApplicationsData, error: fallbackApplicationsError } = await supabase
              .from('applications')
              .select(`
                *,
                campaigns (
                  title,
                  brand,
                  reward_amount
                ),
                user_profiles (
                  name,
                  instagram_followers,
                  tiktok_followers,
                  youtube_followers
                )
              `)
              .in('campaign_id', campaignIds)
              .order('created_at', { ascending: false })
            
            if (fallbackApplicationsError) {
              console.warn('申請データのフォールバック読み込みも失敗:', fallbackApplicationsError)
              applicationsData = []
            } else {
              applicationsData = fallbackApplicationsData || []
            }
          } catch (fallbackError) {
            console.warn('申請データのフォールバック処理でエラー:', fallbackError)
            applicationsData = []
          }
        }
      }
      
      setApplications(applicationsData)
      
      // 分析データ生成
      generateAnalytics(campaignsData || [], applicationsData || [])
      
    } catch (error) {
      console.error('Load company data error:', error)
      setError(error.message || 'データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const generateAnalytics = (campaignsData, applicationsData) => {
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
      return {
        id: campaign.id,
        title: campaign.title,
        totalApplications: campaignApps.length,
        approvedApplications: campaignApps.filter(app => app.status === 'approved').length,
        completedApplications: campaignApps.filter(app => app.status === 'completed').length,
        conversionRate: campaignApps.length > 0 ? 
          (campaignApps.filter(app => app.status === 'approved').length / campaignApps.length * 100).toFixed(1) : 0
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
      influencerAnalysis
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
        'SNS Instagram': app.sns_urls?.instagram || '',
        'SNS TikTok': app.sns_urls?.tiktok || '',
        'SNS YouTube': app.sns_urls?.youtube || '',
        'SNS Twitter': app.sns_urls?.twitter || ''
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
                        <p className="text-sm font-medium text-gray-600">支払済報酬</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(analytics.totalRewardPaid)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 상태별 분포 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>応募状態分布</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analytics.statusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {analytics.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 일별 신청 추이 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>日別応募推移</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.dailyApplications}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="applications" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 캠페인 탭 */}
            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>キャンペーン別成果</CardTitle>
                  <CardDescription>
                    各キャンペーンの応募数と承認率を確認できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.campaignPerformance.map((campaign) => (
                      <Card key={campaign.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                {campaign.title}
                              </h4>
                              <div className="grid md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">総応募数</p>
                                  <p className="font-semibold text-blue-600">
                                    {formatNumber(campaign.totalApplications)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">承認数</p>
                                  <p className="font-semibold text-green-600">
                                    {formatNumber(campaign.approvedApplications)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">完了数</p>
                                  <p className="font-semibold text-purple-600">
                                    {formatNumber(campaign.completedApplications)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">承認率</p>
                                  <p className="font-semibold text-orange-600">
                                    {campaign.conversionRate}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 인플루언서 탭 */}
            <TabsContent value="influencers">
              <Card>
                <CardHeader>
                  <CardTitle>参加インフルエンサー</CardTitle>
                  <CardDescription>
                    キャンペーンに参加したインフルエンサーの情報
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.influencerAnalysis.slice(0, 20).map((influencer, index) => (
                      <Card key={`${influencer.userId}-${index}`} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-800">
                                  {influencer.name || 'ユーザー'}
                                </h4>
                                {getStatusBadge(influencer.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {influencer.campaignTitle}
                              </p>
                              <div className="flex space-x-6 text-sm">
                                {influencer.instagramFollowers > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Instagram className="h-4 w-4 text-pink-500" />
                                    <span>{formatNumber(influencer.instagramFollowers)}</span>
                                  </div>
                                )}
                                {influencer.tiktokFollowers > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Hash className="h-4 w-4 text-black" />
                                    <span>{formatNumber(influencer.tiktokFollowers)}</span>
                                  </div>
                                )}
                                {influencer.youtubeFollowers > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Youtube className="h-4 w-4 text-red-500" />
                                    <span>{formatNumber(influencer.youtubeFollowers)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 분석 탭 */}
            <TabsContent value="analytics">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>キャンペーン別応募数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analytics.campaignPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="title" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalApplications" fill="#3b82f6" name="総応募数" />
                        <Bar dataKey="approvedApplications" fill="#10b981" name="承認数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>キャンペーン別承認率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.campaignPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="title" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="conversionRate" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="承認率 (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
