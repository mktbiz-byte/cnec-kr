import { useState, useEffect } from 'react'
import VideoReferencesSection from './VideoReferencesSection'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  CreditCard, Download, Settings, LogOut, 
  AlertTriangle, Trash2, Shield, Eye, EyeOff, X, Building2,
  Camera, Upload, Instagram, Youtube
} from 'lucide-react'

const MyPageKoreaEnhanced = () => {
  const { user, signOut } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [pointTransactions, setPointTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  
  // 프로필 완성도 모달
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  
  // 프로필 사진 업로드
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  // 회원 탈퇴 관련 상태
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')
  const [withdrawalDetails, setWithdrawalDetails] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 출금 신청 관련 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    residentNumber: '',
    reason: ''
  })
  const [showResidentNumber, setShowResidentNumber] = useState(false)

  // SNS 업로드 및 포인트 신청 관련 상태
  const [showSnsUploadModal, setShowSnsUploadModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [snsUploadForm, setSnsUploadForm] = useState({
    sns_upload_url: '',
    notes: ''
  })

  // 프로필 편집 관련 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    age: '',
    region: '',
    skin_type: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    other_sns_url: '',
    instagram_followers: '',
    tiktok_followers: '',
    youtube_subscribers: '',
    // 은행 정보
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    resident_number: ''
  })

  // 한국 주요 은행 목록
  const koreanBanks = [
    'KB국민은행',
    '신한은행',
    '우리은행',
    'NH농협은행',
    '하나은행',
    'IBK기업은행',
    'SC제일은행',
    '한국씨티은행',
    'KDB산업은행',
    '경남은행',
    '광주은행',
    '대구은행',
    '부산은행',
    '전북은행',
    '제주은행',
    '카카오뱅크',
    '케이뱅크',
    '토스뱅크'
  ]

  // 피부 타입 옵션
  const skinTypes = [
    '건성',
    '지성',
    '복합성',
    '민감성',
    '중성'
  ]

  // 프로필 완성도 계산
  const calculateProfileCompleteness = (profileData) => {
    if (!profileData) return 0
    
    const fields = [
      profileData.name,
      profileData.phone,
      profileData.instagram_url || profileData.youtube_url,
      profileData.profile_photo_url,
      profileData.skin_type,
      profileData.region
    ]
    
    const filledFields = fields.filter(field => field && field !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await database
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      
      // 프로필 완성도 계산
      const completeness = calculateProfileCompleteness(profileData)
      setProfileCompleteness(completeness)
      
      // 처음 방문하거나 프로필이 50% 미만이면 환영 모달 표시
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome && completeness < 50) {
        setShowWelcomeModal(true)
        localStorage.setItem('hasSeenWelcome', 'true')
      }
      
      setEditForm({
        name: profileData?.name || '',
        phone: profileData?.phone || '',
        bio: profileData?.bio || '',
        age: profileData?.age || '',
        region: profileData?.region || '',
        skin_type: profileData?.skin_type || '',
        instagram_url: profileData?.instagram_url || '',
        tiktok_url: profileData?.tiktok_url || '',
        youtube_url: profileData?.youtube_url || '',
        other_sns_url: profileData?.other_sns_url || '',
        instagram_followers: profileData?.instagram_followers || '',
        tiktok_followers: profileData?.tiktok_followers || '',
        youtube_subscribers: profileData?.youtube_subscribers || '',
        bank_name: profileData?.bank_name || '',
        bank_account_number: profileData?.bank_account_number || '',
        bank_account_holder: profileData?.bank_account_holder || '',
        resident_number: '' // 보안상 빈 값으로 시작
      })
      
      setPhotoPreview(profileData?.profile_photo_url)

      // 캠페인 지원 내역
      const { data: applicationsData, error: applicationsError } = await database
        .from('applications')
        .select(`
          *,
          campaigns (
            id,
            title,
            image_url,
            reward_points
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (applicationsError) throw applicationsError
      setApplications(applicationsData || [])

      // 출금 내역
      const { data: withdrawalsData, error: withdrawalsError } = await database
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (withdrawalsError) throw withdrawalsError
      setWithdrawals(withdrawalsData || [])

      // 포인트 거래 내역
      const { data: transactionsData, error: transactionsError } = await database
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setPointTransactions(transactionsData || [])

    } catch (err) {
      console.error('데이터 로딩 오류:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 프로필 사진 업로드
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('파일 크기는 2MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
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

      // Supabase Storage에 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      // 데이터베이스 업데이트
      const { error: updateError } = await database
        .from('user_profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('프로필 사진이 업데이트되었습니다.')
      await fetchUserData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('사진 업로드 오류:', err)
      setError('사진 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // 프로필 저장
  const handleProfileSave = async () => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')

      const updateData = {
        name: editForm.name,
        phone: editForm.phone,
        bio: editForm.bio,
        age: editForm.age ? parseInt(editForm.age) : null,
        region: editForm.region,
        skin_type: editForm.skin_type,
        instagram_url: editForm.instagram_url,
        tiktok_url: editForm.tiktok_url,
        youtube_url: editForm.youtube_url,
        other_sns_url: editForm.other_sns_url,
        instagram_followers: editForm.instagram_followers ? parseInt(editForm.instagram_followers) : 0,
        tiktok_followers: editForm.tiktok_followers ? parseInt(editForm.tiktok_followers) : 0,
        youtube_subscribers: editForm.youtube_subscribers ? parseInt(editForm.youtube_subscribers) : 0,
        bank_name: editForm.bank_name,
        bank_account_number: editForm.bank_account_number,
        bank_account_holder: editForm.bank_account_holder,
        updated_at: new Date().toISOString()
      }

      // 주민번호가 입력된 경우에만 암호화하여 저장
      if (editForm.resident_number && editForm.resident_number.length > 0) {
        const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-this'
        
        // 주민번호 형식 검증 (6자리-7자리)
        const residentNumberPattern = /^\d{6}-?\d{7}$/
        if (!residentNumberPattern.test(editForm.resident_number)) {
          setError('주민등록번호 형식이 올바르지 않습니다. (예: 123456-1234567)')
          setProcessing(false)
          return
        }

        // 암호화 함수 호출
        const { data: encryptedData, error: encryptError } = await database.rpc(
          'encrypt_resident_number',
          {
            resident_number: editForm.resident_number.replace('-', ''),
            encryption_key: encryptionKey
          }
        )

        if (encryptError) {
          console.error('암호화 오류:', encryptError)
          setError('주민번호 암호화 중 오류가 발생했습니다.')
          setProcessing(false)
          return
        }

        updateData.resident_number_encrypted = encryptedData
      }

      const { error: updateError } = await database
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('프로필이 성공적으로 업데이트되었습니다.')
      setIsEditing(false)
      await fetchUserData()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('프로필 저장 오류:', err)
      setError('프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2 text-purple-600 hover:text-purple-700">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="text-xl font-bold">CNEC Korea</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">홈</a>
              <a href="/mypage" className="text-purple-600 px-3 py-2 rounded-md text-sm font-medium">마이페이지</a>
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 환영 모달 - 처음 방문 시 */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  CNEC Korea에 오신 것을 환영합니다! 🎉
                </h3>
                <p className="text-gray-600">
                  캠페인에 지원하기 전에 프로필을 완성해주세요.
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>프로필 완성도</span>
                  <span className="font-semibold">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompleteness}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-purple-600 mr-2">✓</div>
                  <span>프로필 사진 업로드</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-purple-600 mr-2">✓</div>
                  <span>인스타그램 또는 유튜브 주소 등록</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-purple-600 mr-2">✓</div>
                  <span>피부 타입 및 지역 정보 입력</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-purple-600 mr-2">✓</div>
                  <span>연락처 정보 입력</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  나중에
                </button>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false)
                    setIsEditing(true)
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  프로필 작성하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 프로필 사진 */}
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 h-7 w-7 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.name || '이름 없음'}
                </h1>
                <p className="text-gray-600">{profile?.email || user?.email}</p>
                
                {/* 프로필 완성도 표시 */}
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompleteness}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {profileCompleteness}% 완성
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">보유 포인트</p>
              <p className="text-3xl font-bold text-purple-600">
                {profile?.points?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ≈ ₩{(profile?.points || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: '프로필', icon: User },
                { id: 'applications', label: '지원 내역', icon: Award },
                { id: 'withdrawals', label: '출금 내역', icon: CreditCard },
                { id: 'points', label: '포인트 내역', icon: Download },
                { id: 'settings', label: '계정 설정', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-lg shadow">
          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">개인 정보</h2>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleProfileSave()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? '처리중...' : (isEditing ? '저장' : '편집')}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    기본 정보
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="홍길동"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.name || '이름 없음'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                    <p className="mt-1 text-sm text-gray-900">{profile?.email || user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      전화번호 <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="010-1234-5678"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.phone || '등록되지 않음'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">나이</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="25"
                        min="1"
                        max="100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.age || '미설정'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">지역</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.region || ''}
                        onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="서울특별시"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.region || '미설정'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">피부 타입</label>
                    {isEditing ? (
                      <select
                        value={editForm.skin_type}
                        onChange={(e) => setEditForm({...editForm, skin_type: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">선택하세요</option>
                        {skinTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.skin_type || '미설정'}</p>
                    )}
                  </div>
                </div>
                
                {/* SNS 정보 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                    SNS 정보
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Instagram className="w-4 h-4 mr-1 text-pink-600" />
                      Instagram URL <span className="text-red-500 ml-1">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.instagram_url}
                        onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://instagram.com/username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {profile?.instagram_url ? (
                          <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                            {profile.instagram_url}
                          </a>
                        ) : '미등록'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram 팔로워 수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.instagram_followers}
                        onChange={(e) => setEditForm({...editForm, instagram_followers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="1000"
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.instagram_followers?.toLocaleString() || '0'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <Youtube className="w-4 h-4 mr-1 text-red-600" />
                      YouTube URL
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.youtube_url}
                        onChange={(e) => setEditForm({...editForm, youtube_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://youtube.com/@username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {profile?.youtube_url ? (
                          <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                            {profile.youtube_url}
                          </a>
                        ) : '미등록'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube 구독자 수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.youtube_subscribers}
                        onChange={(e) => setEditForm({...editForm, youtube_subscribers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="500"
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.youtube_subscribers?.toLocaleString() || '0'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.tiktok_url}
                        onChange={(e) => setEditForm({...editForm, tiktok_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://tiktok.com/@username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {profile?.tiktok_url ? (
                          <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                            {profile.tiktok_url}
                          </a>
                        ) : '미등록'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기타 SNS URL</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.other_sns_url}
                        onChange={(e) => setEditForm({...editForm, other_sns_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://..."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {profile?.other_sns_url ? (
                          <a href={profile.other_sns_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.other_sns_url}
                          </a>
                        ) : '미등록'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="자신을 소개해주세요..."
                  />
                ) : (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{profile?.bio || '자기소개가 없습니다.'}</p>
                )}
              </div>

              {/* 영상 레퍼런스 섹션 */}
              <div className="mt-8">
                <VideoReferencesSection userId={user?.id} />
              </div>
            </div>
          )}

          {/* 다른 탭들은 기존 MyPageKorea.jsx의 내용 유지 */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 지원 내역</h2>
              {applications.length === 0 ? (
                <p className="text-gray-600">아직 지원한 캠페인이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{app.campaigns?.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            지원일: {new Date(app.created_at).toLocaleDateString('ko-KR')}
                          </p>
                          <p className="text-sm text-gray-600">
                            상태: <span className={`font-medium ${
                              app.status === 'approved' ? 'text-green-600' :
                              app.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {app.status === 'pending' ? '검토중' :
                               app.status === 'approved' ? '승인됨' :
                               app.status === 'rejected' ? '거절됨' : app.status}
                            </span>
                          </p>
                        </div>
                        {app.campaigns?.reward_points && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">보상 포인트</p>
                            <p className="text-lg font-bold text-purple-600">
                              {app.campaigns.reward_points.toLocaleString()}P
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">출금 내역</h2>
              {withdrawals.length === 0 ? (
                <p className="text-gray-600">출금 내역이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            ₩{withdrawal.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(withdrawal.created_at).toLocaleDateString('ko-KR')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {withdrawal.bank_name} {withdrawal.bank_account_number}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {withdrawal.status === 'pending' ? '처리중' :
                           withdrawal.status === 'completed' ? '완료' :
                           withdrawal.status === 'rejected' ? '거절됨' : withdrawal.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">포인트 내역</h2>
              {pointTransactions.length === 0 ? (
                <p className="text-gray-600">포인트 거래 내역이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {pointTransactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(transaction.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">계정 설정</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  로그아웃
                </button>
                
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  회원 탈퇴
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyPageKoreaEnhanced

