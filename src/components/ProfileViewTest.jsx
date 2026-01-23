/**
 * ProfileViewTest.jsx
 * 뷰티 크리에이터 프로필 뷰 페이지
 * URL: /profile/view (정식) | /profile-view-beta-2025 (레거시)
 * 컴팩트 디자인 - 짧고 깔끔한 UI
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, ArrowLeft, Edit3,
  Sparkles, Copy, Check, ChevronDown, ChevronUp, Home, Search
} from 'lucide-react'

import {
  SKIN_TYPES, SKIN_SHADES, PERSONAL_COLORS, SKIN_TONES,
  HAIR_TYPES, CHANNEL_CONTENTS, PRIMARY_INTERESTS, EDITING_LEVELS, SHOOTING_LEVELS,
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

// 헬퍼 함수
const getLabel = (options, value) => {
  if (!value) return null
  const option = options.find(o => o.value === value)
  return option?.label || value
}

const getLabels = (options, values) => {
  if (!values || !Array.isArray(values) || values.length === 0) return []
  return values.map(v => getLabel(options, v)).filter(Boolean)
}

// 숫자 포맷 (1000 -> 1K)
const formatNumber = (num) => {
  if (!num) return '-'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toLocaleString()
}

// 소셜 URL 정규화 (모든 형식 지원: @username, username, full URL, 한글 등)
const normalizeUrl = (input, platform) => {
  if (!input) return null
  let value = input.trim()

  // 이미 전체 URL인 경우 - 그대로 반환
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  // 플랫폼 도메인이 포함된 경우 (http 없이 입력한 경우)
  const domainPatterns = {
    instagram: /(?:www\.)?instagram\.com\//i,
    youtube: /(?:www\.)?(?:youtube\.com\/|youtu\.be\/)/i,
    tiktok: /(?:www\.)?tiktok\.com\//i
  }

  if (domainPatterns[platform]?.test(value)) {
    return value.startsWith('www.') ? `https://${value}` : `https://www.${value}`
  }

  // @ 제거 및 사용자명 추출
  let username = value.replace(/^@+/, '') // 여러 개의 @도 제거

  // 한글이나 특수문자가 포함된 경우 인코딩
  const needsEncoding = /[^\x00-\x7F]/.test(username)
  if (needsEncoding) {
    username = encodeURIComponent(username)
  }

  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/${username}`
    case 'youtube':
      // 채널 ID (UC로 시작) 또는 핸들
      if (username.startsWith('UC')) {
        return `https://www.youtube.com/channel/${username}`
      }
      if (username.startsWith('channel/')) {
        return `https://www.youtube.com/${username}`
      }
      // c/ 또는 user/ 경로
      if (username.startsWith('c/') || username.startsWith('user/')) {
        return `https://www.youtube.com/${username}`
      }
      // 일반 핸들 (@없이 저장)
      return `https://www.youtube.com/@${username}`
    case 'tiktok':
      return `https://www.tiktok.com/@${username}`
    default:
      return `https://${value}`
  }
}

// 컴팩트 태그
const Tag = ({ children, color = 'gray' }) => {
  const colors = {
    pink: 'bg-pink-50 text-pink-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray: 'bg-gray-100 text-gray-600'
  }
  return (
    <span className={`px-2 py-1 rounded-md text-[11px] font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

// 스펙 아이템
const SpecItem = ({ label, value, icon }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
      {icon && <span className="text-xs">{icon}</span>}
      {value || '-'}
    </span>
  </div>
)

// 채널 아이콘
const ChannelStat = ({ icon, count, label, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-1`}>
      {icon}
    </div>
    <span className="text-sm font-bold text-gray-900">{formatNumber(count)}</span>
    <span className="text-[10px] text-gray-400">{label}</span>
  </div>
)

// AI 프로필 (접이식)
const AIProfileSection = ({ profile, beautyProfile, savedText, onSave, saving }) => {
  const [expanded, setExpanded] = useState(false)
  const [aiProfile, setAiProfile] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false)

  useEffect(() => {
    if (savedText && !hasLoadedSaved) {
      setAiProfile(savedText)
      setHasLoadedSaved(true)
      setExpanded(true)
    }
  }, [savedText, hasLoadedSaved])

  const generateAIProfile = () => {
    setGenerating(true)
    setTimeout(() => {
      const name = profile.name || '크리에이터'
      const gender = getLabel(GENDERS, beautyProfile.gender) || ''
      const skinType = getLabel(SKIN_TYPES, beautyProfile.skin_type)
      const primaryInterest = getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)
      const followerRange = getLabel(FOLLOWER_RANGES, beautyProfile.follower_range)
      const skinConcerns = getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns)

      let lines = []
      lines.push(`안녕하세요, ${gender ? `${gender} ` : ''}뷰티 크리에이터 ${name}입니다.`)
      if (primaryInterest) lines.push(`${primaryInterest} 분야의 콘텐츠를 주로 제작합니다.`)
      if (skinType && skinConcerns.length > 0) {
        lines.push(`${skinType} 피부로 ${skinConcerns.slice(0, 2).join(', ')} 고민을 다룹니다.`)
      }
      if (followerRange) lines.push(`${followerRange} 규모의 팔로워와 소통 중입니다.`)
      lines.push(`협업 제안 환영합니다!`)

      setAiProfile(lines.join(' '))
      setGenerating(false)
      setExpanded(true)
    }, 800)
  }

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3">
      <button
        onClick={() => aiProfile ? setExpanded(!expanded) : generateAIProfile()}
        disabled={generating}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-gray-800">AI 소개글</span>
        </div>
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
        ) : aiProfile ? (
          expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <span className="text-xs text-violet-600 font-medium">생성하기</span>
        )}
      </button>

      {expanded && aiProfile && (
        <div className="mt-3 pt-3 border-t border-violet-100">
          <p className="text-sm text-gray-700 leading-relaxed">{aiProfile}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(aiProfile)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="flex-1 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-600 flex items-center justify-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? '복사됨' : '복사'}
            </button>
            <button
              onClick={() => { onSave(aiProfile) }}
              disabled={saving}
              className="flex-1 py-1.5 bg-violet-500 rounded-lg text-xs font-medium text-white"
            >
              {saving ? '저장중...' : '저장'}
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
  const location = useLocation()

  // 현재 경로에 따라 활성 탭 결정
  const getActiveNavTab = () => {
    const path = location.pathname
    if (path === '/campaigns') return 'search'
    if (path === '/mypage' || path.startsWith('/my/')) return 'my'
    if (path.startsWith('/profile')) return 'my'
    return 'home'
  }
  const currentNavTab = getActiveNavTab()

  const [profile, setProfile] = useState(null)
  const [beautyProfile, setBeautyProfile] = useState(null)
  const [aiProfileText, setAiProfileText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [expandedSections, setExpandedSections] = useState({})

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
          skin_shade: data.skin_shade || '',
          personal_color: data.personal_color || '',
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
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">프로필 정보가 없습니다.</p>
        <button onClick={() => navigate('/profile/settings')} className="px-6 py-3 bg-violet-500 text-white rounded-xl font-bold">
          프로필 작성하기
        </button>
      </div>
    )
  }

  // 카테고리별 태그 생성
  const beautyTags = []
  if (beautyProfile.skin_type) beautyTags.push(getLabel(SKIN_TYPES, beautyProfile.skin_type))
  if (beautyProfile.skin_shade) beautyTags.push(getLabel(SKIN_SHADES, beautyProfile.skin_shade))
  if (beautyProfile.personal_color) beautyTags.push(getLabel(PERSONAL_COLORS, beautyProfile.personal_color))
  getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns).forEach(c => beautyTags.push(c))
  if (beautyProfile.hair_type) beautyTags.push(getLabel(HAIR_TYPES, beautyProfile.hair_type))
  getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns).forEach(c => beautyTags.push(c))
  if (beautyProfile.nail_usage && beautyProfile.nail_usage !== 'never') beautyTags.push(`네일 ${getLabel(NAIL_USAGE, beautyProfile.nail_usage)}`)
  if (beautyProfile.circle_lens_usage && beautyProfile.circle_lens_usage !== 'never') beautyTags.push(`렌즈 ${getLabel(CIRCLE_LENS_USAGE, beautyProfile.circle_lens_usage)}`)
  if (beautyProfile.glasses_usage && beautyProfile.glasses_usage !== 'never') beautyTags.push(`안경 ${getLabel(GLASSES_USAGE, beautyProfile.glasses_usage)}`)

  const channelTags = []
  if (beautyProfile.primary_interest) channelTags.push(getLabel(CHANNEL_CONTENTS, beautyProfile.primary_interest))
  if (beautyProfile.category) channelTags.push(getLabel(CATEGORIES, beautyProfile.category))
  if (beautyProfile.follower_range) channelTags.push(getLabel(FOLLOWER_RANGES, beautyProfile.follower_range))
  if (beautyProfile.upload_frequency) channelTags.push(getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency))
  if (beautyProfile.editing_level) channelTags.push(`편집 ${getLabel(EDITING_LEVELS, beautyProfile.editing_level)}`)
  if (beautyProfile.shooting_level) channelTags.push(`촬영 ${getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)}`)
  getLabels(CONTENT_FORMATS, beautyProfile.content_formats).forEach(f => channelTags.push(f))
  getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences).forEach(c => channelTags.push(c))
  if (beautyProfile.video_length_style) channelTags.push(getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style))
  if (beautyProfile.shortform_tempo) channelTags.push(`${getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo)} 템포`)
  getLabels(VIDEO_STYLES, beautyProfile.video_styles).forEach(s => channelTags.push(s))

  const activityTags = []
  if (beautyProfile.child_appearance === 'possible') {
    activityTags.push('아이출연가능')
    beautyProfile.children?.forEach(child => {
      activityTags.push(`${child.gender === 'boy' ? '남아' : '여아'} ${child.age}세`)
    })
  }
  if (beautyProfile.family_appearance === 'possible') {
    activityTags.push('가족출연가능')
    getLabels(FAMILY_MEMBERS, beautyProfile.family_members).forEach(m => activityTags.push(`${m}출연`))
  }
  if (beautyProfile.offline_visit === 'possible') {
    activityTags.push('오프라인촬영가능')
    getLabels(OFFLINE_LOCATIONS, beautyProfile.offline_locations).forEach(l => activityTags.push(l))
    if (beautyProfile.offline_region) activityTags.push(beautyProfile.offline_region)
  }
  if (beautyProfile.linktree_available === 'possible') {
    activityTags.push('링크트리가능')
    getLabels(LINKTREE_CHANNELS, beautyProfile.linktree_channels).forEach(c => activityTags.push(`${c} 링크트리`))
  }
  if (beautyProfile.mirroring_available === 'possible') {
    activityTags.push('미러링가능')
    beautyProfile.mirroring_channels?.forEach(c => {
      const names = { naver_clip: '네이버클립', youtube: '유튜브', instagram: '인스타', tiktok: '틱톡' }
      activityTags.push(`${names[c] || c} 미러링`)
    })
  }
  if (beautyProfile.smartstore_purchase === 'possible') activityTags.push('스마트스토어구매가능')

  const otherTags = []
  getLabels(DIET_CONCERNS, beautyProfile.diet_concerns).forEach(d => otherTags.push(d))
  getLabels(LANGUAGES, beautyProfile.languages).forEach(l => otherTags.push(l))
  if (beautyProfile.gender) otherTags.push(getLabel(GENDERS, beautyProfile.gender))
  if (profile.age) otherTags.push(`${profile.age}세`)
  if (beautyProfile.job_visibility === 'public' && beautyProfile.job) otherTags.push(beautyProfile.job)

  // 탭별 태그 개수
  const tabCounts = {
    beauty: beautyTags.length,
    channel: channelTags.length,
    activity: activityTags.length,
    other: otherTags.length
  }
  const totalTags = beautyTags.length + channelTags.length + activityTags.length + otherTags.length

  // 더보기 토글
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // 태그 렌더링 (더보기 기능 포함)
  const renderTags = (tags, color, section, limit = 6) => {
    const isExpanded = expandedSections[section]
    const displayTags = isExpanded ? tags : tags.slice(0, limit)
    const hasMore = tags.length > limit

    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag, idx) => (
            <Tag key={idx} color={color}>{tag}</Tag>
          ))}
        </div>
        {hasMore && (
          <button onClick={() => toggleSection(section)} className="mt-1.5 text-[11px] text-violet-500 font-medium">
            {isExpanded ? '접기' : `+${tags.length - limit}개 더보기`}
          </button>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-11 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">프로필</h1>
          <button onClick={() => navigate('/profile/settings')} className="p-1 -mr-1">
            <Edit3 size={16} className="text-violet-500" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            {/* 프로필 사진 */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                {profile.profile_image ? (
                  <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                    <User className="w-7 h-7 text-violet-300" />
                  </div>
                )}
              </div>
              {beautyProfile.primary_interest && (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-violet-500 text-white text-[9px] font-bold rounded-md">
                  {getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)?.slice(0, 4)}
                </div>
              )}
            </div>

            {/* 이름 & 소셜 */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{profile.name || '이름 없음'}</h2>
              <p className="text-xs text-gray-500">
                {getLabel(GENDERS, beautyProfile.gender)}
                {profile.age ? ` · ${profile.age}세` : ''}
              </p>

              {/* 소셜 아이콘 */}
              <div className="flex gap-1.5 mt-2">
                {profile.instagram_url && (
                  <a href={normalizeUrl(profile.instagram_url, 'instagram')}
                     target="_blank" rel="noopener noreferrer"
                     className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Instagram size={14} className="text-white" />
                  </a>
                )}
                {profile.youtube_url && (
                  <a href={normalizeUrl(profile.youtube_url, 'youtube')}
                     target="_blank" rel="noopener noreferrer"
                     className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                    <Youtube size={14} className="text-white" />
                  </a>
                )}
                {profile.tiktok_url && (
                  <a href={normalizeUrl(profile.tiktok_url, 'tiktok')}
                     target="_blank" rel="noopener noreferrer"
                     className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                    <Hash size={14} className="text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          {profile.bio && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
          )}
        </div>

        {/* 채널 영향력 */}
        {(profile.instagram_followers || profile.youtube_subscribers || profile.tiktok_followers) && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-3">CHANNEL INFLUENCE</p>
            <div className="flex justify-around">
              {profile.youtube_subscribers && (
                <ChannelStat
                  icon={<Youtube size={18} className="text-white" />}
                  count={profile.youtube_subscribers}
                  label="YOUTUBE"
                  color="bg-red-500"
                />
              )}
              {profile.instagram_followers && (
                <ChannelStat
                  icon={<Instagram size={18} className="text-white" />}
                  count={profile.instagram_followers}
                  label="INSTAGRAM"
                  color="bg-gradient-to-br from-purple-500 to-pink-500"
                />
              )}
              {profile.tiktok_followers && (
                <ChannelStat
                  icon={<Hash size={18} className="text-white" />}
                  count={profile.tiktok_followers}
                  label="TIKTOK"
                  color="bg-gray-900"
                />
              )}
            </div>
          </div>
        )}

        {/* 뷰티 스펙 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 mb-3">BEAUTY SPEC</p>
          <div className="grid grid-cols-3 gap-4">
            <SpecItem label="피부" value={getLabel(SKIN_TYPES, beautyProfile.skin_type)} />
            <SpecItem label="호수" value={getLabel(SKIN_SHADES, beautyProfile.skin_shade)} />
            <SpecItem label="퍼스널컬러" value={getLabel(PERSONAL_COLORS, beautyProfile.personal_color)?.slice(0, 5)} />
            <SpecItem label="헤어" value={getLabel(HAIR_TYPES, beautyProfile.hair_type)} />
            <SpecItem label="편집" value={getLabel(EDITING_LEVELS, beautyProfile.editing_level)} />
            <SpecItem label="촬영" value={getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)} />
          </div>

          {/* 피부 고민 */}
          {beautyProfile.skin_concerns?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase mb-2">CONCERNS</p>
              <div className="flex flex-wrap gap-1">
                {getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns).slice(0, 4).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-[11px]">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI 소개글 */}
        <AIProfileSection
          profile={profile}
          beautyProfile={beautyProfile}
          savedText={aiProfileText}
          onSave={saveAiProfile}
          saving={saving}
        />

        {/* 키워드 태그 - 탭 형태 */}
        {totalTags > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-3">KEYWORDS</p>

            {/* 탭 버튼 */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                  activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                전체 {totalTags}
              </button>
              {tabCounts.beauty > 0 && (
                <button
                  onClick={() => setActiveTab('beauty')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                    activeTab === 'beauty' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600'
                  }`}
                >
                  뷰티 {tabCounts.beauty}
                </button>
              )}
              {tabCounts.channel > 0 && (
                <button
                  onClick={() => setActiveTab('channel')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                    activeTab === 'channel' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  채널 {tabCounts.channel}
                </button>
              )}
              {tabCounts.activity > 0 && (
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                    activeTab === 'activity' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
                  }`}
                >
                  활동 {tabCounts.activity}
                </button>
              )}
              {tabCounts.other > 0 && (
                <button
                  onClick={() => setActiveTab('other')}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap ${
                    activeTab === 'other' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  기타 {tabCounts.other}
                </button>
              )}
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === 'all' && (
              <div className="space-y-3">
                {beautyTags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-pink-400 font-medium mb-1.5">💄 뷰티</p>
                    {renderTags(beautyTags, 'pink', 'beauty-all')}
                  </div>
                )}
                {channelTags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-blue-400 font-medium mb-1.5">📺 채널</p>
                    {renderTags(channelTags, 'blue', 'channel-all')}
                  </div>
                )}
                {activityTags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-orange-400 font-medium mb-1.5">🎬 활동</p>
                    {renderTags(activityTags, 'orange', 'activity-all')}
                  </div>
                )}
                {otherTags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5">✨ 기타</p>
                    {renderTags(otherTags, 'gray', 'other-all')}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'beauty' && beautyTags.length > 0 && renderTags(beautyTags, 'pink', 'beauty', 12)}
            {activeTab === 'channel' && channelTags.length > 0 && renderTags(channelTags, 'blue', 'channel', 12)}
            {activeTab === 'activity' && activityTags.length > 0 && renderTags(activityTags, 'orange', 'activity', 12)}
            {activeTab === 'other' && otherTags.length > 0 && renderTags(otherTags, 'gray', 'other', 12)}
          </div>
        )}

        {/* 연락처 (간단히) */}
        {(profile.phone || profile.address) && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">CONTACT</p>
            {profile.phone && <p className="text-sm text-gray-700">{profile.phone}</p>}
            {profile.address && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {profile.address}
              </p>
            )}
          </div>
        )}

        {/* 프로필 수정 버튼 */}
        <button
          onClick={() => navigate('/profile/settings')}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          프로필 수정
        </button>
      </div>

      {/* 앱 전체 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 z-30">
        <div className="flex justify-between items-center py-3 px-8 pb-6">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentNavTab === 'home' ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            <Home size={24} strokeWidth={currentNavTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">홈</span>
          </button>

          <button
            onClick={() => navigate('/campaigns')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentNavTab === 'search' ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            <Search size={24} strokeWidth={currentNavTab === 'search' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">캠페인</span>
          </button>

          <button
            onClick={() => navigate('/mypage')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              currentNavTab === 'my' ? 'text-purple-600' : 'text-gray-300'
            }`}
          >
            <User size={24} strokeWidth={currentNavTab === 'my' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">마이</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default ProfileViewTest
