import React, { useState, useEffect } from 'react'
import VideoReferencesSection from './VideoReferencesSection'
import { useAuth } from '../contexts/AuthContext'
import { database, supabase } from '../lib/supabase'
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  CreditCard, Download, Settings, LogOut, 
  AlertTriangle, Trash2, Shield, Eye, EyeOff, X, Building2
} from 'lucide-react'

const MyPageKorea = () => {
  const { user, signOut } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [pointTransactions, setPointTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  
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

  // 출금 신청
  const handleWithdrawSubmit = async () => {
    try {
      setProcessing(true)
      setError('')

      // 입력 검증
      if (!withdrawForm.amount || !withdrawForm.bankName || !withdrawForm.bankAccountNumber || 
          !withdrawForm.bankAccountHolder || !withdrawForm.residentNumber) {
        setError('모든 필수 항목을 입력해주세요.')
        setProcessing(false)
        return
      }

      const amount = parseInt(withdrawForm.amount)
      if (amount < 10000) {
        setError('최소 출금 금액은 10,000 포인트입니다.')
        setProcessing(false)
        return
      }

      if (amount > profile.points) {
        setError('보유 포인트가 부족합니다.')
        setProcessing(false)
        return
      }

      // 주민번호 형식 검증
      const residentNumberPattern = /^\d{6}-?\d{7}$/
      if (!residentNumberPattern.test(withdrawForm.residentNumber)) {
        setError('주민등록번호 형식이 올바르지 않습니다.')
        setProcessing(false)
        return
      }

      // 주민번호 암호화
      const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-this'
      const { data: encryptedResident, error: encryptError } = await database.rpc(
        'encrypt_resident_number',
        {
          resident_number: withdrawForm.residentNumber.replace('-', ''),
          encryption_key: encryptionKey
        }
      )

      if (encryptError) {
        console.error('암호화 오류:', encryptError)
        setError('주민번호 암호화 중 오류가 발생했습니다.')
        setProcessing(false)
        return
      }

      // 출금 신청 생성
      const { error: withdrawalError } = await database
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          bank_name: withdrawForm.bankName,
          bank_account_number: withdrawForm.bankAccountNumber,
          bank_account_holder: withdrawForm.bankAccountHolder,
          resident_number_encrypted: encryptedResident,
          reason: withdrawForm.reason,
          status: 'pending',
          platform_region: 'kr',
          country_code: 'KR'
        })

      if (withdrawalError) throw withdrawalError

      // 포인트 차감
      const newPoints = profile.points - amount
      const { error: pointsError } = await database
        .from('user_profiles')
        .update({ points: newPoints })
        .eq('id', user.id)

      if (pointsError) throw pointsError

      // 포인트 거래 내역 추가
      await database.from('point_transactions').insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: 'withdrawal',
        description: `출금 신청: ${amount.toLocaleString()}포인트 (${withdrawForm.bankName} ${withdrawForm.bankAccountNumber})`,
        platform_region: 'kr',
        country_code: 'KR'
      })

      setSuccess('출금 신청이 완료되었습니다. 영업일 기준 3-5일 내에 처리됩니다.')
      setShowWithdrawModal(false)
      setWithdrawForm({
        amount: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountHolder: '',
        residentNumber: '',
        reason: ''
      })
      
      await fetchUserData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('출금 신청 오류:', err)
      setError('출금 신청 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  // SNS 업로드 제출
  const handleSnsUploadSubmit = async () => {
    try {
      setProcessing(true)
      setError('')

      if (!snsUploadForm.sns_upload_url) {
        setError('SNS 업로드 URL을 입력해주세요.')
        setProcessing(false)
        return
      }

      const { error: updateError } = await database
        .from('applications')
        .update({
          sns_upload_url: snsUploadForm.sns_upload_url,
          sns_upload_date: new Date().toISOString(),
          notes: snsUploadForm.notes,
          status: 'sns_uploaded'
        })
        .eq('id', selectedApplication.id)

      if (updateError) throw updateError

      setSuccess('SNS 업로드가 완료되었습니다. 관리자 승인 후 포인트가 지급됩니다.')
      setShowSnsUploadModal(false)
      setSnsUploadForm({ sns_upload_url: '', notes: '' })
      setSelectedApplication(null)
      
      await fetchUserData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('SNS 업로드 오류:', err)
      setError('SNS 업로드 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  // 회원 탈퇴 처리
  const handleAccountDeletion = async () => {
    try {
      if (confirmText !== '회원탈퇴') {
        setError('확인 텍스트를 정확히 입력해주세요.')
        return
      }

      setProcessing(true)
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
      setProcessing(false)
    }
  }

  // 상태 배지 컴포넌트
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      selected: { label: '선정됨', color: 'bg-blue-100 text-blue-800' },
      sns_uploaded: { label: 'SNS 업로드 완료', color: 'bg-purple-100 text-purple-800' },
      completed: { label: '완료', color: 'bg-green-100 text-green-800' },
      rejected: { label: '거절됨', color: 'bg-red-100 text-red-800' },
      approved: { label: '승인됨', color: 'bg-green-100 text-green-800' },
      processing: { label: '처리중', color: 'bg-blue-100 text-blue-800' }
    }

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
          <p className="mt-2 text-gray-600">프로필 관리 및 활동 내역을 확인하세요</p>
        </div>

        {/* 포인트 카드 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">보유 포인트</p>
              <p className="text-4xl font-bold mt-1">{profile?.points?.toLocaleString() || 0}</p>
              <p className="text-sm opacity-75 mt-1">1 포인트 = 1원</p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!profile?.points || profile.points < 10000}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              출금 신청
            </button>
          </div>
          {profile?.points < 10000 && (
            <p className="text-sm opacity-75 mt-2">* 최소 출금 금액: 10,000 포인트</p>
          )}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">이름 *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      전화번호 <span className="text-xs text-gray-500">(선택사항)</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-1234-5678"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.phone || '등록되지 않음'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      나이 <span className="text-xs text-gray-500">(선택사항)</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25"
                        min="1"
                        max="100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.age || '미설정'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      지역 <span className="text-xs text-gray-500">(선택사항)</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.region || ''}
                        onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SNS 정보</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.instagram_url}
                        onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.instagram_url || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram 팔로워 수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.instagram_followers}
                        onChange={(e) => setEditForm({...editForm, instagram_followers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.instagram_followers?.toLocaleString() || 0}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.tiktok_url}
                        onChange={(e) => setEditForm({...editForm, tiktok_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://tiktok.com/@username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.tiktok_url || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TikTok 팔로워 수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.tiktok_followers}
                        onChange={(e) => setEditForm({...editForm, tiktok_followers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.tiktok_followers?.toLocaleString() || 0}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.youtube_url}
                        onChange={(e) => setEditForm({...editForm, youtube_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/@channel"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.youtube_url || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube 구독자 수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.youtube_subscribers}
                        onChange={(e) => setEditForm({...editForm, youtube_subscribers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.youtube_subscribers?.toLocaleString() || 0}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 은행 정보 섹션 */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  출금 계좌 정보
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  포인트 출금을 위한 은행 계좌 정보를 등록하세요. 주민등록번호는 암호화되어 안전하게 저장됩니다.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">은행명</label>
                    {isEditing ? (
                      <select
                        value={editForm.bank_name}
                        onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">은행 선택</option>
                        {koreanBanks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.bank_name || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계좌번호</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.bank_account_number}
                        onChange={(e) => setEditForm({...editForm, bank_account_number: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123-456-789012"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.bank_account_number || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">예금주명</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.bank_account_holder}
                        onChange={(e) => setEditForm({...editForm, bank_account_holder: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="홍길동"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.bank_account_holder || '미등록'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      주민등록번호
                      <span className="text-xs text-red-500 ml-1">(암호화 저장)</span>
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type={showResidentNumber ? "text" : "password"}
                          value={editForm.resident_number}
                          onChange={(e) => setEditForm({...editForm, resident_number: e.target.value})}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123456-1234567"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResidentNumber(!showResidentNumber)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        >
                          {showResidentNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.resident_number_encrypted ? '등록됨 (암호화)' : '미등록'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 지원 내역 탭 */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">캠페인 지원 내역</h2>
              
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">아직 지원한 캠페인이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{app.campaigns?.title}</h3>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>지원일: {new Date(app.created_at).toLocaleDateString('ko-KR')}</span>
                            <StatusBadge status={app.status} />
                          </div>
                          
                          {app.status === 'selected' && !app.sns_upload_url && (
                            <button
                              onClick={() => {
                                setSelectedApplication(app)
                                setShowSnsUploadModal(true)
                              }}
                              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                            >
                              SNS 업로드 하기
                            </button>
                          )}
                          
                          {app.sns_upload_url && (
                            <div className="mt-3 text-sm">
                              <p className="text-gray-600">업로드 URL: 
                                <a href={app.sns_upload_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                  {app.sns_upload_url}
                                </a>
                              </p>
                            </div>
                          )}
                          
                          {app.points_awarded > 0 && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                              포인트 지급: {app.points_awarded.toLocaleString()}P
                            </div>
                          )}
                        </div>
                        
                        {app.campaigns?.image_url && (
                          <img 
                            src={app.campaigns.image_url} 
                            alt={app.campaigns.title}
                            className="w-20 h-20 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 출금 내역 탭 */}
          {activeTab === 'withdrawals' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">출금 내역</h2>
              
              {withdrawals.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">출금 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <p className="font-semibold text-lg text-gray-900">
                              {withdrawal.amount.toLocaleString()}원
                            </p>
                            <StatusBadge status={withdrawal.status} />
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>은행: {withdrawal.bank_name}</p>
                            <p>계좌: {withdrawal.bank_account_number}</p>
                            <p>예금주: {withdrawal.bank_account_holder}</p>
                            <p>신청일: {new Date(withdrawal.created_at).toLocaleDateString('ko-KR')}</p>
                            {withdrawal.processed_at && (
                              <p>처리일: {new Date(withdrawal.processed_at).toLocaleDateString('ko-KR')}</p>
                            )}
                          </div>
                          {withdrawal.admin_notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              <p className="font-medium">관리자 메모:</p>
                              <p>{withdrawal.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 포인트 내역 탭 */}
          {activeTab === 'points' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">포인트 거래 내역</h2>
              
              {pointTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">포인트 거래 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointTransactions.map((transaction) => (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(transaction.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 계정 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">계정 설정</h2>
              
              <div className="space-y-6">
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="flex items-start">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-red-900">회원 탈퇴</h3>
                      <p className="mt-2 text-sm text-red-700">
                        회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 
                        보유 중인 포인트는 모두 소멸됩니다.
                      </p>
                      <button
                        onClick={() => setShowWithdrawalModal(true)}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        회원 탈퇴하기
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <button
                    onClick={signOut}
                    className="flex items-center text-gray-700 hover:text-gray-900"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 출금 신청 모달 */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">출금 신청</h3>
                <button onClick={() => setShowWithdrawModal(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금 금액 (포인트) *
                  </label>
                  <input
                    type="number"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                    min="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">최소 출금 금액: 10,000 포인트</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">은행명 *</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bankName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">은행 선택</option>
                    {koreanBanks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호 *</label>
                  <input
                    type="text"
                    value={withdrawForm.bankAccountNumber}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bankAccountNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123-456-789012"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예금주명 *</label>
                  <input
                    type="text"
                    value={withdrawForm.bankAccountHolder}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bankAccountHolder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="홍길동"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주민등록번호 * <span className="text-xs text-red-500">(암호화 저장)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showResidentNumber ? "text" : "password"}
                      value={withdrawForm.residentNumber}
                      onChange={(e) => setWithdrawForm({...withdrawForm, residentNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="123456-1234567"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResidentNumber(!showResidentNumber)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showResidentNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금 사유 <span className="text-xs text-gray-500">(선택사항)</span>
                  </label>
                  <textarea
                    value={withdrawForm.reason}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="출금 사유를 입력하세요"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleWithdrawSubmit}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {processing ? '처리중...' : '출금 신청'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SNS 업로드 모달 */}
        {showSnsUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">SNS 업로드</h3>
                <button onClick={() => setShowSnsUploadModal(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SNS 업로드 URL *
                  </label>
                  <input
                    type="url"
                    value={snsUploadForm.sns_upload_url}
                    onChange={(e) => setSnsUploadForm({...snsUploadForm, sns_upload_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모 <span className="text-xs text-gray-500">(선택사항)</span>
                  </label>
                  <textarea
                    value={snsUploadForm.notes}
                    onChange={(e) => setSnsUploadForm({...snsUploadForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="추가 메모를 입력하세요"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSnsUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSnsUploadSubmit}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {processing ? '처리중...' : '제출'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 모달 */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">회원 탈퇴</h3>
                <button onClick={() => setShowWithdrawalModal(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">
                    회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    보유 중인 <strong>{profile?.points?.toLocaleString() || 0}포인트</strong>도 모두 소멸됩니다.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    탈퇴 사유
                  </label>
                  <select
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
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
                    value={withdrawalDetails}
                    onChange={(e) => setWithdrawalDetails(e.target.value)}
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
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAccountDeletion}
                    disabled={processing || confirmText !== '회원탈퇴'}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? '처리중...' : '탈퇴하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPageKorea

