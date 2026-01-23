/**
 * ProfileViewTest.jsx
 * 뷰티 크리에이터 프로필 종합 보기 페이지
 * v3: 카테고리별 해시태그 정리 + 모든 필드 표시
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, ArrowLeft, Edit3,
  Sparkles, Copy, Check, ExternalLink, Video, MapPin, Globe,
  Users, Baby, Heart, Link2, Target
} from 'lucide-react'

import {
  SKIN_TYPES, SKIN_TONES, HAIR_TYPES, PRIMARY_INTERESTS, EDITING_LEVELS, SHOOTING_LEVELS,
  FOLLOWER_RANGES, UPLOAD_FREQUENCIES, GENDERS, JOB_VISIBILITY,
  CHILD_APPEARANCE, FAMILY_APPEARANCE, OFFLINE_VISIT, OFFLINE_LOCATIONS,
  LINKTREE_AVAILABLE, LINKTREE_CHANNELS, LANGUAGES,
  VIDEO_LENGTH_STYLES, SHORTFORM_TEMPO_STYLES, VIDEO_STYLES,
  SKIN_CONCERNS, HAIR_CONCERNS, DIET_CONCERNS,
  CONTENT_FORMATS, COLLABORATION_PREFERENCES, CATEGORIES,
  NAIL_USAGE, CIRCLE_LENS_USAGE, GLASSES_USAGE,
  MIRRORING_AVAILABLE, MIRRORING_CHANNELS, SMARTSTORE_PURCHASE,
  FAMILY_MEMBERS
} from '../constants/beautyProfileOptions'

// 값을 라벨로 변환하는 헬퍼 함수
const getLabel = (options, value) => {
  if (!value) return null
  const option = options.find(o => o.value === value)
  return option?.label || value
}

// 배열 값을 라벨 배열로 변환
const getLabels = (options, values) => {
  if (!values || !Array.isArray(values) || values.length === 0) return []
  return values.map(v => getLabel(options, v)).filter(Boolean)
}

// 해시태그 컴포넌트
const HashTag = ({ children, color = 'violet' }) => {
  const colorClasses = {
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
      #{children}
    </span>
  )
}

// 카테고리 섹션 컴포넌트
const CategorySection = ({ title, icon: Icon, children, color = 'gray' }) => {
  if (!children || (Array.isArray(children) && children.length === 0)) return null

  const colorClasses = {
    pink: 'text-pink-600 bg-pink-50',
    amber: 'text-amber-600 bg-amber-50',
    violet: 'text-violet-600 bg-violet-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-600 bg-gray-50',
    orange: 'text-orange-600 bg-orange-50',
    teal: 'text-teal-600 bg-teal-50'
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <div className={`w-6 h-6 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <p className="text-xs font-bold text-gray-700">{title}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  )
}

// 정보 카드 컴포넌트
const InfoCard = ({ icon: Icon, label, value, color = 'violet' }) => {
  if (!value) return null

  const colorClasses = {
    violet: 'from-violet-500 to-purple-500',
    pink: 'from-pink-500 to-rose-500',
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

// AI 프로필 작성기 컴포넌트
const AIProfileWriter = ({ profile, beautyProfile, savedText, onSave, saving }) => {
  const [aiProfile, setAiProfile] = useState(savedText || '')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (savedText && !aiProfile) setAiProfile(savedText)
  }, [savedText])

  const generateAIProfile = () => {
    setGenerating(true)
    setTimeout(() => {
      const name = profile.name || '크리에이터'
      const age = profile.age ? `${profile.age}세` : ''
      const gender = getLabel(GENDERS, beautyProfile.gender) || ''
      const skinType = getLabel(SKIN_TYPES, beautyProfile.skin_type)
      const hairType = getLabel(HAIR_TYPES, beautyProfile.hair_type)
      const primaryInterest = getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)
      const editingLevel = getLabel(EDITING_LEVELS, beautyProfile.editing_level)
      const shootingLevel = getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)
      const followerRange = getLabel(FOLLOWER_RANGES, beautyProfile.follower_range)
      const skinConcerns = getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns)
      const hairConcerns = getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns)
      const collabPrefs = getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences)

      let intro = `안녕하세요! ${gender ? gender + ' ' : ''}${age ? age + ' ' : ''}뷰티 크리에이터 ${name}입니다.`
      let expertise = primaryInterest ? `\n\n${primaryInterest} 분야를 중심으로 활동하고 있습니다.` : ''
      let features = ''
      if (skinType || hairType) {
        features = '\n\n'
        if (skinType) features += `${skinType} 피부`
        if (skinType && hairType) features += ', '
        if (hairType) features += `${hairType} 헤어`
        features += ' 타입으로, '
        const concerns = [...skinConcerns.slice(0, 2), ...hairConcerns.slice(0, 2)]
        if (concerns.length > 0) {
          features += `${concerns.join(', ')} 관련 콘텐츠를 만들고 있어요.`
        } else {
          features += '관련 콘텐츠를 제작하고 있어요.'
        }
      }
      let skills = ''
      if (editingLevel || shootingLevel) {
        skills = '\n\n'
        if (editingLevel) skills += `편집 ${editingLevel}`
        if (editingLevel && shootingLevel) skills += ', '
        if (shootingLevel) skills += `촬영 ${shootingLevel}`
        skills += ' 수준의 역량을 갖추고 있습니다.'
      }
      let channel = followerRange ? `\n\n현재 ${followerRange} 규모의 팔로워와 함께하고 있습니다.` : ''
      let collab = collabPrefs.length > 0 ? `\n\n${collabPrefs.join(', ')} 협업을 선호합니다.` : ''
      const closing = '\n\n좋은 기회로 함께할 수 있기를 기대합니다!'

      setAiProfile(intro + expertise + features + skills + channel + collab + closing)
      setGenerating(false)
    }, 1000)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(aiProfile)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <span className="text-sm font-bold text-gray-900">AI 자기소개 생성</span>
      </div>

      <button
        onClick={generateAIProfile}
        disabled={generating}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? '생성 중...' : 'AI 프로필 생성'}
      </button>

      {aiProfile && (
        <div className="mt-3 space-y-2">
          <div className="relative">
            {isEditing ? (
              <textarea
                value={aiProfile}
                onChange={(e) => setAiProfile(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={8}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">{aiProfile}</p>
              </div>
            )}
            {!isEditing && (
              <button onClick={copyToClipboard} className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-sm border">
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-xs"
            >
              {isEditing ? '완료' : '수정'}
            </button>
            <button
              onClick={async () => {
                if (onSave) {
                  await onSave(aiProfile)
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                }
              }}
              disabled={saving}
              className="flex-1 py-2 bg-violet-600 text-white rounded-lg font-medium text-xs disabled:opacity-70"
            >
              {saving ? '저장 중...' : saved ? '저장됨!' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ProfileViewTest = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [beautyProfile, setBeautyProfile] = useState(null)
  const [aiProfileText, setAiProfileText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await database.userProfiles.get(user.id)

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age,
          bio: data.bio || '',
          profile_image: data.profile_image || '',
          postcode: data.postcode || '',
          address: data.address || '',
          detail_address: data.detail_address || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          blog_url: data.blog_url || '',
          instagram_followers: data.instagram_followers,
          youtube_subscribers: data.youtube_subscribers,
          tiktok_followers: data.tiktok_followers,
          channel_name: data.channel_name || '',
          followers: data.followers,
          avg_views: data.avg_views,
          target_audience: data.target_audience || ''
        })

        setBeautyProfile({
          skin_type: data.skin_type || '',
          skin_tone: data.skin_tone || '',
          hair_type: data.hair_type || '',
          primary_interest: data.primary_interest || '',
          editing_level: data.editing_level || '',
          shooting_level: data.shooting_level || '',
          follower_range: data.follower_range || '',
          upload_frequency: data.upload_frequency || '',
          gender: data.gender || '',
          job_visibility: data.job_visibility || '',
          job: data.job || '',
          child_appearance: data.child_appearance || '',
          family_appearance: data.family_appearance || '',
          offline_visit: data.offline_visit || '',
          offline_region: data.offline_region || '',
          linktree_available: data.linktree_available || '',
          video_length_style: data.video_length_style || '',
          shortform_tempo: data.shortform_tempo || '',
          nail_usage: data.nail_usage || '',
          circle_lens_usage: data.circle_lens_usage || '',
          glasses_usage: data.glasses_usage || '',
          mirroring_available: data.mirroring_available || '',
          smartstore_purchase: data.smartstore_purchase || '',
          category: data.category || '',
          skin_concerns: data.skin_concerns || [],
          hair_concerns: data.hair_concerns || [],
          diet_concerns: data.diet_concerns || [],
          content_formats: data.content_formats || [],
          collaboration_preferences: data.collaboration_preferences || [],
          video_styles: data.video_styles || [],
          children: data.children || [],
          family_members: data.family_members || [],
          offline_locations: data.offline_locations || [],
          languages: data.languages || [],
          linktree_channels: data.linktree_channels || [],
          mirroring_channels: data.mirroring_channels || []
        })

        if (data.ai_profile_text) setAiProfileText(data.ai_profile_text)
      }
    } catch (err) {
      console.error('프로필 로드 오류:', err)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveAiProfile = async (text) => {
    try {
      setSaving(true)
      await database.userProfiles.update(user.id, { ai_profile_text: text })
      setAiProfileText(text)
    } catch (err) {
      console.error('AI 프로필 저장 오류:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">프로필 정보가 없습니다.</p>
        <button onClick={() => navigate('/profile-test-beta-2025')} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold">
          프로필 작성하기
        </button>
      </div>
    )
  }

  // 카테고리별 태그 생성
  const skinTags = []
  if (beautyProfile.skin_type) skinTags.push({ tag: getLabel(SKIN_TYPES, beautyProfile.skin_type), color: 'pink' })
  if (beautyProfile.skin_tone) skinTags.push({ tag: getLabel(SKIN_TONES, beautyProfile.skin_tone), color: 'pink' })
  getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns).forEach(c => skinTags.push({ tag: c, color: 'pink' }))

  const hairTags = []
  if (beautyProfile.hair_type) hairTags.push({ tag: getLabel(HAIR_TYPES, beautyProfile.hair_type), color: 'amber' })
  getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns).forEach(c => hairTags.push({ tag: c, color: 'amber' }))

  const beautyStyleTags = []
  if (beautyProfile.nail_usage && beautyProfile.nail_usage !== 'never') {
    const nailLabel = getLabel(NAIL_USAGE, beautyProfile.nail_usage)
    beautyStyleTags.push({ tag: `네일 ${nailLabel}`, color: 'fuchsia' })
  }
  if (beautyProfile.circle_lens_usage && beautyProfile.circle_lens_usage !== 'never') {
    const lensLabel = getLabel(CIRCLE_LENS_USAGE, beautyProfile.circle_lens_usage)
    beautyStyleTags.push({ tag: `렌즈 ${lensLabel}`, color: 'fuchsia' })
  }
  if (beautyProfile.glasses_usage && beautyProfile.glasses_usage !== 'never') {
    const glassesLabel = getLabel(GLASSES_USAGE, beautyProfile.glasses_usage)
    beautyStyleTags.push({ tag: `안경 ${glassesLabel}`, color: 'fuchsia' })
  }

  const dietTags = getLabels(DIET_CONCERNS, beautyProfile.diet_concerns).map(c => ({ tag: c, color: 'green' }))

  const expertiseTags = []
  if (beautyProfile.primary_interest) expertiseTags.push({ tag: getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest), color: 'violet' })
  if (beautyProfile.category) expertiseTags.push({ tag: getLabel(CATEGORIES, beautyProfile.category), color: 'violet' })
  if (beautyProfile.editing_level) expertiseTags.push({ tag: `편집 ${getLabel(EDITING_LEVELS, beautyProfile.editing_level)}`, color: 'blue' })
  if (beautyProfile.shooting_level) expertiseTags.push({ tag: `촬영 ${getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)}`, color: 'blue' })

  const channelTags = []
  if (beautyProfile.follower_range) channelTags.push({ tag: getLabel(FOLLOWER_RANGES, beautyProfile.follower_range), color: 'green' })
  if (beautyProfile.upload_frequency) channelTags.push({ tag: getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency), color: 'green' })
  getLabels(CONTENT_FORMATS, beautyProfile.content_formats).forEach(f => channelTags.push({ tag: f, color: 'teal' }))
  getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences).forEach(c => channelTags.push({ tag: c, color: 'blue' }))

  const videoTags = []
  if (beautyProfile.video_length_style) videoTags.push({ tag: getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style), color: 'violet' })
  if (beautyProfile.shortform_tempo) videoTags.push({ tag: `${getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo)} 템포`, color: 'violet' })
  getLabels(VIDEO_STYLES, beautyProfile.video_styles).forEach(s => videoTags.push({ tag: s, color: 'violet' }))

  const availabilityTags = []
  if (beautyProfile.child_appearance === 'possible') availabilityTags.push({ tag: '아이출연가능', color: 'pink' })
  if (beautyProfile.family_appearance === 'possible') {
    availabilityTags.push({ tag: '가족출연가능', color: 'pink' })
    getLabels(FAMILY_MEMBERS, beautyProfile.family_members).forEach(m => availabilityTags.push({ tag: m + '출연', color: 'pink' }))
  }
  if (beautyProfile.offline_visit === 'possible') {
    availabilityTags.push({ tag: '오프라인촬영가능', color: 'green' })
    getLabels(OFFLINE_LOCATIONS, beautyProfile.offline_locations).forEach(l => availabilityTags.push({ tag: l, color: 'green' }))
    if (beautyProfile.offline_region) availabilityTags.push({ tag: beautyProfile.offline_region, color: 'green' })
  }

  const specialTags = []
  if (beautyProfile.linktree_available === 'possible') {
    specialTags.push({ tag: '링크트리가능', color: 'teal' })
    getLabels(LINKTREE_CHANNELS, beautyProfile.linktree_channels).forEach(c => specialTags.push({ tag: `${c} 링크트리`, color: 'teal' }))
  }
  if (beautyProfile.mirroring_available === 'possible') {
    specialTags.push({ tag: '미러링가능', color: 'indigo' })
    beautyProfile.mirroring_channels?.forEach(c => {
      const channelNames = { naver_clip: '네이버클립', youtube: '유튜브', instagram: '인스타', tiktok: '틱톡' }
      specialTags.push({ tag: `${channelNames[c] || c} 미러링`, color: 'indigo' })
    })
  }
  if (beautyProfile.smartstore_purchase === 'possible') {
    specialTags.push({ tag: '스마트스토어구매가능', color: 'orange' })
  }

  const languageTags = getLabels(LANGUAGES, beautyProfile.languages).map(l => ({ tag: l, color: 'blue' }))

  const personalTags = []
  if (beautyProfile.gender) personalTags.push({ tag: getLabel(GENDERS, beautyProfile.gender), color: 'gray' })
  if (profile.age) personalTags.push({ tag: `${profile.age}세`, color: 'gray' })
  if (beautyProfile.job_visibility === 'public' && beautyProfile.job) personalTags.push({ tag: beautyProfile.job, color: 'gray' })

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
            <ArrowLeft size={22} className="text-gray-900" />
          </button>
          <h1 className="text-base font-bold text-gray-900">프로필 미리보기</h1>
          <button onClick={() => navigate('/profile-test-beta-2025')} className="p-1.5 -mr-1.5">
            <Edit3 size={18} className="text-violet-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-100 text-red-700 text-xs font-medium">{error}</div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* 프로필 헤더 */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                {profile.profile_image ? (
                  <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white/60" />
                  </div>
                )}
              </div>
              {beautyProfile.primary_interest && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white rounded-full">
                  <span className="text-[10px] font-bold text-violet-600">
                    {getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.name || '이름 없음'}</h2>
              <p className="text-white/80 text-sm mt-1">
                {getLabel(GENDERS, beautyProfile.gender)}
                {profile.age ? ` · ${profile.age}세` : ''}
              </p>
              {profile.bio && (
                <p className="text-white/70 text-xs mt-2 line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* SNS 채널 */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {profile.instagram_url && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
                <Instagram size={14} />
                <span className="text-xs font-medium">{profile.instagram_followers?.toLocaleString() || '-'}</span>
              </div>
            )}
            {profile.youtube_url && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
                <Youtube size={14} />
                <span className="text-xs font-medium">{profile.youtube_subscribers?.toLocaleString() || '-'}</span>
              </div>
            )}
            {profile.tiktok_url && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
                <Hash size={14} />
                <span className="text-xs font-medium">{profile.tiktok_followers?.toLocaleString() || '-'}</span>
              </div>
            )}
            {profile.channel_name && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
                <span className="text-xs">📺 {profile.channel_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 관심 키워드 - 카테고리별 정리 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold text-gray-900">관심 키워드</span>
          </div>

          {/* 뷰티 & 메이크업 */}
          {(skinTags.length > 0 || hairTags.length > 0 || beautyStyleTags.length > 0) && (
            <CategorySection title="뷰티 & 메이크업" icon={Sparkles} color="pink">
              {skinTags.map((item, idx) => <HashTag key={`skin-${idx}`} color={item.color}>{item.tag}</HashTag>)}
              {hairTags.map((item, idx) => <HashTag key={`hair-${idx}`} color={item.color}>{item.tag}</HashTag>)}
              {beautyStyleTags.map((item, idx) => <HashTag key={`style-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 다이어트 & 건강 */}
          {dietTags.length > 0 && (
            <CategorySection title="다이어트 & 건강" icon={Heart} color="green">
              {dietTags.map((item, idx) => <HashTag key={`diet-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 전문분야 & 역량 */}
          {expertiseTags.length > 0 && (
            <CategorySection title="전문분야 & 역량" icon={Target} color="violet">
              {expertiseTags.map((item, idx) => <HashTag key={`exp-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 채널 & 콘텐츠 */}
          {channelTags.length > 0 && (
            <CategorySection title="채널 & 콘텐츠" icon={Video} color="teal">
              {channelTags.map((item, idx) => <HashTag key={`ch-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 영상 스타일 */}
          {videoTags.length > 0 && (
            <CategorySection title="영상 스타일" icon={Video} color="violet">
              {videoTags.map((item, idx) => <HashTag key={`vid-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 출연 & 활동 */}
          {availabilityTags.length > 0 && (
            <CategorySection title="출연 & 활동" icon={Users} color="pink">
              {availabilityTags.map((item, idx) => <HashTag key={`avail-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 특별 기능 */}
          {specialTags.length > 0 && (
            <CategorySection title="특별 기능" icon={Link2} color="teal">
              {specialTags.map((item, idx) => <HashTag key={`spec-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 언어 능력 */}
          {languageTags.length > 0 && (
            <CategorySection title="언어 능력" icon={Globe} color="blue">
              {languageTags.map((item, idx) => <HashTag key={`lang-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 기본 정보 */}
          {personalTags.length > 0 && (
            <CategorySection title="기본 정보" icon={User} color="gray">
              {personalTags.map((item, idx) => <HashTag key={`pers-${idx}`} color={item.color}>{item.tag}</HashTag>)}
            </CategorySection>
          )}

          {/* 태그가 없는 경우 */}
          {skinTags.length === 0 && hairTags.length === 0 && expertiseTags.length === 0 &&
           channelTags.length === 0 && personalTags.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">프로필을 작성해주세요</p>
          )}
        </div>

        {/* 아이 정보 */}
        {beautyProfile.child_appearance === 'possible' && beautyProfile.children?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-bold text-gray-900">출연 가능 아이</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {beautyProfile.children.map((child, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg border border-pink-100">
                  <span className="text-lg">{child.gender === 'boy' ? '👦' : '👧'}</span>
                  <span className="text-sm font-medium text-pink-700">
                    {child.gender === 'boy' ? '남아' : '여아'} {child.age}세
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 배송 정보 */}
        {profile.address && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">배송지</span>
            </div>
            <p className="text-xs text-gray-600">
              [{profile.postcode}] {profile.address} {profile.detail_address}
            </p>
          </div>
        )}

        {/* AI 프로필 작성기 */}
        <AIProfileWriter
          profile={profile}
          beautyProfile={beautyProfile}
          savedText={aiProfileText}
          onSave={saveAiProfile}
          saving={saving}
        />

        {/* 프로필 수정 버튼 */}
        <button
          onClick={() => navigate('/profile-test-beta-2025')}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          프로필 수정하기
        </button>
      </div>
    </div>
  )
}

export default ProfileViewTest
