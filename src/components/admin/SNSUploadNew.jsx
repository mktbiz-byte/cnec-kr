import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database, supabase } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, ArrowLeft, Download, Eye, Edit, Save, 
  AlertCircle, CheckCircle, Users, FileText, 
  Calendar, DollarSign, MapPin, Package,
  Instagram, Youtube, Hash, ExternalLink, Copy,
  Truck, Search, Phone, Mail, User, Play, Image,
  ThumbsUp, MessageCircle, Share, Heart
} from 'lucide-react'

// 다국어 지원
const translations = {
  ko: {
    title: 'SNS 업로드 확인',
    subtitle: '최종 보고서 SNS가 업로드된 것을 확인하는 곳',
    backToDashboard: '대시보드로 돌아가기',
    completedCreators: '완료된 크리에이터',
    name: '이름',
    campaign: '캠페인',
    snsLinks: 'SNS 링크',
    uploadStatus: '업로드 상태',
    viewPost: '게시물 보기',
    markCompleted: '완료 처리',
    addFeedback: '피드백 추가',
    loading: '데이터를 불러오는 중...',
    error: '오류가 발생했습니다',
    success: '성공적으로 저장되었습니다',
    noUploads: '업로드된 SNS가 없습니다',
    status: '상태',
    completed: '완료됨',
    pending: '대기중',
    approved: '승인됨',
    instagram: '인스타그램',
    tiktok: '틱톡',
    youtube: '유튜브',
    twitter: '트위터',
    uploadDate: '업로드 날짜',
    feedback: '피드백',
    approvePoints: '포인트 승인',
    pointsApproved: '포인트 지급 완료',
    pointsPending: '포인트 승인 대기',
    approvePointsConfirm: '포인트를 지급하시겠습니까?',
    pointsAmount: '지급 포인트',
    saveFeedback: '피드백 저장',
    performance: '성과',
    likes: '좋아요',
    comments: '댓글',
    shares: '공유',
    views: '조회수'
  },
  ja: {
    title: 'SNS 업로드확인',
    subtitle: '最終보고서SNSが업로드されたことを확인する場所',
    backToDashboard: '대시보드に돌아가기',
    completedCreators: '완료した크리에이터',
    name: '名前',
    campaign: 'キャンペーン',
    snsLinks: 'SNSリンク',
    uploadStatus: '업로드状況',
    viewPost: '投稿を見る',
    markCompleted: '완료処理',
    addFeedback: 'フィードバック추가',
    loading: 'データを로딩 중...',
    error: '오류가 발생했습니다',
    success: '正常に저장されました',
    noUploads: '업로드されたSNSがありません',
    status: 'ステータス',
    completed: '완료済み',
    pending: '待機中',
    approved: '승인됨',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'Twitter',
    uploadDate: '업로드日',
    feedback: 'フィードバック',
    saveFeedback: 'フィードバック저장',
    performance: 'パフォーマンス',
    likes: 'いいね',
    comments: 'コメント',
    shares: 'シェア',
    views: '再生回数'
  },
  en: {
    title: 'SNS Upload Verification',
    subtitle: 'Verify that final report SNS has been uploaded',
    backToDashboard: 'Back to Dashboard',
    completedCreators: 'Completed Creators',
    name: 'Name',
    campaign: 'Campaign',
    snsLinks: 'SNS Links',
    uploadStatus: 'Upload Status',
    viewPost: 'View Post',
    markCompleted: 'Mark Completed',
    addFeedback: 'Add Feedback',
    loading: 'Loading data...',
    error: 'An error occurred',
    success: 'Successfully saved',
    noUploads: 'No SNS uploads',
    status: 'Status',
    completed: 'Completed',
    pending: 'Pending',
    approved: 'Approved',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'Twitter',
    uploadDate: 'Upload Date',
    feedback: 'Feedback',
    saveFeedback: 'Save Feedback',
    performance: 'Performance',
    likes: 'Likes',
    comments: 'Comments',
    shares: 'Shares',
    views: 'Views'
  }
}

const SNSUploadNew = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [language, setLanguage] = useState('ko')
  
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [feedback, setFeedback] = useState('')

  const t = translations[language]

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('SNS 업로드 데이터 로드 시작, campaignId:', campaignId)
      
      // 캠페인 데이터 로드 (특정 캠페인인 경우)
      if (campaignId && campaignId !== 'undefined') {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()
        
        if (campaignError) {
          throw new Error(`캠페인 조회 실패: ${campaignError.message}`)
        }
        
        setCampaign(campaignData)
        console.log('캠페인 데이터:', campaignData)
      }
      
      // 완료된 크리에이터의 SNS 업로드 데이터 로드 (사용자 프로필 정보 포함)
      let query = supabase
        .from('applications')
        .select(`
          *,
          campaigns (
            id,
            title,
            brand,
            reward_points,
            creator_points_override
          ),
          user_profiles (
            user_id,
            name,
            email,
            phone,
            instagram_url,
            tiktok_url,
            youtube_url,
            instagram_followers,
            tiktok_followers,
            youtube_subscribers
          )
        `)
        .eq('status', 'approved')
        .not('video_links', 'is', null)
        .neq('video_links', '')
        .order('updated_at', { ascending: false })
      
      if (campaignId && campaignId !== 'undefined') {
        query = query.eq('campaign_id', campaignId)
      }
      
      const { data: applicationsData, error: applicationsError } = await query
      
      if (applicationsError) {
        console.error('신청서 데이터 조회 오류:', applicationsError)
        setApplications([])
      } else {
        setApplications(applicationsData || [])
        console.log('완료된 크리에이터 데이터:', applicationsData?.length || 0, '건')
      }
      
    } catch (error) {
      console.error('데이터 로딩 오류:', error)
      setError(error.message || '데이터 로딩에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackUpdate = async () => {
    if (!selectedCreator) return

    try {
      setProcessing(true)
      setError('')

      const { error } = await supabase
        .from('applications')
        .update({ 
          admin_feedback: feedback,
          feedback_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedCreator.id)

      if (error) {
        throw new Error(`피드백 업데이트 실패: ${error.message}`)
      }

      // 로컬 상태 업데이트
      setApplications(prev => prev.map(app => 
        app.id === selectedCreator.id 
          ? { 
              ...app, 
              admin_feedback: feedback,
              feedback_updated_at: new Date().toISOString()
            }
          : app
      ))

      setSuccess('피드백이 성공적으로 저장되었습니다.')
      setFeedbackModal(false)
      setFeedback('')
      setSelectedCreator(null)

      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('피드백 업데이트 오류:', error)
      setError(error.message || '피드백 저장에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  // 포인트 승인 함수
  const handleApprovePoints = async (application) => {
    // 보상 포인트 확인 (수정된 포인트 우선)
    const rewardPoints = application.campaigns?.creator_points_override || application.campaigns?.reward_points || 0
    if (!rewardPoints) {
      setError('캠페인 보상 포인트 정보가 없습니다.')
      return
    }
    const userName = application.user_profiles?.name || application.applicant_name || '사용자'
    const confirmMessage = `${userName}님에게 ${rewardPoints.toLocaleString()}P를 지급하시겠습니까?`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setProcessing(true)
      setError('')

      // 1. 포인트 지급 (point_transactions 테이블에 직접 추가)
      const { error: pointError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: application.user_id,
          campaign_id: application.campaign_id,
          application_id: application.id,
          transaction_type: 'campaign_reward',
          amount: rewardPoints,
          description: `캠페인 완료 보상: ${application.campaigns.title}`,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      if (pointError) {
        throw new Error(`포인트 지급 실패: ${pointError.message}`)
      }

      // 2. 기존 pending_reward 상태 업데이트 (있는 경우)
      const { error: updatePendingError } = await supabase
        .from('point_transactions')
        .update({
          status: 'approved',
          amount: rewardPoints,
          updated_at: new Date().toISOString()
        })
        .eq('application_id', application.id)
        .eq('transaction_type', 'pending_reward')

      if (updatePendingError) {
        console.warn('기존 거래 상태 업데이트 실패:', updatePendingError)
      }

      // 로컬 상태 업데이트
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { 
              ...app, 
              point_request_status: 'approved',
              points_awarded_at: new Date().toISOString()
            }
          : app
      ))

      setSuccess(`${userName}님에게 ${rewardPoints.toLocaleString()}P가 지급되었습니다.`)
      setTimeout(() => setSuccess(''), 5000)

    } catch (error) {
      console.error('피드백 업데이트 오류:', error)
      setError(error.message || '피드백 업데이트에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const openFeedbackModal = (creator) => {
    setSelectedCreator(creator)
    setFeedback(creator.admin_feedback || '')
    setFeedbackModal(true)
  }

  const getStatusBadge = (application) => {
    if (application.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800">{t.completed}</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">{t.pending}</Badge>
  }

  const getSNSIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />
      case 'tiktok':
        return <Hash className="h-4 w-4 text-black" />
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />
      case 'twitter':
        return <Hash className="h-4 w-4 text-blue-600" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  const exportToExcel = () => {
    const data = applications.map(app => ({
      '이름': app.user_profiles?.name || app.applicant_name || '',
      '이메일': app.user_profiles?.email || '',
      '전화번호': app.user_profiles?.phone || '',
      '인스타그램 URL': app.user_profiles?.instagram_url || '',
      '인스타그램 팔로워': app.user_profiles?.instagram_followers || '',
      '캠페인': app.campaigns?.title || '',
      '브랜드': app.campaigns?.brand || '',
      '상태': app.status,
      'Instagram URL': app.instagram_url || '',
      'TikTok URL': app.tiktok_url || '',
      'YouTube URL': app.youtube_url || '',
      'SNS 업로드 URL': app.video_links || '',
      '관리자 피드백': app.admin_feedback || '',
      '완료일': app.completed_at ? new Date(app.completed_at).toLocaleDateString() : '',
      '피드백 업데이트일': app.feedback_updated_at ? new Date(app.feedback_updated_at).toLocaleDateString() : ''
    }))

    const filename = `sns_uploads_${campaignId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t.title}
            </h1>
            <p className="text-gray-600 mt-2">
              {campaign ? `${campaign.title} - ${t.subtitle}` : t.subtitle}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={applications.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel 내보내기
            </Button>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 완료된 크리에이터 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <span>{t.completedCreators}</span>
              <Badge variant="secondary">{applications.length}명</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t.noUploads}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {application.user_profiles?.name || application.applicant_name || '이름 없음'}
                          </h3>
                          {getStatusBadge(application)}
                        </div>
                        
                        {/* 사용자 정보 */}
                        {application.user_profiles && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {application.user_profiles.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span>{application.user_profiles.email}</span>
                                </div>
                              )}
                              {application.user_profiles.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{application.user_profiles.phone}</span>
                                </div>
                              )}
                              {application.user_profiles.instagram_url && (
                                <div className="flex items-center space-x-2">
                                  <Instagram className="h-4 w-4 text-pink-500" />
                                  <span>Instagram</span>
                                </div>
                              )}
                              {application.user_profiles.instagram_followers && (
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-blue-500" />
                                  <span>{application.user_profiles.instagram_followers.toLocaleString()} 팔로워</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* 캠페인 정보 */}
                        {!campaignId && (
                          <div className="mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span>{application.campaigns?.title || '캠페인 정보 없음'}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* SNS 링크 */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">{t.snsLinks}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {application.instagram_url && (
                              <a 
                                href={application.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 p-2 border rounded"
                              >
                                <Instagram className="h-4 w-4" />
                                <span className="text-sm">Instagram</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {application.tiktok_url && (
                              <a 
                                href={application.tiktok_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-black hover:text-gray-700 p-2 border rounded"
                              >
                                <Hash className="h-4 w-4" />
                                <span className="text-sm">TikTok</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {application.youtube_url && (
                              <a 
                                href={application.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-red-600 hover:text-red-800 p-2 border rounded"
                              >
                                <Youtube className="h-4 w-4" />
                                <span className="text-sm">YouTube</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* SNS 업로드 URL */}
                        {application.video_links && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">업로드된 콘텐츠</h4>
                            <a 
                              href={application.video_links}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 p-2 border rounded bg-blue-50"
                            >
                              <Play className="h-4 w-4" />
                              <span className="text-sm">업로드된 콘텐츠 보기</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* 관리자 피드백 */}
                        {application.admin_feedback && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">{t.feedback}</h4>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm text-gray-800">{application.admin_feedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFeedbackModal(application)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {application.admin_feedback ? '피드백 수정' : t.addFeedback}
                        </Button>
                        
                        {/* 포인트 승인 버튼 */}
                        {application.point_request_status === 'pending' && application.sns_upload_url && (
                          <Button
                            size="sm"
                            onClick={() => handleApprovePoints(application)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {t.approvePoints}
                          </Button>
                        )}
                        
                        {application.point_request_status === 'approved' && (
                          <div className="flex items-center space-x-2 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t.pointsApproved}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t pt-2 mt-4">
                      완료일: {application.completed_at ? new Date(application.completed_at).toLocaleString() : '정보 없음'}
                      {application.feedback_updated_at && (
                        <span className="ml-4">
                          피드백 업데이트: {new Date(application.feedback_updated_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 피드백 입력 모달 */}
        <Dialog open={feedbackModal} onOpenChange={setFeedbackModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.addFeedback}</DialogTitle>
              <DialogDescription>
                {selectedCreator?.user_profiles?.name}님의 콘텐츠에 대한 피드백을 입력하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback">{t.feedback}</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="콘텐츠에 대한 피드백을 입력하세요..."
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setFeedbackModal(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleFeedbackUpdate}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t.saveFeedback}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default SNSUploadNew
