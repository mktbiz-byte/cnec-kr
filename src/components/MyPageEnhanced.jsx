import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, User, FileText, Award, DollarSign, ExternalLink, Upload, Download, X, Check, Clock, AlertCircle, CreditCard, Building, MapPin } from 'lucide-react'

const MyPageEnhanced = () => {
  const { user } = useAuth()
  const { language } = useLanguage()
  
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [points, setPoints] = useState(0)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 모달 상태
  const [snsUploadModal, setSnsUploadModal] = useState(false)
  const [pointRequestModal, setPointRequestModal] = useState(false)
  const [withdrawalModal, setWithdrawalModal] = useState(false)
  const [cancelApplicationModal, setCancelApplicationModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  
  // 폼 데이터
  const [snsUrls, setSnsUrls] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: ''
  })
  
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bank_name: '',
    bank_code: '',
    branch_name: '',
    branch_code: '',
    account_type: 'savings', // savings, checking
    account_number: '',
    account_holder_name: '',
    account_holder_name_kana: '',
    address: '',
    phone: '',
    purpose: 'personal' // personal, business
  })

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 사용자 프로필 로드
      const userProfile = await database.users.getProfile(user.id)
      setProfile(userProfile)
      
      // 캠페인 신청 내역 로드
      const userApplications = await database.applications.getByUserId(user.id)
      setApplications(userApplications || [])
      
      // 포인트 잔액 로드
      const userPoints = await database.points.getBalance(user.id)
      setPoints(userPoints || 0)
      
      // 출금 내역 로드
      const userWithdrawals = await database.withdrawals.getByUserId(user.id)
      setWithdrawals(userWithdrawals || [])
      
    } catch (error) {
      console.error('Load user data error:', error)
      setError(language === 'ko' 
        ? '사용자 데이터를 불러올 수 없습니다.'
        : 'ユーザーデータを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancelApplication = async () => {
    if (!selectedApplication) return
    
    try {
      await database.applications.cancel(selectedApplication.id)
      setSuccess(language === 'ko' 
        ? '캠페인 신청이 취소되었습니다.'
        : 'キャンペーン応募がキャンセルされました。'
      )
      setCancelApplicationModal(false)
      setSelectedApplication(null)
      loadUserData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Cancel application error:', error)
      setError(language === 'ko' 
        ? '신청 취소에 실패했습니다.'
        : '応募キャンセルに失敗しました。'
      )
    }
  }

  const handleSnsUpload = async () => {
    if (!selectedApplication) return
    
    try {
      const updateData = {
        sns_urls: snsUrls,
        status: 'content_uploaded'
      }
      
      await database.applications.update(selectedApplication.id, updateData)
      setSuccess(language === 'ko' 
        ? 'SNS URL이 등록되었습니다.'
        : 'SNS URLが登録されました。'
      )
      setSnsUploadModal(false)
      setSnsUrls({ instagram: '', tiktok: '', youtube: '', twitter: '' })
      loadUserData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('SNS upload error:', error)
      setError(language === 'ko' 
        ? 'SNS URL 등록에 실패했습니다.'
        : 'SNS URL登録に失敗しました。'
      )
    }
  }

  const handlePointRequest = async () => {
    if (!selectedApplication) return
    
    try {
      await database.applications.requestPoints(selectedApplication.id)
      setSuccess(language === 'ko' 
        ? '포인트 지급 요청이 전송되었습니다.'
        : 'ポイント支給要請が送信されました。'
      )
      setPointRequestModal(false)
      loadUserData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Point request error:', error)
      setError(language === 'ko' 
        ? '포인트 요청에 실패했습니다.'
        : 'ポイント要請に失敗しました。'
      )
    }
  }

  const handleWithdrawalRequest = async () => {
    try {
      // 폼 검증
      if (!withdrawalForm.amount || !withdrawalForm.bank_name || !withdrawalForm.account_number || !withdrawalForm.account_holder_name) {
        setError(language === 'ko' 
          ? '필수 필드를 모두 입력해주세요.'
          : '必須フィールドをすべて入力してください。'
        )
        return
      }
      
      const amount = parseInt(withdrawalForm.amount)
      if (amount > points) {
        setError(language === 'ko' 
          ? '출금 가능한 포인트가 부족합니다.'
          : '出金可能なポイントが不足しています。'
        )
        return
      }
      
      await database.withdrawals.create({
        user_id: user.id,
        amount: amount,
        bank_info: withdrawalForm,
        status: 'pending'
      })
      
      setSuccess(language === 'ko' 
        ? '출금 신청이 완료되었습니다.'
        : '出金申請が完了しました。'
      )
      setWithdrawalModal(false)
      setWithdrawalForm({
        amount: '',
        bank_name: '',
        bank_code: '',
        branch_name: '',
        branch_code: '',
        account_type: 'savings',
        account_number: '',
        account_holder_name: '',
        account_holder_name_kana: '',
        address: '',
        phone: '',
        purpose: 'personal'
      })
      loadUserData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Withdrawal request error:', error)
      setError(language === 'ko' 
        ? '출금 신청에 실패했습니다.'
        : '出金申請に失敗しました。'
      )
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: language === 'ko' ? '검토중' : '審査中', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '승인됨' : '承認済み', icon: Check },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: language === 'ko' ? '거절됨' : '拒否', icon: X },
      content_uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', label: language === 'ko' ? '컨텐츠 업로드됨' : 'コンテンツアップロード済み', icon: Upload },
      points_requested: { bg: 'bg-purple-100', text: 'text-purple-800', label: language === 'ko' ? '포인트 요청됨' : 'ポイント要請済み', icon: CreditCard },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '완료' : '完了', icon: Check },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: language === 'ko' ? '취소됨' : 'キャンセル済み', icon: X }
    }
    
    const style = statusStyles[status] || statusStyles.pending
    const Icon = style.icon
    
    return (
      <Badge className={`${style.bg} ${style.text} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{style.label}</span>
      </Badge>
    )
  }

  const getApplicationActions = (application) => {
    const actions = []
    
    switch (application.status) {
      case 'pending':
        actions.push(
          <Button
            key="cancel"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedApplication(application)
              setCancelApplicationModal(true)
            }}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            {language === 'ko' ? '취소' : 'キャンセル'}
          </Button>
        )
        break
        
      case 'approved':
        // 구글 드라이브/슬라이드 링크 확인
        if (application.google_drive_link) {
          actions.push(
            <Button
              key="drive"
              variant="outline"
              size="sm"
              onClick={() => window.open(application.google_drive_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {language === 'ko' ? '드라이브' : 'ドライブ'}
            </Button>
          )
        }
        
        if (application.google_slides_link) {
          actions.push(
            <Button
              key="slides"
              variant="outline"
              size="sm"
              onClick={() => window.open(application.google_slides_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {language === 'ko' ? '가이드' : 'ガイド'}
            </Button>
          )
        }
        
        // SNS 업로드
        actions.push(
          <Button
            key="upload"
            size="sm"
            onClick={() => {
              setSelectedApplication(application)
              setSnsUrls(application.sns_urls || { instagram: '', tiktok: '', youtube: '', twitter: '' })
              setSnsUploadModal(true)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-1" />
            {language === 'ko' ? 'SNS 업로드' : 'SNSアップロード'}
          </Button>
        )
        break
        
      case 'content_uploaded':
        // 포인트 신청
        actions.push(
          <Button
            key="points"
            size="sm"
            onClick={() => {
              setSelectedApplication(application)
              setPointRequestModal(true)
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Award className="h-4 w-4 mr-1" />
            {language === 'ko' ? '포인트 신청' : 'ポイント申請'}
          </Button>
        )
        break
    }
    
    return actions
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ko' ? '로딩 중...' : '読み込み中...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 알림 메시지 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {language === 'ko' ? '마이페이지' : 'マイページ'}
          </h1>
          <p className="text-gray-600">
            {language === 'ko' ? '캠페인 신청 내역과 포인트를 관리하세요' : 'キャンペーン応募履歴とポイントを管理してください'}
          </p>
        </div>

        {/* 포인트 카드 */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-2">
                  {language === 'ko' ? '보유 포인트' : '保有ポイント'}
                </p>
                <p className="text-4xl font-bold">{formatCurrency(points)}</p>
              </div>
              <div className="text-right">
                <Button
                  variant="secondary"
                  onClick={() => setWithdrawalModal(true)}
                  disabled={points < 1000}
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {language === 'ko' ? '출금 신청' : '出金申請'}
                </Button>
                {points < 1000 && (
                  <p className="text-xs text-purple-200 mt-1">
                    {language === 'ko' ? '최소 ₩1,000부터 출금 가능' : '最低₩1,000から出金可能'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">
              {language === 'ko' ? '캠페인 신청' : 'キャンペーン応募'}
            </TabsTrigger>
            <TabsTrigger value="points">
              {language === 'ko' ? '포인트 내역' : 'ポイント履歴'}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              {language === 'ko' ? '출금 내역' : '出金履歴'}
            </TabsTrigger>
          </TabsList>

          {/* 캠페인 신청 탭 */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {language === 'ko' ? '신청한 캠페인이 없습니다' : '応募したキャンペーンはありません'}
                  </h3>
                  <p className="text-gray-500">
                    {language === 'ko' 
                      ? '새로운 캠페인에 참여해보세요!'
                      : '新しいキャンペーンに参加してみましょう！'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} className="shadow-lg border-0">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {application.campaigns?.title}
                          </h3>
                          {getStatusBadge(application.status)}
                        </div>
                        
                        <p className="text-purple-600 font-medium mb-2">
                          {application.campaigns?.brand}
                        </p>
                        <p className="text-gray-600 mb-2">
                          {formatCurrency(application.campaigns?.reward_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {language === 'ko' ? '신청일:' : '応募日:'} {formatDate(application.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 ml-6">
                        {getApplicationActions(application)}
                      </div>
                    </div>
                    
                    {/* SNS URL 표시 */}
                    {application.sns_urls && Object.keys(application.sns_urls).some(key => application.sns_urls[key]) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">
                          {language === 'ko' ? '업로드된 SNS URL' : 'アップロード済みSNS URL'}
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(application.sns_urls).map(([platform, url]) => (
                            url && (
                              <div key={platform} className="flex items-center space-x-2">
                                <span className="text-sm font-medium capitalize">{platform}:</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm truncate"
                                >
                                  {url}
                                </a>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 포인트 내역 탭 */}
          <TabsContent value="points">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>{language === 'ko' ? '포인트 내역' : 'ポイント履歴'}</CardTitle>
                <CardDescription>
                  {language === 'ko' ? '포인트 적립 및 사용 내역입니다' : 'ポイント獲得・使用履歴です'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  {language === 'ko' ? '포인트 내역이 없습니다' : 'ポイント履歴はありません'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 출금 내역 탭 */}
          <TabsContent value="withdrawals">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>{language === 'ko' ? '출금 내역' : '出金履歴'}</CardTitle>
                <CardDescription>
                  {language === 'ko' ? '출금 신청 및 처리 내역입니다' : '出金申請・処理履歴です'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ko' ? '출금 내역이 없습니다' : '出金履歴はありません'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(withdrawal.created_at)}</p>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SNS 업로드 모달 */}
        <Dialog open={snsUploadModal} onOpenChange={setSnsUploadModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? 'SNS URL 등록' : 'SNS URL登録'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? '업로드한 SNS 컨텐츠의 URL을 등록해주세요.'
                  : 'アップロードしたSNSコンテンツのURLを登録してください。'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {Object.entries(snsUrls).map(([platform, url]) => (
                <div key={platform} className="space-y-2">
                  <Label htmlFor={platform} className="capitalize">
                    {platform} URL
                  </Label>
                  <Input
                    id={platform}
                    value={url}
                    onChange={(e) => setSnsUrls(prev => ({ ...prev, [platform]: e.target.value }))}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setSnsUploadModal(false)}>
                {language === 'ko' ? '취소' : 'キャンセル'}
              </Button>
              <Button onClick={handleSnsUpload} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ko' ? '등록' : '登録'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 포인트 신청 모달 */}
        <Dialog open={pointRequestModal} onOpenChange={setPointRequestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? '포인트 지급 요청' : 'ポイント支給要請'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? '관리자에게 포인트 지급을 요청합니다.'
                  : '管理者にポイント支給を要請します。'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-gray-600">
                {language === 'ko' 
                  ? '캠페인을 완료하셨나요? 포인트 지급을 요청하시면 관리자가 검토 후 지급해드립니다.'
                  : 'キャンペーンを完了しましたか？ポイント支給を要請すると管理者が検討後支給いたします。'
                }
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setPointRequestModal(false)}>
                {language === 'ko' ? '취소' : 'キャンセル'}
              </Button>
              <Button onClick={handlePointRequest} className="bg-purple-600 hover:bg-purple-700">
                <Award className="h-4 w-4 mr-2" />
                {language === 'ko' ? '요청' : '要請'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 출금 신청 모달 */}
        <Dialog open={withdrawalModal} onOpenChange={setWithdrawalModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? '출금 신청' : '出金申請'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? '일본 은행 계좌로 송금하기 위한 정보를 입력해주세요.'
                  : '日本の銀行口座への送金のための情報を入力してください。'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 출금 금액 */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {language === 'ko' ? '출금 금액 (₩)' : '出金金額 (₩)'} *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1000"
                  max={points}
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500">
                  {language === 'ko' 
                    ? `최소 ₩1,000, 최대 ${formatCurrency(points)}`
                    : `最低₩1,000、最大${formatCurrency(points)}`
                  }
                </p>
              </div>

              {/* 은행 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ko' ? '은행 정보' : '銀行情報'}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">
                      {language === 'ko' ? '은행명' : '銀行名'} *
                    </Label>
                    <Input
                      id="bank_name"
                      value={withdrawalForm.bank_name}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder={language === 'ko' ? '예: 미즈호은행' : '例: みずほ銀行'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bank_code">
                      {language === 'ko' ? '은행 코드' : '銀行コード'}
                    </Label>
                    <Input
                      id="bank_code"
                      value={withdrawalForm.bank_code}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bank_code: e.target.value }))}
                      placeholder="0001"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch_name">
                      {language === 'ko' ? '지점명' : '支店名'} *
                    </Label>
                    <Input
                      id="branch_name"
                      value={withdrawalForm.branch_name}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, branch_name: e.target.value }))}
                      placeholder={language === 'ko' ? '예: 신주쿠지점' : '例: 新宿支店'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch_code">
                      {language === 'ko' ? '지점 코드' : '支店コード'}
                    </Label>
                    <Input
                      id="branch_code"
                      value={withdrawalForm.branch_code}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, branch_code: e.target.value }))}
                      placeholder="001"
                    />
                  </div>
                </div>
              </div>

              {/* 계좌 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ko' ? '계좌 정보' : '口座情報'}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_type">
                      {language === 'ko' ? '계좌 종류' : '口座種別'}
                    </Label>
                    <Select
                      value={withdrawalForm.account_type}
                      onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, account_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">
                          {language === 'ko' ? '보통예금' : '普通預金'}
                        </SelectItem>
                        <SelectItem value="checking">
                          {language === 'ko' ? '당좌예금' : '当座預金'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account_number">
                      {language === 'ko' ? '계좌번호' : '口座番号'} *
                    </Label>
                    <Input
                      id="account_number"
                      value={withdrawalForm.account_number}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="1234567"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_holder_name">
                      {language === 'ko' ? '예금주명 (한자/히라가나)' : '口座名義 (漢字・ひらがな)'} *
                    </Label>
                    <Input
                      id="account_holder_name"
                      value={withdrawalForm.account_holder_name}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      placeholder={language === 'ko' ? '예: 김철수' : '例: 田中太郎'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account_holder_name_kana">
                      {language === 'ko' ? '예금주명 (카타카나)' : '口座名義 (カタカナ)'} *
                    </Label>
                    <Input
                      id="account_holder_name_kana"
                      value={withdrawalForm.account_holder_name_kana}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, account_holder_name_kana: e.target.value }))}
                      placeholder={language === 'ko' ? '예: キムチョルス' : '例: タナカタロウ'}
                    />
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ko' ? '연락처 정보' : '連絡先情報'}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {language === 'ko' ? '주소' : '住所'} *
                  </Label>
                  <Textarea
                    id="address"
                    value={withdrawalForm.address}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={language === 'ko' 
                      ? '예: 도쿄도 신주쿠구 신주쿠 1-1-1'
                      : '例: 東京都新宿区新宿1-1-1'
                    }
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === 'ko' ? '전화번호' : '電話番号'} *
                  </Label>
                  <Input
                    id="phone"
                    value={withdrawalForm.phone}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="090-1234-5678"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">
                    {language === 'ko' ? '송금 목적' : '送金目的'}
                  </Label>
                  <Select
                    value={withdrawalForm.purpose}
                    onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, purpose: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">
                        {language === 'ko' ? '개인용' : '個人用'}
                      </SelectItem>
                      <SelectItem value="business">
                        {language === 'ko' ? '사업용' : '事業用'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setWithdrawalModal(false)}>
                {language === 'ko' ? '취소' : 'キャンセル'}
              </Button>
              <Button onClick={handleWithdrawalRequest} className="bg-green-600 hover:bg-green-700">
                <DollarSign className="h-4 w-4 mr-2" />
                {language === 'ko' ? '출금 신청' : '出金申請'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 신청 취소 모달 */}
        <Dialog open={cancelApplicationModal} onOpenChange={setCancelApplicationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ko' ? '캠페인 신청 취소' : 'キャンペーン応募キャンセル'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? '정말로 이 캠페인 신청을 취소하시겠습니까?'
                  : '本当にこのキャンペーン応募をキャンセルしますか？'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setCancelApplicationModal(false)}>
                {language === 'ko' ? '아니오' : 'いいえ'}
              </Button>
              <Button onClick={handleCancelApplication} variant="destructive">
                <X className="h-4 w-4 mr-2" />
                {language === 'ko' ? '취소' : 'キャンセル'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MyPageEnhanced
