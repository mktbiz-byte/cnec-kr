/**
 * ProfileViewTest.jsx
 * 뷰티 크리에이터 프로필 종합 보기 페이지
 * v2: 해시태그 형태로 간소화
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, ArrowLeft, Edit3,
  Sparkles, RefreshCw, Copy, Check
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
  MIRRORING_AVAILABLE, MIRRORING_CHANNELS, SMARTSTORE_PURCHASE
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
    violet: 'bg-violet-100 text-violet-700',
    pink: 'bg-pink-100 text-pink-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    gray: 'bg-gray-100 text-gray-600',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      #{children}
    </span>
  )
}

// 해시태그 그룹 (카테고리별)
const HashTagSection = ({ title, children }) => {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <div className="mb-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  )
}

// AI 프로필 작성기 컴포넌트 (간소화)
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
      const uploadFreq = getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency)
      const videoLength = getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style)
      const skinConcerns = getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns)
      const hairConcerns = getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns)
      const contentFormats = getLabels(CONTENT_FORMATS, beautyProfile.content_formats)
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
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          instagram_followers: data.instagram_followers,
          youtube_subscribers: data.youtube_subscribers,
          tiktok_followers: data.tiktok_followers,
          channel_name: data.channel_name || '',
          followers: data.followers,
          avg_views: data.avg_views
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

  // 모든 해시태그 생성
  const allTags = []

  // 기본 정보
  if (beautyProfile.gender) allTags.push({ tag: getLabel(GENDERS, beautyProfile.gender), color: 'gray' })
  if (profile.age) allTags.push({ tag: `${profile.age}세`, color: 'gray' })
  if (beautyProfile.job_visibility === 'public' && beautyProfile.job) allTags.push({ tag: beautyProfile.job, color: 'gray' })

  // 피부/헤어
  if (beautyProfile.skin_type) allTags.push({ tag: getLabel(SKIN_TYPES, beautyProfile.skin_type) + '피부', color: 'pink' })
  if (beautyProfile.skin_tone) allTags.push({ tag: getLabel(SKIN_TONES, beautyProfile.skin_tone), color: 'pink' })
  if (beautyProfile.hair_type) allTags.push({ tag: getLabel(HAIR_TYPES, beautyProfile.hair_type) + '헤어', color: 'amber' })
  getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns).forEach(c => allTags.push({ tag: c, color: 'pink' }))
  getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns).forEach(c => allTags.push({ tag: c, color: 'amber' }))

  // 뷰티 스타일
  if (beautyProfile.nail_usage && beautyProfile.nail_usage !== 'never') allTags.push({ tag: '네일' + (beautyProfile.nail_usage === 'always' ? '항상' : '가끔'), color: 'fuchsia' })
  if (beautyProfile.circle_lens_usage && beautyProfile.circle_lens_usage !== 'never') allTags.push({ tag: '렌즈' + (beautyProfile.circle_lens_usage === 'always' ? '항상' : '가끔'), color: 'fuchsia' })
  if (beautyProfile.glasses_usage && beautyProfile.glasses_usage !== 'never') allTags.push({ tag: '안경' + (beautyProfile.glasses_usage === 'always' ? '항상' : '가끔'), color: 'fuchsia' })

  // 관심분야/역량
  if (beautyProfile.primary_interest) allTags.push({ tag: getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest), color: 'violet' })
  if (beautyProfile.category) allTags.push({ tag: getLabel(CATEGORIES, beautyProfile.category), color: 'violet' })
  if (beautyProfile.editing_level) allTags.push({ tag: '편집' + getLabel(EDITING_LEVELS, beautyProfile.editing_level), color: 'blue' })
  if (beautyProfile.shooting_level) allTags.push({ tag: '촬영' + getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level), color: 'blue' })
  getLabels(LANGUAGES, beautyProfile.languages).forEach(l => allTags.push({ tag: l, color: 'blue' }))

  // 채널
  if (beautyProfile.follower_range) allTags.push({ tag: getLabel(FOLLOWER_RANGES, beautyProfile.follower_range), color: 'green' })
  if (beautyProfile.upload_frequency) allTags.push({ tag: getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency), color: 'green' })

  // 영상 스타일
  if (beautyProfile.video_length_style) allTags.push({ tag: getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style), color: 'violet' })
  if (beautyProfile.shortform_tempo) allTags.push({ tag: getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo) + '템포', color: 'violet' })
  getLabels(VIDEO_STYLES, beautyProfile.video_styles).forEach(s => allTags.push({ tag: s, color: 'violet' }))
  getLabels(CONTENT_FORMATS, beautyProfile.content_formats).forEach(f => allTags.push({ tag: f, color: 'violet' }))
  getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences).forEach(c => allTags.push({ tag: c, color: 'blue' }))

  // 출연 가능
  if (beautyProfile.child_appearance === 'possible') allTags.push({ tag: '아이출연가능', color: 'green' })
  if (beautyProfile.family_appearance === 'possible') allTags.push({ tag: '가족출연가능', color: 'green' })
  if (beautyProfile.offline_visit === 'possible') allTags.push({ tag: '오프라인촬영가능', color: 'green' })
  getLabels(OFFLINE_LOCATIONS, beautyProfile.offline_locations).forEach(l => allTags.push({ tag: l, color: 'green' }))

  // 링크트리
  if (beautyProfile.linktree_available === 'possible') {
    allTags.push({ tag: '링크트리가능', color: 'blue' })
    getLabels(LINKTREE_CHANNELS, beautyProfile.linktree_channels).forEach(c => allTags.push({ tag: c + '링크트리', color: 'blue' }))
  }

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
        {/* 프로필 헤더 (컴팩트) */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-7 h-7 text-white/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{profile.name || '이름 없음'}</h2>
              <p className="text-white/80 text-xs mt-0.5">
                {getLabel(GENDERS, beautyProfile.gender)}
                {profile.age ? ` · ${profile.age}세` : ''}
                {beautyProfile.primary_interest ? ` · ${getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)}` : ''}
              </p>
            </div>
          </div>

          {/* SNS 아이콘 */}
          <div className="mt-3 flex gap-2">
            {profile.instagram_url && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
                <Instagram size={12} />
                <span className="text-xs">{profile.instagram_followers?.toLocaleString() || '-'}</span>
              </div>
            )}
            {profile.youtube_url && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
                <Youtube size={12} />
                <span className="text-xs">{profile.youtube_subscribers?.toLocaleString() || '-'}</span>
              </div>
            )}
            {profile.tiktok_url && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
                <Hash size={12} />
                <span className="text-xs">{profile.tiktok_followers?.toLocaleString() || '-'}</span>
              </div>
            )}
          </div>
        </div>

        {/* 해시태그 프로필 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-3">크리에이터 프로필</p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((item, idx) => (
              <HashTag key={idx} color={item.color}>{item.tag}</HashTag>
            ))}
            {allTags.length === 0 && (
              <p className="text-xs text-gray-400">프로필을 작성해주세요</p>
            )}
          </div>
        </div>

        {/* 아이 정보 (있는 경우만) */}
        {beautyProfile.child_appearance === 'possible' && beautyProfile.children?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-2">출연 가능 아이</p>
            <div className="flex flex-wrap gap-1.5">
              {beautyProfile.children.map((child, idx) => (
                <HashTag key={idx} color="pink">
                  {child.gender === 'boy' ? '남아' : '여아'}{child.age}세
                </HashTag>
              ))}
            </div>
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
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          프로필 수정하기
        </button>
      </div>
    </div>
  )
}

export default ProfileViewTest
