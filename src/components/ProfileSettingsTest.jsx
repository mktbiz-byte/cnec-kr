/**
 * ProfileSettingsTest.jsx
 * 뷰티 크리에이터 프로필 페이지 - 테스트 버전
 * 비공개 URL로만 접근 가능 (/profile-test-beta-2025)
 *
 * 새로운 필드 구조:
 * - 단일 선택: 피부타입, 주요 관심 분야, 경험 수준, 팔로워 규모, 업로드 빈도, 타겟 성별, 타겟 연령대
 * - 다중 선택: 피부 고민, 헤어 고민, 다이어트 고민, 선호 콘텐츠 형식, 협업 선호도, 타겟 관심사
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, Camera, ArrowLeft, Search,
  Lock, AlertTriangle, X, LogOut, ChevronDown, ChevronUp, Check, Info
} from 'lucide-react'

import {
  SKIN_TYPES,
  PRIMARY_INTERESTS,
  EXPERIENCE_LEVELS,
  FOLLOWER_RANGES,
  UPLOAD_FREQUENCIES,
  TARGET_GENDERS,
  TARGET_AGE_GROUPS,
  SKIN_CONCERNS,
  HAIR_CONCERNS,
  DIET_CONCERNS,
  CONTENT_FORMATS,
  COLLABORATION_PREFERENCES,
  TARGET_INTERESTS,
  CATEGORIES
} from '../constants/beautyProfileOptions'

// 테스트 모드 배너
const TestModeBanner = () => (
  <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
    테스트 모드 - 이 페이지는 비공개 테스트 버전입니다
  </div>
)

// 섹션 헤더 컴포넌트
const SectionHeader = ({ title, subtitle, required = false, icon: Icon }) => (
  <div className="flex items-start gap-3 mb-4">
    {Icon && (
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
    )}
    <div>
      <h2 className="text-base font-bold text-gray-900">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
)

// 단일 선택 버튼 그룹 (라디오 버튼 스타일)
const SingleSelectGroup = ({ options, value, onChange, name }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          value === option.value
            ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
            : 'bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

// 다중 선택 체크박스 그룹
const MultiSelectGroup = ({ options, values = [], onChange, name, columns = 2 }) => {
  const handleToggle = (optionValue) => {
    const newValues = values.includes(optionValue)
      ? values.filter(v => v !== optionValue)
      : [...values, optionValue]
    onChange(newValues)
  }

  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {options.map((option) => {
        const isSelected = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
              isSelected
                ? 'bg-violet-50 border-2 border-violet-500 text-violet-700'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-violet-300'
            }`}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-violet-600' : 'border border-gray-300'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// 접이식 섹션 컴포넌트
const CollapsibleSection = ({ title, subtitle, required, children, defaultOpen = true, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-violet-600" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// 진행 상태 표시
const ProgressIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl mb-6">
    <div className="flex-1">
      <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
    <span className="text-sm font-medium text-violet-600">{currentStep}/{totalSteps}</span>
  </div>
)

const ProfileSettingsTest = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // 기본 프로필 필드 (기존 호환)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    bio: '',
    profile_image: '',
    postcode: '',
    address: '',
    detail_address: '',
    // SNS 정보
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    blog_url: '',
    instagram_followers: '',
    youtube_subscribers: '',
    tiktok_followers: '',
    // 대표 채널 정보
    channel_name: '',
    followers: '',
    avg_views: '',
    target_audience: ''
  })

  // 새로운 뷰티 프로필 필드
  const [beautyProfile, setBeautyProfile] = useState({
    // 단일 선택
    skin_type: '',
    primary_interest: '',
    experience_level: '',
    follower_range: '',
    upload_frequency: '',
    target_gender: '',
    target_age_group: '',
    category: '',  // 기존 호환
    // 다중 선택
    skin_concerns: [],
    hair_concerns: [],
    diet_concerns: [],
    content_formats: [],
    collaboration_preferences: [],
    target_interests: []
  })

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPostcodeLayer, setShowPostcodeLayer] = useState(false)
  const [activeTab, setActiveTab] = useState('basic') // basic, beauty, sns, advanced

  // 회원 탈퇴 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionDetails, setDeletionDetails] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // 프로필 완성도 계산
  const calculateProgress = () => {
    let filled = 0
    let total = 10 // 필수 항목 수

    if (profile.name) filled++
    if (profile.phone) filled++
    if (profile.address) filled++
    if (beautyProfile.skin_type) filled++
    if (beautyProfile.skin_concerns.length > 0) filled++
    if (beautyProfile.hair_concerns.length > 0) filled++
    if (beautyProfile.diet_concerns.length > 0) filled++
    if (profile.instagram_url || profile.youtube_url || profile.tiktok_url) filled++
    if (profile.channel_name) filled++
    if (photoPreview) filled++

    return filled
  }

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await database.userProfiles.get(user.id)

      if (profileData) {
        // 기본 프로필 데이터 로드
        setProfile({
          name: profileData.name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          age: profileData.age || '',
          bio: profileData.bio || '',
          profile_image: profileData.profile_image || '',
          postcode: profileData.postcode || '',
          address: profileData.address || '',
          detail_address: profileData.detail_address || '',
          instagram_url: profileData.instagram_url || '',
          youtube_url: profileData.youtube_url || '',
          tiktok_url: profileData.tiktok_url || '',
          blog_url: profileData.blog_url || '',
          instagram_followers: profileData.instagram_followers || '',
          youtube_subscribers: profileData.youtube_subscribers || '',
          tiktok_followers: profileData.tiktok_followers || '',
          channel_name: profileData.channel_name || '',
          followers: profileData.followers || '',
          avg_views: profileData.avg_views || '',
          target_audience: profileData.target_audience || ''
        })

        // 뷰티 프로필 데이터 로드 (새 필드 + 기존 호환)
        setBeautyProfile({
          skin_type: profileData.skin_type || '',
          primary_interest: profileData.primary_interest || '',
          experience_level: profileData.experience_level || '',
          follower_range: profileData.follower_range || '',
          upload_frequency: profileData.upload_frequency || '',
          target_gender: profileData.target_gender || '',
          target_age_group: profileData.target_age_group || '',
          category: profileData.category || '',
          // 다중 선택 필드 (JSON 배열로 저장)
          skin_concerns: profileData.skin_concerns || [],
          hair_concerns: profileData.hair_concerns || [],
          diet_concerns: profileData.diet_concerns || [],
          content_formats: profileData.content_formats || [],
          collaboration_preferences: profileData.collaboration_preferences || [],
          target_interests: profileData.target_interests || []
        })

        if (profileData.profile_image) {
          setPhotoPreview(profileData.profile_image)
        }
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!profile.name.trim()) {
        setError('이름을 입력해주세요.')
        setSaving(false)
        return
      }

      const profileData = {
        id: user.id,
        role: 'creator',
        // 기본 정보
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone?.trim() || null,
        age: profile.age ? parseInt(profile.age) : null,
        bio: profile.bio?.trim() || null,
        postcode: profile.postcode?.trim() || null,
        address: profile.address?.trim() || null,
        detail_address: profile.detail_address?.trim() || null,
        // SNS 정보
        instagram_url: profile.instagram_url?.trim() || null,
        youtube_url: profile.youtube_url?.trim() || null,
        tiktok_url: profile.tiktok_url?.trim() || null,
        blog_url: profile.blog_url?.trim() || null,
        instagram_followers: profile.instagram_followers ? parseInt(profile.instagram_followers) : null,
        youtube_subscribers: profile.youtube_subscribers ? parseInt(profile.youtube_subscribers) : null,
        tiktok_followers: profile.tiktok_followers ? parseInt(profile.tiktok_followers) : null,
        // 대표 채널 정보
        channel_name: profile.channel_name?.trim() || null,
        followers: profile.followers ? parseInt(profile.followers) : null,
        avg_views: profile.avg_views ? parseInt(profile.avg_views) : null,
        target_audience: profile.target_audience?.trim() || null,
        // 뷰티 프로필 - 단일 선택
        skin_type: beautyProfile.skin_type || null,
        category: beautyProfile.category || null,
        primary_interest: beautyProfile.primary_interest || null,
        experience_level: beautyProfile.experience_level || null,
        follower_range: beautyProfile.follower_range || null,
        upload_frequency: beautyProfile.upload_frequency || null,
        target_gender: beautyProfile.target_gender || null,
        target_age_group: beautyProfile.target_age_group || null,
        // 뷰티 프로필 - 다중 선택 (JSON 배열)
        skin_concerns: beautyProfile.skin_concerns,
        hair_concerns: beautyProfile.hair_concerns,
        diet_concerns: beautyProfile.diet_concerns,
        content_formats: beautyProfile.content_formats,
        collaboration_preferences: beautyProfile.collaboration_preferences,
        target_interests: beautyProfile.target_interests
      }

      await database.userProfiles.upsert(profileData)
      setSuccess('저장되었습니다')
      setTimeout(() => setSuccess(''), 2000)

    } catch (error) {
      console.error('프로필 저장 오류:', error)
      setError(`저장 실패: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('모든 비밀번호 필드를 입력해주세요.')
        setSaving(false)
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.')
        setSaving(false)
        return
      }

      if (passwordData.newPassword.length < 6) {
        setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
        setSaving(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setError(`비밀번호 변경에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAccountDeletion = async () => {
    try {
      if (confirmText !== '회원탈퇴') {
        setError('확인 텍스트를 정확히 입력해주세요.')
        return
      }

      setDeleting(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.')
      }

      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          reason: deletionReason,
          details: deletionDetails
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '회원 탈퇴 처리에 실패했습니다.')
      }

      setSuccess('회원 탈퇴가 완료되었습니다.')
      setTimeout(() => signOut(), 2000)
    } catch (err) {
      console.error('회원 탈퇴 오류:', err)
      setError(err.message || '회원 탈퇴 처리 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleAddressSearch = () => {
    if (typeof window === 'undefined') return

    setShowPostcodeLayer(true)

    const executePostcode = () => {
      const container = document.getElementById('postcode-layer')
      if (!container) return

      new window.daum.Postcode({
        oncomplete: function(data) {
          let fullAddress = data.address
          let extraAddress = ''

          if (data.addressType === 'R') {
            if (data.bname !== '') extraAddress += data.bname
            if (data.buildingName !== '')
              extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName)
            fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '')
          }

          setProfile(prev => ({
            ...prev,
            postcode: data.zonecode,
            address: fullAddress
          }))
          setShowPostcodeLayer(false)
        },
        onclose: function() {
          setShowPostcodeLayer(false)
        },
        width: '100%',
        height: '100%'
      }).embed(container)
    }

    if (window.daum && window.daum.Postcode) {
      setTimeout(executePostcode, 100)
    } else {
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.onload = () => setTimeout(executePostcode, 100)
      document.head.appendChild(script)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('JPG 또는 PNG 파일만 업로드 가능합니다.')
      return
    }

    try {
      setUploadingPhoto(true)
      setError('')

      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })

      const maxSize = 1920
      let width = img.width
      let height = img.height

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      )

      const fileName = `${user.id}-${Date.now()}.jpg`
      const fileToUpload = new File([blob], fileName, { type: 'image/jpeg' })

      URL.revokeObjectURL(img.src)

      const filePath = `${user.id}/${fileToUpload.name}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      try {
        await supabase
          .from('user_profiles')
          .update({ profile_image: publicUrl })
          .eq('id', user.id)
      } catch (dbError) {
        console.warn('프로필 이미지 DB 업데이트 오류:', dbError)
      }

      setProfile(prev => ({ ...prev, profile_image: publicUrl }))
      setPhotoPreview(publicUrl)
      setSuccess('프로필 사진이 업로드되었습니다.')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      console.error('사진 업로드 오류:', err)
      setError('사진 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: '기본정보' },
    { id: 'beauty', label: '뷰티프로필' },
    { id: 'sns', label: 'SNS채널' },
    { id: 'advanced', label: '상세설정' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 테스트 모드 배너 */}
      <TestModeBanner />

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">프로필 설정</h1>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="text-violet-600 font-semibold text-[15px] disabled:opacity-50"
          >
            {saving ? '저장중...' : '저장'}
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-md mx-auto px-4 flex gap-1 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-4 mt-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프로필 완성도 */}
        <ProgressIndicator currentStep={calculateProgress()} totalSteps={10} />

        {/* === 기본 정보 탭 === */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* 프로필 사진 */}
            <div className="flex flex-col items-center">
              {!photoPreview && (
                <div className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">프로필 사진을 꼭 등록해 주세요!</p>
                      <p className="text-xs text-white/90 mt-0.5">프로필 사진이 있으면 캠페인 선정률이 3배 높아져요</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-400 to-pink-400">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-gray-500">프로필 사진 변경</p>
            </div>

            {/* 기본 정보 입력 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <SectionHeader title="기본 정보" required />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">닉네임 *</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="닉네임 입력"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">나이</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="만 나이"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">연락처</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="010-1234-5678"
                />
              </div>

              {/* 배송지 주소 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">배송지 주소</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={profile.postcode}
                    readOnly
                    className="w-24 px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 focus:outline-none"
                    placeholder="우편번호"
                  />
                  <button
                    onClick={handleAddressSearch}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl text-[15px] font-medium flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.address}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 mb-3 focus:outline-none"
                  placeholder="주소를 검색해주세요"
                />
                <input
                  type="text"
                  value={profile.detail_address}
                  onChange={(e) => setProfile(prev => ({ ...prev, detail_address: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="상세주소 입력"
                />
              </div>

              {/* 자기소개 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">자기소개</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="간단한 자기소개를 작성해주세요"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* === 뷰티 프로필 탭 === */}
        {activeTab === 'beauty' && (
          <div className="space-y-4">
            {/* 피부 타입 (단일 선택) */}
            <CollapsibleSection title="피부 타입" required subtitle="현재 피부 상태를 선택해주세요">
              <SingleSelectGroup
                options={SKIN_TYPES}
                value={beautyProfile.skin_type}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, skin_type: value }))}
                name="skin_type"
              />
            </CollapsibleSection>

            {/* 피부 고민 (다중 선택) */}
            <CollapsibleSection title="피부 고민" required subtitle="해당하는 모든 피부 고민을 선택해주세요">
              <MultiSelectGroup
                options={SKIN_CONCERNS}
                values={beautyProfile.skin_concerns}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, skin_concerns: values }))}
                name="skin_concerns"
                columns={2}
              />
            </CollapsibleSection>

            {/* 헤어 고민 (다중 선택) */}
            <CollapsibleSection title="헤어 고민" required subtitle="해당하는 모든 헤어 고민을 선택해주세요">
              <MultiSelectGroup
                options={HAIR_CONCERNS}
                values={beautyProfile.hair_concerns}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, hair_concerns: values }))}
                name="hair_concerns"
                columns={2}
              />
            </CollapsibleSection>

            {/* 다이어트 고민 (다중 선택) */}
            <CollapsibleSection title="다이어트 고민" required subtitle="해당하는 모든 다이어트 고민을 선택해주세요">
              <MultiSelectGroup
                options={DIET_CONCERNS}
                values={beautyProfile.diet_concerns}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, diet_concerns: values }))}
                name="diet_concerns"
                columns={2}
              />
            </CollapsibleSection>

            {/* 주요 관심 분야 (단일 선택) */}
            <CollapsibleSection title="주요 관심 분야" subtitle="크리에이터의 주력 분야를 선택해주세요" defaultOpen={false}>
              <SingleSelectGroup
                options={PRIMARY_INTERESTS}
                value={beautyProfile.primary_interest}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, primary_interest: value }))}
                name="primary_interest"
              />
            </CollapsibleSection>

            {/* 관심 카테고리 (단일 선택 - 기존 호환) */}
            <CollapsibleSection title="관심 카테고리" subtitle="관심있는 제품 카테고리를 선택해주세요" defaultOpen={false}>
              <SingleSelectGroup
                options={CATEGORIES}
                value={beautyProfile.category}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, category: value }))}
                name="category"
              />
            </CollapsibleSection>

            {/* 경험 수준 (단일 선택) */}
            <CollapsibleSection title="경험 수준" subtitle="해당 분야에서의 경험 수준" defaultOpen={false}>
              <SingleSelectGroup
                options={EXPERIENCE_LEVELS}
                value={beautyProfile.experience_level}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, experience_level: value }))}
                name="experience_level"
              />
            </CollapsibleSection>
          </div>
        )}

        {/* === SNS 채널 탭 === */}
        {activeTab === 'sns' && (
          <div className="space-y-4">
            {/* 인스타그램 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <Instagram size={20} className="text-white" />
                </div>
                <div className="font-semibold text-gray-900">Instagram</div>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.instagram_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="@username 또는 URL"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={profile.instagram_followers}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_followers: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="팔로워 수"
                  />
                  <span className="text-sm text-gray-500">명</span>
                </div>
              </div>
            </div>

            {/* 유튜브 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                  <Youtube size={20} className="text-white" />
                </div>
                <div className="font-semibold text-gray-900">YouTube</div>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.youtube_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="채널 URL"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={profile.youtube_subscribers}
                    onChange={(e) => setProfile(prev => ({ ...prev, youtube_subscribers: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="구독자 수"
                  />
                  <span className="text-sm text-gray-500">명</span>
                </div>
              </div>
            </div>

            {/* 틱톡 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <Hash size={20} className="text-white" />
                </div>
                <div className="font-semibold text-gray-900">TikTok</div>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.tiktok_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="@username 또는 URL"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={profile.tiktok_followers}
                    onChange={(e) => setProfile(prev => ({ ...prev, tiktok_followers: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="팔로워 수"
                  />
                  <span className="text-sm text-gray-500">명</span>
                </div>
              </div>
            </div>

            {/* 대표 채널 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <SectionHeader
                title="대표 채널 정보"
                subtitle="브랜드 사이트에서 크리에이터 검색 시 사용됩니다"
              />
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.channel_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, channel_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="대표 채널명"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={profile.followers}
                    onChange={(e) => setProfile(prev => ({ ...prev, followers: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="팔로워/구독자 수"
                  />
                  <input
                    type="number"
                    value={profile.avg_views}
                    onChange={(e) => setProfile(prev => ({ ...prev, avg_views: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="평균 조회수"
                  />
                </div>
                <input
                  type="text"
                  value={profile.target_audience}
                  onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="타겟 오디언스 (예: 20-30대 여성)"
                />
              </div>
            </div>

            {/* 팔로워 규모 (단일 선택) */}
            <CollapsibleSection title="팔로워 규모" subtitle="현재 전체 팔로워 범위" defaultOpen={false}>
              <SingleSelectGroup
                options={FOLLOWER_RANGES}
                value={beautyProfile.follower_range}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, follower_range: value }))}
                name="follower_range"
              />
            </CollapsibleSection>

            {/* 업로드 빈도 (단일 선택) */}
            <CollapsibleSection title="업로드 빈도" subtitle="콘텐츠 업로드 주기" defaultOpen={false}>
              <SingleSelectGroup
                options={UPLOAD_FREQUENCIES}
                value={beautyProfile.upload_frequency}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, upload_frequency: value }))}
                name="upload_frequency"
              />
            </CollapsibleSection>

            {/* 선호 콘텐츠 형식 (다중 선택) */}
            <CollapsibleSection title="선호 콘텐츠 형식" subtitle="제작 가능한 모든 콘텐츠 형식을 선택해주세요" defaultOpen={false}>
              <MultiSelectGroup
                options={CONTENT_FORMATS}
                values={beautyProfile.content_formats}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, content_formats: values }))}
                name="content_formats"
                columns={2}
              />
            </CollapsibleSection>

            {/* 협업 선호도 (다중 선택) */}
            <CollapsibleSection title="협업 선호도" subtitle="선호하는 모든 협업 형태를 선택해주세요" defaultOpen={false}>
              <MultiSelectGroup
                options={COLLABORATION_PREFERENCES}
                values={beautyProfile.collaboration_preferences}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, collaboration_preferences: values }))}
                name="collaboration_preferences"
                columns={2}
              />
            </CollapsibleSection>
          </div>
        )}

        {/* === 상세 설정 탭 === */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* 타겟 성별 (단일 선택) */}
            <CollapsibleSection title="타겟 성별" subtitle="주요 타겟 성별">
              <SingleSelectGroup
                options={TARGET_GENDERS}
                value={beautyProfile.target_gender}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, target_gender: value }))}
                name="target_gender"
              />
            </CollapsibleSection>

            {/* 타겟 연령대 (단일 선택) */}
            <CollapsibleSection title="타겟 연령대" subtitle="주요 타겟 연령대">
              <SingleSelectGroup
                options={TARGET_AGE_GROUPS}
                value={beautyProfile.target_age_group}
                onChange={(value) => setBeautyProfile(prev => ({ ...prev, target_age_group: value }))}
                name="target_age_group"
              />
            </CollapsibleSection>

            {/* 타겟 관심사 (다중 선택) */}
            <CollapsibleSection title="타겟 관심사" subtitle="타겟이 관심 있는 모든 카테고리를 선택해주세요" defaultOpen={false}>
              <MultiSelectGroup
                options={TARGET_INTERESTS}
                values={beautyProfile.target_interests}
                onChange={(values) => setBeautyProfile(prev => ({ ...prev, target_interests: values }))}
                name="target_interests"
                columns={2}
              />
            </CollapsibleSection>

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-gray-700" />
                <h2 className="text-base font-bold text-gray-900">비밀번호 변경</h2>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="현재 비밀번호"
                />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="새 비밀번호"
                />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="새 비밀번호 확인"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-[15px] hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  비밀번호 변경
                </button>
              </div>
            </div>

            {/* 회원 탈퇴 */}
            <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900 mb-1">회원 탈퇴</h3>
                  <p className="text-sm text-red-700 mb-3">
                    회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    회원 탈퇴하기
                  </button>
                </div>
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={signOut}
              className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold text-[15px] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              로그아웃
            </button>
          </div>
        )}

        {/* 하단 저장 버튼 */}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '프로필 저장'}
        </button>
      </div>

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">회원 탈퇴</h3>
              <button onClick={() => setShowDeleteModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">
                  회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">탈퇴 사유</label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">선택하세요</option>
                  <option value="서비스 불만족">서비스 불만족</option>
                  <option value="사용 빈도 낮음">사용 빈도 낮음</option>
                  <option value="개인정보 보호">개인정보 보호</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 사유 <span className="text-xs text-gray-500">(선택사항)</span>
                </label>
                <textarea
                  value={deletionDetails}
                  onChange={(e) => setDeletionDetails(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                  placeholder="탈퇴 사유를 자세히 입력해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  확인을 위해 <strong>"회원탈퇴"</strong>를 입력하세요
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="회원탈퇴"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={handleAccountDeletion}
                  disabled={deleting || confirmText !== '회원탈퇴'}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {deleting ? '처리중...' : '탈퇴하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우편번호 검색 레이어 */}
      {showPostcodeLayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-bold text-gray-900">주소 검색</h3>
              <button
                onClick={() => setShowPostcodeLayer(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <span className="text-2xl text-gray-400">&times;</span>
              </button>
            </div>
            <div id="postcode-layer" style={{ height: '400px' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettingsTest
