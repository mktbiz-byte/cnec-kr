import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, ArrowLeft, Download, Play, 
  AlertCircle, CheckCircle, Users, FileText, 
  Calendar, DollarSign, Activity,
  Instagram, Youtube, Hash, ExternalLink, Globe,
  TrendingUp, BarChart3, Award
} from 'lucide-react'
import i18n from '../../lib/i18n'
import LanguageSelector from '../LanguageSelector'

const SNSUploadFinalReport_multilingual = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [reportData, setReportData] = useState({
    totalUploads: 0,
    platformStats: {
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      other: 0
    }
  })

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 특정 캠페인 또는 전체 캠페인 로드
      if (campaignId && campaignId !== 'undefined') {
        const campaignData = await database.campaigns.getById(campaignId)
        if (!campaignData) {
          setError(t('common.error'))
          return
        }
        setCampaign(campaignData)
      } else {
        // campaignId가 없으면 전체 SNS 업로드 보기
        console.log('전체 SNS 업로드 보기 모드')
        setCampaign(null)
      }
      
      // SNS 업로드 데이터 로드
      let applicationsData
      if (campaignId && campaignId !== 'undefined') {
        applicationsData = await database.applications.getByCampaign(campaignId)
      } else {
        applicationsData = await database.applications.getAll()
      }
      
      if (!applicationsData) {
        setError(t('common.error'))
        return
      }
      
      // 기본 통계 계산
      const dataArray = Array.isArray(applicationsData) ? applicationsData : applicationsData?.data || []
      const stats = {
        totalUploads: dataArray.length,
        platformStats: {
          instagram: 0,
          tiktok: 0, 
          youtube: 0,
          other: 0
        }
      }
      
      setApplications(dataArray)
      setReportData(stats)
      
      // 사용자 프로필 로드
      if (dataArray.length > 0) {
        const userIds = [...new Set(dataArray.map(app => app.user_id))]
        const profiles = {}
        
        for (const userId of userIds) {
          const profile = await database.userProfiles.get(userId)
          if (profile) {
            profiles[userId] = profile
          }
        }
        setUserProfiles(profiles)
      }
      
    } catch (error) {
      console.error('SNS 업로드 데이터 로드 오류:', error)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }

  }

  const calculateReportData = (apps) => {
    const platformStats = {
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      other: 0
    }
    
    let totalUploads = 0
    
    apps.forEach(app => {
      if (app.video_links) {
        if (app.video_links.instagram_url) {
          platformStats.instagram++
          totalUploads++
        }
        if (app.video_links.tiktok_url) {
          platformStats.tiktok++
          totalUploads++
        }
        if (app.video_links.youtube_url) {
          platformStats.youtube++
          totalUploads++
        }
        if (app.video_links.other_url) {
          platformStats.other++
          totalUploads++
        }
      }
    })
    
    setReportData({
      totalUploads,
      platformStats
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : language === 'ko' ? 'ko-KR' : 'ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    const locale = language === 'en' ? 'en-US' : 
                  language === 'ko' ? 'ko-KR' : 'ko-KR'
    
    return date.toLocaleDateString(locale)
  }

  const exportToExcel = () => {
    const headers = [
      t('common.name'), 
      'Instagram URL', 
      'TikTok URL', 
      'YouTube URL', 
      t('snsUploadReport.notes'), 
      t('snsUploadReport.uploadDate')
    ]
    
    const rows = applications.map(app => {
      const profile = userProfiles[app.user_id]
      const videoLinks = app.video_links || {}
      return [
        profile?.name || 'N/A',
        videoLinks.instagram_url || '',
        videoLinks.tiktok_url || '',
        videoLinks.youtube_url || '',
        videoLinks.other_url || '',
        videoLinks.notes || '',
        app.video_uploaded_at ? formatDate(app.video_uploaded_at) : 'N/A'
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${campaign?.title || 'campaign'}_sns_uploads_final.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!campaign && campaignId && campaignId !== 'undefined') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('common.error')}</h3>
        {/* 기업 보고서에서는 뒤로가기 버튼 제거 */}
      </div>
    )
  }
  
  // 전체 SNS 업로드 보기 모드
  if (!campaign && (!campaignId || campaignId === 'undefined')) {
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
              {t('common.download')}
            </Button>
            <Button onClick={() => window.print()}>
              <FileText className="h-4 w-4 mr-2" />
              {t('common.print')}
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{t('snsUploadReport.title')}</CardTitle>
                <CardDescription className="text-xl text-purple-600 font-medium">
                  {t('snsUploadReport.description')}
                </CardDescription>
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
                  <p className="text-sm font-medium text-gray-600">{t('snsUploadReport.completedCreators')}</p>
                  <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('snsUploadReport.totalUploads')}</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.totalUploads}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{t('snsUploadReport.platformStats')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Instagram className="h-8 w-8 text-pink-500" />
                  <div>
                    <p className="font-medium">{t('sns.instagram')}</p>
                    <p className="text-sm text-gray-600">{t('sns.reels')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-pink-600">
                  {reportData.platformStats.instagram}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Hash className="h-8 w-8 text-black" />
                  <div>
                    <p className="font-medium">{t('sns.tiktok')}</p>
                    <p className="text-sm text-gray-600">{t('sns.shorts')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {reportData.platformStats.tiktok}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Youtube className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium">{t('sns.youtube')}</p>
                    <p className="text-sm text-gray-600">{t('sns.videos')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.platformStats.youtube}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{t('sns.other')}</p>
                    <p className="text-sm text-gray-600">{t('sns.externalPlatform')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.platformStats.other}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Uploaded Content List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('snsUploadReport.uploadedContentList')}</CardTitle>
            <CardDescription>
              {t('snsUploadReport.uploadedContentDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {applications.map((application) => {
                const profile = userProfiles[application.user_id]
                const videoLinks = application.video_links || {}
                
                return (
                  <div key={application.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                        <p className="text-sm text-gray-600">
                          {t('snsUploadReport.uploadDate')}: {application.video_uploaded_at ? formatDate(application.video_uploaded_at) : 'N/A'}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('snsUploadReport.completed')}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {videoLinks.instagram_url && (
                        <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Instagram className="h-6 w-6 text-pink-500" />
                            <div>
                              <p className="font-medium">{t('sns.instagram')}</p>
                              <p className="text-sm text-gray-600">{t('sns.reels')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={videoLinks.instagram_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-2" />
                              {t('snsUploadReport.watch')}
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {videoLinks.tiktok_url && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Hash className="h-6 w-6 text-black" />
                            <div>
                              <p className="font-medium">{t('sns.tiktok')}</p>
                              <p className="text-sm text-gray-600">{t('sns.shorts')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={videoLinks.tiktok_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-2" />
                              {t('snsUploadReport.watch')}
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {videoLinks.youtube_url && (
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Youtube className="h-6 w-6 text-red-500" />
                            <div>
                              <p className="font-medium">{t('sns.youtube')}</p>
                              <p className="text-sm text-gray-600">{t('sns.videos')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={videoLinks.youtube_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-2" />
                              {t('snsUploadReport.watch')}
                            </a>
                          </Button>
                        </div>
                      )}
                      
                      {videoLinks.other_url && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-6 w-6 text-blue-500" />
                            <div>
                              <p className="font-medium">{t('sns.other')}</p>
                              <p className="text-sm text-gray-600">{t('sns.externalPlatform')}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={videoLinks.other_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t('snsUploadReport.visit')}
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {videoLinks.notes && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">{t('snsUploadReport.notes')}:</p>
                        <p className="text-gray-600">{videoLinks.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 특정 캠페인 SNS 업로드 보기 모드
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
            {t('common.download')}
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="h-4 w-4 mr-2" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{campaign.title}</CardTitle>
              <CardDescription className="text-xl text-purple-600 font-medium">
                {campaign.brand}
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              {t('snsUploadReport.finalReport')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">{t('campaign.period')}</p>
                <p className="font-medium">
                  {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                </p>
              </div>
            </div>
            
            {/* 기업 보고서에서는 리워드 정보 숨김 */}
            
            <div className="flex items-center space-x-4">
              <Activity className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">{t('campaign.status')}</p>
                <p className="font-medium">
                  {campaign.status === 'active' ? t('campaign.active') : 
                   campaign.status === 'completed' ? t('campaign.completed') : 
                   campaign.status === 'draft' ? t('campaign.draft') : 
                   t('campaign.closed')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('snsUploadReport.completedCreators')}</p>
                <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('snsUploadReport.totalUploads')}</p>
                <p className="text-3xl font-bold text-green-600">{reportData.totalUploads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* 기업 보고서에서는 총 리워드 카드 숨김 */}
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{t('snsUploadReport.platformStats')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Instagram className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="font-medium">{t('sns.instagram')}</p>
                  <p className="text-sm text-gray-600">{t('sns.reels')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-pink-600">
                {reportData.platformStats.instagram}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Hash className="h-8 w-8 text-black" />
                <div>
                  <p className="font-medium">{t('sns.tiktok')}</p>
                  <p className="text-sm text-gray-600">{t('sns.shorts')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {reportData.platformStats.tiktok}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Youtube className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium">{t('sns.youtube')}</p>
                  <p className="text-sm text-gray-600">{t('sns.videos')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {reportData.platformStats.youtube}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{t('sns.other')}</p>
                  <p className="text-sm text-gray-600">{t('sns.externalPlatform')}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.platformStats.other}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Content List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('snsUploadReport.uploadedContentList')}</CardTitle>
          <CardDescription>
            {t('snsUploadReport.uploadedContentDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {applications.map((application) => {
              const profile = userProfiles[application.user_id]
              const videoLinks = application.video_links || {}
              
              return (
                <div key={application.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{profile?.name || 'N/A'}</h3>
                      <p className="text-sm text-gray-600">
                        {t('snsUploadReport.uploadDate')}: {application.video_uploaded_at ? formatDate(application.video_uploaded_at) : 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('snsUploadReport.completed')}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {videoLinks.instagram_url && (
                      <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Instagram className="h-6 w-6 text-pink-500" />
                          <div>
                            <p className="font-medium">{t('sns.instagram')}</p>
                            <p className="text-sm text-gray-600">{t('sns.reels')}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={videoLinks.instagram_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            {t('snsUploadReport.watch')}
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {videoLinks.tiktok_url && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Hash className="h-6 w-6 text-black" />
                          <div>
                            <p className="font-medium">{t('sns.tiktok')}</p>
                            <p className="text-sm text-gray-600">{t('sns.shorts')}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={videoLinks.tiktok_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            {t('snsUploadReport.watch')}
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {videoLinks.youtube_url && (
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Youtube className="h-6 w-6 text-red-500" />
                          <div>
                            <p className="font-medium">{t('sns.youtube')}</p>
                            <p className="text-sm text-gray-600">{t('sns.videos')}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={videoLinks.youtube_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            {t('snsUploadReport.watch')}
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {videoLinks.other_url && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Globe className="h-6 w-6 text-blue-500" />
                          <div>
                            <p className="font-medium">{t('sns.other')}</p>
                            <p className="text-sm text-gray-600">{t('sns.externalPlatform')}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={videoLinks.other_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('snsUploadReport.visit')}
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {videoLinks.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('snsUploadReport.notes')}:</p>
                      <p className="text-gray-600">{videoLinks.notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SNSUploadFinalReport_multilingual
