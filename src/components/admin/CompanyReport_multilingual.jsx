import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, ArrowLeft, Download, FileText, 
  AlertCircle, CheckCircle, Users, Calendar, 
  DollarSign, Activity, TrendingUp, BarChart3
} from 'lucide-react'
import i18n from '../../lib/i18n'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageSelector from '../LanguageSelector'

const CompanyReport = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  
  const [campaign, setCampaign] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [period, setPeriod] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  
  const [reportData, setReportData] = useState({
    totalApplications: 0,
    approvedCount: 0,
    approvalRate: 0,
    completedCount: 0,
    completionRate: 0,
    totalReward: 0,
    averageReward: 0,
    statusDistribution: {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0
    },
    dailyApplications: []
  })

  useEffect(() => {
    loadData()
  }, [campaignId])

  useEffect(() => {
    if (applications.length > 0) {
      calculateReportData(applications)
    }
  }, [applications, period, selectedCampaign])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 캠페인 정보 로드
      const campaignData = await database.campaigns.getById(campaignId)
      if (!campaignData) {
        setError(i18n.t('common.error'))
        return
      }
      setCampaign(campaignData)
      
      // 해당 캠페인의 신청 정보 로드
      const applicationsData = await database.applications.getByCampaign(campaignId)
      if (!applicationsData) {
        setError(i18n.t('common.error'))
        return
      }
      setApplications(applicationsData)
      
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(i18n.t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const calculateReportData = (apps) => {
    // 필터링된 신청 데이터
    let filteredApps = [...apps]
    
    // 기간 필터링
    if (period !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (period) {
        case 'past7days':
          startDate.setDate(now.getDate() - 7)
          break
        case 'past30days':
          startDate.setDate(now.getDate() - 30)
          break
        case 'past90days':
          startDate.setDate(now.getDate() - 90)
          break
        case 'past1year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          break
      }
      
      filteredApps = filteredApps.filter(app => {
        const appDate = new Date(app.created_at)
        return appDate >= startDate && appDate <= now
      })
    }
    
    // 캠페인 필터링
    if (selectedCampaign !== 'all') {
      filteredApps = filteredApps.filter(app => app.campaign_id === selectedCampaign)
    }
    
    // 통계 계산
    const totalApplications = filteredApps.length
    const approvedCount = filteredApps.filter(app => app.status === 'approved' || app.status === 'completed').length
    const completedCount = filteredApps.filter(app => app.status === 'completed').length
    
    const approvalRate = totalApplications > 0 ? (approvedCount / totalApplications) * 100 : 0
    const completionRate = approvedCount > 0 ? (completedCount / approvedCount) * 100 : 0
    
    // 기업 보고서에서는 리워드 정보 숨김
    const totalReward = 0
    const averageReward = 0
    
    // 상태별 분포
    const statusDistribution = {
      pending: filteredApps.filter(app => app.status === 'pending').length,
      approved: filteredApps.filter(app => app.status === 'approved').length,
      rejected: filteredApps.filter(app => app.status === 'rejected').length,
      completed: completedCount,
      cancelled: filteredApps.filter(app => app.status === 'cancelled').length
    }
    
    // 일별 신청 추이
    const dailyApplications = calculateDailyApplications(filteredApps)
    
    setReportData({
      totalApplications,
      approvedCount,
      approvalRate,
      completedCount,
      completionRate,
      totalReward,
      averageReward,
      statusDistribution,
      dailyApplications
    })
  }

  const calculateDailyApplications = (apps) => {
    const dailyData = {}
    
    apps.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = 0
      }
      dailyData[date]++
    })
    
    // 날짜순으로 정렬
    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'KRW'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    const locale = language === 'en' ? 'en-US' : 
                  language === 'ko' ? 'ko-KR' : 'ko-KR'
    
    return date.toLocaleDateString(locale)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  const exportToExcel = () => {
    const headers = [
      i18n.t('common.date'),
      i18n.t('common.name'),
      i18n.t('common.status')
    ]
    
    const rows = applications.map(app => {
      const campaign = campaigns.find(c => c.id === app.campaign_id)
      return [
        formatDate(app.created_at),
        campaign?.title || 'N/A',
        i18n.t(`companyReport.status.${app.status}`)
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${company?.name || 'company'}_report.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{i18n.t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{i18n.t('common.error')}</h3>
        {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {i18n.t('companyReport.downloadReport')}
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="h-4 w-4 mr-2" />
            {i18n.t('common.print')}
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">
                {i18n.t('companyReport.title', { name: company.name })}
              </CardTitle>
              <CardDescription className="text-xl text-purple-600 font-medium">
                {i18n.t('companyReport.description')}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4" />
                <span>{campaigns.length} {i18n.t('companyReport.tabs.campaigns')}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">{i18n.t('companyReport.period.label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={period === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPeriod('all')}
              >
                {i18n.t('companyReport.period.all')}
              </Button>
              <Button 
                variant={period === 'past7days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPeriod('past7days')}
              >
                {i18n.t('companyReport.period.past7days')}
              </Button>
              <Button 
                variant={period === 'past30days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPeriod('past30days')}
              >
                {i18n.t('companyReport.period.past30days')}
              </Button>
              <Button 
                variant={period === 'past90days' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPeriod('past90days')}
              >
                {i18n.t('companyReport.period.past90days')}
              </Button>
              <Button 
                variant={period === 'past1year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setPeriod('past1year')}
              >
                {i18n.t('companyReport.period.past1year')}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">{i18n.t('companyReport.campaign.label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedCampaign === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCampaign('all')}
              >
                {i18n.t('companyReport.campaign.all')}
              </Button>
              {campaigns.map(campaign => (
                <Button 
                  key={campaign.id}
                  variant={selectedCampaign === campaign.id ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  {campaign.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{i18n.t('companyReport.metrics.totalApplications')}</p>
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
                <p className="text-sm font-medium text-gray-600">{i18n.t('companyReport.metrics.approvalRate')}</p>
                <p className="text-3xl font-bold text-green-600">{formatPercentage(reportData.approvalRate)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{i18n.t('companyReport.metrics.completionRate')}</p>
                <p className="text-3xl font-bold text-purple-600">{formatPercentage(reportData.completionRate)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{i18n.t('companyReport.metrics.totalReward')}</p>
                <p className="text-3xl font-bold text-orange-600">{formatCurrency(reportData.totalReward)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{i18n.t('companyReport.charts.statusDistribution')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 대기 중 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">{i18n.t('companyReport.status.pending')}</span>
                </div>
                <span className="text-sm font-medium">{reportData.statusDistribution.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${reportData.totalApplications > 0 
                      ? (reportData.statusDistribution.pending / reportData.totalApplications) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* 거부됨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">{i18n.t('companyReport.status.rejected')}</span>
                </div>
                <span className="text-sm font-medium">{reportData.statusDistribution.rejected}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ 
                    width: `${reportData.totalApplications > 0 
                      ? (reportData.statusDistribution.rejected / reportData.totalApplications) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* 완료됨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium">{i18n.t('companyReport.status.completed')}</span>
                </div>
                <span className="text-sm font-medium">{reportData.statusDistribution.completed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ 
                    width: `${reportData.totalApplications > 0 
                      ? (reportData.statusDistribution.completed / reportData.totalApplications) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* 취소됨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm font-medium">{i18n.t('companyReport.status.cancelled')}</span>
                </div>
                <span className="text-sm font-medium">{reportData.statusDistribution.cancelled}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ 
                    width: `${reportData.totalApplications > 0 
                      ? (reportData.statusDistribution.cancelled / reportData.totalApplications) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{i18n.t('companyReport.charts.dailyApplications')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {reportData.dailyApplications.length > 0 ? (
              <div className="flex items-end h-full space-x-2">
                {reportData.dailyApplications.map((item, index) => {
                  const maxCount = Math.max(...reportData.dailyApplications.map(d => d.count))
                  const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-xs mt-1 text-gray-600">
                        {formatDate(item.date)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">{i18n.t('common.error')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>{i18n.t('companyReport.campaignPerformance.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {campaigns.map(campaign => {
              const campaignApps = applications.filter(app => app.campaign_id === campaign.id)
              const totalApps = campaignApps.length
              const approvedApps = campaignApps.filter(app => app.status === 'approved' || app.status === 'completed').length
              const completedApps = campaignApps.filter(app => app.status === 'completed').length
              
              const approvalRate = totalApps > 0 ? (approvedApps / totalApps) * 100 : 0
              const completionRate = approvedApps > 0 ? (completedApps / approvedApps) * 100 : 0
              
              return (
                <div key={campaign.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <Badge variant="outline">{totalApps} {i18n.t('companyReport.charts.count')}</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{i18n.t('companyReport.campaignPerformance.approvalRate')}</span>
                        <span className="text-sm font-medium">{formatPercentage(approvalRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${approvalRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{i18n.t('companyReport.campaignPerformance.completionRate')}</span>
                        <span className="text-sm font-medium">{formatPercentage(completionRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{i18n.t('companyReport.campaignPerformance.uploadRate')}</span>
                        <span className="text-sm font-medium">{formatPercentage(completionRate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompanyReport
