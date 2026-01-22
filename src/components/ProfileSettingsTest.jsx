/**
 * ProfileSettingsTest.jsx
 * 뷰티 크리에이터 프로필 페이지 - 테스트 버전 v4
 * 비공개 URL로만 접근 가능 (/profile-test-beta-2025)
 * 개선: UI 크기 증가, 계정관리 분리, 동기부여 상단 배치
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, Camera, ArrowLeft, Search,
  AlertTriangle, X, LogOut, Check, Plus, Trash2, Video, ChevronRight,
  Sparkles, Target, TrendingUp, Settings, Shield
} from 'lucide-react'

import {
  SKIN_TYPES,
  HAIR_TYPES,
  PRIMARY_INTERESTS,
  EDITING_LEVELS,
  SHOOTING_LEVELS,
  FOLLOWER_RANGES,
  UPLOAD_FREQUENCIES,
  GENDERS,
  JOB_VISIBILITY,
  CHILD_APPEARANCE,
  CHILD_GENDERS,
  FAMILY_APPEARANCE,
  FAMILY_MEMBERS,
  OFFLINE_VISIT,
  OFFLINE_LOCATIONS,
  LINKTREE_AVAILABLE,
  LINKTREE_CHANNELS,
  LANGUAGES,
  VIDEO_LENGTH_STYLES,
  SHORTFORM_TEMPO_STYLES,
  VIDEO_STYLES,
  SKIN_CONCERNS,
  HAIR_CONCERNS,
  DIET_CONCERNS,
  CONTENT_FORMATS,
  COLLABORATION_PREFERENCES,
  CATEGORIES
} from '../constants/beautyProfileOptions'

// 테스트 모드 배너
const TestModeBanner = () => (
  <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
    테스트 버전 v4
  </div>
)

// 단일 선택 버튼 그룹 (크기 증가)
const SingleSelectGroup = ({ options, value, onChange, size = 'normal' }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`rounded-xl font-semibold transition-all duration-200 ${
          size === 'small' ? 'px-4 py-2.5 text-sm' : 'px-5 py-3 text-base'
        } ${
          value === option.value
            ? 'bg-violet-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

// 다중 선택 체크박스 그룹 (크기 증가)
const MultiSelectGroup = ({ options, values = [], onChange, columns = 2 }) => {
  const handleToggle = (optionValue) => {
    const newValues = values.includes(optionValue)
      ? values.filter(v => v !== optionValue)
      : [...values, optionValue]
    onChange(newValues)
  }

  return (
    <div className={`grid gap-2.5 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {options.map((option) => {
        const isSelected = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all text-left ${
              isSelected
                ? 'bg-violet-50 border-2 border-violet-500 text-violet-700'
                : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-violet-600' : 'border-2 border-gray-300'
            }`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// 아이 정보 입력 컴포넌트 (크기 증가)
const ChildrenInput = ({ children = [], onChange }) => {
  const addChild = () => onChange([...children, { gender: '', age: '' }])
  const removeChild = (index) => onChange(children.filter((_, i) => i !== index))
  const updateChild = (index, field, value) => {
    const updated = [...children]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {children.map((child, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <select
            value={child.gender}
            onChange={(e) => updateChild(index, 'gender', e.target.value)}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">성별 선택</option>
            {CHILD_GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <input
            type="number"
            value={child.age}
            onChange={(e) => updateChild(index, 'age', e.target.value)}
            placeholder="나이"
            className="w-20 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
            min="0"
            max="18"
          />
          <button type="button" onClick={() => removeChild(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addChild}
        className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 hover:border-violet-400 hover:text-violet-600 transition-colors"
      >
        <Plus className="w-4 h-4" /> 아이 추가
      </button>
    </div>
  )
}

// 진행 상태 표시 (크기 증가)
const ProgressIndicator = ({ percentage }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="flex-1">
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
    <span className="text-lg font-bold text-violet-600 min-w-[60px] text-right">{percentage}%</span>
  </div>
)

// 섹션 상단 동기부여 메시지 (새로운 컴포넌트)
const SectionBenefit = ({ icon: Icon, title, description, benefit }) => (
  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100 mb-6">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-violet-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <div className="mt-3 flex items-center gap-2 text-violet-600 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          {benefit}
        </div>
      </div>
    </div>
  </div>
)

// 섹션 타이틀 (크기 증가)
const SectionTitle = ({ title, required = false, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-base font-bold text-gray-900">
      {title}
      {required && <span className="text-red-500 ml-1">*</span>}
    </h3>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
)

// 하단 네비게이션 버튼
const BottomNavigation = ({ isLastStep, onNext, canProceed, saving }) => (
  <div className="mt-8 space-y-3">
    {isLastStep ? (
      <button
        onClick={onNext}
        disabled={!canProceed || saving}
        className="w-full py-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200"
      >
        {saving ? '저장 중...' : '프로필 저장하기'}
      </button>
    ) : (
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-4.5 bg-violet-600 text-white rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        다음 단계로 <ChevronRight className="w-5 h-5" />
      </button>
    )}
    {!canProceed && !isLastStep && (
      <p className="text-center text-sm text-gray-400">필수 항목을 입력하면 다음 단계로 진행할 수 있어요</p>
    )}
  </div>
)

const ProfileSettingsTest = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', age: '', bio: '', profile_image: '',
    postcode: '', address: '', detail_address: '',
    instagram_url: '', youtube_url: '', tiktok_url: '', blog_url: '',
    instagram_followers: '', youtube_subscribers: '', tiktok_followers: '',
    channel_name: '', followers: '', avg_views: '', target_audience: ''
  })

  const [beautyProfile, setBeautyProfile] = useState({
    skin_type: '', hair_type: '', primary_interest: '', editing_level: '', shooting_level: '',
    follower_range: '', upload_frequency: '', gender: '', job_visibility: '',
    job: '', child_appearance: '', family_appearance: '',
    offline_visit: '', offline_region: '',
    linktree_available: '',
    video_length_style: '', shortform_tempo: '',
    video_style: '', // 단일선택으로 변경
    category: '',
    skin_concerns: [], hair_concerns: [], diet_concerns: [],
    content_formats: [], collaboration_preferences: [], children: [], family_members: [],
    offline_locations: [], languages: [], linktree_channels: []
  })

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPostcodeLayer, setShowPostcodeLayer] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [completedSteps, setCompletedSteps] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionDetails, setDeletionDetails] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // 탭 구성 - 계정관리 완전 분리
  const tabs = [
    { id: 'basic', label: '기본', icon: User },
    { id: 'beauty', label: '뷰티', icon: Sparkles },
    { id: 'sns', label: 'SNS', icon: TrendingUp },
    { id: 'video', label: '영상', icon: Video },
    { id: 'detail', label: '상세', icon: Target },
    { id: 'account', label: '계정', icon: Settings }
  ]

  // 각 단계별 완료 조건 체크
  const checkStepComplete = (step) => {
    switch (step) {
      case 'basic':
        return !!profile.name && !!profile.phone
      case 'beauty':
        return !!beautyProfile.skin_type && beautyProfile.skin_concerns.length > 0 &&
               !!beautyProfile.hair_type && beautyProfile.hair_concerns.length > 0
      case 'sns':
        return !!(profile.instagram_url || profile.youtube_url || profile.tiktok_url)
      case 'video':
        return !!beautyProfile.video_length_style
      case 'detail':
        return !!beautyProfile.gender
      case 'account':
        return true // 계정 관리는 항상 완료 상태
      default:
        return false
    }
  }

  // 진행률 계산
  const calculateProgress = () => {
    let score = 0
    const weights = {
      name: 10, phone: 10, address: 5, photo: 10,
      skin_type: 10, skin_concerns: 10,
      hair_type: 5, hair_concerns: 5,
      sns: 15, video_style: 10, gender: 10
    }

    if (profile.name) score += weights.name
    if (profile.phone) score += weights.phone
    if (profile.address) score += weights.address
    if (photoPreview) score += weights.photo
    if (beautyProfile.skin_type) score += weights.skin_type
    if (beautyProfile.skin_concerns.length > 0) score += weights.skin_concerns
    if (beautyProfile.hair_type) score += weights.hair_type
    if (beautyProfile.hair_concerns.length > 0) score += weights.hair_concerns
    if (profile.instagram_url || profile.youtube_url || profile.tiktok_url) score += weights.sns
    if (beautyProfile.video_length_style) score += weights.video_style
    if (beautyProfile.gender) score += weights.gender

    return Math.min(100, score)
  }

  // 탭 접근 가능 여부
  const canAccessTab = (tabId) => {
    if (tabId === 'account') return true // 계정 관리는 항상 접근 가능

    const tabIndex = tabs.findIndex(t => t.id === tabId)
    if (tabIndex === 0) return true

    for (let i = 0; i < tabIndex; i++) {
      if (tabs[i].id === 'account') continue
      if (!checkStepComplete(tabs[i].id)) return false
    }
    return true
  }

  // 다음 단계로 이동
  // 다음 단계 이동 시 자동 저장
  const handleNext = async () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)

    // 모든 단계에서 자동 저장 실행
    await handleSaveProfile(true) // silent mode - 성공 메시지 숨김

    if (activeTab === 'detail') {
      // 마지막 단계에서는 성공 메시지 표시
      setSuccess('프로필이 저장되었습니다!')
      setTimeout(() => setSuccess(''), 3000)
    } else if (currentIndex < tabs.length - 2) { // account 탭 제외
      if (!completedSteps.includes(activeTab)) {
        setCompletedSteps([...completedSteps, activeTab])
      }
      setActiveTab(tabs[currentIndex + 1].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await database.userProfiles.get(user.id)
      console.log('[DEBUG] 프로필 로드 - 전체 데이터:', data)
      console.log('[DEBUG] 프로필 로드 - age 값:', data?.age, '타입:', typeof data?.age)

      if (data) {
        setProfile({
          name: data.name || '', email: data.email || user.email || '',
          phone: data.phone || '',
          age: data.age != null ? String(data.age) : '', // 숫자 0도 유지
          bio: data.bio || '',
          profile_image: data.profile_image || '',
          postcode: data.postcode || '', address: data.address || '',
          detail_address: data.detail_address || '',
          instagram_url: data.instagram_url || '', youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '', blog_url: data.blog_url || '',
          instagram_followers: data.instagram_followers != null ? String(data.instagram_followers) : '',
          youtube_subscribers: data.youtube_subscribers != null ? String(data.youtube_subscribers) : '',
          tiktok_followers: data.tiktok_followers != null ? String(data.tiktok_followers) : '',
          channel_name: data.channel_name || '',
          followers: data.followers != null ? String(data.followers) : '',
          avg_views: data.avg_views != null ? String(data.avg_views) : '',
          target_audience: data.target_audience || ''
        })

        setBeautyProfile({
          skin_type: data.skin_type || '', hair_type: data.hair_type || '',
          primary_interest: data.primary_interest || '',
          editing_level: data.editing_level || '', shooting_level: data.shooting_level || '',
          follower_range: data.follower_range || '', upload_frequency: data.upload_frequency || '',
          gender: data.gender || '', job_visibility: data.job_visibility || '',
          job: data.job || '', child_appearance: data.child_appearance || '',
          family_appearance: data.family_appearance || '',
          offline_visit: data.offline_visit || '', offline_region: data.offline_region || '',
          linktree_available: data.linktree_available || '',
          video_length_style: data.video_length_style || '', shortform_tempo: data.shortform_tempo || '',
          video_style: data.video_styles?.[0] || '', // 첫 번째 값만 사용
          category: data.category || '',
          skin_concerns: data.skin_concerns || [], hair_concerns: data.hair_concerns || [],
          diet_concerns: data.diet_concerns || [], content_formats: data.content_formats || [],
          collaboration_preferences: data.collaboration_preferences || [],
          children: data.children || [], family_members: data.family_members || [],
          offline_locations: data.offline_locations || [], languages: data.languages || [],
          linktree_channels: data.linktree_channels || []
        })

        if (data.profile_image) setPhotoPreview(data.profile_image)

        const completed = []
        tabs.forEach(tab => {
          if (checkStepComplete(tab.id)) completed.push(tab.id)
        })
        setCompletedSteps(completed)
      } else {
        setProfile(prev => ({ ...prev, email: user.email || '' }))
      }
    } catch (err) {
      console.error('프로필 로드 오류:', err)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (silent = false) => {
    try {
      setSaving(true)
      if (!silent) {
        setError('')
        setSuccess('')
      }

      if (!profile.name.trim()) {
        if (!silent) setError('이름을 입력해주세요.')
        setSaving(false)
        return
      }

      const profileData = {
        id: user.id, role: 'creator',
        name: profile.name.trim(), email: profile.email.trim(),
        phone: profile.phone?.trim() || null,
        age: profile.age ? parseInt(profile.age) : null,
        bio: profile.bio?.trim() || null,
        postcode: profile.postcode?.trim() || null,
        address: profile.address?.trim() || null,
        detail_address: profile.detail_address?.trim() || null,
        instagram_url: profile.instagram_url?.trim() || null,
        youtube_url: profile.youtube_url?.trim() || null,
        tiktok_url: profile.tiktok_url?.trim() || null,
        blog_url: profile.blog_url?.trim() || null,
        instagram_followers: profile.instagram_followers ? parseInt(profile.instagram_followers) : null,
        youtube_subscribers: profile.youtube_subscribers ? parseInt(profile.youtube_subscribers) : null,
        tiktok_followers: profile.tiktok_followers ? parseInt(profile.tiktok_followers) : null,
        channel_name: profile.channel_name?.trim() || null,
        followers: profile.followers ? parseInt(profile.followers) : null,
        avg_views: profile.avg_views ? parseInt(profile.avg_views) : null,
        target_audience: profile.target_audience?.trim() || null,
        skin_type: beautyProfile.skin_type || null,
        hair_type: beautyProfile.hair_type || null,
        category: beautyProfile.category || null,
        primary_interest: beautyProfile.primary_interest || null,
        editing_level: beautyProfile.editing_level || null,
        shooting_level: beautyProfile.shooting_level || null,
        follower_range: beautyProfile.follower_range || null,
        upload_frequency: beautyProfile.upload_frequency || null,
        gender: beautyProfile.gender || null,
        job_visibility: beautyProfile.job_visibility || null,
        job: beautyProfile.job_visibility === 'public' ? beautyProfile.job?.trim() || null : null,
        child_appearance: beautyProfile.child_appearance || null,
        family_appearance: beautyProfile.family_appearance || null,
        offline_visit: beautyProfile.offline_visit || null,
        offline_region: beautyProfile.offline_visit === 'possible' ? beautyProfile.offline_region?.trim() || null : null,
        linktree_available: beautyProfile.linktree_available || null,
        video_length_style: beautyProfile.video_length_style || null,
        shortform_tempo: beautyProfile.shortform_tempo || null,
        skin_concerns: beautyProfile.skin_concerns,
        hair_concerns: beautyProfile.hair_concerns,
        diet_concerns: beautyProfile.diet_concerns,
        content_formats: beautyProfile.content_formats,
        collaboration_preferences: beautyProfile.collaboration_preferences,
        video_styles: beautyProfile.video_style ? [beautyProfile.video_style] : [], // 단일값을 배열로 저장
        children: beautyProfile.child_appearance === 'possible' ? beautyProfile.children : [],
        family_members: beautyProfile.family_appearance === 'possible' ? beautyProfile.family_members : [],
        offline_locations: beautyProfile.offline_visit === 'possible' ? beautyProfile.offline_locations : [],
        languages: beautyProfile.languages,
        linktree_channels: beautyProfile.linktree_available === 'possible' ? beautyProfile.linktree_channels : []
      }

      await database.userProfiles.upsert(profileData)
      if (!silent) {
        setSuccess('프로필이 저장되었습니다!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('프로필 저장 오류:', err)
      if (!silent) setError(`저장 실패: ${err.message}`)
    } finally {
      setSaving(false)
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
          setProfile(prev => ({ ...prev, postcode: data.zonecode, address: fullAddress }))
          setShowPostcodeLayer(false)
        },
        onclose: () => setShowPostcodeLayer(false),
        width: '100%', height: '100%'
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

    if (file.size > 10 * 1024 * 1024) { setError('파일 크기는 10MB 이하여야 합니다.'); return }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) { setError('JPG 또는 PNG 파일만 업로드 가능합니다.'); return }

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
      let width = img.width, height = img.height
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = (height * maxSize) / width; width = maxSize }
        else { width = (width * maxSize) / height; height = maxSize }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      const fileName = `${user.id}-${Date.now()}.jpg`
      const fileToUpload = new File([blob], fileName, { type: 'image/jpeg' })
      URL.revokeObjectURL(img.src)

      const filePath = `${user.id}/${fileToUpload.name}`
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(filePath)

      try {
        await supabase.from('user_profiles').update({ profile_image: publicUrl }).eq('id', user.id)
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

  const handleChangePassword = async () => {
    try {
      setSaving(true)
      setError('')
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

      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword })
      if (error) throw error

      setSuccess('비밀번호가 변경되었습니다.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`비밀번호 변경 실패: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (confirmText !== '회원탈퇴') { setError('확인 텍스트를 정확히 입력해주세요.'); return }

    try {
      setDeleting(true)
      setError('')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('인증 세션이 만료되었습니다.')

      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: user.id, reason: deletionReason, details: deletionDetails })
      })

      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || '회원 탈퇴 실패')

      setSuccess('회원 탈퇴가 완료되었습니다.')
      setTimeout(() => signOut(), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    )
  }

  const currentStepIndex = tabs.findIndex(t => t.id === activeTab)
  const isLastStep = activeTab === 'detail'
  const canProceed = checkStepComplete(activeTab)
  const progressPercentage = calculateProgress()

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <TestModeBanner />

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">프로필 설정</h1>
          <div className="w-10" />
        </div>

        {/* 탭 네비게이션 */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const accessible = canAccessTab(tab.id)
              const isActive = activeTab === tab.id
              const isComplete = completedSteps.includes(tab.id) || checkStepComplete(tab.id)
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  onClick={() => accessible && setActiveTab(tab.id)}
                  disabled={!accessible}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : accessible
                        ? isComplete
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isComplete && !isActive ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-4 mt-4 p-4 rounded-xl text-sm font-semibold ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {activeTab !== 'account' && <ProgressIndicator percentage={progressPercentage} />}

        {/* === 기본 정보 탭 === */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={User}
              title="기본 정보를 입력하면"
              description="브랜드가 당신을 더 쉽게 찾을 수 있어요"
              benefit="프로필 사진 등록 시 캠페인 선정률 3배 UP!"
            />

            {/* 프로필 사진 */}
            <div className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-gray-200">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-400 to-pink-400">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">프로필 사진</p>
                <p className="text-sm text-gray-500 mt-1">첫인상을 결정하는 중요한 요소예요</p>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="기본 정보" required />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">닉네임 *</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="닉네임"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">나이</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="만 나이"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">연락처 *</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">배송지 주소</label>
                <div className="flex gap-3 mb-3">
                  <input type="text" value={profile.postcode} readOnly className="w-24 px-4 py-3.5 bg-gray-50 rounded-xl text-base border-2 border-transparent" placeholder="우편번호" />
                  <button onClick={handleAddressSearch} className="flex-1 px-4 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <Search size={18} /> 주소 검색
                  </button>
                </div>
                <input type="text" value={profile.address} readOnly className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base mb-3 border-2 border-transparent" placeholder="주소" />
                <input
                  type="text"
                  value={profile.detail_address}
                  onChange={(e) => setProfile(prev => ({ ...prev, detail_address: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="상세주소"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">자기소개</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none border-2 border-transparent"
                  placeholder="간단한 자기소개를 작성해주세요"
                  rows={3}
                />
              </div>
            </div>

            <BottomNavigation isLastStep={isLastStep} onNext={handleNext} canProceed={canProceed} saving={saving} />
          </div>
        )}

        {/* === 뷰티 프로필 탭 === */}
        {activeTab === 'beauty' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={Sparkles}
              title="뷰티 프로필을 완성하면"
              description="내 피부/헤어 고민에 맞는 캠페인을 추천받아요"
              benefit="상세할수록 맞춤 캠페인 매칭 정확도 UP!"
            />

            {/* 피부 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="피부 정보" required subtitle="내 피부 타입에 맞는 제품 캠페인을 매칭받아요" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">피부 타입 *</p>
                <SingleSelectGroup
                  options={SKIN_TYPES}
                  value={beautyProfile.skin_type}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, skin_type: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">피부 고민 * (복수선택)</p>
                <MultiSelectGroup
                  options={SKIN_CONCERNS}
                  values={beautyProfile.skin_concerns}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, skin_concerns: v }))}
                />
              </div>
            </div>

            {/* 헤어 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="헤어 정보" required subtitle="헤어케어 제품 캠페인 매칭에 활용돼요" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">헤어 타입 *</p>
                <SingleSelectGroup
                  options={HAIR_TYPES}
                  value={beautyProfile.hair_type}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, hair_type: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">헤어 고민 * (복수선택)</p>
                <MultiSelectGroup
                  options={HAIR_CONCERNS}
                  values={beautyProfile.hair_concerns}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, hair_concerns: v }))}
                />
              </div>
            </div>

            {/* 다이어트 고민 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <SectionTitle title="다이어트 고민" subtitle="건강/다이어트 캠페인 매칭에 활용돼요 (선택)" />
              <MultiSelectGroup
                options={DIET_CONCERNS}
                values={beautyProfile.diet_concerns}
                onChange={(v) => setBeautyProfile(prev => ({ ...prev, diet_concerns: v }))}
              />
            </div>

            {/* 크리에이터 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="크리에이터 정보" subtitle="브랜드가 당신의 전문성을 파악해요 (선택)" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">주요 관심 분야</p>
                <SingleSelectGroup
                  options={PRIMARY_INTERESTS}
                  value={beautyProfile.primary_interest}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, primary_interest: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">관심 카테고리</p>
                <SingleSelectGroup
                  options={CATEGORIES}
                  value={beautyProfile.category}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, category: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">편집 수준</p>
                <SingleSelectGroup
                  options={EDITING_LEVELS}
                  value={beautyProfile.editing_level}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, editing_level: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">촬영 수준</p>
                <SingleSelectGroup
                  options={SHOOTING_LEVELS}
                  value={beautyProfile.shooting_level}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, shooting_level: v }))}
                  size="small"
                />
              </div>
            </div>

            <BottomNavigation isLastStep={isLastStep} onNext={handleNext} canProceed={canProceed} saving={saving} />
          </div>
        )}

        {/* === SNS 채널 탭 === */}
        {activeTab === 'sns' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={TrendingUp}
              title="SNS 정보를 입력하면"
              description="브랜드가 당신의 영향력을 한눈에 확인해요"
              benefit="채널 정보가 상세할수록 협업 제안 UP!"
            />

            {/* SNS 채널 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="SNS 채널" required subtitle="최소 1개 이상 입력해주세요" />

              {/* 인스타그램 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                  <Instagram size={22} className="text-white" />
                </div>
                <div className="flex-1 grid grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={profile.instagram_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                    className="col-span-3 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="@username"
                  />
                  <input
                    type="number"
                    value={profile.instagram_followers}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_followers: e.target.value }))}
                    className="col-span-2 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="팔로워"
                  />
                </div>
              </div>

              {/* 유튜브 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                  <Youtube size={22} className="text-white" />
                </div>
                <div className="flex-1 grid grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={profile.youtube_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                    className="col-span-3 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="채널 URL"
                  />
                  <input
                    type="number"
                    value={profile.youtube_subscribers}
                    onChange={(e) => setProfile(prev => ({ ...prev, youtube_subscribers: e.target.value }))}
                    className="col-span-2 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="구독자"
                  />
                </div>
              </div>

              {/* 틱톡 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <Hash size={22} className="text-white" />
                </div>
                <div className="flex-1 grid grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={profile.tiktok_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                    className="col-span-3 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="@username"
                  />
                  <input
                    type="number"
                    value={profile.tiktok_followers}
                    onChange={(e) => setProfile(prev => ({ ...prev, tiktok_followers: e.target.value }))}
                    className="col-span-2 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="팔로워"
                  />
                </div>
              </div>
            </div>

            {/* 채널 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="메인채널 정보" subtitle="브랜드 검색에 활용되는 정보예요" />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={profile.channel_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, channel_name: e.target.value }))}
                  className="px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="대표 채널명"
                />
                <input
                  type="number"
                  value={profile.avg_views}
                  onChange={(e) => setProfile(prev => ({ ...prev, avg_views: e.target.value }))}
                  className="px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="평균 조회수"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">팔로워 규모</p>
                <SingleSelectGroup
                  options={FOLLOWER_RANGES}
                  value={beautyProfile.follower_range}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, follower_range: v }))}
                  size="small"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">업로드 빈도</p>
                <SingleSelectGroup
                  options={UPLOAD_FREQUENCIES}
                  value={beautyProfile.upload_frequency}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, upload_frequency: v }))}
                  size="small"
                />
              </div>
            </div>

            {/* 콘텐츠 & 협업 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="콘텐츠 & 협업" subtitle="선호하는 형식을 알려주세요 (선택)" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">콘텐츠 형식</p>
                <MultiSelectGroup
                  options={CONTENT_FORMATS}
                  values={beautyProfile.content_formats}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, content_formats: v }))}
                  columns={3}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">협업 선호도</p>
                <MultiSelectGroup
                  options={COLLABORATION_PREFERENCES}
                  values={beautyProfile.collaboration_preferences}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, collaboration_preferences: v }))}
                  columns={3}
                />
              </div>
            </div>

            {/* 링크트리 설정 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <SectionTitle title="링크트리 설정" subtitle="인스타/틱톡/유튜브 프로필에 링크트리 추가 가능 여부" />
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">업데이트 예정</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">링크트리 설정 가능</p>
                <SingleSelectGroup
                  options={LINKTREE_AVAILABLE}
                  value={beautyProfile.linktree_available}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, linktree_available: v }))}
                  size="small"
                />
                {beautyProfile.linktree_available === 'possible' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-3">설정 가능한 채널</p>
                      <MultiSelectGroup
                        options={LINKTREE_CHANNELS}
                        values={beautyProfile.linktree_channels}
                        onChange={(v) => setBeautyProfile(prev => ({ ...prev, linktree_channels: v }))}
                        columns={3}
                      />
                    </div>
                    <div className="p-3 bg-violet-50 rounded-xl border border-violet-200">
                      <p className="text-sm text-violet-700 font-medium">
                        링크트리 설정 가능 시 캠페인별 추가 지급 조건이 적용될 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <BottomNavigation isLastStep={isLastStep} onNext={handleNext} canProceed={canProceed} saving={saving} />
          </div>
        )}

        {/* === 영상 스타일 탭 === */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={Video}
              title="영상 스타일을 설정하면"
              description="내 스타일에 맞는 캠페인만 매칭돼요"
              benefit="영상 스타일이 명확할수록 미스매치 DOWN!"
            />

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="영상 스타일" required subtitle="제작 가능한 영상 형태를 선택해주세요" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">영상 길이 *</p>
                <SingleSelectGroup
                  options={VIDEO_LENGTH_STYLES}
                  value={beautyProfile.video_length_style}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, video_length_style: v }))}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">숏폼 템포</p>
                <div className="space-y-3">
                  {SHORTFORM_TEMPO_STYLES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBeautyProfile(prev => ({ ...prev, shortform_tempo: option.value }))}
                      className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
                        beautyProfile.shortform_tempo === option.value
                          ? 'bg-violet-50 border-2 border-violet-500'
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className={`text-base font-semibold ${beautyProfile.shortform_tempo === option.value ? 'text-violet-700' : 'text-gray-900'}`}>{option.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        beautyProfile.shortform_tempo === option.value ? 'bg-violet-600' : 'border-2 border-gray-300'
                      }`}>
                        {beautyProfile.shortform_tempo === option.value && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">SNS 영상 스타일 (1개 선택)</p>
                <SingleSelectGroup
                  options={VIDEO_STYLES}
                  value={beautyProfile.video_style}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, video_style: v }))}
                  size="small"
                />
              </div>
            </div>

            <BottomNavigation isLastStep={isLastStep} onNext={handleNext} canProceed={canProceed} saving={saving} />
          </div>
        )}

        {/* === 상세 설정 탭 === */}
        {activeTab === 'detail' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={Target}
              title="상세 정보까지 완성하면"
              description="브랜드 매칭에 모든 정보가 활용돼요"
              benefit="완성된 프로필 = 더 많은 협업 기회!"
            />

            {/* 개인 정보 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <SectionTitle title="개인 정보" required subtitle="캠페인 타겟팅에 활용돼요" />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">성별 *</p>
                <SingleSelectGroup
                  options={GENDERS}
                  value={beautyProfile.gender}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, gender: v }))}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">직업 공개</p>
                <SingleSelectGroup
                  options={JOB_VISIBILITY}
                  value={beautyProfile.job_visibility}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, job_visibility: v }))}
                  size="small"
                />
                {beautyProfile.job_visibility === 'public' && (
                  <input
                    type="text"
                    value={beautyProfile.job}
                    onChange={(e) => setBeautyProfile(prev => ({ ...prev, job: e.target.value }))}
                    className="w-full mt-3 px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                    placeholder="직업 입력 (예: 대학생, 직장인, 프리랜서)"
                  />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">아이 출연 가능</p>
                <SingleSelectGroup
                  options={CHILD_APPEARANCE}
                  value={beautyProfile.child_appearance}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, child_appearance: v }))}
                  size="small"
                />
                {beautyProfile.child_appearance === 'possible' && (
                  <div className="mt-3">
                    <ChildrenInput
                      children={beautyProfile.children}
                      onChange={(v) => setBeautyProfile(prev => ({ ...prev, children: v }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">커플/가족 출연 가능</p>
                <SingleSelectGroup
                  options={FAMILY_APPEARANCE}
                  value={beautyProfile.family_appearance}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, family_appearance: v }))}
                  size="small"
                />
                {beautyProfile.family_appearance === 'possible' && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-3">출연 가능한 가족 구성원</p>
                    <MultiSelectGroup
                      options={FAMILY_MEMBERS}
                      values={beautyProfile.family_members}
                      onChange={(v) => setBeautyProfile(prev => ({ ...prev, family_members: v }))}
                      columns={3}
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">오프라인 방문촬영 가능</p>
                <SingleSelectGroup
                  options={OFFLINE_VISIT}
                  value={beautyProfile.offline_visit}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, offline_visit: v }))}
                  size="small"
                />
                {beautyProfile.offline_visit === 'possible' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-3">촬영 가능 장소</p>
                      <MultiSelectGroup
                        options={OFFLINE_LOCATIONS}
                        values={beautyProfile.offline_locations}
                        onChange={(v) => setBeautyProfile(prev => ({ ...prev, offline_locations: v }))}
                        columns={3}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">촬영 가능 지역</p>
                      <input
                        type="text"
                        value={beautyProfile.offline_region}
                        onChange={(e) => setBeautyProfile(prev => ({ ...prev, offline_region: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                        placeholder="예: 서울, 경기, 전국 등"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">언어 능력 (콘텐츠 제작 가능)</p>
                <MultiSelectGroup
                  options={LANGUAGES}
                  values={beautyProfile.languages}
                  onChange={(v) => setBeautyProfile(prev => ({ ...prev, languages: v }))}
                  columns={2}
                />
              </div>
            </div>

            <BottomNavigation isLastStep={isLastStep} onNext={handleNext} canProceed={canProceed} saving={saving} />
          </div>
        )}

        {/* === 계정 관리 탭 (완전 분리) === */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <SectionBenefit
              icon={Shield}
              title="계정 관리"
              description="비밀번호 변경 및 계정 설정을 관리해요"
              benefit="안전한 계정 관리를 위해 주기적으로 비밀번호를 변경하세요"
            />

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <SectionTitle title="비밀번호 변경" subtitle="계정 보안을 위해 주기적으로 변경해주세요" />

              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="현재 비밀번호"
                />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="새 비밀번호 (6자 이상)"
                />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-2 border-transparent"
                  placeholder="새 비밀번호 확인"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl text-base font-bold disabled:opacity-50"
                >
                  {saving ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={signOut}
              className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl text-base font-bold flex items-center justify-center gap-3"
            >
              <LogOut size={20} /> 로그아웃
            </button>

            {/* 회원 탈퇴 */}
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-red-800">회원 탈퇴</p>
                  <p className="text-sm text-red-600 mt-1">모든 데이터가 삭제되며 복구할 수 없습니다.</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold"
                  >
                    탈퇴하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">회원 탈퇴</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800 font-medium">회원 탈퇴 시 모든 데이터가 영구 삭제됩니다.</p>
              </div>
              <select
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base font-medium"
              >
                <option value="">탈퇴 사유 선택</option>
                <option value="서비스 불만족">서비스 불만족</option>
                <option value="사용 빈도 낮음">사용 빈도 낮음</option>
                <option value="개인정보 보호">개인정보 보호</option>
                <option value="기타">기타</option>
              </select>
              <textarea
                value={deletionDetails}
                onChange={(e) => setDeletionDetails(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base resize-none"
                rows={2}
                placeholder="상세 사유 (선택)"
              />
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base"
                placeholder='"회원탈퇴" 입력'
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleAccountDeletion}
                  disabled={deleting || confirmText !== '회원탈퇴'}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold text-base disabled:opacity-50"
                >
                  {deleting ? '처리중...' : '탈퇴'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우편번호 검색 레이어 */}
      {showPostcodeLayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">주소 검색</h3>
              <button onClick={() => setShowPostcodeLayer(false)} className="p-1">
                <X className="w-6 h-6 text-gray-400" />
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
