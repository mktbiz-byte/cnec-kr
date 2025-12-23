import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { database, supabase } from '../../lib/supabase'
import {
  User, Settings, FileText, DollarSign, LogOut, ChevronRight,
  Edit3, Phone, Mail, MapPin, Instagram, Youtube, Hash,
  Award, Star, Clock, CheckCircle, AlertCircle, Loader2, X,
  CreditCard, Building2, Shield, Eye, EyeOff, Trash2, ExternalLink,
  ArrowRight, Bell, HelpCircle, Wallet, TrendingUp
} from 'lucide-react'

// 등급 설정
const GRADE_CONFIG = {
  1: { name: 'FRESH', label: '새싹 크리에이터', color: '#10B981', bgGradient: 'from-emerald-500 to-teal-600' },
  2: { name: 'GLOW', label: '빛나기 시작하는 단계', color: '#3B82F6', bgGradient: 'from-blue-500 to-indigo-600' },
  3: { name: 'BLOOM', label: '본격적으로 피어나는 중', color: '#8B5CF6', bgGradient: 'from-violet-500 to-purple-600' },
  4: { name: 'ICONIC', label: '브랜드가 먼저 찾는', color: '#EC4899', bgGradient: 'from-pink-500 to-rose-600' },
  5: { name: 'MUSE', label: '크넥 대표 뮤즈', color: '#F59E0B', bgGradient: 'from-amber-400 to-orange-500' }
}

