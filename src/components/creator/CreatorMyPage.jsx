import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import { compressImage, isImageFile } from '../../lib/imageCompression'
import {
  User, Settings, FileText, DollarSign, LogOut, ChevronRight,
  Camera, Edit3, Phone, Mail, MapPin, Instagram, Youtube, Hash,
  Award, Star, Clock, CheckCircle, AlertCircle, Loader2, X,
  CreditCard, Building2, Shield, Eye, EyeOff, Trash2, ExternalLink
} from 'lucide-react'

const CreatorMyPage = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [activeSection, setActiveSection] = useState('overview') // overview, profile, applications, points, settings
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 프로필 편집 관련
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  // 출금 관련
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: ''
  })

  const koreanBanks = [
    'KB국민은행', '신한은행', '우리은행', 'NH농협은행', '하나은행',
    'IBK기업은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크'
  ]

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // 프로필 가져오기
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setPhotoPreview(profileData?.profile_photo_url)
      setEditForm({
        name: profileData?.name || '',
        phone: profileData?.phone || '',
        bio: profileData?.bio || '',
        age: profileData?.age || '',
        postcode: profileData?.postcode || '',
        address: profileData?.address || '',
        detail_address: profileData?.detail_address || '',
        skin_type: profileData?.skin_type || '',
        instagram_url: profileData?.instagram_url || '',
        tiktok_url: profileData?.tiktok_url || '',
        youtube_url: profileData?.youtube_url || '',
        bank_name: profileData?.bank_name || '',
        bank_account_number: profileData?.bank_account_number || '',
        bank_account_holder: profileData?.bank_account_holder || ''
      })

      // 지원 내역
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (
            id, title, brand, image_url, reward_points,
            creator_points_override, content_submission_deadline,
            campaign_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(apps || [])

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)

      let uploadFile = file
      if (isImageFile(file)) {
        uploadFile = await compressImage(file, { maxWidth: 400, quality: 0.8 })
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, uploadFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      setPhotoPreview(publicUrl)

      // 즉시 DB 업데이트
      await supabase
        .from('user_profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id)

      setSuccess('프로필 사진이 업데이트되었습니다')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('사진 업로드 오류:', error)
      setError('사진 업로드에 실패했습니다')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setProcessing(true)

      const updateData = {
        name: editForm.name,
        phone: editForm.phone,
        bio: editForm.bio,
        age: editForm.age ? parseInt(editForm.age) : null,
        postcode: editForm.postcode,
        address: editForm.address,
        detail_address: editForm.detail_address,
        skin_type: editForm.skin_type,
        instagram_url: editForm.instagram_url,
        tiktok_url: editForm.tiktok_url,
        youtube_url: editForm.youtube_url,
        bank_name: editForm.bank_name,
        bank_account_number: editForm.bank_account_number,
        bank_account_holder: editForm.bank_account_holder,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, ...updateData }))
      setIsEditing(false)
      setSuccess('프로필이 저장되었습니다')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('프로필 저장 오류:', error)
      setError('프로필 저장에 실패했습니다')
    } finally {
      setProcessing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: '검토중' },
      approved: { color: 'bg-green-100 text-green-700', label: '승인됨' },
      selected: { color: 'bg-blue-100 text-blue-700', label: '선정됨' },
      rejected: { color: 'bg-red-100 text-red-700', label: '거절됨' },
      filming: { color: 'bg-orange-100 text-orange-700', label: '촬영중' },
      video_submitted: { color: 'bg-purple-100 text-purple-700', label: '영상제출' },
      completed: { color: 'bg-gray-100 text-gray-700', label: '완료' },
      paid: { color: 'bg-green-100 text-green-700', label: '정산완료' }
    }
    return badges[status] || { color: 'bg-gray-100 text-gray-600', label: status }
  }

  const menuItems = [
    { id: 'overview', icon: User, label: '프로필 요약' },
    { id: 'profile', icon: Edit3, label: '프로필 수정' },
    { id: 'applications', icon: FileText, label: '지원 내역' },
    { id: 'points', icon: DollarSign, label: '포인트/정산' },
    { id: 'settings', icon: Settings, label: '설정' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-5 mt-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      {/* 프로필 헤더 카드 */}
      <div className="px-5 pt-5">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            {/* 프로필 사진 */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 border-4 border-white/20">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={32} className="text-gray-500" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">
                {profile?.name || '이름 미등록'}
              </h2>
              <p className="text-gray-400 text-sm mb-2">{user?.email}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/30 rounded-full text-xs font-medium">
                  <Star size={10} /> 새싹 크리에이터
                </span>
              </div>
            </div>
          </div>

          {/* 요약 통계 */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold">{applications.filter(a => a.status === 'approved' || a.status === 'selected').length}</p>
              <p className="text-xs text-gray-400">진행중</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{applications.filter(a => a.status === 'completed' || a.status === 'paid').length}</p>
              <p className="text-xs text-gray-400">완료</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(profile?.total_points || 0).replace('원', '')}</p>
              <p className="text-xs text-gray-400">포인트</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 탭 */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id)
                if (item.id === 'profile') setIsEditing(true)
                else setIsEditing(false)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 섹션 콘텐츠 */}
      <div className="px-5">
        {/* 프로필 요약 */}
        {activeSection === 'overview' && (
          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-purple-600" /> 기본 정보
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-600">{profile?.phone || '미등록'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-600">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-600">{profile?.address || '미등록'}</span>
                </div>
              </div>
            </div>

            {/* SNS 정보 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Instagram size={18} className="text-purple-600" /> SNS 계정
              </h3>
              <div className="space-y-3">
                {profile?.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-blue-600 hover:underline">
                    <Instagram size={16} /> 인스타그램
                    <ExternalLink size={12} />
                  </a>
                )}
                {profile?.youtube_url && (
                  <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-red-600 hover:underline">
                    <Youtube size={16} /> 유튜브
                    <ExternalLink size={12} />
                  </a>
                )}
                {profile?.tiktok_url && (
                  <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-800 hover:underline">
                    <Hash size={16} /> 틱톡
                    <ExternalLink size={12} />
                  </a>
                )}
                {!profile?.instagram_url && !profile?.youtube_url && !profile?.tiktok_url && (
                  <p className="text-gray-400 text-sm">등록된 SNS 계정이 없습니다</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 프로필 수정 */}
        {activeSection === 'profile' && isEditing && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">기본 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="이름 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="배송받을 주소"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">SNS 계정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">인스타그램</label>
                  <input
                    type="url"
                    value={editForm.instagram_url}
                    onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유튜브</label>
                  <input
                    type="url"
                    value={editForm.youtube_url}
                    onChange={(e) => setEditForm({...editForm, youtube_url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://youtube.com/@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">틱톡</label>
                  <input
                    type="url"
                    value={editForm.tiktok_url}
                    onChange={(e) => setEditForm({...editForm, tiktok_url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">정산 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                  <select
                    value={editForm.bank_name}
                    onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">은행 선택</option>
                    {koreanBanks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                  <input
                    type="text"
                    value={editForm.bank_account_number}
                    onChange={(e) => setEditForm({...editForm, bank_account_number: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="'-' 없이 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                  <input
                    type="text"
                    value={editForm.bank_account_holder}
                    onChange={(e) => setEditForm({...editForm, bank_account_holder: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="예금주명"
                  />
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleProfileSave}
              disabled={processing}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {processing ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        )}

        {/* 지원 내역 */}
        {activeSection === 'applications' && (
          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">아직 지원한 캠페인이 없습니다</p>
              </div>
            ) : (
              applications.map((app, idx) => {
                const badge = getStatusBadge(app.status)
                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex gap-3">
                      {app.campaigns?.image_url ? (
                        <img
                          src={app.campaigns.image_url}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {app.campaigns?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{app.campaigns?.brand}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(app.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(app.campaigns?.creator_points_override || app.campaigns?.reward_points)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* 포인트/정산 */}
        {activeSection === 'points' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
              <p className="text-sm text-purple-200 mb-1">보유 포인트</p>
              <p className="text-3xl font-bold">{formatCurrency(profile?.total_points || 0)}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">정산 신청</h3>
              {profile?.bank_name && profile?.bank_account_number ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">등록된 계좌</p>
                    <p className="font-medium text-gray-900">
                      {profile.bank_name} {profile.bank_account_number}
                    </p>
                    <p className="text-sm text-gray-600">{profile.bank_account_holder}</p>
                  </div>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                  >
                    출금 신청하기
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm mb-3">정산받을 계좌를 먼저 등록해주세요</p>
                  <button
                    onClick={() => {
                      setActiveSection('profile')
                      setIsEditing(true)
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                  >
                    계좌 등록하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 설정 */}
        {activeSection === 'settings' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile-settings')}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gray-400" />
                <span className="font-medium text-gray-900">계정 설정</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-red-500" />
                <span className="font-medium text-red-500">로그아웃</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorMyPage
