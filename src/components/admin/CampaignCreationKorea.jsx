import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { database, storage } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const CampaignCreationKorea = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    brand: '',
    description: '',
    requirements: '',
    category: 'youtube',  // youtube, instagram, 4week_challenge
    image_url: '',
    reward_amount: '',
    max_participants: '',
    application_deadline: '',
    start_date: '',
    end_date: '',
    status: 'active',
    target_platforms: {
      instagram: false,
      youtube: true,
      tiktok: false
    }
  })

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState(null)

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'youtube', label: '🎬 유튜브 모집', platforms: { youtube: true, instagram: false, tiktok: false } },
    { value: 'instagram', label: '📸 인스타 모집', platforms: { instagram: true, youtube: false, tiktok: false } },
    { value: '4week_challenge', label: '🏆 4주 챌린지', platforms: { instagram: true, youtube: true, tiktok: true } }
  ]

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (editId) {
      loadCampaignData()
    }
  }, [editId])

  const loadCampaignData = async () => {
    try {
      const { data, error } = await database
        .from('campaigns')
        .select('*')
        .eq('id', editId)
        .single()

      if (error) throw error
      
      if (data) {
        setCampaignForm({
          ...data,
          target_platforms: data.target_platforms || { instagram: true, youtube: false, tiktok: false }
        })
      }
    } catch (err) {
      console.error('캠페인 데이터 로드 실패:', err)
      setError('캠페인 데이터를 불러오는데 실패했습니다.')
    }
  }

  // 카테고리 변경 시 target_platforms 자동 업데이트
  const handleCategoryChange = (value) => {
    const selected = categoryOptions.find(opt => opt.value === value)
    setCampaignForm(prev => ({
      ...prev,
      category: value,
      target_platforms: selected ? selected.platforms : prev.target_platforms
    }))
  }

  // 이미지 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `campaign-images/${fileName}`

      const { error: uploadError } = await storage
        .from('campaign-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = storage
        .from('campaign-images')
        .getPublicUrl(filePath)

      setCampaignForm(prev => ({ ...prev, image_url: publicUrl }))
      setSuccess('이미지가 업로드되었습니다!')
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
      setError('이미지 업로드에 실패했습니다: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  // 캠페인 저장
  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const campaignData = {
        ...campaignForm,
        reward_amount: parseInt(campaignForm.reward_amount),
        max_participants: parseInt(campaignForm.max_participants)
      }

      if (editId) {
        // 수정
        const { error } = await database
          .from('campaigns')
          .update(campaignData)
          .eq('id', editId)

        if (error) throw error
        setSuccess('캠페인이 수정되었습니다!')
      } else {
        // 신규 생성
        const { error } = await database
          .from('campaigns')
          .insert([campaignData])

        if (error) throw error
        setSuccess('캠페인이 생성되었습니다!')
      }

      setTimeout(() => {
        navigate('/campaigns-manage')
      }, 1500)
    } catch (err) {
      console.error('캠페인 저장 실패:', err)
      setError('캠페인 저장에 실패했습니다: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {editId ? '캠페인 수정' : '새 캠페인 생성'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <Label htmlFor="category">캠페인 카테고리 *</Label>
                <Select value={campaignForm.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 캠페인 제목 */}
              <div>
                <Label htmlFor="title">캠페인 제목 *</Label>
                <Input
                  id="title"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 신제품 립스틱 리뷰 캠페인"
                  required
                />
              </div>

              {/* 브랜드명 */}
              <div>
                <Label htmlFor="brand">브랜드명 *</Label>
                <Input
                  id="brand"
                  value={campaignForm.brand}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="예: 에이블씨엔씨"
                  required
                />
              </div>

              {/* 캠페인 설명 */}
              <div>
                <Label htmlFor="description">캠페인 설명 *</Label>
                <Textarea
                  id="description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="캠페인에 대한 상세 설명을 입력하세요"
                  rows={4}
                  required
                />
              </div>

              {/* 참여 조건 */}
              <div>
                <Label htmlFor="requirements">참여 조건</Label>
                <Textarea
                  id="requirements"
                  value={campaignForm.requirements}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="예: 팔로워 1,000명 이상, 뷰티 콘텐츠 제작 경험"
                  rows={3}
                />
              </div>

              {/* 보상 포인트 */}
              <div>
                <Label htmlFor="reward_amount">보상 포인트 *</Label>
                <Input
                  id="reward_amount"
                  type="number"
                  value={campaignForm.reward_amount}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, reward_amount: e.target.value }))}
                  placeholder="예: 100000"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {campaignForm.reward_amount && `₩${parseInt(campaignForm.reward_amount).toLocaleString()}`}
                </p>
              </div>

              {/* 모집 인원 */}
              <div>
                <Label htmlFor="max_participants">모집 인원 *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={campaignForm.max_participants}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, max_participants: e.target.value }))}
                  placeholder="예: 10"
                  required
                />
              </div>

              {/* 날짜 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="application_deadline">지원 마감일 *</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={campaignForm.application_deadline}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, application_deadline: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">캠페인 시작일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">캠페인 종료일 *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <Label htmlFor="image">캠페인 이미지</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-sm text-gray-500 mt-1">업로드 중...</p>}
                {campaignForm.image_url && (
                  <img src={campaignForm.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                )}
              </div>

              {/* 상태 */}
              <div>
                <Label htmlFor="status">캠페인 상태</Label>
                <Select value={campaignForm.status} onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">모집 중</SelectItem>
                    <SelectItem value="closed">종료</SelectItem>
                    <SelectItem value="draft">임시저장</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 에러/성공 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-4">
                <Button type="submit" disabled={processing} className="flex-1">
                  {processing ? '저장 중...' : (editId ? '수정하기' : '생성하기')}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/campaigns-manage')}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CampaignCreationKorea
