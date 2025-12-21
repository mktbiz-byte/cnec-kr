import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database, supabase } from '../lib/supabase'
// imageCompression import 제거 - 인라인 canvas 압축 사용
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Save, User, Lock,
  Instagram, Youtube, Hash, Globe, CheckCircle,
  AlertCircle, Home, ArrowLeft, Camera, AlertTriangle, X, LogOut
} from 'lucide-react'
import { Link } from 'react-router-dom'

const ProfileSettings = () => {
  const { user, signOut } = useAuth()
  const { language } = useLanguage()
  
  // 프로필 필드 (Master DB 스키마 기준 - 브랜드 사이트 연동)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    skin_type: '',
    category: '',
    // 대표 채널 정보 (브랜드 사이트 검색용)
    channel_name: '',
    followers: '',
    avg_views: '',
    target_audience: '',
    // SNS URL
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    blog_url: '',
    bio: '',
    profile_image: '',
    // 주소 정보
    postcode: '',
    address: '',
    detail_address: '',
    // SNS 개별 팔로워/구독자 수
    instagram_followers: '',
    youtube_subscribers: '',
    tiktok_followers: ''
  })

  // 프로필 사진 업로드 상태
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

  // 회원 탈퇴 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionDetails, setDeletionDetails] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '프로필 설정',
      subtitle: '개인정보 및 계정 설정을 관리하세요',
      personalInfo: '개인정보',
      accountSettings: '계정 설정',
      name: '이름',
      email: '이메일',
      age: '나이',
      skinType: '피부 타입',
      socialMedia: '소셜 미디어',
      instagramUrl: '인스타그램 URL',
      youtubeUrl: '유튜브 URL',
      tiktokUrl: '틱톡 URL',
      bio: '자기소개',
      changePassword: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      confirmPassword: '비밀번호 확인',
      save: '저장',
      saving: '저장 중...',
      backToHome: '마이페이지로',
      skinTypes: {
        dry: '건성',
        oily: '지성',
        combination: '복합성',
        sensitive: '민감성',
        normal: '보통'
      }
    },
    ja: {
      title: 'プロフィール設定',
      subtitle: '個人情報とアカウント設定を管理します',
      personalInfo: '個人情報',
      accountSettings: 'アカウント設定',
      name: '名前',
      email: 'メール',
      age: '年齢',
      skinType: '肌タイプ',
      socialMedia: 'ソーシャルメディア',
      instagramUrl: 'Instagram URL',
      youtubeUrl: 'YouTube URL',
      tiktokUrl: 'TikTok URL',
      bio: '自己紹介',
      changePassword: 'パスワード変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      confirmPassword: 'パスワード確認',
      save: '保存',
      saving: '保存中...',
      backToHome: 'ホームに戻る',
      skinTypes: {
        dry: '乾燥肌',
        oily: '脂性肌',
        combination: '混合肌',
        sensitive: '敏感肌',
        normal: '普通肌'
      }
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      console.log('프로필 로드 시작, 사용자 ID:', user?.id)
      
      const profileData = await database.userProfiles.get(user.id)
      console.log('로드된 프로필 데이터:', profileData)
      
      if (profileData) {
        setProfile({
          name: profileData.name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          age: profileData.age || '',
          skin_type: profileData.skin_type || '',
          category: profileData.category || '',
          // 대표 채널 정보 (브랜드 사이트 검색용)
          channel_name: profileData.channel_name || '',
          followers: profileData.followers || '',
          avg_views: profileData.avg_views || '',
          target_audience: profileData.target_audience || '',
          // SNS URL
          instagram_url: profileData.instagram_url || '',
          youtube_url: profileData.youtube_url || '',
          tiktok_url: profileData.tiktok_url || '',
          blog_url: profileData.blog_url || '',
          bio: profileData.bio || '',
          profile_image: profileData.profile_image || '',
          // 주소 정보
          postcode: profileData.postcode || '',
          address: profileData.address || '',
          detail_address: profileData.detail_address || '',
          // SNS 개별 팔로워/구독자 수
          instagram_followers: profileData.instagram_followers || '',
          youtube_subscribers: profileData.youtube_subscribers || '',
          tiktok_followers: profileData.tiktok_followers || ''
        })
        // 기존 프로필 사진이 있으면 미리보기에 설정
        if (profileData.profile_image) {
          setPhotoPreview(profileData.profile_image)
        }
      } else {
        // 프로필이 없으면 기본값으로 설정
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
        return
      }

      console.log('프로필 저장 시작:', profile)

      // Master DB 스키마에 맞춘 데이터 전송 (브랜드 사이트 연동)
      // user_profiles 테이블은 id가 auth user id를 PK로 사용
      // 주의: profile_image는 DB 컬럼이 없을 수 있으므로 제외 (Storage에만 저장)
      const profileData = {
        id: user.id,
        role: 'creator', // 필수! 브랜드 사이트 검색에 필요
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone?.trim() || null,
        age: profile.age ? parseInt(profile.age) : null,
        skin_type: profile.skin_type || null,
        category: profile.category || null,
        // 대표 채널 정보 (브랜드 사이트 크리에이터 선택 시 사용)
        channel_name: profile.channel_name?.trim() || null,
        followers: profile.followers ? parseInt(profile.followers) : null,
        avg_views: profile.avg_views ? parseInt(profile.avg_views) : null,
        target_audience: profile.target_audience?.trim() || null,
        // SNS URL
        instagram_url: profile.instagram_url.trim() || null,
        youtube_url: profile.youtube_url.trim() || null,
        tiktok_url: profile.tiktok_url.trim() || null,
        blog_url: profile.blog_url?.trim() || null,
        bio: profile.bio.trim() || null,
        // profile_image는 DB 컬럼이 없으므로 제외 - Storage URL만 사용
        // 주소 정보
        postcode: profile.postcode?.trim() || null,
        address: profile.address?.trim() || null,
        detail_address: profile.detail_address?.trim() || null,
        // SNS 개별 팔로워/구독자 수
        instagram_followers: profile.instagram_followers ? parseInt(profile.instagram_followers) : null,
        youtube_subscribers: profile.youtube_subscribers ? parseInt(profile.youtube_subscribers) : null,
        tiktok_followers: profile.tiktok_followers ? parseInt(profile.tiktok_followers) : null
      }

      console.log('저장할 프로필 데이터:', profileData)

      const result = await database.userProfiles.upsert(profileData)
      console.log('프로필 저장 결과:', result)

      setSuccess('프로필이 성공적으로 저장되었습니다.')
      
      // 성공 메시지를 3초 후에 자동으로 숨김
      setTimeout(() => {
        setSuccess('')
      }, 3000)

    } catch (error) {
      console.error('프로필 저장 오류:', error)
      setError(`프로필 저장에 실패했습니다: ${error.message}`)
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
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.')
        return
      }

      if (passwordData.newPassword.length < 6) {
        setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // 성공 메시지를 3초 후에 자동으로 숨김
      setTimeout(() => {
        setSuccess('')
      }, 3000)

    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setError(`비밀번호 변경에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 회원 탈퇴 처리
  const handleAccountDeletion = async () => {
    try {
      if (confirmText !== '회원탈퇴') {
        setError('확인 텍스트를 정확히 입력해주세요.')
        return
      }

      setDeleting(true)
      setError('')

      // 사용자 계정 삭제 (Supabase Auth)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) throw deleteError

      setSuccess('회원 탈퇴가 완료되었습니다.')
      setTimeout(() => {
        signOut()
      }, 2000)
    } catch (err) {
      console.error('회원 탈퇴 오류:', err)
      setError('회원 탈퇴 처리 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  // 다음 우편번호 검색
  const handleAddressSearch = () => {
    if (typeof window === 'undefined') return

    // 다음 우편번호 스크립트 로드
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => {
      new window.daum.Postcode({
        oncomplete: function(data) {
          // 우편번호와 주소 정보 설정
          let fullAddress = data.address
          let extraAddress = ''

          if (data.addressType === 'R') {
            if (data.bname !== '') {
              extraAddress += data.bname
            }
            if (data.buildingName !== '') {
              extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName)
            }
            fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '')
          }

          setProfile(prev => ({
            ...prev,
            postcode: data.zonecode,
            address: fullAddress
          }))
        }
      }).open()
    }
    document.head.appendChild(script)
  }

  // 프로필 사진 업로드
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크 (JPG, PNG만 허용 - GIF 불가)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('JPG 또는 PNG 파일만 업로드 가능합니다. (GIF 불가)')
      return
    }

    try {
      setUploadingPhoto(true)
      setError('')

      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // 이미지를 JPEG로 변환 및 압축
      let fileToUpload
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = URL.createObjectURL(file)
        })

        // 최대 1920px로 리사이즈
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

        // 항상 JPEG로 변환
        const blob = await new Promise(resolve =>
          canvas.toBlob(resolve, 'image/jpeg', 0.85)
        )

        const fileName = `${user.id}-${Date.now()}.jpg`
        fileToUpload = new File([blob], fileName, { type: 'image/jpeg' })

        URL.revokeObjectURL(img.src)

        console.log('이미지 압축 완료:', {
          원본: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          압축: `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`
        })
      } catch (compressionError) {
        console.error('이미지 압축 실패:', compressionError)
        setError('이미지 처리 중 오류가 발생했습니다.')
        setUploadingPhoto(false)
        return
      }

      // Supabase Storage에 업로드
      const filePath = `${user.id}/${fileToUpload.name}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      // 데이터베이스 업데이트 시도 (profile_image 컬럼이 없을 수 있음)
      // DB 업데이트 실패해도 Storage에 이미지가 저장되었으므로 성공으로 처리
      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ profile_image: publicUrl })
          .eq('id', user.id)

        if (updateError) {
          console.warn('프로필 이미지 DB 업데이트 실패 (컬럼이 없을 수 있음):', updateError)
          // DB 업데이트 실패해도 Storage에 저장되었으므로 계속 진행
        }
      } catch (dbError) {
        console.warn('프로필 이미지 DB 업데이트 오류:', dbError)
      }

      // 로컬 상태 업데이트 (Storage URL 사용)
      setProfile(prev => ({ ...prev, profile_image: publicUrl }))
      setPhotoPreview(publicUrl)
      setSuccess('프로필 사진이 업로드되었습니다.')

      setTimeout(() => setSuccess(''), 3000)
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
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>프로필을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/mypage"
              className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.backToHome}
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 개인정보 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t.personalInfo}
              </CardTitle>
              <CardDescription>
                기본 개인정보를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 프로필 사진 */}
              <div className="space-y-2">
                <Label>프로필 사진</Label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                          <User className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                      {uploadingPhoto ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
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
                  <div className="text-sm text-gray-500">
                    <p>JPG, PNG 파일 (최대 10MB)</p>
                    <p className="text-xs mt-1">권장 크기: 400x400px</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.name}
                />
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  이메일은 변경할 수 없습니다
                </p>
              </div>

              {/* 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-1234-5678"
                />
              </div>

              {/* 나이 */}
              <div className="space-y-2">
                <Label htmlFor="age">{t.age}</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={t.age}
                  min="1"
                  max="120"
                />
              </div>

              {/* 피부 타입 */}
              <div className="space-y-2">
                <Label htmlFor="skin_type">{t.skinType}</Label>
                <Select
                  value={profile.skin_type}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, skin_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.skinType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">{t.skinTypes.dry}</SelectItem>
                    <SelectItem value="oily">{t.skinTypes.oily}</SelectItem>
                    <SelectItem value="combination">{t.skinTypes.combination}</SelectItem>
                    <SelectItem value="sensitive">{t.skinTypes.sensitive}</SelectItem>
                    <SelectItem value="normal">{t.skinTypes.normal}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 카테고리 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={profile.category}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skincare">기초</SelectItem>
                    <SelectItem value="makeup">메이크업</SelectItem>
                    <SelectItem value="maskpack">마스크팩</SelectItem>
                    <SelectItem value="suncare">선케어</SelectItem>
                    <SelectItem value="haircare">헤어</SelectItem>
                    <SelectItem value="bodycare">바디케어</SelectItem>
                    <SelectItem value="fragrance">향수</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 대표 채널 정보 (브랜드 사이트 연동용) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Youtube className="h-5 w-5 mr-2" />
                  대표 채널 정보
                </h3>
                <p className="text-sm text-gray-500">브랜드 사이트에서 크리에이터 검색 시 사용됩니다</p>

                <div className="space-y-2">
                  <Label htmlFor="channel_name">채널명</Label>
                  <Input
                    id="channel_name"
                    value={profile.channel_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, channel_name: e.target.value }))}
                    placeholder="대표 채널명"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="followers">팔로워/구독자 수</Label>
                    <Input
                      id="followers"
                      type="number"
                      value={profile.followers}
                      onChange={(e) => setProfile(prev => ({ ...prev, followers: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avg_views">평균 조회수</Label>
                    <Input
                      id="avg_views"
                      type="number"
                      value={profile.avg_views}
                      onChange={(e) => setProfile(prev => ({ ...prev, avg_views: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">타겟 오디언스</Label>
                  <Input
                    id="target_audience"
                    value={profile.target_audience}
                    onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="예: 20-30대 여성, 뷰티에 관심있는 MZ세대"
                  />
                </div>
              </div>

              <Separator />

              {/* 소셜 미디어 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  {t.socialMedia}
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    {t.instagramUrl}
                  </Label>
                  <Input
                    id="instagram_url"
                    value={profile.instagram_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url" className="flex items-center">
                    <Youtube className="h-4 w-4 mr-2" />
                    {t.youtubeUrl}
                  </Label>
                  <Input
                    id="youtube_url"
                    value={profile.youtube_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://youtube.com/@username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok_url" className="flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    {t.tiktokUrl}
                  </Label>
                  <Input
                    id="tiktok_url"
                    value={profile.tiktok_url}
                    onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>

                <Separator className="my-4" />

                {/* SNS 팔로워 수 */}
                <h4 className="text-sm font-medium text-gray-700">SNS 팔로워 수</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="instagram_followers" className="text-xs flex items-center">
                      <Instagram className="h-3 w-3 mr-1" />
                      인스타
                    </Label>
                    <Input
                      id="instagram_followers"
                      type="number"
                      value={profile.instagram_followers}
                      onChange={(e) => setProfile(prev => ({ ...prev, instagram_followers: e.target.value }))}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="youtube_subscribers" className="text-xs flex items-center">
                      <Youtube className="h-3 w-3 mr-1" />
                      유튜브
                    </Label>
                    <Input
                      id="youtube_subscribers"
                      type="number"
                      value={profile.youtube_subscribers}
                      onChange={(e) => setProfile(prev => ({ ...prev, youtube_subscribers: e.target.value }))}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tiktok_followers" className="text-xs flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      틱톡
                    </Label>
                    <Input
                      id="tiktok_followers"
                      type="number"
                      value={profile.tiktok_followers}
                      onChange={(e) => setProfile(prev => ({ ...prev, tiktok_followers: e.target.value }))}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 주소 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  배송 주소
                </h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="postcode">우편번호</Label>
                    <Input
                      id="postcode"
                      value={profile.postcode}
                      onChange={(e) => setProfile(prev => ({ ...prev, postcode: e.target.value }))}
                      placeholder="우편번호"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddressSearch}
                      className="whitespace-nowrap"
                    >
                      주소 검색
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="주소 검색 버튼을 클릭하세요"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail_address">상세주소</Label>
                  <Input
                    id="detail_address"
                    value={profile.detail_address}
                    onChange={(e) => setProfile(prev => ({ ...prev, detail_address: e.target.value }))}
                    placeholder="아파트/건물명, 동/호수"
                  />
                </div>
              </div>

              <Separator />

              {/* 자기소개 */}
              <div className="space-y-2">
                <Label htmlFor="bio">{t.bio}</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t.bio}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 계정 설정 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                {t.accountSettings}
              </CardTitle>
              <CardDescription>
                계정 보안 설정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t.changePassword}</h3>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder={t.currentPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder={t.newPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t.confirmPassword}
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  variant="outline"
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      {t.changePassword}
                    </>
                  )}
                </Button>
              </div>

              <Separator className="my-6" />

              {/* 회원 탈퇴 */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <h3 className="text-base font-semibold text-red-900">회원 탈퇴</h3>
                    <p className="mt-1 text-sm text-red-700">
                      회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                      보유 중인 포인트는 모두 소멸됩니다.
                    </p>
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                    >
                      회원 탈퇴하기
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* 로그아웃 */}
              <Button
                onClick={signOut}
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-red-600">회원 탈퇴</h3>
              <button onClick={() => setShowDeleteModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  탈퇴 사유
                </label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="회원탈퇴"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleAccountDeletion}
                  disabled={deleting || confirmText !== '회원탈퇴'}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleting ? '처리중...' : '탈퇴하기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings
