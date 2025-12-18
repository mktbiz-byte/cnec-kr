import { useState, useEffect } from 'react'
import VideoReferencesSection from './VideoReferencesSection'
import OliveYoungGuideViewer from './OliveYoungGuideViewer'
import FourWeekGuideViewer from './FourWeekGuideViewer'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { compressImage, isImageFile } from '../lib/imageCompression'
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

  // 가이드 보기 모달 관련 상태
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState(null)

  // 프로필 편집 관련 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    age: '',
    postcode: '',
    address: '',
    detail_address: '',
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

  // 프로필 완성도 계산 (합리적인 기준)
  const calculateProfileCompleteness = (profileData) => {
    if (!profileData) return 0

    // 필수 항목 (각 25점, 총 100점)
    const requiredFields = [
      { field: profileData.name, weight: 25 },                                    // 이름 (필수)
      { field: profileData.phone, weight: 25 },                                   // 연락처 (필수)
      { field: profileData.instagram_url || profileData.youtube_url || profileData.tiktok_url, weight: 25 }, // SNS URL 최소 1개 (필수)
      { field: profileData.address || profileData.postcode, weight: 25 }          // 주소 또는 우편번호 (필수)
    ]

    let score = 0
    requiredFields.forEach(item => {
      if (item.field && item.field !== '') {
        score += item.weight
      }
    })

    return Math.round(score)
  }

  // 프로필이 캠페인 신청 가능한 상태인지 확인
  const isProfileComplete = (profileData) => {
    if (!profileData) return false

    const hasName = profileData.name && profileData.name.trim() !== ''
    const hasPhone = profileData.phone && profileData.phone.trim() !== ''
    const hasSnsUrl = (profileData.instagram_url && profileData.instagram_url.trim() !== '') ||
                      (profileData.youtube_url && profileData.youtube_url.trim() !== '') ||
                      (profileData.tiktok_url && profileData.tiktok_url.trim() !== '')
    const hasAddress = (profileData.address && profileData.address.trim() !== '') ||
                       (profileData.postcode && profileData.postcode.trim() !== '')

    return hasName && hasPhone && hasSnsUrl && hasAddress
  }

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const handleCancelApplication = async (applicationId) => {
    if (!confirm('정말로 지원을 취소하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id) // 보안: 자신의 지원만 삭제 가능

      if (error) throw error

      alert('지원이 취소되었습니다.')
      fetchUserData() // 데이터 새로고침
    } catch (error) {
      console.error('Error canceling application:', error)
      alert('지원 취소에 실패했습니다.')
    }
  }

  const handleEditApplication = (applicationId, campaignId) => {
    // 지원 페이지로 이동 (수정 모드)
    window.location.href = `/campaign-application?campaign_id=${campaignId}&edit=${applicationId}`
  }

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      
      // 프로필 완성도 계산
      const completeness = calculateProfileCompleteness(profileData)
      setProfileCompleteness(completeness)

      // 프로필이 100% 미만이면 프로필 설정 필수 모달 표시
      // (필수 항목: 이름, 연락처, SNS URL, 주소)
      if (completeness < 100) {
        setShowWelcomeModal(true)
      }
      
      // 편집 모드가 아닐 때만 editForm 업데이트 (편집 중인 데이터 보호)
      if (!isEditing) {
        setEditForm({
        name: profileData?.name || '',
        phone: profileData?.phone || '',
        bio: profileData?.bio || '',
        age: profileData?.age || '',
        postcode: profileData?.postcode || '',
        address: profileData?.address || '',
        detail_address: profileData?.detail_address || '',
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
      }
      
      setPhotoPreview(profileData?.profile_photo_url)

      // 캠페인 지원 내역 (조인 대신 별도 쿼리)
      const { data: appsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (applicationsError) {
        console.error('Applications fetch error:', applicationsError)
        throw applicationsError
      }

      // 캠페인 정보 별도 조회
      let applicationsData = appsData || []
      if (applicationsData.length > 0) {
        const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('id, title, brand, image_url, reward_points, creator_points_override, recruitment_deadline, application_deadline, content_submission_deadline, campaign_type, start_date, end_date, step1_deadline, step2_deadline, step3_deadline, week1_deadline, week2_deadline, week3_deadline, week4_deadline, oliveyoung_step1_guide_ai, oliveyoung_step2_guide_ai, oliveyoung_step3_guide_ai, challenge_weekly_guides, challenge_weekly_guides_ai')
            .in('id', campaignIds)

          // 비디오 제출 내역 조회
          const applicationIds = applicationsData.map(a => a.id)
          const { data: videoSubmissionsData } = await supabase
            .from('video_submissions')
            .select('id, status, video_file_url, created_at, application_id')
            .in('application_id', applicationIds)

          // 캠페인 및 비디오 데이터 병합
          applicationsData = applicationsData.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null,
            video_submissions: videoSubmissionsData?.filter(v => v.application_id === app.id) || []
          }))
        }
      }

      console.log('Fetched applications:', applicationsData)
      setApplications(applicationsData || [])

      // 출금 내역
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (withdrawalsError) throw withdrawalsError
      setWithdrawals(withdrawalsData || [])

      // 포인트 거래 내역
      const { data: transactionsData, error: transactionsError } = await supabase
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

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
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

      // 이미지 압축
      let fileToUpload = file
      if (isImageFile(file)) {
        try {
          fileToUpload = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            quality: 0.8
          })
        } catch (compressionError) {
          console.error('이미지 압축 실패:', compressionError)
          // 압축 실패 시 원본 파일 사용
        }
      }

      // Supabase Storage에 업로드
      const fileExt = fileToUpload.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
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
        postcode: editForm.postcode,
        address: editForm.address,
        detail_address: editForm.detail_address,
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
        const { data: encryptedData, error: encryptError } = await supabase.rpc(
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

      const { error: updateError } = await supabase
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
        {/* 프로필 설정 필수 모달 */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
              {/* 상단 그라데이션 헤더 */}
              <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-6 text-white text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur mb-4">
                  <AlertTriangle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  프로필 설정이 필요합니다
                </h3>
                <p className="text-white/80 text-sm">
                  캠페인 참여를 위해 프로필을 완성해주세요
                </p>
              </div>

              <div className="p-6">
                {/* 프로필 완성도 */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">현재 프로필 완성도</span>
                    <span className="font-bold text-purple-600">{profileCompleteness}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 h-4 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${profileCompleteness}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    모든 필수 항목 완성 시 캠페인 지원이 가능합니다
                  </p>
                </div>

                {/* 필수 항목 체크리스트 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-gray-800 mb-3">필수 입력 항목</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${profile?.name ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {profile?.name ? <span className="text-white text-xs">✓</span> : <span className="text-white text-xs">1</span>}
                      </div>
                      <span className={profile?.name ? 'text-gray-500 line-through' : 'text-gray-700'}>이름</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${profile?.phone ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {profile?.phone ? <span className="text-white text-xs">✓</span> : <span className="text-white text-xs">2</span>}
                      </div>
                      <span className={profile?.phone ? 'text-gray-500 line-through' : 'text-gray-700'}>연락처</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${(profile?.instagram_url || profile?.youtube_url || profile?.tiktok_url) ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {(profile?.instagram_url || profile?.youtube_url || profile?.tiktok_url) ? <span className="text-white text-xs">✓</span> : <span className="text-white text-xs">3</span>}
                      </div>
                      <span className={(profile?.instagram_url || profile?.youtube_url || profile?.tiktok_url) ? 'text-gray-500 line-through' : 'text-gray-700'}>SNS 계정 (인스타/유튜브/틱톡 중 1개)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${(profile?.address || profile?.postcode) ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {(profile?.address || profile?.postcode) ? <span className="text-white text-xs">✓</span> : <span className="text-white text-xs">4</span>}
                      </div>
                      <span className={(profile?.address || profile?.postcode) ? 'text-gray-500 line-through' : 'text-gray-700'}>배송 주소</span>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <button
                  onClick={() => {
                    setShowWelcomeModal(false)
                    setIsEditing(true)
                    setActiveTab('profile')
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  지금 프로필 설정하기
                </button>
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full mt-3 py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  나중에 하기
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
                    <label className="block text-sm font-medium text-gray-700">프로필 사진</label>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        {(photoPreview || profile?.profile_photo_url) && (
                          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
                            <img
                              src={photoPreview || profile?.profile_photo_url}
                              alt="프로필 사진"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        {uploadingPhoto && <p className="text-sm text-gray-500">업로드 중...</p>}
                      </div>
                    ) : (
                      <div className="mt-2">
                        {profile?.profile_photo_url ? (
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
                            <img
                              src={profile.profile_photo_url}
                              alt="프로필 사진"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">등록되지 않음</p>
                        )}
                      </div>
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
                    <label className="block text-sm font-medium text-gray-700">주소</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editForm.postcode || ''}
                            readOnly
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            placeholder="우편번호"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              new window.daum.Postcode({
                                oncomplete: function(data) {
                                  setEditForm({
                                    ...editForm,
                                    postcode: data.zonecode,
                                    address: data.address
                                  })
                                }
                              }).open()
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            우편번호 검색
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          placeholder="기본 주소"
                        />
                        <input
                          type="text"
                          value={editForm.detail_address || ''}
                          onChange={(e) => setEditForm({...editForm, detail_address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="상세 주소"
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.postcode && profile?.address 
                          ? `(${profile.postcode}) ${profile.address} ${profile.detail_address || ''}`
                          : '미설정'
                        }
                      </p>
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
              <div className="mt-8 pb-24">
                <VideoReferencesSection userId={user?.id} />
              </div>

              {/* 편집 모드 하단 고정 저장 버튼 */}
              {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                        편집 중 - 변경사항을 저장해주세요
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            fetchUserData() // 원래 데이터로 복원
                          }}
                          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleProfileSave}
                          disabled={processing}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                        >
                          {processing ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              저장 중...
                            </span>
                          ) : '저장하기'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{app.campaigns?.title}</h3>
                            {app.campaigns?.campaign_type && (
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                app.campaigns.campaign_type === 'oliveyoung' ? 'bg-green-100 text-green-700' :
                                app.campaigns.campaign_type === '4week_challenge' ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {app.campaigns.campaign_type === 'oliveyoung' ? '올영' :
                                 app.campaigns.campaign_type === '4week_challenge' ? '4주 챌린지' :
                                 '기획형'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            지원일: {new Date(app.created_at).toLocaleDateString('ko-KR')}
                            {app.campaigns?.recruitment_deadline && (
                              <span className="ml-2 text-gray-500">
                                | 모집 마감: {new Date(app.campaigns.recruitment_deadline).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            상태: <span className={`font-medium ${
                              app.status === 'approved' ? 'text-green-600' :
                              app.status === 'selected' ? 'text-blue-600' :
                              app.status === 'rejected' ? 'text-red-600' :
                              app.status === 'video_submitted' ? 'text-purple-600' :
                              app.status === 'filming' ? 'text-orange-600' :
                              (app.status === 'pending' && app.campaigns?.recruitment_deadline && new Date(app.campaigns.recruitment_deadline) < new Date()) ? 'text-gray-600' :
                              'text-yellow-600'
                            }`}>
                              {app.status === 'pending' && app.campaigns?.recruitment_deadline && new Date(app.campaigns.recruitment_deadline) < new Date() ? '모집 마감' :
                               app.status === 'pending' ? '검토중' :
                               app.status === 'approved' ? '승인됨' :
                               app.status === 'selected' ? '선정됨' :
                               app.status === 'rejected' ? '거절됨' :
                               app.status === 'filming' ? '촬영중' :
                               app.status === 'video_submitted' ? '기업 영상 검수중' : app.status}
                            </span>
                          </p>
                          {app.status === 'pending' && !(app.campaigns?.recruitment_deadline && new Date(app.campaigns.recruitment_deadline) < new Date()) && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleCancelApplication(app.id)}
                                className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleEditApplication(app.id, app.campaign_id)}
                                className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                              >
                                수정
                              </button>
                            </div>
                          )}
                          
                          {/* 마감일 표시 - 모든 선정된 캠페인에 표시 */}
                          {(app.status === 'selected' || app.status === 'filming' || app.status === 'video_submitted') && (
                            <>
                              {app.campaigns?.campaign_type === 'oliveyoung' && (app.campaigns?.step1_deadline || app.campaigns?.step2_deadline || app.campaigns?.step3_deadline) ? (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                                  <div className="space-y-2 text-sm">
                                    {app.campaigns?.step1_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📹 1차 마감:</span>
                                        <div className="font-bold text-red-600">
                                          {new Date(app.campaigns.step1_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.step2_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📱 2차 마감:</span>
                                        <div className="font-bold text-orange-600">
                                          {new Date(app.campaigns.step2_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.step3_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📱 3차 마감:</span>
                                        <div className="font-bold text-orange-600">
                                          {new Date(app.campaigns.step3_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : app.campaigns?.campaign_type === '4week_challenge' && (app.campaigns?.week1_deadline || app.campaigns?.week2_deadline || app.campaigns?.week3_deadline || app.campaigns?.week4_deadline) ? (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                                  <div className="space-y-2 text-sm">
                                    {app.campaigns?.week1_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📹 1주차 마감:</span>
                                        <div className="font-bold text-red-600">
                                          {new Date(app.campaigns.week1_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.week2_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📹 2주차 마감:</span>
                                        <div className="font-bold text-red-600">
                                          {new Date(app.campaigns.week2_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.week3_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📹 3주차 마감:</span>
                                        <div className="font-bold text-orange-600">
                                          {new Date(app.campaigns.week3_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.week4_deadline && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-700">📹 4주차 마감:</span>
                                        <div className="font-bold text-orange-600">
                                          {new Date(app.campaigns.week4_deadline).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (app.campaigns?.start_date || app.campaigns?.end_date) && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {app.campaigns?.start_date && (
                                      <div>
                                        <span className="text-gray-600">🎥 영상 촬영 마감:</span>
                                        <div className="font-semibold text-red-600 mt-1">
                                          {new Date(app.campaigns.start_date).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                    {app.campaigns?.end_date && (
                                      <div>
                                        <span className="text-gray-600">📱 SNS 업로드 마감:</span>
                                        <div className="font-semibold text-orange-600 mt-1">
                                          {new Date(app.campaigns.end_date).toLocaleDateString('ko-KR')}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* 가이드 확인 배너 - 기획형 */}
                              {(() => {
                                const hasValidGuide = app.personalized_guide && 
                                  typeof app.personalized_guide === 'string' && 
                                  app.personalized_guide.trim() !== '' && 
                                  app.personalized_guide !== 'null' &&
                                  app.personalized_guide.length > 10
                                
                                console.log('Planning campaign button check:', {
                                  campaign: app.campaigns?.title,
                                  campaignType: app.campaigns?.campaign_type,
                                  status: app.status,
                                  hasGuide: !!app.personalized_guide,
                                  guideType: typeof app.personalized_guide,
                                  guideLength: app.personalized_guide?.length,
                                  hasValidGuide: hasValidGuide,
                                  shouldShow: app.campaigns?.campaign_type === 'planned' && hasValidGuide && (app.status === 'filming' || app.status === 'video_submitted')
                                })
                                // 기획형 캠페인: personalized_guide 사용, filming 상태면 가이드 전달된 것으로 간주
                                return app.campaigns?.campaign_type === 'planned' && hasValidGuide && (app.status === 'filming' || app.status === 'video_submitted')
                              })() && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                                    <h4 className="font-semibold text-purple-900">📝 가이드가 전달되었습니다!</h4>
                                  </div>
                                  <p className="text-sm text-purple-700 mb-3">
                                    기업에서 맞춤형 촬영 가이드를 전달했습니다. 가이드를 확인하고 촬영을 시작하세요.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        console.log('Guide data:', app.personalized_guide)
                                        if (!app.personalized_guide) {
                                          alert('아직 가이드가 생성되지 않았습니다. 기업에서 가이드를 전달할 때까지 기다려주세요.')
                                          return
                                        }
                                        // JSON 문자열인 경우 파싱
                                        let guideData = app.personalized_guide
                                        if (typeof guideData === 'string') {
                                          try {
                                            guideData = JSON.parse(guideData)
                                          } catch (e) {
                                            console.error('Failed to parse guide data:', e)
                                          }
                                        }
                                        if (!guideData || Object.keys(guideData).length === 0) {
                                          alert('가이드 내용이 비어있습니다.')
                                          return
                                        }
                                        // campaigns 정보와 additional_message도 함께 전달
                                        setSelectedGuide({
                                          personalized_guide: guideData,
                                          additional_message: app.additional_message,
                                          campaigns: app.campaigns
                                        })
                                        setShowGuideModal(true)
                                      }}
                                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                    >
                                      가이드 보기
                                    </button>
                                    <button
                                      onClick={() => {
                                        window.location.href = `/submit-video/${app.campaign_id}`
                                      }}
                                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      영상 제출하기
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 가이드 확인 배너 - 올리브영 */}
                              {(() => {
                                // 올리브영 캠페인: oliveyoung_step1_guide_ai 등 사용, filming 상태면 가이드 전달된 것으로 간주
                                const hasOliveyoungGuide = app.campaigns?.oliveyoung_step1_guide_ai || app.campaigns?.oliveyoung_step2_guide_ai || app.campaigns?.oliveyoung_step3_guide_ai
                                return app.campaigns?.campaign_type === 'oliveyoung' && hasOliveyoungGuide && (app.status === 'filming' || app.status === 'video_submitted')
                              })() && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                    <h4 className="font-semibold text-green-900">📝 촬영 가이드가 전달되었습니다!</h4>
                                  </div>
                                  <p className="text-sm text-green-700 mb-3">
                                    올리브영 3단계 촬영 가이드를 확인하고 각 단계별로 영상을 제출하세요.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedGuide({
                                          campaigns: app.campaigns
                                        })
                                        setShowGuideModal(true)
                                      }}
                                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      촬영 가이드 보기
                                    </button>
                                    <button
                                      onClick={() => {
                                        window.location.href = `/submit-oliveyoung-video/${app.campaign_id}?step=1`
                                      }}
                                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      1차 영상 업로드
                                    </button>
                                    <button
                                      onClick={() => {
                                        window.location.href = `/submit-oliveyoung-video/${app.campaign_id}?step=2`
                                      }}
                                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                    >
                                      2차 영상 업로드
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 가이드 확인 배너 - 4주 챌린지 */}
                              {(() => {
                                // 4주 챌린지 캠페인: challenge_weekly_guides_ai 사용, selected 이상 상태면 가이드 표시
                                const has4WeekGuide = app.campaigns?.challenge_weekly_guides_ai
                                return app.campaigns?.campaign_type === '4week_challenge' && has4WeekGuide && (app.status === 'selected' || app.status === 'filming' || app.status === 'video_submitted')
                              })() && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                                    <h4 className="font-semibold text-purple-900">📝 4주 챌린지 가이드가 전달되었습니다!</h4>
                                  </div>
                                  <p className="text-sm text-purple-700 mb-3">
                                    주차별 촬영 가이드를 확인하고 각 주차별로 영상을 제출하세요.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedGuide({
                                          campaigns: app.campaigns
                                        })
                                        setShowGuideModal(true)
                                      }}
                                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                    >
                                      촬영 가이드 보기
                                    </button>
                                    <button
                                      onClick={() => {
                                        window.location.href = `/submit-video/${app.campaign_id}`
                                      }}
                                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      영상 제출하기
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* 수정 요청 알림 배너 */}
                              {app.video_submissions?.[0]?.video_review_comments?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                                    <h4 className="font-semibold text-red-900">🎬 영상 수정 요청이 있습니다!</h4>
                                  </div>
                                  <p className="text-sm text-red-700 mb-3">
                                    기업에서 영상 수정 요청을 전달했습니다. 수정 사항을 확인하고 영상을 재업로드해 주세요.
                                  </p>
                                  <button
                                    onClick={() => {
                                      window.location.href = `/video-review/${app.video_submissions[0].id}`
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                                  >
                                    수정 요청 확인하기 ({app.video_submissions[0].video_review_comments.length}개)
                                  </button>
                                </div>
                              )}
                              
                              {app.tracking_number && (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-600">
                                    {app.shipping_company && (
                                      <span className="font-medium text-purple-600">[{app.shipping_company}]</span>
                                    )}
                                    {' '}송장번호: <span className="font-medium text-blue-600">{app.tracking_number}</span>
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(app.tracking_number)
                                      alert('송장번호가 복사되었습니다.')
                                    }}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                  >
                                    복사
                                  </button>
                                </div>
                              )}
                              {app.product_delivery_date && (
                                <p className="text-sm text-gray-600">
                                  배송일: <span className="font-medium">{new Date(app.product_delivery_date).toLocaleDateString('ko-KR')}</span>
                                </p>
                              )}
                              {app.content_submission_deadline && (
                                <p className="text-sm text-gray-600">
                                  콘텐츠 제출 마감: <span className="font-medium text-orange-600">{new Date(app.content_submission_deadline).toLocaleDateString('ko-KR')}</span>
                                </p>
                              )}
                              {app.admin_notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  관리자 메모: <span className="text-gray-700">{app.admin_notes}</span>
                                </p>
                              )}
                              
                              {/* 촬영 마감일 강조 표시 */}
                              {app.guide_shared_to_company && app.campaigns?.content_submission_deadline && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-orange-900 mb-1">📅 촬영 마감일</h4>
                                      <p className="text-lg font-bold text-orange-600">
                                        {new Date(app.campaigns.content_submission_deadline).toLocaleDateString('ko-KR')}
                                      </p>
                                      <p className="text-xs text-orange-700 mt-1">
                                        {Math.ceil((new Date(app.campaigns.content_submission_deadline) - new Date()) / (1000 * 60 * 60 * 24))}일 남음
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* 영상 제출 및 마감일 연장 버튼 */}
                              {app.guide_shared_to_company && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(app)
                                      setShowSnsUploadModal(true)
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  >
                                    🎥 영상 제출하기
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('촬영 마감일 연장을 요청하시겠습니까?')) return
                                      
                                      try {
                                        // TODO: 마감일 연장 요청 기능 구현
                                        alert('마감일 연장 요청이 전송되었습니다. 관리자가 검토 후 연락드립니다.')
                                      } catch (error) {
                                        console.error('Error requesting deadline extension:', error)
                                        alert('요청에 실패했습니다.')
                                      }
                                    }}
                                    className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                                  >
                                    📅 마감일 연장 요청
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {(app.campaigns?.reward_points || app.campaigns?.reward_amount) && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">보상 포인트</p>
                            <p className="text-lg font-bold text-purple-600">
                              {(app.campaigns.creator_points_override || app.campaigns.reward_points || 0).toLocaleString()}P
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

      {/* 가이드 보기 모달 */}
      {showGuideModal && selectedGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">맞춤 촬영 가이드</h3>
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* 캠페인 타입에 따라 다른 뷰어 렌더링 */}
              {selectedGuide && selectedGuide.campaigns && (() => {
                const campaign = selectedGuide.campaigns
                const campaignType = campaign.campaign_type

                // 올리브영 세일 캠페인
                if (campaignType === 'oliveyoung' || campaignType === 'oliveyoung_sale') {
                  // STEP별 가이드 표시
                  const step1Guide = campaign.oliveyoung_step1_guide_ai
                  const step2Guide = campaign.oliveyoung_step2_guide_ai
                  const step3Guide = campaign.oliveyoung_step3_guide_ai

                  return (
                    <div className="space-y-6">
                      {step1Guide && (
                        <div>
                          <h4 className="text-lg font-bold mb-3">📹 STEP 1: 세일 전 영상</h4>
                          <OliveYoungGuideViewer 
                            guide={step1Guide}
                            individualMessage={selectedGuide.additional_message}
                          />
                        </div>
                      )}
                      {step2Guide && (
                        <div>
                          <h4 className="text-lg font-bold mb-3">🛍️ STEP 2: 세일 당일 영상</h4>
                          <OliveYoungGuideViewer 
                            guide={step2Guide}
                            individualMessage={null}
                          />
                        </div>
                      )}
                      {step3Guide && (
                        <div>
                          <h4 className="text-lg font-bold mb-3">🔗 STEP 3: 스토리 URL 링크</h4>
                          <OliveYoungGuideViewer 
                            guide={step3Guide}
                            individualMessage={null}
                          />
                        </div>
                      )}
                      {!step1Guide && !step2Guide && !step3Guide && (
                        <div className="text-center py-8 text-gray-500">
                          아직 가이드가 생성되지 않았습니다.
                        </div>
                      )}
                    </div>
                  )
                }

                // 4주 챌린지 캠페인
                if (campaignType === '4week_challenge') {
                  // Use custom_guide (delivered guides) if available, otherwise fallback to campaign guides
                  const customGuide = selectedGuide.custom_guide
                  const weeklyGuides = customGuide || campaign.challenge_weekly_guides_ai
                  const basicGuides = campaign.challenge_weekly_guides

                  return (
                    <div>
                      {weeklyGuides ? (
                        <FourWeekGuideViewer 
                          guides={weeklyGuides}
                          basicGuides={basicGuides}
                          commonMessage={selectedGuide.additional_message}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          아직 가이드가 생성되지 않았습니다.
                        </div>
                      )}
                    </div>
                  )
                }

                // 기획형 캠페인 (기존 로직)
                return (
                  <div>
                    {selectedGuide.personalized_guide ? (
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {(() => {
                          try {
                            const guideData = typeof selectedGuide.personalized_guide === 'string'
                              ? JSON.parse(selectedGuide.personalized_guide)
                              : selectedGuide.personalized_guide;
                            
                            return (
                              <div className="space-y-6">
                                {/* 추가 메시지 - 최상단 */}
                                {selectedGuide.additional_message && (
                                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                    <h4 className="font-semibold mb-2 text-orange-900">📢 크리에이터에게 전달하는 추가 메시지</h4>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedGuide.additional_message}</p>
                                  </div>
                                )}

                                {/* 기본 정보 */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <div className="space-y-1 text-sm">
                                    <div><strong>캠페인:</strong> {guideData.campaign_title}</div>
                                    <div><strong>플랫폼:</strong> {guideData.target_platform?.toUpperCase()}</div>
                                    <div><strong>영상 길이:</strong> {guideData.video_duration}</div>
                                  </div>
                                </div>

                                {/* 필수 해시태그 */}
                                {guideData.required_hashtags && (
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold mb-3">필수 해시태그</h4>
                                    <div className="space-y-2">
                                      {guideData.required_hashtags.real && (
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">리얼 후기:</span>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {guideData.required_hashtags.real.map((tag, i) => (
                                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">#{tag}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {guideData.required_hashtags.product && (
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">제품 관련:</span>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {guideData.required_hashtags.product.map((tag, i) => (
                                              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">#{tag}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {guideData.required_hashtags.common && (
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">공통:</span>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {guideData.required_hashtags.common.map((tag, i) => (
                                              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">#{tag}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* AI 가이드 추천 이유 */}
                                {guideData.why_recommended && (
                                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold mb-2 text-purple-900">🤖 AI 가이드 추천 이유</h4>
                                    {typeof guideData.why_recommended === 'string' ? (
                                      <p className="text-sm text-gray-700">{guideData.why_recommended}</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {/* 장면 구성 이유 */}
                                        {guideData.why_recommended.scene_reasoning && (
                                          <div>
                                            <p className="text-sm font-medium text-purple-800 mb-1">🎬 장면 구성 이유</p>
                                            <p className="text-sm text-gray-700">{guideData.why_recommended.scene_reasoning}</p>
                                          </div>
                                        )}
                                        
                                        {/* 참고 영상 */}
                                        {guideData.why_recommended.reference_videos && guideData.why_recommended.reference_videos.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-purple-800 mb-2">📺 참고 영상</p>
                                            <div className="space-y-2">
                                              {guideData.why_recommended.reference_videos.map((video, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded border border-purple-100">
                                                  <div className="flex items-start justify-between mb-1">
                                                    <a 
                                                      href={video.url} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="text-sm font-medium text-purple-700 hover:text-purple-900 hover:underline flex-1"
                                                    >
                                                      {video.title}
                                                    </a>
                                                    <span className="text-xs text-gray-500 ml-2">{video.views}</span>
                                                  </div>
                                                  <p className="text-xs text-gray-600">{video.key_point}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* 크리에이터 적합성 */}
                                        {guideData.why_recommended.creator_fit && (
                                          <div>
                                            <p className="text-sm font-medium text-purple-800 mb-1">🎯 크리에이터 적합성</p>
                                            <p className="text-sm text-gray-700">{guideData.why_recommended.creator_fit}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 촬영 요구사항 */}
                                {guideData.shooting_requirements && (
                                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h4 className="font-semibold mb-3">촬영 요구사항</h4>
                                    <div className="space-y-2">
                                      {guideData.shooting_requirements.must_include && (
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">필수 포함 장면:</span>
                                          <ul className="list-disc list-inside mt-1 space-y-1">
                                            {guideData.shooting_requirements.must_include.map((item, i) => (
                                              <li key={i} className="text-sm text-gray-700">{item}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {guideData.shooting_requirements.video_style && (
                                        <div className="mt-2">
                                          <span className="text-sm font-medium text-gray-700">영상 스타일:</span>
                                          <div className="text-sm text-gray-700 mt-1">
                                            <div>템포: {guideData.shooting_requirements.video_style.tempo}</div>
                                            <div>톤: {guideData.shooting_requirements.video_style.tone}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 촬영 장면 구성 (10개) */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-lg">🎬 촬영 장면 구성 ({guideData.shooting_scenes?.length || 0}개)</h4>
                                    <span className="text-sm text-red-600 font-medium">본 대사와 촬영 장면은 크리에이터의 스타일에 맞게 변경하여 촬영해 주세요.</span>
                                  </div>
                                  <div className="space-y-4">
                                    {(guideData.shooting_scenes || []).map((scene, idx) => (
                                      <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">장면 {scene.order}</span>
                                          <span className="font-semibold text-purple-900 text-lg">{scene.scene_type}</span>
                                        </div>
                                        <div className="space-y-2 mt-3">
                                          <div>
                                            <span className="text-sm font-medium text-gray-700">장면:</span>
                                            <p className="text-sm mt-1 text-gray-800">{scene.scene_description}</p>
                                          </div>
                                          {scene.dialogue && (
                                            <div className="bg-yellow-100 p-3 rounded border-l-4 border-yellow-500">
                                              <span className="text-sm font-medium text-gray-700">💬 대사:</span>
                                              <p className="text-sm mt-1 italic text-gray-800">"{scene.dialogue}"</p>
                                            </div>
                                          )}
                                          {scene.shooting_tip && (
                                            <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                                              <span className="text-sm font-medium text-gray-700">💡 촬영 팁:</span>
                                              <p className="text-sm mt-1 text-gray-800">{scene.shooting_tip}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 크리에이터 팁 */}
                                {guideData.creator_tips && guideData.creator_tips.length > 0 && (
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-semibold mb-3">💡 크리에이터 팁</h4>
                                    <ul className="list-decimal list-inside space-y-1">
                                      {guideData.creator_tips.filter(tip => tip).map((tip, i) => (
                                        <li key={i} className="text-sm text-gray-700">{tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}


                              </div>
                            );
                          } catch (error) {
                            // JSON 파싱 실패 시 텍스트로 표시
                            console.error('Guide parsing error:', error);
                            const content = selectedGuide.personalized_guide;
                            if (!content || content.trim() === '' || content.trim() === '``') {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <p>가이드 내용이 비어있습니다.</p>
                                  <p className="text-sm mt-2">관리자에게 문의해주세요.</p>
                                </div>
                              );
                            }
                            return <div className="whitespace-pre-wrap">{content}</div>;
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        아직 가이드가 생성되지 않았습니다.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <button
                onClick={() => {
                  setShowGuideModal(false)
                  setSelectedGuide(null)
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPageKoreaEnhanced
