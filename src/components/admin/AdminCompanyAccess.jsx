import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, supabase } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Loader2, Plus, Edit, Trash2, Eye, Copy, ExternalLink, 
  AlertCircle, CheckCircle, Building, Key, Link as LinkIcon,
  Calendar, RefreshCw, Search, Filter
} from 'lucide-react'

const AdminCompanyAccess = () => {
  const { language } = useLanguage()
  
  const [companies, setCompanies] = useState([])
  const [accessTokens, setAccessTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [createCompanyModal, setCreateCompanyModal] = useState(false)
  const [createTokenModal, setCreateTokenModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    contact_person: '',
    phone: '',
    address: '',
    description: ''
  })
  
  const [tokenForm, setTokenForm] = useState({
    company_id: '',
    description: '',
    expires_at: ''
  })

  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 회사 목록 로드
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (companiesError) throw companiesError
      setCompanies(companiesData || [])
      
      // 액세스 토큰 로드
      const { data: tokensData, error: tokensError } = await supabase
        .from('company_access_tokens')
        .select(`
          *,
          companies (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
      
      if (tokensError) throw tokensError
      setAccessTokens(tokensData || [])
      
    } catch (error) {
      console.error('Load data error:', error)
      setError(language === 'ko' 
        ? '데이터를 불러올 수 없습니다.'
        : 'データを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    try {
      setProcessing(true)
      setError('')
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyForm,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setSuccess(language === 'ko' 
        ? '회사가 생성되었습니다.'
        : '会社が作成されました。'
      )
      setCreateCompanyModal(false)
      resetCompanyForm()
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Create company error:', error)
      setError(language === 'ko' 
        ? '회사 생성에 실패했습니다.'
        : '会社の作成に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateAccessToken = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 랜덤 토큰 생성
      const token = generateSecureToken()
      
      const { data, error } = await supabase
        .from('company_access_tokens')
        .insert([{
          company_id: tokenForm.company_id,
          token: token,
          description: tokenForm.description,
          expires_at: tokenForm.expires_at || null,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setSuccess(language === 'ko' 
        ? '액세스 토큰이 생성되었습니다.'
        : 'アクセストークンが作成されました。'
      )
      setCreateTokenModal(false)
      resetTokenForm()
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Create access token error:', error)
      setError(language === 'ko' 
        ? '액세스 토큰 생성에 실패했습니다.'
        : 'アクセストークンの作成に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleTokenStatus = async (tokenId, currentStatus) => {
    try {
      setProcessing(true)
      setError('')
      
      const { data, error } = await supabase
        .from('company_access_tokens')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .select()
        .single()
      
      if (error) throw error
      
      setSuccess(language === 'ko' 
        ? '토큰 상태가 변경되었습니다.'
        : 'トークン状態が変更されました。'
      )
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Toggle token status error:', error)
      setError(language === 'ko' 
        ? '토큰 상태 변경에 실패했습니다.'
        : 'トークン状態の変更に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteToken = async (tokenId) => {
    if (!confirm(language === 'ko' 
      ? '정말로 이 토큰을 삭제하시겠습니까?'
      : '本当にこのトークンを삭제しますか？'
    )) return
    
    try {
      setProcessing(true)
      setError('')
      
      const { error } = await supabase
        .from('company_access_tokens')
        .delete()
        .eq('id', tokenId)
      
      if (error) throw error
      
      setSuccess(language === 'ko' 
        ? '토큰이 삭제되었습니다.'
        : 'トークンが삭제されました。'
      )
      
      // 데이터 새로고침
      await loadData()
      
    } catch (error) {
      console.error('Delete token error:', error)
      setError(language === 'ko' 
        ? '토큰 삭제에 실패했습니다.'
        : 'トークンの삭제に실패했습니다。'
      )
    } finally {
      setProcessing(false)
    }
  }

  const generateSecureToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess(language === 'ko' 
        ? '클립보드에 복사되었습니다.'
        : 'クリップボードにコピーされました。'
      )
    } catch (error) {
      console.error('Copy to clipboard error:', error)
      setError(language === 'ko' 
        ? '클립보드 복사에 실패했습니다.'
        : 'クリップボードへのコピーに실패했습니다。'
      )
    }
  }

  const generateReportUrl = (companyId, token) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/company-report/${companyId}?token=${token}`
  }

  const resetCompanyForm = () => {
    setCompanyForm({
      name: '',
      email: '',
      contact_person: '',
      phone: '',
      address: '',
      description: ''
    })
  }

  const resetTokenForm = () => {
    setTokenForm({
      company_id: '',
      description: '',
      expires_at: ''
    })
  }

  const getStatusBadge = (isActive, expiresAt) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date()
    
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800">
          {language === 'ko' ? '만료됨' : '期限切れ'}
        </Badge>
      )
    }
    
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800">
          {language === 'ko' ? '활성' : 'アクティブ'}
        </Badge>
      )
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-800">
        {language === 'ko' ? '비활성' : '非アクティブ'}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  const filteredTokens = accessTokens.filter(token => {
    if (filters.search && !token.companies?.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !token.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status !== 'all') {
      const isExpired = token.expires_at && new Date(token.expires_at) < new Date()
      if (filters.status === 'active' && (!token.is_active || isExpired)) return false
      if (filters.status === 'inactive' && (token.is_active && !isExpired)) return false
      if (filters.status === 'expired' && !isExpired) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {language === 'ko' ? '회사 액세스 관리' : '会社アクセス管理'}
          </h1>
          <p className="text-gray-600">
            {language === 'ko' 
              ? '회사별 리포트 액세스 토큰을 관리합니다.'
              : '会社別보고서アクセストークンを管理します。'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setCreateCompanyModal(true)}
          >
            <Building className="h-4 w-4 mr-2" />
            {language === 'ko' ? '회사 추가' : '会社추가'}
          </Button>
          <Button
            onClick={() => setCreateTokenModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Key className="h-4 w-4 mr-2" />
            {language === 'ko' ? '토큰 생성' : 'トークン作成'}
          </Button>
          <Button
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ko' ? '새로고침' : '업데이트'}
          </Button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'ko' ? '검색' : '검색'}</Label>
              <Input
                placeholder={language === 'ko' ? '회사명 또는 설명 검색' : '会社名または설명검색'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ko' ? '상태' : '状態'}</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ko' ? '전체' : '全て'}</SelectItem>
                  <SelectItem value="active">{language === 'ko' ? '활성' : 'アクティブ'}</SelectItem>
                  <SelectItem value="inactive">{language === 'ko' ? '비활성' : '非アクティブ'}</SelectItem>
                  <SelectItem value="expired">{language === 'ko' ? '만료됨' : '期限切れ'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액세스 토큰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>{language === 'ko' ? '액세스 토큰 목록' : 'アクセストークン목록'}</span>
          </CardTitle>
          <CardDescription>
            {language === 'ko' 
              ? '회사별 리포트 액세스를 위한 토큰을 관리합니다.'
              : '会社別보고서アクセス用のトークンを管理します。'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {language === 'ko' ? '액세스 토큰이 없습니다' : 'アクセストークンはありません'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {language === 'ko' 
                    ? '새로운 액세스 토큰을 생성해보세요.'
                    : '新しいアクセストークンを作成してみましょう。'
                  }
                </p>
                <Button
                  onClick={() => setCreateTokenModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {language === 'ko' ? '첫 토큰 생성' : '最初のトークンを作成'}
                </Button>
              </div>
            ) : (
              filteredTokens.map((token) => (
                <Card key={token.id} className="border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {token.companies?.name || 'Unknown Company'}
                          </h4>
                          {getStatusBadge(token.is_active, token.expires_at)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            {language === 'ko' ? '설명:' : '설명:'} {token.description || 'N/A'}
                          </p>
                          <p>
                            {language === 'ko' ? '생성일:' : '생성일:'} {formatDate(token.created_at)}
                          </p>
                          {token.expires_at && (
                            <p>
                              {language === 'ko' ? '만료일:' : '有効期限:'} {formatDate(token.expires_at)}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {token.token.substring(0, 20)}...
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(token.token)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateReportUrl(token.company_id, token.token))}
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          {language === 'ko' ? 'URL 복사' : 'URLコピー'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(generateReportUrl(token.company_id, token.token), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {language === 'ko' ? '리포트 보기' : '보고서표시'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTokenStatus(token.id, token.is_active)}
                          disabled={processing}
                        >
                          {token.is_active ? 
                            (language === 'ko' ? '비활성화' : '無効化') : 
                            (language === 'ko' ? '활성화' : '有効化')
                          }
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteToken(token.id)}
                          disabled={processing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 회사 생성 모달 */}
      <Dialog open={createCompanyModal} onOpenChange={setCreateCompanyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '새 회사 추가' : '新規会社추가'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko' 
                ? '새로운 회사 정보를 입력하세요.'
                : '新しい会社情報を入力してください。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">{language === 'ko' ? '회사명' : '会社名'}</Label>
                <Input
                  id="company_name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'ko' ? '회사명을 입력하세요' : '会社名を入力してください'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_email">{language === 'ko' ? '이메일' : 'メールアドレス'}</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="company@example.com"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">{language === 'ko' ? '담당자' : '担当者'}</Label>
                <Input
                  id="contact_person"
                  value={companyForm.contact_person}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder={language === 'ko' ? '담당자명을 입력하세요' : '担当者名を入力してください'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_phone">{language === 'ko' ? '전화번호' : '電話番号'}</Label>
                <Input
                  id="company_phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="03-1234-5678"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_address">{language === 'ko' ? '주소' : '住所'}</Label>
              <Input
                id="company_address"
                value={companyForm.address}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder={language === 'ko' ? '회사 주소를 입력하세요' : '会社住所を入力してください'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_description">{language === 'ko' ? '설명' : '설명'}</Label>
              <Textarea
                id="company_description"
                value={companyForm.description}
                onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'ko' ? '회사에 대한 간단한 설명' : '会社についての簡単な설명'}
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateCompany}
                disabled={processing || !companyForm.name || !companyForm.email}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Building className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '회사 생성' : '会社作成'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateCompanyModal(false)
                  resetCompanyForm()
                }}
              >
                {language === 'ko' ? '취소' : '취소'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 토큰 생성 모달 */}
      <Dialog open={createTokenModal} onOpenChange={setCreateTokenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ko' ? '액세스 토큰 생성' : 'アクセストークン作成'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko' 
                ? '회사별 리포트 액세스를 위한 토큰을 생성합니다.'
                : '会社別보고서アクセス用のトークンを作成します。'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token_company">{language === 'ko' ? '회사 선택' : '会社選択'}</Label>
              <Select 
                value={tokenForm.company_id} 
                onValueChange={(value) => setTokenForm(prev => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ko' ? '회사를 선택하세요' : '会社を選択してください'} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token_description">{language === 'ko' ? '설명' : '설명'}</Label>
              <Input
                id="token_description"
                value={tokenForm.description}
                onChange={(e) => setTokenForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={language === 'ko' ? '토큰 용도 설명' : 'トークン用途설명'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token_expires">{language === 'ko' ? '만료일 (선택사항)' : '有効期限 (任意)'}</Label>
              <Input
                id="token_expires"
                type="date"
                value={tokenForm.expires_at}
                onChange={(e) => setTokenForm(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateAccessToken}
                disabled={processing || !tokenForm.company_id}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                {language === 'ko' ? '토큰 생성' : 'トークン作成'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateTokenModal(false)
                  resetTokenForm()
                }}
              >
                {language === 'ko' ? '취소' : '취소'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminCompanyAccess
