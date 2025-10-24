import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit, Trash2, Eye, Search, Filter, ArrowLeft, Save, X, Calendar, DollarSign } from 'lucide-react'

const AdminCampaigns = () => {
  const { user } = useAuth()
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // 캠페인 편집/생성 모달
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    description: '',
    reward_amount: '',
    status: 'draft',
    platforms: [],
    questions: []
  })

  useEffect(() => {
    // 관리자 권한 확인
    if (!user || !user.email?.includes('mkt_biz@cnec.co.kr')) {
      navigate('/')
      return
    }

    loadCampaigns()
  }, [user, navigate])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      setError('')
      
      const campaignsData = await database.campaigns.getAll()
      setCampaigns(campaignsData || [])
    } catch (error) {
      console.error('Load campaigns error:', error)
      setError(language === 'ko' 
        ? '캠페인을 불러올 수 없습니다.'
        : 'キャンペーンを読み込めません。'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `question_${Date.now()}`,
          question: '',
          type: 'text',
          required: false
        }
      ]
    }))
  }

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const openCreateModal = () => {
    setEditingCampaign(null)
    setFormData({
      title: '',
      brand: '',
      description: '',
      reward_amount: '',
      status: 'draft',
      platforms: [],
      questions: []
    })
    setEditModalOpen(true)
  }

  const openEditModal = (campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      title: campaign.title || '',
      brand: campaign.brand || '',
      description: campaign.description || '',
      reward_amount: campaign.reward_amount || '',
      status: campaign.status || 'draft',
      platforms: campaign.platforms || [],
      questions: campaign.questions || []
    })
    setEditModalOpen(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // 폼 검증
      if (!formData.title || !formData.brand || !formData.reward_amount) {
        setError(language === 'ko' 
          ? '필수 필드를 모두 입력해주세요.'
          : '必須フィールドをすべて入力してください。'
        )
        return
      }

      const campaignData = {
        title: formData.title,
        brand: formData.brand,
        description: formData.description,
        reward_amount: parseInt(formData.reward_amount),
        status: formData.status,
        platforms: formData.platforms,
        questions: formData.questions
      }

      if (editingCampaign) {
        // 기존 캠페인 업데이트
        await database.campaigns.update(editingCampaign.id, campaignData)
        setSuccess(language === 'ko' 
          ? '캠페인이 성공적으로 업데이트되었습니다.'
          : 'キャンペーンが正常に업데이트されました。'
        )
      } else {
        // 새 캠페인 생성
        await database.campaigns.create(campaignData)
        setSuccess(language === 'ko' 
          ? '새 캠페인이 성공적으로 생성되었습니다.'
          : '新しいキャンペーンが正常に作成されました。'
        )
      }

      setEditModalOpen(false)
      loadCampaigns()
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Save campaign error:', error)
      setError(language === 'ko' 
        ? '캠페인 저장에 실패했습니다.'
        : 'キャンペーンの저장に실패했습니다。'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (campaignId) => {
    if (!confirm(language === 'ko' 
      ? '정말로 이 캠페인을 삭제하시겠습니까?'
      : '本当にこのキャンペーンを삭제しますか？'
    )) {
      return
    }

    try {
      await database.campaigns.delete(campaignId)
      setSuccess(language === 'ko' 
        ? '캠페인이 삭제되었습니다.'
        : 'キャンペーンが삭제されました。'
      )
      loadCampaigns()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Delete campaign error:', error)
      setError(language === 'ko' 
        ? '캠페인 삭제에 실패했습니다.'
        : 'キャンペーンの삭제に실패했습니다。'
      )
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: language === 'ko' ? '활성' : 'アクティブ' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: language === 'ko' ? '비활성' : '非アクティブ' },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: language === 'ko' ? '초안' : '下書き' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: language === 'ko' ? '완료' : '완료' }
    }
    
    const style = statusStyles[status] || statusStyles.draft
    
    return (
      <Badge className={`${style.bg} ${style.text}`}>
        {style.label}
      </Badge>
    )
  }

  // 필터링된 캠페인
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
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
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ko' ? '대시보드로' : '대시보드へ'}
              </Button>
              
              <h1 className="text-xl font-bold text-gray-800">
                {language === 'ko' ? '캠페인 관리' : '캠페인 관리'}
              </h1>
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
              
              <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'ko' ? '새 캠페인' : '新キャンペーン'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 알림 메시지 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 검색 및 필터 */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={language === 'ko' ? '캠페인 제목이나 브랜드로 검색...' : '캠페인 제목やブランドで검색...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ko' ? '모든 상태' : '全ての状態'}</SelectItem>
                    <SelectItem value="active">{language === 'ko' ? '활성' : 'アクティブ'}</SelectItem>
                    <SelectItem value="inactive">{language === 'ko' ? '비활성' : '非アクティブ'}</SelectItem>
                    <SelectItem value="draft">{language === 'ko' ? '초안' : '下書き'}</SelectItem>
                    <SelectItem value="completed">{language === 'ko' ? '완료' : '완료'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 캠페인 목록 */}
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {language === 'ko' ? '캠페인이 없습니다' : 'キャンペーンはありません'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {language === 'ko' 
                    ? '새로운 캠페인을 생성해보세요!'
                    : '新しいキャンペーンを作成してみましょう！'
                  }
                </p>
                <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'ko' ? '첫 캠페인 만들기' : '最初のキャンペーンを作成'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{campaign.title}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      
                      <p className="text-purple-600 font-medium mb-2">{campaign.brand}</p>
                      <p className="text-gray-600 mb-4">{campaign.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>{formatCurrency(campaign.reward_amount)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(campaign.created_at)}</span>
                        </div>
                        {campaign.platforms && campaign.platforms.length > 0 && (
                          <div className="flex space-x-1">
                            {campaign.platforms.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/campaign-application?campaign_id=${campaign.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(campaign)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600 hover:text-red-700"
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

        {/* 캠페인 편집/생성 모달 */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign 
                  ? (language === 'ko' ? '캠페인 편집' : 'キャンペーン편집')
                  : (language === 'ko' ? '새 캠페인 생성' : '新캠페인 생성')
                }
              </DialogTitle>
              <DialogDescription>
                {language === 'ko' 
                  ? '캠페인 정보를 입력하고 저장하세요.'
                  : 'キャンペーン情報を入力して저장してください。'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ko' ? '기본 정보' : '基本情報'}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      {language === 'ko' ? '캠페인 제목' : '캠페인 제목'} *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={language === 'ko' ? '캠페인 제목을 입력하세요' : '캠페인 제목を入力してください'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brand">
                      {language === 'ko' ? '브랜드명' : 'ブランド名'} *
                    </Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder={language === 'ko' ? '브랜드명을 입력하세요' : 'ブランド名を入力してください'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {language === 'ko' ? '캠페인 설명' : 'キャンペーン설명'}
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={language === 'ko' ? '캠페인에 대한 자세한 설명을 입력하세요' : 'キャンペーンの상세설명を入力してください'}
                    rows={3}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reward_amount">
                      {language === 'ko' ? '보상 금액 (₩)' : '보상金額 (₩)'} *
                    </Label>
                    <Input
                      id="reward_amount"
                      name="reward_amount"
                      type="number"
                      min="0"
                      value={formData.reward_amount}
                      onChange={handleInputChange}
                      placeholder="50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      {language === 'ko' ? '상태' : '状態'}
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{language === 'ko' ? '초안' : '下書き'}</SelectItem>
                        <SelectItem value="active">{language === 'ko' ? '활성' : 'アクティブ'}</SelectItem>
                        <SelectItem value="inactive">{language === 'ko' ? '비활성' : '非アクティブ'}</SelectItem>
                        <SelectItem value="completed">{language === 'ko' ? '완료' : '완료'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 플랫폼 선택 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ko' ? '대상 플랫폼' : '対象プラットフォーム'}
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {['instagram', 'tiktok', 'youtube', 'twitter'].map((platform) => (
                    <Button
                      key={platform}
                      type="button"
                      variant={formData.platforms.includes(platform) ? 'default' : 'outline'}
                      onClick={() => handlePlatformToggle(platform)}
                      className="capitalize"
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 질문 관리 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {language === 'ko' ? '캠페인 질문' : 'キャンペーン質問'}
                  </h3>
                  <Button type="button" variant="outline" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ko' ? '질문 추가' : '質問추가'}
                  </Button>
                </div>
                
                {formData.questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>
                        {language === 'ko' ? '질문' : '質問'} {index + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Input
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder={language === 'ko' ? '질문 내용을 입력하세요' : '質問内容を入力してください'}
                    />
                    
                    <div className="flex items-center space-x-4">
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(index, 'type', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">{language === 'ko' ? '텍스트' : 'テキスト'}</SelectItem>
                          <SelectItem value="textarea">{language === 'ko' ? '장문' : '長文'}</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                        />
                        <span className="text-sm">{language === 'ko' ? '필수' : '必須'}</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                >
                  {language === 'ko' ? '취소' : '취소'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingCampaign 
                    ? (language === 'ko' ? '업데이트' : '업데이트')
                    : (language === 'ko' ? '생성' : '作成')
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminCampaigns
