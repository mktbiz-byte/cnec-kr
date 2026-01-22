/**
 * ProfileViewTest.jsx
 * 뷰티 크리에이터 프로필 종합 보기 페이지
 * AI 프로필 작성기 포함
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, ArrowLeft, Edit3,
  Sparkles, MapPin, Phone, Mail, Camera, Video, Users, Baby,
  Globe, Link2, Star, RefreshCw, Copy, Check, Briefcase
} from 'lucide-react'

import {
  SKIN_TYPES, HAIR_TYPES, PRIMARY_INTERESTS, EDITING_LEVELS, SHOOTING_LEVELS,
  FOLLOWER_RANGES, UPLOAD_FREQUENCIES, GENDERS, JOB_VISIBILITY,
  CHILD_APPEARANCE, FAMILY_APPEARANCE, OFFLINE_VISIT, OFFLINE_LOCATIONS,
  LINKTREE_AVAILABLE, LINKTREE_CHANNELS, LANGUAGES,
  VIDEO_LENGTH_STYLES, SHORTFORM_TEMPO_STYLES, VIDEO_STYLES,
  SKIN_CONCERNS, HAIR_CONCERNS, DIET_CONCERNS,
  CONTENT_FORMATS, COLLABORATION_PREFERENCES, CATEGORIES
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

// 테스트 모드 배너
const TestModeBanner = () => (
  <div className="bg-emerald-500 text-white text-center py-2 px-4 text-sm font-medium">
    프로필 미리보기 (테스트)
  </div>
)

// 섹션 컴포넌트
const Section = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
)

// 정보 행 컴포넌트
const InfoRow = ({ label, value, highlight = false }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[60%] ${highlight ? 'text-violet-600' : 'text-gray-900'}`}>
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  )
}

// 태그 그룹 컴포넌트
const TagGroup = ({ tags, color = 'violet' }) => {
  if (!tags || tags.length === 0) return <span className="text-sm text-gray-400">-</span>

  const colorClasses = {
    violet: 'bg-violet-100 text-violet-700',
    pink: 'bg-pink-100 text-pink-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, idx) => (
        <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colorClasses[color]}`}>
          {tag}
        </span>
      ))}
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

  // 저장된 텍스트가 있으면 표시
  useEffect(() => {
    if (savedText && !aiProfile) {
      setAiProfile(savedText)
    }
  }, [savedText])

  const generateAIProfile = () => {
    setGenerating(true)

    // 프로필 데이터 기반으로 AI 프로필 생성 (실제로는 AI API 호출)
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
      const videoStyle = getLabel(VIDEO_STYLES, beautyProfile.video_style)
      const videoLength = getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style)
      const tempo = getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo)

      const skinConcerns = getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns)
      const hairConcerns = getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns)
      const contentFormats = getLabels(CONTENT_FORMATS, beautyProfile.content_formats)
      const collabPrefs = getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences)
      const languages = getLabels(LANGUAGES, beautyProfile.languages)

      // 프로필 문구 생성
      let intro = `안녕하세요! ${gender ? gender + ' ' : ''}${age ? age + ' ' : ''}뷰티 크리에이터 ${name}입니다.`

      // 전문 분야
      let expertise = ''
      if (primaryInterest) {
        expertise = `\n\n${primaryInterest} 분야를 중심으로 활동하고 있습니다.`
      }

      // 피부/헤어 특징
      let features = ''
      if (skinType || hairType) {
        features = '\n\n'
        if (skinType) features += `${skinType} 피부`
        if (skinType && hairType) features += ', '
        if (hairType) features += `${hairType} 헤어`
        features += ' 타입으로, '

        const concerns = [...skinConcerns.slice(0, 2), ...hairConcerns.slice(0, 2)]
        if (concerns.length > 0) {
          features += `${concerns.join(', ')} 등의 고민을 가진 분들께 도움이 되는 콘텐츠를 만들고 있어요.`
        } else {
          features += '관련 콘텐츠를 제작하고 있어요.'
        }
      }

      // 콘텐츠 스타일
      let style = ''
      if (videoStyle || videoLength || contentFormats.length > 0) {
        style = '\n\n'
        if (videoStyle) style += `${videoStyle} 스타일의 `
        if (videoLength) style += `${videoLength} `
        style += '영상을 주로 제작하며, '
        if (tempo) style += `${tempo} 템포의 편집으로 `
        if (contentFormats.length > 0) {
          style += `${contentFormats.slice(0, 3).join(', ')} 형식의 콘텐츠를 선보입니다.`
        } else {
          style += '다양한 콘텐츠를 선보입니다.'
        }
      }

      // 역량
      let skills = ''
      if (editingLevel || shootingLevel) {
        skills = '\n\n'
        if (editingLevel) skills += `편집 ${editingLevel}`
        if (editingLevel && shootingLevel) skills += ', '
        if (shootingLevel) skills += `촬영 ${shootingLevel}`
        skills += ' 수준의 역량을 갖추고 있습니다.'
      }

      // 채널 정보
      let channel = ''
      if (followerRange) {
        channel = `\n\n현재 ${followerRange} 규모의 팔로워와 함께하고 있으며, `
        if (uploadFreq) channel += `${uploadFreq} 업로드를 유지하고 있어요.`
      }

      // 협업 선호
      let collab = ''
      if (collabPrefs.length > 0) {
        collab = `\n\n${collabPrefs.join(', ')} 형태의 협업을 선호하며, 브랜드와 진정성 있는 파트너십을 추구합니다.`
      }

      // 언어
      let lang = ''
      if (languages.length > 1) {
        lang = `\n\n${languages.join(', ')} 콘텐츠 제작이 가능합니다.`
      }

      // 마무리
      const closing = '\n\n좋은 기회로 함께할 수 있기를 기대합니다!'

      const generatedProfile = intro + expertise + features + style + skills + channel + collab + lang + closing

      setAiProfile(generatedProfile)
      setGenerating(false)
    }, 1500)
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
    <Section title="AI 프로필 작성기" icon={Sparkles}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          입력하신 프로필 정보를 바탕으로 브랜드에게 어필할 수 있는 자기소개 문구를 자동으로 생성해드려요.
        </p>

        <button
          onClick={generateAIProfile}
          disabled={generating}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              프로필 생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI 프로필 문구 생성하기
            </>
          )}
        </button>

        {aiProfile && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              {isEditing ? (
                <textarea
                  value={aiProfile}
                  onChange={(e) => setAiProfile(e.target.value)}
                  className="w-full p-4 bg-white rounded-xl border-2 border-violet-300 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={12}
                  placeholder="프로필 내용을 수정하세요..."
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                    {aiProfile}
                  </p>
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? '미리보기' : '수정하기'}
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
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {saving ? '저장 중...' : saved ? '저장됨!' : '저장하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
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
          video_style: data.video_styles?.[0] || '',
          category: data.category || '',
          skin_concerns: data.skin_concerns || [],
          hair_concerns: data.hair_concerns || [],
          diet_concerns: data.diet_concerns || [],
          content_formats: data.content_formats || [],
          collaboration_preferences: data.collaboration_preferences || [],
          children: data.children || [],
          family_members: data.family_members || [],
          offline_locations: data.offline_locations || [],
          languages: data.languages || [],
          linktree_channels: data.linktree_channels || []
        })

        // AI 프로필 텍스트 로드
        if (data.ai_profile_text) {
          setAiProfileText(data.ai_profile_text)
        }
      }
    } catch (err) {
      console.error('프로필 로드 오류:', err)
      setError('프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // AI 프로필 텍스트 저장
  const saveAiProfile = async (text) => {
    try {
      setSaving(true)
      await database.userProfiles.update(user.id, {
        ai_profile_text: text
      })
      setAiProfileText(text)
      console.log('AI 프로필 저장 완료')
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
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">프로필 정보가 없습니다.</p>
        <button
          onClick={() => navigate('/profile-test-beta-2025')}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold"
        >
          프로필 작성하기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <TestModeBanner />

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">프로필 미리보기</h1>
          <button
            onClick={() => navigate('/profile-test-beta-2025')}
            className="p-2 -mr-2"
          >
            <Edit3 size={20} className="text-violet-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-red-100 text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 프로필 헤더 */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.name || '이름 없음'}</h2>
              <p className="text-white/80 text-sm mt-1">
                {getLabel(GENDERS, beautyProfile.gender)}
                {profile.age ? ` / ${profile.age}세` : ''}
              </p>
              {beautyProfile.primary_interest && (
                <p className="text-white/90 text-sm mt-1 font-medium">
                  {getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)} 크리에이터
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-white/90 text-sm leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* SNS 아이콘 */}
          <div className="mt-4 flex gap-3">
            {profile.instagram_url && (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Instagram size={18} className="text-white" />
              </div>
            )}
            {profile.youtube_url && (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Youtube size={18} className="text-white" />
              </div>
            )}
            {profile.tiktok_url && (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Hash size={18} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* AI 프로필 작성기 */}
        <AIProfileWriter
          profile={profile}
          beautyProfile={beautyProfile}
          savedText={aiProfileText}
          onSave={saveAiProfile}
          saving={saving}
        />

        {/* 기본 정보 */}
        <Section title="기본 정보" icon={User}>
          <InfoRow label="이름" value={profile.name} />
          <InfoRow label="나이" value={profile.age ? `${profile.age}세` : null} />
          <InfoRow label="성별" value={getLabel(GENDERS, beautyProfile.gender)} />
          <InfoRow label="연락처" value={profile.phone} />
          <InfoRow label="이메일" value={profile.email} />
          {beautyProfile.job_visibility === 'public' && (
            <InfoRow label="직업" value={beautyProfile.job} />
          )}
        </Section>

        {/* 뷰티 프로필 */}
        <Section title="뷰티 프로필" icon={Sparkles}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">피부 타입</p>
              <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                {getLabel(SKIN_TYPES, beautyProfile.skin_type) || '-'}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">피부 고민</p>
              <TagGroup tags={getLabels(SKIN_CONCERNS, beautyProfile.skin_concerns)} color="pink" />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">헤어 타입</p>
              <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                {getLabel(HAIR_TYPES, beautyProfile.hair_type) || '-'}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">헤어 고민</p>
              <TagGroup tags={getLabels(HAIR_CONCERNS, beautyProfile.hair_concerns)} color="amber" />
            </div>

            {beautyProfile.diet_concerns?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">다이어트 고민</p>
                <TagGroup tags={getLabels(DIET_CONCERNS, beautyProfile.diet_concerns)} color="green" />
              </div>
            )}
          </div>
        </Section>

        {/* 크리에이터 역량 */}
        <Section title="크리에이터 역량" icon={Star}>
          <InfoRow label="주요 관심 분야" value={getLabel(PRIMARY_INTERESTS, beautyProfile.primary_interest)} highlight />
          <InfoRow label="관심 카테고리" value={getLabel(CATEGORIES, beautyProfile.category)} />
          <InfoRow label="편집 수준" value={getLabel(EDITING_LEVELS, beautyProfile.editing_level)} />
          <InfoRow label="촬영 수준" value={getLabel(SHOOTING_LEVELS, beautyProfile.shooting_level)} />
          {beautyProfile.languages?.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">언어 능력</p>
              <TagGroup tags={getLabels(LANGUAGES, beautyProfile.languages)} color="blue" />
            </div>
          )}
        </Section>

        {/* 채널 정보 */}
        <Section title="채널 정보" icon={Video}>
          <InfoRow label="대표 채널" value={profile.channel_name} />
          <InfoRow label="팔로워 규모" value={getLabel(FOLLOWER_RANGES, beautyProfile.follower_range)} highlight />
          <InfoRow label="업로드 빈도" value={getLabel(UPLOAD_FREQUENCIES, beautyProfile.upload_frequency)} />
          <InfoRow label="평균 조회수" value={profile.avg_views ? `${profile.avg_views.toLocaleString()}회` : null} />
          <InfoRow label="타겟 오디언스" value={profile.target_audience} />

          <div className="mt-4 space-y-3">
            {profile.instagram_url && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <Instagram size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile.instagram_url}</p>
                  {profile.instagram_followers && (
                    <p className="text-xs text-gray-500">{profile.instagram_followers.toLocaleString()} 팔로워</p>
                  )}
                </div>
              </div>
            )}

            {profile.youtube_url && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <Youtube size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile.youtube_url}</p>
                  {profile.youtube_subscribers && (
                    <p className="text-xs text-gray-500">{profile.youtube_subscribers.toLocaleString()} 구독자</p>
                  )}
                </div>
              </div>
            )}

            {profile.tiktok_url && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Hash size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile.tiktok_url}</p>
                  {profile.tiktok_followers && (
                    <p className="text-xs text-gray-500">{profile.tiktok_followers.toLocaleString()} 팔로워</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* 영상 스타일 */}
        <Section title="영상 스타일" icon={Camera}>
          <InfoRow label="영상 길이" value={getLabel(VIDEO_LENGTH_STYLES, beautyProfile.video_length_style)} highlight />
          <InfoRow label="숏폼 템포" value={getLabel(SHORTFORM_TEMPO_STYLES, beautyProfile.shortform_tempo)} />
          <InfoRow label="영상 스타일" value={getLabel(VIDEO_STYLES, beautyProfile.video_style)} />

          {beautyProfile.content_formats?.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">선호 콘텐츠 형식</p>
              <TagGroup tags={getLabels(CONTENT_FORMATS, beautyProfile.content_formats)} />
            </div>
          )}

          {beautyProfile.collaboration_preferences?.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">협업 선호도</p>
              <TagGroup tags={getLabels(COLLABORATION_PREFERENCES, beautyProfile.collaboration_preferences)} color="blue" />
            </div>
          )}
        </Section>

        {/* 출연 가능 정보 */}
        {(beautyProfile.child_appearance === 'possible' || beautyProfile.family_appearance === 'possible' || beautyProfile.offline_visit === 'possible') && (
          <Section title="출연 가능 정보" icon={Users}>
            {beautyProfile.child_appearance === 'possible' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-medium text-gray-900">아이 출연 가능</span>
                </div>
                {beautyProfile.children?.length > 0 && (
                  <div className="pl-6">
                    {beautyProfile.children.map((child, idx) => (
                      <span key={idx} className="mr-2 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                        {child.gender === 'boy' ? '남아' : '여아'} {child.age}세
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {beautyProfile.family_appearance === 'possible' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">가족 출연 가능</span>
                </div>
                {beautyProfile.family_members?.length > 0 && (
                  <div className="pl-6">
                    <TagGroup
                      tags={beautyProfile.family_members.map(m =>
                        m === 'husband' ? '남편' : m === 'wife' ? '아내' : '부모님'
                      )}
                      color="blue"
                    />
                  </div>
                )}
              </div>
            )}

            {beautyProfile.offline_visit === 'possible' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">오프라인 방문촬영 가능</span>
                </div>
                {beautyProfile.offline_locations?.length > 0 && (
                  <div className="pl-6 mb-2">
                    <TagGroup tags={getLabels(OFFLINE_LOCATIONS, beautyProfile.offline_locations)} color="green" />
                  </div>
                )}
                {beautyProfile.offline_region && (
                  <p className="pl-6 text-sm text-gray-600">지역: {beautyProfile.offline_region}</p>
                )}
              </div>
            )}
          </Section>
        )}

        {/* 링크트리 */}
        {beautyProfile.linktree_available === 'possible' && (
          <Section title="링크트리 설정" icon={Link2}>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">링크트리 설정 가능</span>
            </div>
            {beautyProfile.linktree_channels?.length > 0 && (
              <TagGroup tags={getLabels(LINKTREE_CHANNELS, beautyProfile.linktree_channels)} />
            )}
          </Section>
        )}

        {/* 배송지 정보 */}
        {profile.address && (
          <Section title="배송지 정보" icon={MapPin}>
            <p className="text-sm text-gray-700">
              ({profile.postcode}) {profile.address}
              {profile.detail_address && ` ${profile.detail_address}`}
            </p>
          </Section>
        )}

        {/* 프로필 수정 버튼 */}
        <button
          onClick={() => navigate('/profile-test-beta-2025')}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          프로필 수정하기
        </button>
      </div>
    </div>
  )
}

export default ProfileViewTest
