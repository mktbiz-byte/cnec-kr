import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import {
  Loader2, User, Instagram, Youtube, Hash, Camera, ArrowLeft, Search
} from 'lucide-react'

const ProfileSettings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    skin_type: '',
    personal_color: '',
    instagram_url: '',
    instagram_followers: '',
    youtube_url: '',
    youtube_subscribers: '',
    tiktok_url: '',
    tiktok_followers: '',
    profile_image: '',
    postcode: '',
    address: '',
    detail_address: ''
  })

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPostcodeLayer, setShowPostcodeLayer] = useState(false)

  // 피부 타입 옵션
  const skinTypes = ['건성', '지성', '복합성', '민감성', '중성']

  // 퍼스널 컬러 옵션
  const personalColors = ['봄웜', '여쿨', '가을웜', '겨울쿨']

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
        setProfile({
          name: profileData.name || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          skin_type: profileData.skin_type || '',
          personal_color: profileData.personal_color || '',
          instagram_url: profileData.instagram_url || '',
          instagram_followers: profileData.instagram_followers || '',
          youtube_url: profileData.youtube_url || '',
          youtube_subscribers: profileData.youtube_subscribers || '',
          tiktok_url: profileData.tiktok_url || '',
          tiktok_followers: profileData.tiktok_followers || '',
          profile_image: profileData.profile_image || '',
          postcode: profileData.postcode || '',
          address: profileData.address || '',
          detail_address: profileData.detail_address || ''
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
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone?.trim() || null,
        skin_type: profile.skin_type || null,
        personal_color: profile.personal_color || null,
        instagram_url: profile.instagram_url?.trim() || null,
        instagram_followers: profile.instagram_followers ? parseInt(profile.instagram_followers) : null,
        youtube_url: profile.youtube_url?.trim() || null,
        youtube_subscribers: profile.youtube_subscribers ? parseInt(profile.youtube_subscribers) : null,
        tiktok_url: profile.tiktok_url?.trim() || null,
        tiktok_followers: profile.tiktok_followers ? parseInt(profile.tiktok_followers) : null,
        postcode: profile.postcode?.trim() || null,
        address: profile.address?.trim() || null,
        detail_address: profile.detail_address?.trim() || null
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

  // 인스타그램 URL에서 아이디 추출
  const extractInstagramId = (url) => {
    if (!url) return ''
    const match = url.match(/instagram\.com\/([^/?]+)/)
    return match ? `@${match[1]}` : url
  }

  // 팔로워 수 포맷팅
  const formatFollowers = (num) => {
    if (!num) return ''
    const n = parseInt(num)
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
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
      </div>

      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-4 mt-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center">
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

        {/* 기본 정보 */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">기본 정보</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">닉네임</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="닉네임 입력"
              />
            </div>
            <div>
              <label className="block text-xs text-violet-600 mb-1.5">연락처</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          {/* 배송지 주소 */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1.5">
              배송지 주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
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

        {/* 뷰티 프로필 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-gray-900">뷰티 프로필</h2>
            <span className="text-xs text-violet-600 font-medium">(매칭 확률 UP)</span>
          </div>

          {/* 피부 타입 */}
          <div className="mb-5">
            <label className="block text-sm text-gray-700 mb-2">피부 타입</label>
            <div className="flex flex-wrap gap-2">
              {skinTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setProfile(prev => ({ ...prev, skin_type: type }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profile.skin_type === type
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 퍼스널 컬러 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">퍼스널 컬러</label>
            <div className="flex flex-wrap gap-2">
              {personalColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setProfile(prev => ({ ...prev, personal_color: color }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profile.personal_color === color
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SNS 채널 정보 */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">SNS 채널 정보</h2>

          {/* 인스타그램 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Instagram size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={profile.instagram_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                  className="w-full text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="@username 또는 URL"
                />
              </div>
              <div className="flex items-center gap-1 border-l pl-3">
                <input
                  type="number"
                  value={profile.instagram_followers}
                  onChange={(e) => setProfile(prev => ({ ...prev, instagram_followers: e.target.value }))}
                  className="w-16 text-right text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-gray-400">명</span>
              </div>
            </div>
          </div>

          {/* 유튜브 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                <Youtube size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={profile.youtube_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="w-full text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="채널 URL"
                />
              </div>
              <div className="flex items-center gap-1 border-l pl-3">
                <input
                  type="number"
                  value={profile.youtube_subscribers}
                  onChange={(e) => setProfile(prev => ({ ...prev, youtube_subscribers: e.target.value }))}
                  className="w-16 text-right text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-gray-400">명</span>
              </div>
            </div>
          </div>

          {/* 틱톡 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                <Hash size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={profile.tiktok_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  className="w-full text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="@username 또는 URL"
                />
              </div>
              <div className="flex items-center gap-1 border-l pl-3">
                <input
                  type="number"
                  value={profile.tiktok_followers}
                  onChange={(e) => setProfile(prev => ({ ...prev, tiktok_followers: e.target.value }))}
                  className="w-16 text-right text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-gray-400">명</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '프로필 저장'}
        </button>
      </div>

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

export default ProfileSettings
