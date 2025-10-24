import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import AdminHeader from './AdminHeader'
import AdminNavigation from './AdminNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Loader2, ArrowLeft, Download, Eye, Check, X, 
  AlertCircle, CheckCircle, Clock, Users, FileText, 
  Calendar, DollarSign, Target, Mail, Phone, MapPin,
  Instagram, Youtube, Hash, ExternalLink, Star,
  UserCheck, UserX, UserPlus
} from 'lucide-react'

const ApplicationsReportSimple = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '신청서 관리',
      subtitle: '모든 캠페인 신청서를 관리합니다',
      totalApplications: '총 신청서',
      pendingApplications: '대기 중',
      approvedApplications: '승인됨',
      rejectedApplications: '거절됨',
      filterByCampaign: '캠페인별 필터',
      filterByStatus: '상태별 필터',
      allCampaigns: '모든 캠페인',
      allStatuses: '모든 상태',
      pending: '대기 중',
      approved: '승인됨',
      rejected: '거절됨',
      completed: '완료됨',
      viewDetails: '상세 보기',
      approve: '승인',
      reject: '거절',
      backToDashboard: '대시보드로 돌아가기',
      loading: '데이터를 불러오는 중...',
      error: '데이터를 불러오는데 실패했습니다.',
      noApplications: '신청서가 없습니다.',
      applicationDetails: '신청서 상세 정보',
      campaignInfo: '캠페인 정보',
      applicantInfo: '신청자 정보',
      close: '닫기'
    },
    ja: {
      title: '申請書管理',
      subtitle: 'すべてのキャンペーン申請書を管理します',
      totalApplications: '総申請書',
      pendingApplications: '待機中',
      approvedApplications: '승인됨',
      rejectedApplications: '拒否済み',
      filterByCampaign: 'キャンペーン別フィルター',
      filterByStatus: 'ステータス別フィルター',
      allCampaigns: 'すべてのキャンペーン',
      allStatuses: 'すべてのステータス',
      pending: '待機中',
      approved: '승인됨',
      rejected: '拒否済み',
      completed: '완료済み',
      viewDetails: '상세표시',
      approve: '승인',
      reject: '拒否',
      backToDashboard: '대시보드に돌아가기',
      loading: 'データを로딩 중...',
      error: 'データの読み込みに실패했습니다。',
      noApplications: '申請書がありません。',
      applicationDetails: '申請書상세情報',
      campaignInfo: 'キャンペーン情報',
      applicantInfo: '申請者情報',
      close: '닫기'
    }
  }

  const t = texts[language] || texts.ko
  
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 모든 캠페인 로드
      const campaignsData = await database.campaigns.getAll()
      setCampaigns(campaignsData || [])
      
      // 모든 신청서 로드 (캠페인 정보 포함)
      const applicationsData = await database.applications.getAll()
      setApplications(applicationsData || [])
      
    } catch (error) {
      console.error('Load data error:', error)
      setError('データの読み込みに실패했습니다。')
    } finally {
      setLoading(false)
    }
  }

  const handleVirtualSelection = async (applicationId, isSelected) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        virtual_selected: isSelected,
        virtual_selected_at: isSelected ? new Date().toISOString() : null
      })
      
      setSuccess(isSelected ? '仮選択しました。' : '仮選択を解除しました。')
      loadData()
      
    } catch (error) {
      console.error('Virtual selection error:', error)
      setError('仮選択の업데이트に실패했습니다。')
    } finally {
      setProcessing(false)
    }
  }

  const handleFinalConfirmation = async (applicationId) => {
    try {
      setProcessing(true)
      setError('')
      
      await database.applications.update(applicationId, {
        status: 'approved',
        virtual_selected: false,
        approved_at: new Date().toISOString()
      })
      
      setSuccess('最終確定しました。')
      loadData()
      
    } catch (error) {
      console.error('Final confirmation error:', error)
      setError('最終確定に실패했습니다。')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status, virtualSelected) => {
    if (virtualSelected) {
      return <Badge className="bg-orange-100 text-orange-800">仮選択</Badge>
    }
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '審査中' },
      approved: { color: 'bg-green-100 text-green-800', text: '승인됨' },
      rejected: { color: 'bg-red-100 text-red-800', text: '거부됨' },
      completed: { color: 'bg-blue-100 text-blue-800', text: '완료' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const exportToExcel = () => {
    const headers = ['名前', '年齢', '肌タイプ', 'Instagram', 'TikTok', 'YouTube', 'ステータス', '지원日']
    const rows = filteredApplications.map(app => {
      const profile = userProfiles[app.user_id]
      return [
        profile?.name || 'N/A',
        profile?.age || 'N/A',
        profile?.skin_type || 'N/A',
        profile?.instagram_url || 'N/A',
        profile?.tiktok_url || 'N/A',
        profile?.youtube_url || 'N/A',
        app.virtual_selected ? '仮選択' : (app.status === 'approved' ? '승인됨' : '審査中'),
        new Date(app.created_at).toLocaleDateString('ja-JP')
      ]
    })
    
    // 질문 답변 추가
    if (campaign?.questions && campaign.questions.length > 0) {
      campaign.questions.forEach((question, index) => {
        headers.push(`質問${index + 1}`)
      })
      
      rows.forEach((row, rowIndex) => {
        const app = filteredApplications[rowIndex]
        if (app.question_answers) {
          campaign.questions.forEach((question, qIndex) => {
            row.push(app.question_answers[qIndex] || 'N/A')
          })
        }
      })
    }
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${campaign?.title || 'campaign'}_applications_simple.csv`
    link.click()
  }

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'virtual') return app.virtual_selected
    if (statusFilter === 'pending') return app.status === 'pending' && !app.virtual_selected
    if (campaignFilter !== 'all') return app.campaign_id === parseInt(campaignFilter)
    return app.status === statusFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">지원者データを로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">キャンペーン지원 관리</h1>
          <p className="text-gray-600">全てのキャンペーン지원を管理します</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel出力
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>지원統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm">
                <strong>総지원者:</strong> {filteredApplications.length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                <strong>仮選択:</strong> {filteredApplications.filter(app => app.virtual_selected).length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <strong>승인됨:</strong> {filteredApplications.filter(app => app.status === 'approved').length}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                <strong>キャンペーン数:</strong> {campaigns.length}건
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <span className="font-medium">フィルター:</span>
            <div className="flex space-x-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                全て ({applications.length})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                審査中 ({applications.filter(app => app.status === 'pending' && !app.virtual_selected).length})
              </Button>
              <Button
                variant={statusFilter === 'virtual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('virtual')}
              >
                仮選択 ({applications.filter(app => app.virtual_selected).length})
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                승인됨 ({applications.filter(app => app.status === 'approved').length})
              </Button>
            </div>
            
            {/* Campaign Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">キャンペーン:</span>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全てのキャンペーン</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const campaign = application.campaigns
          
          return (
            <Card key={application.id} className={application.virtual_selected ? 'border-l-4 border-l-orange-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{application.user_profiles?.name || 'N/A'}</h3>
                      {getStatusBadge(application.status, application.virtual_selected)}
                      <span className="text-sm text-gray-500">
                        {new Date(application.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    
                    {/* Campaign Info */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">{campaign?.title || 'N/A'}</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {campaign?.brand || 'N/A'}
                        </Badge>
                        {campaign?.reward_amount && (
                          <span className="text-sm text-green-600 font-medium">
                            ₩{campaign.reward_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">年齢:</span> {application.user_profiles?.age || 'N/A'}歳
                      </div>
                      <div>
                        <span className="font-medium">肌タイプ:</span> {application.user_profiles?.skin_type || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">지원日:</span> {new Date(application.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    {/* SNS 정보 */}
                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                      {application.user_profiles?.instagram_url && (
                        <div className="flex items-center space-x-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <a href={application.user_profiles.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Instagram
                          </a>
                        </div>
                      )}
                      {application.user_profiles?.tiktok_url && (
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-black" />
                          <a href={application.user_profiles.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            TikTok
                          </a>
                        </div>
                      )}
                      {application.user_profiles?.youtube_url && (
                        <div className="flex items-center space-x-2">
                          <Youtube className="h-4 w-4 text-red-500" />
                          <a href={application.user_profiles.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            YouTube
                          </a>
                        </div>
                      )}
                    </div>

                    {/* 질문 답변 */}
                    {application.question_answers && campaign?.questions && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">質問回答</h4>
                        <div className="space-y-2">
                          {campaign.questions.map((question, index) => {
                            const answer = application.question_answers[index]
                            if (!answer) return null
                            
                            return (
                              <div key={index} className="text-sm">
                                <span className="font-medium text-gray-700">Q{index + 1}:</span> {question.text}
                                <p className="mt-1 text-gray-600 bg-white p-2 rounded border">{answer}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application)
                        setDetailModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      상세
                    </Button>
                    
                    {application.status === 'pending' && !application.virtual_selected && (
                      <Button
                        size="sm"
                        onClick={() => handleVirtualSelection(application.id, true)}
                        disabled={processing}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        仮選択
                      </Button>
                    )}
                    
                    {application.virtual_selected && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleFinalConfirmation(application.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          最終確定
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVirtualSelection(application.id, false)}
                          disabled={processing}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          仮選択解除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredApplications.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">지원者がいません</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'このキャンペーンにはまだ지원者がいません'
                  : `フィルター条건に該当する지원者がいません`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상세 모달 */}
      <Dialog open={detailModal} onOpenChange={setDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>지원者상세</DialogTitle>
            <DialogDescription>
              지원者の상세情報を확인してください
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">お名前:</span>
                  <p className="text-lg">{userProfiles[selectedApplication.user_id]?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">年齢:</span>
                  <p className="text-lg">{userProfiles[selectedApplication.user_id]?.age || 'N/A'}歳</p>
                </div>
                <div>
                  <span className="font-medium">肌タイプ:</span>
                  <p>{userProfiles[selectedApplication.user_id]?.skin_type || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">지원日:</span>
                  <p>{new Date(selectedApplication.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">SNSアカウント</h4>
                <div className="space-y-2">
                  {userProfiles[selectedApplication.user_id]?.instagram_url && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <span>Instagram</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfiles[selectedApplication.user_id].instagram_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          開く
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  {userProfiles[selectedApplication.user_id]?.tiktok_url && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-black" />
                        <span>TikTok</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfiles[selectedApplication.user_id].tiktok_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          開く
                        </a>
                      </Button>
                    </div>
                  )}
                  
                  {userProfiles[selectedApplication.user_id]?.youtube_url && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span>YouTube</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfiles[selectedApplication.user_id].youtube_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          開く
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedApplication.question_answers && campaign?.questions && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">質問回答</h4>
                    <div className="space-y-3">
                      {campaign.questions.map((question, index) => {
                        const answer = selectedApplication.question_answers[index]
                        if (!answer) return null
                        
                        return (
                          <div key={index}>
                            <p className="font-medium text-sm">Q{index + 1}: {question.text}</p>
                            <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{answer}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

export default ApplicationsReportSimple
