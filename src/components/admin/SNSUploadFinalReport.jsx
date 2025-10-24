import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
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

const SNSUploadFinalReport = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
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
          setError('キャンペーンが見つかりません。')
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
        setError('SNS 업로드データの読み込みに실패했습니다。')
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
      setError('データの로딩 중に오류가 발생했습니다。')
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
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const exportToExcel = () => {
    const headers = ['名前', 'Instagram URL', 'TikTok URL', 'YouTube URL', 'その他 URL', '備考', '업로드日']
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
        app.video_uploaded_at ? new Date(app.video_uploaded_at).toLocaleDateString('ja-JP') : 'N/A'
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
          <p className="text-gray-600">SNS 업로드データを로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!campaign && campaignId && campaignId !== 'undefined') {
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
  
  // 전체 SNS 업로드 보기 모드
  if (!campaign && (!campaignId || campaignId === 'undefined')) {
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
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel出力
            </Button>
            <Button onClick={() => window.print()}>
              <FileText className="h-4 w-4 mr-2" />
              印刷
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">全キャンペーンSNS 업로드</CardTitle>
                <CardDescription className="text-xl text-purple-600 font-medium">
                  SNS 업로드最終報告書
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
                  <p className="text-sm font-medium text-gray-600">완료크리에이터</p>
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
                  <p className="text-sm font-medium text-gray-600">総업로드数</p>
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
              <span>プラットフォーム別업로드統計</span>
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
                  {reportData.platformStats.instagram}
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
                  {reportData.platformStats.tiktok}
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
                  {reportData.platformStats.youtube}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">その他</p>
                    <p className="text-sm text-gray-600">外部プラットフォーム</p>
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
            <CardTitle>업로드済みコンテンツ목록</CardTitle>
            <CardDescription>
              크리에이터が업로드したSNSコンテンツの상세
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
                          업로드日: {application.video_uploaded_at ? new Date(application.video_uploaded_at).toLocaleDateString('ja-JP') : 'N/A'}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        완료
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {videoLinks.instagram_url && (
                        <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
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
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
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
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-6 w-6 text-blue-500" />
                            <div>
                              <p className="font-medium">その他</p>
                              <p className="text-sm text-gray-600">外部プラットフォーム</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={videoLinks.other_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-2" />
                              視聴
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {videoLinks.notes && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">備考:</p>
                        <p className="text-sm text-gray-600">{videoLinks.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {applications.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">업로드されたコンテンツがありません</h3>
                  <p className="text-gray-500">まだSNSに업로드されたコンテンツがありません。</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel出力
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
                {campaign.brand} - SNS 업로드最終報告書
              </CardDescription>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(campaign.start_date).toLocaleDateString('ja-JP')} - {new Date(campaign.end_date).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>SNS 업로드완료</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(applications.length * campaign.reward_amount)}
              </div>
              <div className="text-sm text-gray-600">総支払보상</div>
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
                <p className="text-sm font-medium text-gray-600">완료크리에이터</p>
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
                <p className="text-sm font-medium text-gray-600">総업로드数</p>
                <p className="text-3xl font-bold text-green-600">{reportData.totalUploads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総支払보상</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(applications.length * campaign.reward_amount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-3xl font-bold text-orange-600">100%</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>プラットフォーム別업로드統計</span>
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
                {reportData.platformStats.instagram}
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
                {reportData.platformStats.tiktok}
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
                {reportData.platformStats.youtube}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">その他</p>
                  <p className="text-sm text-gray-600">外部プラットフォーム</p>
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
          <CardTitle>업로드済みコンテンツ목록</CardTitle>
          <CardDescription>
            크리에이터が업로드したSNSコンテンツの상세
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
                        업로드日: {application.video_uploaded_at ? new Date(application.video_uploaded_at).toLocaleDateString('ja-JP') : 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      완료
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {videoLinks.instagram_url && (
                      <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
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
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
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
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Globe className="h-6 w-6 text-blue-500" />
                          <div>
                            <p className="font-medium">その他</p>
                            <p className="text-sm text-gray-600">外部プラットフォーム</p>
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
                      <p className="text-sm font-medium text-gray-700 mb-1">備考:</p>
                      <p className="text-sm text-gray-600">{videoLinks.notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
            
            {applications.length === 0 && (
              <div className="text-center py-8">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">업로드済みコンテンツがありません</h3>
                <p className="text-gray-500">まだ크리에이터からの動画업로드がありません。</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {applications.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Award className="h-5 w-5" />
              <span>キャンペーン완료サマリー</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">成果指標</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>参加크리에이터数:</span>
                    <span className="font-medium">{applications.length}名</span>
                  </div>
                  <div className="flex justify-between">
                    <span>総コンテンツ数:</span>
                    <span className="font-medium">{reportData.totalUploads}本</span>
                  </div>
                  <div className="flex justify-between">
                    <span>総支払보상:</span>
                    <span className="font-medium">{formatCurrency(applications.length * campaign.reward_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>완료率:</span>
                    <span className="font-medium text-green-600">100%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">プラットフォーム分布</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Instagram:</span>
                    <span className="font-medium">{reportData.platformStats.instagram}本</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TikTok:</span>
                    <span className="font-medium">{reportData.platformStats.tiktok}本</span>
                  </div>
                  <div className="flex justify-between">
                    <span>YouTube:</span>
                    <span className="font-medium">{reportData.platformStats.youtube}本</span>
                  </div>
                  <div className="flex justify-between">
                    <span>その他:</span>
                    <span className="font-medium">{reportData.platformStats.other}本</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SNSUploadFinalReport
