/**
 * ProfileViewTest.jsx
 * 뷰티 크리에이터 프로필 종합 보기 페이지
 * v4: 심플하고 깔끔한 디자인 (2번째 이미지 스타일)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, ArrowLeft, Edit3,
  Sparkles, Copy, Check, ExternalLink
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

// 심플 해시태그 컴포넌트
const SimpleTag = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
    #{children}
  </span>
)

// 카테고리 라벨
const CategoryLabel = ({ children }) => (
  <p className="text-xs font-medium text-gray-400 mb-2">{children}</p>
)

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
      const age = profile.age || ''
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
      const videoStyles = getLabels(VIDEO_STYLES, beautyProfile.video_styles)

      // 자연스러운 한국어 프로필 생성
      let lines = []

      // 인사 및 소개
      let introLine = `안녕하세요, ${name}입니다.`
      if (age && gender) {
        introLine = `안녕하세요, ${age}세 ${gender} 뷰티 크리에이터 ${name}입니다.`
      } else if (gender) {
        introLine = `안녕하세요, ${gender} 뷰티 크리에이터 ${name}입니다.`
      }
      lines.push(introLine)

      // 전문 분야
      if (primaryInterest) {
        lines.push(`${primaryInterest} 분야의 콘텐츠를 주로 제작하고 있으며, 진정성 있는 리뷰와 정보 전달을 추구합니다.`)
      }

      // 피부/헤어 특성 및 고민
      const allConcerns = [...skinConcerns, ...hairConcerns]
      if (skinType && allConcerns.length > 0) {
        lines.push(`${skinType} 피부 타입으로 ${allConcerns.slice(0, 3).join(', ')} 등의 고민을 다루는 콘텐츠에 강점이 있습니다.`)
      } else if (skinType) {
        lines.push(`${skinType} 피부 타입의 특성을 살린 솔직한 제품 리뷰를 진행합니다.`)
      }

      // 채널 규모
      if (followerRange) {
        lines.push(`현재 ${followerRange} 규모의 팔로워와 소통하며 꾸준히 성장하고 있습니다.`)
      }

      // 영상 스타일
      if (videoStyles.length > 0) {
        lines.push(`${videoStyles.slice(0, 3).join(', ')} 스타일의 영상을 제작합니다.`)
      }

      // 역량
      if (editingLevel && shootingLevel) {
        lines.push(`편집 ${editingLevel}, 촬영 ${shootingLevel} 수준으로 퀄리티 높은 결과물을 제공해 드릴 수 있습니다.`)
      }

      // 협업 선호
      if (collabPrefs.length > 0) {
        lines.push(`${collabPrefs.join(', ')} 형태의 협업에 적극적으로 임하고 있습니다.`)
      }

      // 마무리
      lines.push(`브랜드와의 시너지를 통해 좋은 결과물을 만들어 나가고 싶습니다. 협업 제안 언제든 환영합니다.`)

      setAiProfile(lines.join('\n\n'))
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
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-bold text-gray-900">AI 자기소개 생성</span>
      </div>

      <button
        onClick={generateAIProfile}
        disabled={generating}
        className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? '생성 중...' : 'AI 프로필 생성'}
      </button>

      {aiProfile && (
        <div className="mt-4 space-y-3">
          <div className="relative">
            {isEditing ? (
              <textarea
                value={aiProfile}
                onChange={(e) => setAiProfile(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={8}
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{aiProfile}</p>
              </div>
            )}
            {!isEditing && (
              <button onClick={copyToClipboard} className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200"
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
              className="flex-1 py-2.5 bg-violet-500 text-white rounded-xl font-medium text-sm disabled:opacity-70 hover:bg-violet-600"
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">프로필 정보가 없습니다.</p>
        <button onClick={() => navigate('/profile-test-beta-2025')} className="px-6 py-3 bg-violet-500 text-white rounded-xl font-bold">
          프로필 작성하기
        </button>
      </div>
    )
  }

  // 카테고리별 태그 생성
  const beautyTags = []
  if (beautyProfile.skin_type) beautyTags.push(getLabel(SKIN_TYPES, beautyProfile.skin_type))
  if (beautyProfile.skin_tone) beautyTags.push(getLabel(SKIN_TONES, beautyProfile.skin_tone))
  getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns).forEach(c => beautyTags.push(c))
  if (beautyProfile.hair_type) beautyTags.push(getLabel(HAIR_TYPES, beautyProfile.hair_type))
  getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns).forEach(c => beautyTags.push(c))
  if (beautyProfile.nail_usage && beautyProfile.nail_usage !== 'never') beautyTags.push(`네일 ${getLabel(NAIL_USAGE, beautyProfile.nail_usage)}`)
  if (beautyProfile.circle_lens_usage && beautyProfile.circle_lens_usage !== 'never') beautyTags.push(`렌즈 ${getLabel(CIRCLE_LENS_USAGE, beautyProfile.circle_lens_usage)}`)
  if (beautyProfile.glasses_usage && beautyProfile.glasses_usage !== 'never') beautyTags.push(`안경 ${getLabel(GLASSES_USAGE, beautyProfile.glasses_usage)}`)

  const dietTags = getLabels(DIET_CONCERNS, beautyProfile.diet_concerns)

  const expertiseTags = []
  if (beautyProfile.primary_interest) expertiseTags.push(getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest))
  if (beautyProfile.category) expertiseTags.push(getLabel(CATEGORIES, beautyProfile.category))
  if (beautyProfile.editing_level) expertiseTags.push(`편집 ${getLabel(EDITING_LEVELS, beautyProfile.editing_level)}`)
  if (beautyProfile.shooting_level) expertiseTags.push(`촬영 ${getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)}`)

  const channelTags = []
  if (beautyProfile.follower_range) channelTags.push(getLabel(FOLLOWER_RANGES, beautyProfile.follower_range))
  if (beautyProfile.upload_frequency) channelTags.push(getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency))
  getLabels(CONTENT_FORMATS, beautyProfile.content_formats).forEach(f => channelTags.push(f))
  getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences).forEach(c => channelTags.push(c))

  const videoTags = []
  if (beautyProfile.video_length_style) videoTags.push(getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style))
  if (beautyProfile.shortform_tempo) videoTags.push(`${getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo)} 템포`)
  getLabels(VIDEO_STYLES, beautyProfile.video_styles).forEach(s => videoTags.push(s))

  const activityTags = []
  if (beautyProfile.child_appearance === 'possible') activityTags.push('아이출연가능')
  if (beautyProfile.family_appearance === 'possible') {
    activityTags.push('가족출연가능')
    getLabels(FAMILY_MEMBERS, beautyProfile.family_members).forEach(m => activityTags.push(`${m}출연`))
  }
  if (beautyProfile.offline_visit === 'possible') {
    activityTags.push('오프라인촬영가능')
    getLabels(OFFLINE_LOCATIONS, beautyProfile.offline_locations).forEach(l => activityTags.push(l))
    if (beautyProfile.offline_region) activityTags.push(beautyProfile.offline_region)
  }

  const specialTags = []
  if (beautyProfile.linktree_available === 'possible') {
    specialTags.push('링크트리가능')
    getLabels(LINKTREE_CHANNELS, beautyProfile.linktree_channels).forEach(c => specialTags.push(`${c} 링크트리`))
  }
  if (beautyProfile.mirroring_available === 'possible') {
    specialTags.push('미러링가능')
    beautyProfile.mirroring_channels?.forEach(c => {
      const channelNames = { naver_clip: '네이버클립', youtube: '유튜브', instagram: '인스타', tiktok: '틱톡' }
      specialTags.push(`${channelNames[c] || c} 미러링`)
    })
  }
  if (beautyProfile.smartstore_purchase === 'possible') {
    specialTags.push('스마트스토어구매가능')
  }

  const languageTags = getLabels(LANGUAGES, beautyProfile.languages)

  const personalTags = []
  if (beautyProfile.gender) personalTags.push(getLabel(GENDERS, beautyProfile.gender))
  if (profile.age) personalTags.push(`${profile.age}세`)
  if (beautyProfile.job_visibility === 'public' && beautyProfile.job) personalTags.push(beautyProfile.job)

  return (
    <div className="min-h-screen bg-white pb-safe">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
            <ArrowLeft size={22} className="text-gray-900" />
          </button>
          <h1 className="text-base font-bold text-gray-900">프로필</h1>
          <button onClick={() => navigate('/profile-test-beta-2025')} className="p-1.5 -mr-1.5">
            <Edit3 size={18} className="text-violet-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 프로필 사진 & 기본 정보 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                  <User className="w-10 h-10 text-violet-300" />
                </div>
              )}
            </div>
            {/* 뱃지 */}
            {beautyProfile.primary_interest && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                {getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-2">{profile.name || '이름 없음'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {getLabel(GENDERS, beautyProfile.gender)}
            {profile.age ? ` · ${profile.age}세` : ''}
          </p>

          {/* SNS 아이콘 버튼 */}
          <div className="flex items-center gap-3 mt-4">
            {profile.instagram_url && (
              <a href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://instagram.com/${profile.instagram_url.replace('@', '')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white">
                <Instagram size={18} />
              </a>
            )}
            {profile.youtube_url && (
              <a href={profile.youtube_url.startsWith('http') ? profile.youtube_url : `https://youtube.com/${profile.youtube_url}`}
                 target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
                <Youtube size={18} />
              </a>
            )}
            {profile.tiktok_url && (
              <a href={profile.tiktok_url.startsWith('http') ? profile.tiktok_url : `https://tiktok.com/@${profile.tiktok_url.replace('@', '')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white">
                <Hash size={18} />
              </a>
            )}
            {profile.blog_url && (
              <a href={profile.blog_url.startsWith('http') ? profile.blog_url : `https://${profile.blog_url}`}
                 target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>

        {/* SNS 팔로워 정보 */}
        {(profile.instagram_followers || profile.youtube_subscribers || profile.tiktok_followers) && (
          <div className="flex justify-center gap-4 mb-4">
            {profile.instagram_url && profile.instagram_followers && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{profile.instagram_followers.toLocaleString()}</p>
                <p className="text-xs text-gray-400">인스타 팔로워</p>
              </div>
            )}
            {profile.youtube_url && profile.youtube_subscribers && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{profile.youtube_subscribers.toLocaleString()}</p>
                <p className="text-xs text-gray-400">유튜브 구독자</p>
              </div>
            )}
            {profile.tiktok_url && profile.tiktok_followers && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{profile.tiktok_followers.toLocaleString()}</p>
                <p className="text-xs text-gray-400">틱톡 팔로워</p>
              </div>
            )}
          </div>
        )}

        {/* AI 프로필 작성기 - 상단 배치 */}
        <AIProfileWriter
          profile={profile}
          beautyProfile={beautyProfile}
          savedText={aiProfileText}
          onSave={saveAiProfile}
          saving={saving}
        />

        {/* 채널 정보 */}
        {(profile.channel_name || profile.avg_views) && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              {profile.channel_name && (
                <div>
                  <p className="text-xs text-gray-400">대표 채널</p>
                  <p className="text-sm font-bold text-gray-900">{profile.channel_name}</p>
                </div>
              )}
              {profile.avg_views && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">평균 조회수</p>
                  <p className="text-sm font-bold text-gray-900">{profile.avg_views.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 정보 카드 - 2열 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">나이</span>
            </div>
            <p className="text-base font-bold text-gray-900">{profile.age ? `${profile.age}세` : '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-400">피부 타입</span>
            </div>
            <p className="text-base font-bold text-gray-900">
              {beautyProfile.skin_type ? getLabel(SKIN_TYPES, beautyProfile.skin_type) : '-'}
            </p>
          </div>
        </div>

        {/* 헤어 타입 & 퍼스널 컬러 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {beautyProfile.hair_type && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">💇</span>
                <span className="text-xs text-gray-400">헤어 타입</span>
              </div>
              <p className="text-base font-bold text-gray-900">{getLabel(HAIR_TYPES, beautyProfile.hair_type)}</p>
            </div>
          )}
          {beautyProfile.skin_tone && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-300 to-orange-300" />
                <span className="text-xs text-gray-400">퍼스널 컬러</span>
              </div>
              <p className="text-base font-bold text-gray-900">{getLabel(SKIN_TONES, beautyProfile.skin_tone)}</p>
            </div>
          )}
        </div>

        {/* 자기소개 */}
        {profile.bio && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Introduction</p>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* 관심 키워드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-gray-900" />
            <span className="text-sm font-bold text-gray-900">관심 키워드</span>
          </div>

          {/* 뷰티 & 메이크업 */}
          {beautyTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>뷰티 & 메이크업</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {beautyTags.map((tag, idx) => <SimpleTag key={`beauty-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 다이어트 & 건강 */}
          {dietTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>다이어트 & 건강</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {dietTags.map((tag, idx) => <SimpleTag key={`diet-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 전문분야 & 역량 */}
          {expertiseTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>전문분야 & 역량</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {expertiseTags.map((tag, idx) => <SimpleTag key={`exp-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 채널 & 콘텐츠 */}
          {channelTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>채널 & 콘텐츠</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {channelTags.map((tag, idx) => <SimpleTag key={`ch-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 영상 스타일 */}
          {videoTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>영상 스타일</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {videoTags.map((tag, idx) => <SimpleTag key={`vid-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 출연 & 활동 */}
          {activityTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>출연 & 활동</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {activityTags.map((tag, idx) => <SimpleTag key={`act-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 특별 기능 */}
          {specialTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>특별 기능</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {specialTags.map((tag, idx) => <SimpleTag key={`spec-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 언어 */}
          {languageTags.length > 0 && (
            <div className="mb-4">
              <CategoryLabel>언어</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {languageTags.map((tag, idx) => <SimpleTag key={`lang-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 기본 정보 */}
          {personalTags.length > 0 && (
            <div className="mb-0">
              <CategoryLabel>기본 정보</CategoryLabel>
              <div className="flex flex-wrap gap-2">
                {personalTags.map((tag, idx) => <SimpleTag key={`pers-${idx}`}>{tag}</SimpleTag>)}
              </div>
            </div>
          )}

          {/* 태그가 없는 경우 */}
          {beautyTags.length === 0 && expertiseTags.length === 0 && channelTags.length === 0 && personalTags.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">프로필을 작성해주세요</p>
          )}
        </div>

        {/* 아이 정보 */}
        {beautyProfile.child_appearance === 'possible' && beautyProfile.children?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-xs text-gray-400 mb-3">출연 가능 아이</p>
            <div className="flex flex-wrap gap-2">
              {beautyProfile.children.map((child, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-xl">
                  <span className="text-base">{child.gender === 'boy' ? '👦' : '👧'}</span>
                  <span className="text-sm font-medium text-pink-700">
                    {child.gender === 'boy' ? '남아' : '여아'} {child.age}세
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 연락처 & 배송지 */}
        {(profile.phone || profile.address) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            {profile.phone && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">연락처</p>
                <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
              </div>
            )}
            {profile.address && (
              <div>
                <p className="text-xs text-gray-400 mb-1">배송지</p>
                <p className="text-sm text-gray-700">
                  [{profile.postcode}] {profile.address}
                  {profile.detail_address && ` ${profile.detail_address}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 프로필 수정 버튼 */}
        <button
          onClick={() => navigate('/profile-test-beta-2025')}
          className="w-full mt-4 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          프로필 수정하기
        </button>
      </div>
    </div>
  )
}

export default ProfileViewTest
