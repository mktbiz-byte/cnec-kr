import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, FileText, Award, DollarSign, TrendingUp, Calendar, Settings, LogOut, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const AdminDashboard = () => {
  const { user, signOut } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    totalRewards: 0,
    totalUsers: 0,
    pendingApplications: 0
  })
  
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // 관리자 권한 확인 - 테스트 계정 포함
    if (!user || (!user.email?.includes('mkt_biz@cnec.co.kr') && !user.email?.includes('admin@cnec.test') && !user.email?.includes('acrossx@howlab.co.kr'))) {
      console.log('관리자 권한 없음:', user?.email)
      navigate('/')
      return
    }

    console.log('관리자 로그인 성공:', user?.email)
    loadDashboardData()
  }, [user, navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 통계 데이터 로드
      const [campaigns, applications, users] = await Promise.all([
        database.campaigns.getAll(),
        database.applications.getAll(),
        database.users.getAll()
      ])
      
      const activeCampaigns = campaigns.filter(c => c.status === 'active')
      const pendingApplications = applications.filter(a => a.status === 'pending')
      const totalRewards = campaigns.reduce((sum, c) => sum + (c.reward_amount || 0), 0)
      
      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalApplications: applications.length,
        totalRewards,
        totalUsers: users.length,
        pendingApplications: pendingApplications.length
      })
      
      // 최근 캠페인 (최대 5개)
      setRecentCampaigns(campaigns.slice(0, 5))
      
      // 최근 신청 (최대 5개)
      setRecentApplications(applications.slice(0, 5))
      
    } catch (error) {
      console.error('Load dashboard data error:', error)
      setError(language === 'ko' 
        ? '대시보드 데이터를 불러올 수 없습니다.'
        : '대시보드データを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
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

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: language === 'ko' ? '검토중' : '審査中' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '승인됨' : '승인됨' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: language === 'ko' ? '거절됨' : '拒否' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', label: language === 'ko' ? '활성' : 'アクティブ' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: language === 'ko' ? '비활성' : '非アクティブ' },
      draft: { bg: 'bg-purple-100', text: 'text-purple-800', label: language === 'ko' ? '초안' : '下書き' }
    }
    
    const style = statusStyles[status] || statusStyles.pending
    
    return (
      <Badge className={`${style.bg} ${style.text}`}>
        {style.label}
      </Badge>
    )
  }

  // 차트 데이터 (Mock 데이터)
  const monthlyData = [
    { month: language === 'ko' ? '1월' : '1月', campaigns: 4, applications: 12 },
    { month: language === 'ko' ? '2월' : '2月', campaigns: 6, applications: 18 },
    { month: language === 'ko' ? '3월' : '3月', campaigns: 8, applications: 24 },
    { month: language === 'ko' ? '4월' : '4月', campaigns: 5, applications: 15 },
    { month: language === 'ko' ? '5월' : '5月', campaigns: 7, applications: 21 },
    { month: language === 'ko' ? '6월' : '6月', campaigns: 9, applications: 27 }
  ]

  const statusData = [
    { name: language === 'ko' ? '승인됨' : '승인됨', value: 45, color: '#10B981' },
    { name: language === 'ko' ? '검토중' : '審査中', value: 30, color: '#F59E0B' },
    { name: language === 'ko' ? '거절됨' : '拒否', value: 25, color: '#EF4444' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-800">
                CNEC Korea {language === 'ko' ? '관리자' : '관리자'}
              </h1>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/dashboard" className="text-purple-600 font-medium">
                  {language === 'ko' ? '대시보드' : '대시보드'}
                </Link>
                <Link to="/campaigns-manage" className="text-gray-600 hover:text-gray-800">
                  {language === 'ko' ? '캠페인 관리' : '캠페인 관리'}
                </Link>
                <Link to="/user-approval" className="text-gray-600 hover:text-gray-800">
                  {language === 'ko' ? '사용자 관리' : 'ユーザー管理'}
                </Link>
                <Link to="/applications-manage" className="text-gray-600 hover:text-gray-800">
                  {language === 'ko' ? '신청 관리' : '지원 관리'}
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 언어 선택 */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className="text-xs"
                >
                  한국어
                </Button>
                <Button
                  variant={language === 'ja' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ja')}
                  className="text-xs"
                >
                  日本語
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                mkt_biz@cnec.co.kr
              </div>
              
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ko' ? '총 캠페인' : '総キャンペーン'}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalCampaigns}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{language === 'ko' ? '활성:' : 'アクティブ:'} {stats.activeCampaigns}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ko' ? '총 신청' : '総지원'}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalApplications}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-yellow-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{language === 'ko' ? '대기:' : '待機:'} {stats.pendingApplications}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ko' ? '총 사용자' : '総ユーザー'}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{language === 'ko' ? '이번 달 +12' : '今月 +12'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ko' ? '총 보상액' : '総보상額'}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRewards)}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{language === 'ko' ? '이번 달' : '今月'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 월별 트렌드 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{language === 'ko' ? '월별 트렌드' : '月別トレンド'}</CardTitle>
              <CardDescription>
                {language === 'ko' ? '캠페인 및 신청 수 추이' : 'キャンペーンと지원数の推移'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="campaigns" stroke="#8B5CF6" strokeWidth={2} />
                  <Line type="monotone" dataKey="applications" stroke="#06B6D4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 신청 상태 분포 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{language === 'ko' ? '신청 상태 분포' : '지원状態分布'}</CardTitle>
              <CardDescription>
                {language === 'ko' ? '현재 신청들의 상태별 분포' : '現在の지원の状態別分布'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 캠페인 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{language === 'ko' ? '최근 캠페인' : '最近のキャンペーン'}</CardTitle>
                <Link to="/campaigns-manage">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'ko' ? '전체 보기' : '全て見る'}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ko' ? '캠페인이 없습니다' : 'キャンペーンはありません'}
                  </div>
                ) : (
                  recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{campaign.title}</h4>
                        <p className="text-sm text-gray-600">{campaign.brand}</p>
                        <p className="text-sm text-purple-600">{formatCurrency(campaign.reward_amount)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(campaign.status)}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 최근 신청 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{language === 'ko' ? '최근 신청' : '最近の지원'}</CardTitle>
                <Link to="/applications-manage">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    {language === 'ko' ? '전체 보기' : '全て見る'}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ko' ? '신청이 없습니다' : '지원はありません'}
                  </div>
                ) : (
                  recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{application.user_name}</h4>
                        <p className="text-sm text-gray-600">{application.campaigns?.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(application.created_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(application.status)}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{language === 'ko' ? '빠른 액션' : 'クイックアクション'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/campaign-create">
                  <Button className="w-full h-20 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center">
                    <Plus className="h-6 w-6 mb-2" />
                    {language === 'ko' ? '새 캠페인' : '新キャンペーン'}
                  </Button>
                </Link>
                
                <Link to="/applications-manage?status=pending">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    {language === 'ko' ? '대기 신청' : '待機지원'}
                  </Button>
                </Link>
                
                <Link to="/user-approval">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 mb-2" />
                    {language === 'ko' ? '사용자 관리' : 'ユーザー管理'}
                  </Button>
                </Link>
                
                <Link to="/system-settings">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Settings className="h-6 w-6 mb-2" />
                    {language === 'ko' ? '설정' : '설정'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