const CreatorMyPage = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [activeSection, setActiveSection] = useState('dashboard')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 프로필 편집 관련
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  // 출금 관련
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [residentNumber, setResidentNumber] = useState('')
  const [withdrawProcessing, setWithdrawProcessing] = useState(false)

  // 한국 주요 은행 목록 (레거시 18개 은행)
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

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // localStorage에서 계좌 정보 로드
      const bankStorageKey = `cnec_bank_info_${user.id}`
      const savedBankInfo = localStorage.getItem(bankStorageKey)
      const bankInfo = savedBankInfo ? JSON.parse(savedBankInfo) : {}

      setProfile({
        ...profileData,
        bank_name: bankInfo.bank_name || '',
        account_number: bankInfo.account_number || '',
        account_holder: bankInfo.account_holder || ''
      })
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
        bank_name: bankInfo.bank_name || '',
        account_number: bankInfo.account_number || '',
        account_holder: bankInfo.account_holder || ''
      })

      // 지원 내역 가져오기 (조인 대신 별도 쿼리)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (appsError) {
        console.error('Applications 로드 오류:', appsError)
      }

      // 캠페인 정보 별도 조회
      let apps = appsData || []
      if (apps.length > 0) {
        const campaignIds = [...new Set(apps.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('id, title, brand, image_url, reward_points, creator_points_override, content_submission_deadline, campaign_type')
            .in('id', campaignIds)

          // 캠페인 데이터 병합
          apps = apps.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null
          }))
        }
      }

      setApplications(apps)

    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setProcessing(true)

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
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, ...updateData }))
      setIsEditing(false)
      setActiveSection('dashboard')
      setSuccess('프로필이 저장되었습니다')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('프로필 저장 오류:', error)
      setError('프로필 저장에 실패했습니다')
    } finally {
      setProcessing(false)
    }
  }

  // 계좌 정보 저장 (localStorage)
  const handleBankInfoSave = async () => {
    try {
      setProcessing(true)

      const bankInfo = {
        bank_name: editForm.bank_name,
        account_number: editForm.account_number,
        account_holder: editForm.account_holder,
        updated_at: new Date().toISOString()
      }

      // localStorage에 저장
      const bankStorageKey = `cnec_bank_info_${user.id}`
      localStorage.setItem(bankStorageKey, JSON.stringify(bankInfo))

      // profile 상태 업데이트
      setProfile(prev => ({ ...prev, ...bankInfo }))
      setActiveSection('dashboard')
      setSuccess('계좌 정보가 저장되었습니다')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('계좌 정보 저장 오류:', error)
      setError('계좌 정보 저장에 실패했습니다')
    } finally {
      setProcessing(false)
    }
  }

  // 주민번호 암호화 함수 (AES-GCM)
  const encryptResidentNumber = async (plainText) => {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(plainText)

      // 암호화 키 생성 (실제 운영시에는 서버에서 관리해야 함)
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('cnec-secure-key-2024-resident-num'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      )

      const salt = crypto.getRandomValues(new Uint8Array(16))
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      )

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      )

      // salt + iv + encrypted data를 합쳐서 Base64로 인코딩
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encrypted), salt.length + iv.length)

      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('암호화 오류:', error)
      throw new Error('주민번호 암호화에 실패했습니다')
    }
  }

  // 주민번호 유효성 검사
  const validateResidentNumber = (num) => {
    const cleaned = num.replace(/-/g, '')
    if (cleaned.length !== 13) return false
    if (!/^\d{13}$/.test(cleaned)) return false
    return true
  }

  // 팝빌 알림톡 발송 함수
  const sendAlimtalk = async (templateCode, receiverNum, receiverName, variables) => {
    try {
      const response = await fetch('/.netlify/functions/send-alimtalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode,
          receiverNum: receiverNum.replace(/-/g, ''),
          receiverName,
          variables
        })
      })

      const result = await response.json()
      console.log('알림톡 발송 결과:', result)
      return result
    } catch (error) {
      console.error('알림톡 발송 오류:', error)
      return { success: false, error: error.message }
    }
  }

  // 출금 신청 처리
  const handleWithdrawSubmit = async () => {
    try {
      setWithdrawProcessing(true)
      setError('')

      const amount = parseInt(withdrawAmount.replace(/,/g, ''))

      // 유효성 검사
      if (!amount || amount < 10000) {
        setError('최소 출금 금액은 10,000P입니다')
        setWithdrawProcessing(false)
        return
      }

      if (amount > (profile?.points || 0)) {
        setError('보유 포인트보다 많은 금액은 출금할 수 없습니다')
        setWithdrawProcessing(false)
        return
      }

      if (!validateResidentNumber(residentNumber)) {
        setError('주민등록번호 형식이 올바르지 않습니다 (13자리)')
        setWithdrawProcessing(false)
        return
      }

      if (!profile?.bank_name || !profile?.account_number) {
        setError('계좌 정보를 먼저 등록해주세요')
        setWithdrawProcessing(false)
        return
      }

      // 주민번호 암호화
      const encryptedResidentNum = await encryptResidentNumber(residentNumber.replace(/-/g, ''))

      // 현재 날짜 포맷
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      // point_transactions 테이블에 출금 기록 저장 (음수 금액)
      // description에 계좌 정보 및 암호화된 주민번호 저장
      const description = `출금 신청: ${amount.toLocaleString()}원 (은행: ${profile.bank_name}, 계좌: ${profile.account_number}, 예금주: ${profile.account_holder}) [주민번호:${encryptedResidentNum}]`

      const { error: dbError } = await supabase
        .from('point_transactions')
        .insert([{
          user_id: user.id,
          amount: -amount, // 출금은 음수로 저장
          type: 'withdraw',
          description: description,
          created_at: new Date().toISOString()
        }])

      if (dbError) throw dbError

      // 팝빌 알림톡 발송 (출금 접수 완료)
      if (profile?.phone) {
        await sendAlimtalk(
          '025100001019', // 출금 접수 완료 템플릿
          profile.phone,
          profile.name || '크리에이터',
          {
            '크리에이터명': profile.name || '크리에이터',
            '출금금액': amount.toLocaleString(),
            '신청일': dateStr
          }
        )
      }

      // 성공 처리
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setResidentNumber('')
      setSuccess('출금 신청이 완료되었습니다. 영업일 기준 3-5일 내 입금됩니다.')
      setTimeout(() => setSuccess(''), 5000)

      // 데이터 새로고침
      loadUserData()

    } catch (error) {
      console.error('출금 신청 오류:', error)
      setError('출금 신청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setWithdrawProcessing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  // 프로필 완성도 체크
  const isProfileComplete = () => {
    return !!(profile?.skin_type && profile?.address && (profile?.instagram_url || profile?.youtube_url || profile?.tiktok_url))
  }

  // 캠페인 상태별 카운트
  const getCampaignCounts = () => {
    return {
      pending: applications.filter(a => a.status === 'pending').length,
      approved: applications.filter(a => ['approved', 'selected', 'virtual_selected'].includes(a.status)).length,
      inProgress: applications.filter(a => ['filming', 'video_submitted'].includes(a.status)).length,
      completed: applications.filter(a => ['completed', 'paid'].includes(a.status)).length
    }
  }

  const counts = getCampaignCounts()
  const currentGrade = profile?.grade || 1
  const gradeInfo = GRADE_CONFIG[currentGrade]
  const totalScore = profile?.total_score || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">
      {/* 알림 메시지 */}
      {(error || success) && (
        <div className={`mx-5 mt-4 p-3 rounded-xl text-sm font-medium ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      {/* 대시보드 모드 */}
      {activeSection === 'dashboard' && (
        <>
          {/* 프로필 완성 배너 */}
          {!isProfileComplete() && (
            <div className="mx-5 mt-5">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold mb-1">프로필을 완성해주세요!</p>
                    <p className="text-sm text-white/80">SNS 연결하고 캠페인에 지원하세요</p>
                  </div>
                  <button
                    onClick={() => { setActiveSection('profile'); setIsEditing(true); }}
                    className="px-4 py-2 bg-white text-violet-600 rounded-xl font-bold text-sm"
                  >
                    완성하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 등급 카드 */}
          <div className="mx-5 mt-5">
            <div className={`bg-gradient-to-br ${gradeInfo.bgGradient} rounded-3xl p-5 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center gap-4 mb-4">
                {/* 프로필 사진 - 수정은 /profile 페이지에서 */}
                <div
                  className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/30 cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-white/60" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-white/80 text-sm">{profile?.name || '크리에이터'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{gradeInfo.name}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{gradeInfo.label}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs mb-1">종합 점수</p>
                  <p className="text-2xl font-bold">{totalScore}점</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs mb-1">완료 캠페인</p>
                  <p className="text-2xl font-bold">{counts.completed}건</p>
                </div>
              </div>
            </div>
          </div>

          {/* 나의 캠페인 현황 */}
          <div className="mx-5 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">나의 캠페인</h3>
              <button
                onClick={() => navigate('/my/applications')}
                className="text-sm text-violet-600 font-medium flex items-center gap-1"
              >
                전체보기 <ChevronRight size={16} />
              </button>
            </div>

            <div
              className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/my/applications')}
            >
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">신청</p>
                </div>
                <div className="text-gray-300">
                  <ArrowRight size={16} />
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-violet-600">{counts.approved}</p>
                  <p className="text-xs text-gray-500 mt-1">선정</p>
                </div>
                <div className="text-gray-300">
                  <ArrowRight size={16} />
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-amber-500">{counts.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">진행중</p>
                </div>
                <div className="text-gray-300">
                  <ArrowRight size={16} />
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-emerald-500">{counts.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">완료</p>
                </div>
              </div>
            </div>
          </div>

          {/* 포인트 현황 */}
          <div className="mx-5 mt-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={20} className="text-violet-600" />
                  <span className="font-bold text-gray-900">보유 포인트</span>
                </div>
                <p className="text-2xl font-bold text-violet-600">
                  {formatCurrency(profile?.points || 0)}
                </p>
              </div>
              <button
                onClick={() => setActiveSection('points')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                출금 신청하기
              </button>
            </div>
          </div>

          {/* 캠페인 관리 섹션 */}
          <div className="mx-5 mt-6">
            <p className="text-xs text-gray-500 font-medium mb-2 px-1">캠페인 관리</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => navigate('/my/applications')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-violet-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">지원 내역</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* 계정 및 설정 섹션 */}
          <div className="mx-5 mt-6">
            <p className="text-xs text-gray-500 font-medium mb-2 px-1">계정 및 설정</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">프로필 설정</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button
                onClick={() => setActiveSection('account')}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CreditCard size={18} className="text-emerald-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">계좌 정보 관리</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button
                onClick={() => navigate('/settings/notifications')}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Bell size={18} className="text-pink-500" />
                  </div>
                  <span className="text-[15px] text-gray-900">알림 설정</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* 기타 섹션 */}
          <div className="mx-5 mt-6 mb-8">
            <p className="text-xs text-gray-500 font-medium mb-2 px-1">기타</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => window.open('https://pf.kakao.com/_TjhGG', '_blank')}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <HelpCircle size={18} className="text-gray-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">고객센터</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <LogOut size={18} className="text-red-400" />
                  </div>
                  <span className="text-[15px] text-gray-900">로그아웃</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* 프로필 편집 */}
      {activeSection === 'profile' && isEditing && (
        <div className="px-5 pt-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setActiveSection('dashboard'); setIsEditing(false); }} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">프로필 설정</h2>
            <div className="w-10" />
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피부타입 *</label>
                <select
                  value={editForm.skin_type}
                  onChange={(e) => setEditForm({...editForm, skin_type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">선택하세요</option>
                  {['건성', '지성', '복합성', '민감성', '중성'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="배송받을 주소"
                />
              </div>
            </div>
          </div>

          {/* SNS 계정 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">SNS 계정 (최소 1개)</h3>
            <div className="space-y-4">
              <div className="relative">
                <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  type="url"
                  value={editForm.instagram_url}
                  onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="인스타그램 URL"
                />
              </div>
              <div className="relative">
                <Youtube size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                <input
                  type="url"
                  value={editForm.youtube_url}
                  onChange={(e) => setEditForm({...editForm, youtube_url: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="유튜브 URL"
                />
              </div>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                <input
                  type="url"
                  value={editForm.tiktok_url}
                  onChange={(e) => setEditForm({...editForm, tiktok_url: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="틱톡 URL"
                />
              </div>
            </div>
          </div>

          {/* 정산 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">정산 정보</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                <select
                  value={editForm.bank_name}
                  onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">은행 선택</option>
                  {koreanBanks.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={editForm.account_number}
                onChange={(e) => setEditForm({...editForm, account_number: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="계좌번호 ('-' 없이)"
              />
              <input
                type="text"
                value={editForm.account_holder}
                onChange={(e) => setEditForm({...editForm, account_holder: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="예금주명"
              />
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={processing}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {processing ? '저장 중...' : '프로필 저장'}
          </button>
        </div>
      )}

      {/* 지원 내역 */}
      {activeSection === 'applications' && (
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveSection('dashboard')} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">지원 내역</h2>
            <div className="w-10" />
          </div>

          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">아직 지원한 캠페인이 없습니다</p>
              </div>
            ) : (
              applications.map((app, idx) => {
                const statusMap = {
                  pending: { color: 'bg-yellow-100 text-yellow-700', label: '검토중' },
                  approved: { color: 'bg-green-100 text-green-700', label: '승인' },
                  selected: { color: 'bg-blue-100 text-blue-700', label: '선정' },
                  virtual_selected: { color: 'bg-blue-100 text-blue-700', label: '가선정' },
                  rejected: { color: 'bg-red-100 text-red-700', label: '미선정' },
                  filming: { color: 'bg-orange-100 text-orange-700', label: '촬영중' },
                  video_submitted: { color: 'bg-purple-100 text-purple-700', label: '영상제출' },
                  completed: { color: 'bg-gray-100 text-gray-700', label: '완료' },
                  paid: { color: 'bg-green-100 text-green-700', label: '정산완료' }
                }
                const status = statusMap[app.status] || { color: 'bg-gray-100 text-gray-600', label: app.status }

                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex gap-3">
                      {app.campaigns?.image_url ? (
                        <img src={app.campaigns.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{app.campaigns?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{app.campaigns?.brand}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
                          <span className="text-[10px] text-gray-400">{new Date(app.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(app.campaigns?.creator_points_override || app.campaigns?.reward_points)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 포인트/정산 */}
      {activeSection === 'points' && (
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveSection('dashboard')} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">포인트 / 정산</h2>
            <div className="w-10" />
          </div>

          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white mb-4">
            <p className="text-sm text-violet-200 mb-1">보유 포인트</p>
            <p className="text-3xl font-bold">{formatCurrency(profile?.points || 0)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">정산 신청</h3>
            {profile?.bank_name && profile?.account_number ? (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">등록된 계좌</p>
                  <p className="font-medium text-gray-900">{profile.bank_name} {profile.account_number}</p>
                  <p className="text-sm text-gray-600">{profile.account_holder}</p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  출금 신청하기
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm mb-3">정산받을 계좌를 먼저 등록해주세요</p>
                <button
                  onClick={() => setActiveSection('account')}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium"
                >
                  계좌 등록하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 계좌 관리 */}
      {activeSection === 'account' && (
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveSection('dashboard')} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">계좌 관리</h2>
            <div className="w-10" />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
              <select
                value={editForm.bank_name}
                onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">은행 선택</option>
                {koreanBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
              <input
                type="text"
                value={editForm.account_number}
                onChange={(e) => setEditForm({...editForm, account_number: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="'-' 없이 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
              <input
                type="text"
                value={editForm.account_holder}
                onChange={(e) => setEditForm({...editForm, account_holder: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="예금주명"
              />
            </div>
            <button
              onClick={handleBankInfoSave}
              disabled={processing}
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {processing ? '저장 중...' : '계좌 정보 저장'}
            </button>
          </div>
        </div>
      )}

      {/* 출금 신청 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">출금 신청</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawAmount('')
                  setResidentNumber('')
                  setError('')
                }}
                className="p-2 -mr-2"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 보유 포인트 */}
            <div className="bg-violet-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-violet-600 mb-1">출금 가능 포인트</p>
              <p className="text-2xl font-bold text-violet-700">{formatCurrency(profile?.points || 0)}</p>
            </div>

            {/* 등록된 계좌 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">입금 계좌</p>
              <p className="font-medium text-gray-900">{profile?.bank_name} {profile?.account_number}</p>
              <p className="text-sm text-gray-600">{profile?.account_holder}</p>
            </div>

            {/* 출금 금액 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">출금 금액</label>
              <div className="relative">
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    if (value) {
                      setWithdrawAmount(parseInt(value).toLocaleString())
                    } else {
                      setWithdrawAmount('')
                    }
                  }}
                  placeholder="최소 10,000P"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">P</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">* 최소 출금 금액: 10,000P</p>
            </div>

            {/* 주민등록번호 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주민등록번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={residentNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '')
                    // 자동 하이픈 추가
                    if (value.length === 6 && !value.includes('-')) {
                      setResidentNumber(value + '-')
                    } else if (value.length <= 14) {
                      setResidentNumber(value)
                    }
                  }}
                  placeholder="000000-0000000"
                  maxLength={14}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Shield size={12} />
                세금 신고를 위해 필요하며, 암호화되어 안전하게 저장됩니다
              </p>
            </div>

            {/* 안내사항 */}
            <div className="bg-amber-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-amber-700 leading-relaxed">
                • 출금 신청 후 영업일 기준 3~5일 내 입금됩니다<br />
                • 세금(3.3%)이 공제된 금액이 입금됩니다<br />
                • 정보가 일치하지 않을 경우 입금이 지연될 수 있습니다
              </p>
            </div>

            {/* 출금 신청 버튼 */}
            <button
              onClick={handleWithdrawSubmit}
              disabled={withdrawProcessing || !withdrawAmount || !residentNumber}
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {withdrawProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  처리 중...
                </>
              ) : (
                '출금 신청하기'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreatorMyPage
