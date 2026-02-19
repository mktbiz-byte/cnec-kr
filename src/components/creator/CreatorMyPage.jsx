import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePCView } from '../../contexts/PCViewContext'
import { database, supabase } from '../../lib/supabase'
import {
  User, Settings, FileText, DollarSign, LogOut, ChevronRight,
  Edit3, Phone, Mail, MapPin, Instagram, Youtube, Hash,
  Award, Star, Clock, CheckCircle, AlertCircle, Loader2, X,
  CreditCard, Building2, Shield, Eye, EyeOff, Trash2, ExternalLink,
  ArrowRight, Bell, HelpCircle, Wallet, TrendingUp, Heart, Gift,
  Crown, Sparkles, BookOpen
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
  const location = useLocation()
  const { isPCView, setExpandedContent } = usePCView()

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

  // 계좌 인증 관련
  const [accountVerifying, setAccountVerifying] = useState(false)
  const [accountVerified, setAccountVerified] = useState(false)
  const [verifiedAccountHolder, setVerifiedAccountHolder] = useState('')

  // 찜한 캠페인 관련
  const [wishlistCampaigns, setWishlistCampaigns] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

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

  // PC 확장 보기: 마이페이지 정보를 넓은 화면으로 표시
  useEffect(() => {
    if (!isPCView || !profile) {
      setExpandedContent(null)
      return
    }
    const gradeInfo = GRADE_CONFIG[profile.grade || 1]
    const completedApps = applications.filter(a => a.status === 'completed' || a.status === 'sns_uploaded').length
    const activeApps = applications.filter(a => ['approved', 'selected', 'filming', 'submitted'].includes(a.status)).length

    setExpandedContent(
      <div className="space-y-6">
        {/* 등급 카드 확대 */}
        <div className={`bg-gradient-to-br ${gradeInfo.bgGradient} rounded-2xl p-8 text-white shadow-xl`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Crown size={32} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm">현재 등급</p>
              <h3 className="text-3xl font-extrabold">{gradeInfo.name}</h3>
              <p className="text-white/80 text-sm">{gradeInfo.label}</p>
            </div>
          </div>
        </div>

        {/* 활동 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">{applications.length}</p>
            <p className="text-sm text-gray-500 mt-1">총 지원</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{activeApps}</p>
            <p className="text-sm text-gray-500 mt-1">진행중</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{completedApps}</p>
            <p className="text-sm text-gray-500 mt-1">완료</p>
          </div>
        </div>

        {/* 포인트 요약 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-violet-600" />
            포인트 현황
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-xs text-violet-600 font-medium mb-1">보유 포인트</p>
              <p className="text-2xl font-bold text-violet-700">{(profile.points || 0).toLocaleString()}P</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-1">누적 포인트</p>
              <p className="text-2xl font-bold text-green-700">{(profile.total_earned_points || 0).toLocaleString()}P</p>
            </div>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">프로필 정보</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700">{profile.phone}</span>
              </div>
            )}
            {profile.instagram_url && (
              <div className="flex items-center gap-3">
                <Instagram size={16} className="text-pink-500" />
                <span className="text-sm text-gray-700">{profile.instagram_url}</span>
              </div>
            )}
            {profile.youtube_url && (
              <div className="flex items-center gap-3">
                <Youtube size={16} className="text-red-500" />
                <span className="text-sm text-gray-700">{profile.youtube_url}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
    return () => setExpandedContent(null)
  }, [isPCView, profile, applications])

  // URL state에서 section 파라미터 처리 (포인트 페이지에서 계좌 등록으로 이동 시)
  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section)
    }
  }, [location.state])

  const loadUserData = async () => {
    try {
      setLoading(true)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile({
        ...profileData,
        bank_name: profileData?.bank_name || '',
        account_number: profileData?.bank_account_number || '',
        account_holder: profileData?.bank_account_holder || ''
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
        bank_name: profileData?.bank_name || '',
        account_number: profileData?.bank_account_number || '',
        account_holder: profileData?.bank_account_holder || ''
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
            .select('*')
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

  // 찜한 캠페인 로드
  const loadWishlist = async () => {
    if (!user) return

    try {
      setWishlistLoading(true)
      const storageKey = `cnec_wishlist_${user.id}`
      const saved = localStorage.getItem(storageKey)

      if (saved) {
        const wishlistIds = JSON.parse(saved)
        if (wishlistIds.length > 0) {
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id, title, brand, image_url, reward_points, creator_points_override, application_deadline, campaign_type')
            .in('id', wishlistIds)

          setWishlistCampaigns(campaigns || [])
        } else {
          setWishlistCampaigns([])
        }
      }
    } catch (error) {
      console.error('찜 목록 로드 오류:', error)
    } finally {
      setWishlistLoading(false)
    }
  }

  // 찜하기 해제
  const removeFromWishlist = (campaignId) => {
    const storageKey = `cnec_wishlist_${user.id}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const wishlistIds = JSON.parse(saved).filter(id => id !== campaignId)
      localStorage.setItem(storageKey, JSON.stringify(wishlistIds))
      setWishlistCampaigns(prev => prev.filter(c => c.id !== campaignId))
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

  // 팝빌 계좌 인증 함수 (입력한 예금주와 실제 예금주 일치 여부 확인)
  const verifyBankAccount = async () => {
    try {
      setAccountVerifying(true)
      setError('')
      setAccountVerified(false)
      setVerifiedAccountHolder('')

      if (!editForm.bank_name || !editForm.account_number) {
        setError('은행과 계좌번호를 입력해주세요')
        setAccountVerifying(false)
        return
      }

      if (!editForm.account_holder || editForm.account_holder.trim() === '') {
        setError('예금주명을 입력해주세요')
        setAccountVerifying(false)
        return
      }

      const response = await fetch('/.netlify/functions/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: editForm.bank_name,
          accountNumber: editForm.account_number.replace(/-/g, '')
        })
      })

      const result = await response.json()
      console.log('계좌 인증 결과:', result)

      if (result.success && result.accountName) {
        // 은행 API에서 반환한 예금주명으로 인증 완료
        const bankAccountName = result.accountName.trim()

        // 인증 완료 상태 설정 (editForm은 건드리지 않음)
        setVerifiedAccountHolder(bankAccountName)
        setAccountVerified(true)
        setSuccess(`계좌 인증 완료! 예금주: ${bankAccountName}`)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || '계좌 인증에 실패했습니다')
      }
    } catch (error) {
      console.error('계좌 인증 오류:', error)
      setError('계좌 인증 중 오류가 발생했습니다')
    } finally {
      setAccountVerifying(false)
    }
  }

  // 계좌 정보 저장 (Supabase)
  const handleBankInfoSave = async () => {
    try {
      setProcessing(true)

      // 인증된 계좌만 저장 가능
      if (!accountVerified) {
        setError('계좌 인증을 먼저 진행해주세요')
        setProcessing(false)
        return
      }

      const bankInfo = {
        bank_name: editForm.bank_name,
        bank_account_number: editForm.account_number,
        bank_account_holder: verifiedAccountHolder || editForm.account_holder,
        updated_at: new Date().toISOString()
      }

      // Supabase에 저장
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(bankInfo)
        .eq('id', user.id)

      if (updateError) {
        console.error('계좌 정보 저장 오류:', updateError)
        setError('계좌 정보 저장에 실패했습니다')
        return
      }

      // profile 상태 업데이트 (internal state uses short names)
      setProfile(prev => ({
        ...prev,
        bank_name: editForm.bank_name,
        account_number: editForm.account_number,
        account_holder: verifiedAccountHolder || editForm.account_holder
      }))
      setActiveSection('dashboard')
      setAccountVerified(false)
      setVerifiedAccountHolder('')
      setSuccess('계좌 정보가 저장되었습니다')
      setTimeout(() => setSuccess(''), 3000)

    } catch (error) {
      console.error('계좌 정보 저장 오류:', error)
      setError('계좌 정보 저장에 실패했습니다')
    } finally {
      setProcessing(false)
    }
  }

  // 주민번호 암호화 함수 (Supabase RPC - pgcrypto)
  const encryptResidentNumber = async (plainText) => {
    try {
      const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-this'
      const { data: encryptedData, error } = await supabase.rpc(
        'encrypt_resident_number',
        {
          resident_number: plainText,
          encryption_key: encryptionKey
        }
      )

      if (error) {
        console.error('암호화 오류:', error)
        return null
      }

      return encryptedData
    } catch (error) {
      console.error('암호화 실패:', error)
      return null
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

      const amount = parseInt(withdrawAmount.replace(/[^0-9]/g, ''))

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

      // 출금 신청 (포인트 차감 + withdrawals 테이블 저장 + 거래 내역 생성)
      const result = await database.userPoints.requestWithdrawal({
        user_id: user.id,
        amount: amount,
        bank_name: profile.bank_name,
        bank_account_number: profile.account_number,
        bank_account_holder: profile.account_holder,
        resident_number_encrypted: encryptedResidentNum
      })

      if (!result.success) throw new Error('출금 신청 처리 실패')

      // 알림 발송 (실패해도 출금 신청은 성공으로 처리)
      try {
        // 카카오 알림톡 발송
        if (profile?.phone) {
          await sendAlimtalk(
            '025100001019',
            profile.phone,
            profile.name || '크리에이터',
            {
              '크리에이터명': profile.name || '크리에이터',
              '출금금액': amount.toLocaleString(),
              '신청일': dateStr
            }
          )
        }

        // 이메일 발송
        if (profile?.email) {
          const todayKorean = today.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: profile.email,
              subject: '[CNEC] 출금 신청 접수 완료',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #1f2937;">출금 신청 접수</h2>
                  <p>${profile.name || '크리에이터'}님, 출금 신청이 접수되었습니다.</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>출금 금액:</strong> ${amount.toLocaleString()}원</p>
                    <p><strong>신청일:</strong> ${todayKorean}</p>
                    <p><strong>입금 계좌:</strong> ${profile.bank_name} ${profile.account_number}</p>
                  </div>
                  <p>관리자 승인 후 입금 처리됩니다.</p>
                  <p style="color: #6b7280;">처리 기간: 매주 월요일</p>
                  <p style="color: #6b7280;">문의: 1833-6025</p>
                </div>
              `
            })
          })
        }
      } catch (notificationError) {
        console.error('알림 발송 실패 (출금 신청은 정상 처리됨):', notificationError)
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
      inProgress: applications.filter(a => ['filming', 'video_submitted', 'sns_uploaded'].includes(a.status)).length,
      completed: applications.filter(a => ['completed', 'paid'].includes(a.status)).length
    }
  }

  // 가이드 데이터 해결 함수: guide_group이 있으면 guide_group_data[그룹] 우선, 없으면 기존 가이드 사용
  const resolveGuideData = (app) => {
    const campaign = app.campaigns
    if (!campaign) return null

    // guide_group이 설정된 경우, guide_group_data에서 그룹별 가이드를 우선 사용
    if (app.guide_group && campaign.guide_group_data) {
      let groupData = campaign.guide_group_data
      if (typeof groupData === 'string') {
        try { groupData = JSON.parse(groupData) } catch(e) { groupData = null }
      }
      if (groupData && groupData[app.guide_group]) {
        return {
          type: 'group',
          groupName: app.guide_group,
          guideData: groupData[app.guide_group]
        }
      }
    }

    // 기획형 캠페인
    if (campaign.campaign_type === 'planned') {
      if (campaign.guide_delivery_mode === 'external' && (campaign.external_guide_url || campaign.external_guide_file_url)) {
        return { type: 'planned_external' }
      }
      if (app.personalized_guide) {
        return { type: 'planned_personalized' }
      }
    }

    // 올리브영 캠페인
    if (campaign.campaign_type === 'oliveyoung') {
      const hasExternalSteps = campaign.step1_guide_mode === 'external' || campaign.step2_guide_mode === 'external' || campaign.step3_guide_mode === 'external'
      const hasAiSteps = campaign.oliveyoung_step1_guide_ai || campaign.oliveyoung_step1_guide ||
                         campaign.oliveyoung_step2_guide_ai || campaign.oliveyoung_step2_guide ||
                         campaign.oliveyoung_step3_guide_ai || campaign.oliveyoung_step3_guide
      if (hasExternalSteps || hasAiSteps) {
        return { type: 'oliveyoung' }
      }
    }

    // 4주 챌린지 캠페인
    if (campaign.campaign_type === '4week_challenge') {
      const hasExternalWeeks = campaign.week1_guide_mode === 'external' || campaign.week2_guide_mode === 'external' ||
                               campaign.week3_guide_mode === 'external' || campaign.week4_guide_mode === 'external'
      const hasAiWeeks = campaign.challenge_weekly_guides_ai
      if (hasExternalWeeks || hasAiWeeks) {
        return { type: '4week_challenge' }
      }
    }

    // 일반 캠페인 AI 가이드
    if (campaign.ai_generated_guide) {
      return { type: 'general' }
    }

    return null
  }

  const counts = getCampaignCounts()
  const currentGrade = profile?.cnec_grade_level || 1
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
                    onClick={() => navigate('/profile')}
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
                onClick={() => navigate('/guide')}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={18} className="text-purple-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">활동 가이드</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button
                onClick={() => navigate('/my/applications')}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-violet-600" />
                  </div>
                  <span className="text-[15px] text-gray-900">지원 내역</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>

              <button
                onClick={() => { setActiveSection('wishlist'); loadWishlist(); }}
                className="w-full px-4 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart size={18} className="text-red-500" />
                  </div>
                  <span className="text-[15px] text-gray-900">찜한 캠페인</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            </div>
          </div>

          {/* MUSE 전용 혜택 섹션 - MUSE 등급(5)일 때만 표시 */}
          {currentGrade === 5 && (
            <div className="mx-5 mt-6">
              <p className="text-xs text-amber-600 font-medium mb-2 px-1 flex items-center gap-1">
                <Crown size={12} />
                MUSE 전용 혜택
              </p>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm overflow-hidden border border-amber-200">
                <button
                  onClick={() => navigate('/my/ai-guide')}
                  className="w-full px-4 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <span className="text-[15px] text-gray-900 font-medium block">AI 크리에이터 가이드</span>
                      <span className="text-xs text-amber-600">유튜브 분석, 대본 생성, 콘텐츠 검증</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-amber-400" />
                </button>
              </div>
            </div>
          )}

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
                const guideInfo = ['approved', 'selected', 'virtual_selected', 'filming', 'video_submitted', 'sns_uploaded', 'completed', 'paid'].includes(app.status)
                  ? resolveGuideData(app)
                  : null

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
                    {/* 촬영 가이드 버튼 - 선정 이후 상태에서 가이드가 있는 경우 표시 */}
                    {guideInfo && (
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/my/applications')}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            guideInfo.type === 'group'
                              ? 'bg-violet-600 text-white hover:bg-violet-700'
                              : guideInfo.type === 'oliveyoung'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : guideInfo.type === '4week_challenge'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          <BookOpen size={14} />
                          {guideInfo.type === 'group'
                            ? `촬영 가이드 보기 (${guideInfo.groupName})`
                            : '촬영 가이드 보기'}
                        </button>
                      </div>
                    )}
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
            <button onClick={() => { setActiveSection('dashboard'); setAccountVerified(false); setVerifiedAccountHolder(''); }} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">계좌 관리</h2>
            <div className="w-10" />
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                계좌 정보와 예금주명을 입력 후 인증하기를 눌러주세요. 입력한 예금주와 실제 예금주가 일치해야 등록됩니다.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">은행 *</label>
              <select
                value={editForm.bank_name}
                onChange={(e) => {
                  setEditForm({...editForm, bank_name: e.target.value})
                  setAccountVerified(false)
                  setVerifiedAccountHolder('')
                }}
                disabled={accountVerifying}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
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
                value={editForm.account_number}
                onChange={(e) => {
                  setEditForm({...editForm, account_number: e.target.value.replace(/[^0-9]/g, '')})
                  setAccountVerified(false)
                  setVerifiedAccountHolder('')
                }}
                disabled={accountVerifying}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                placeholder="'-' 없이 숫자만 입력"
              />
            </div>

            {/* 예금주 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예금주 *</label>
              <input
                type="text"
                value={editForm.account_holder}
                onChange={(e) => {
                  setEditForm({...editForm, account_holder: e.target.value})
                  setAccountVerified(false)
                  setVerifiedAccountHolder('')
                }}
                disabled={accountVerifying}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                placeholder="실명을 정확히 입력해주세요"
              />
            </div>

            {/* 인증 버튼 */}
            <button
              onClick={verifyBankAccount}
              disabled={accountVerifying || !editForm.bank_name || !editForm.account_number || !editForm.account_holder}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {accountVerifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  예금주 확인 중...
                </>
              ) : (
                '예금주 인증하기'
              )}
            </button>

            {/* 인증 결과 표시 */}
            {accountVerified && verifiedAccountHolder && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="font-medium text-green-700">예금주 인증 완료 - {verifiedAccountHolder}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBankInfoSave}
              disabled={processing || !accountVerified}
              className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? '저장 중...' : accountVerified ? '인증된 계좌 저장' : '계좌 인증 후 저장 가능'}
            </button>
          </div>

          {/* 기존 등록된 계좌 정보 */}
          {profile?.bank_name && profile?.account_number && (
            <div className="mt-4 bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-2">현재 등록된 계좌</p>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {profile.bank_name} {profile.account_number}
                </span>
                {profile.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">인증됨</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">예금주: {profile.account_holder}</p>
            </div>
          )}
        </div>
      )}

      {/* 찜한 캠페인 */}
      {activeSection === 'wishlist' && (
        <div className="px-5 pt-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveSection('dashboard')} className="p-2 -ml-2">
              <ArrowRight size={20} className="text-gray-700 rotate-180" />
            </button>
            <h2 className="font-bold text-lg">찜한 캠페인</h2>
            <div className="w-10" />
          </div>

          {wishlistLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : wishlistCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <Heart size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 mb-2">찜한 캠페인이 없습니다</p>
              <p className="text-sm text-gray-400">캠페인 목록에서 하트를 눌러 찜해보세요</p>
              <button
                onClick={() => navigate('/campaigns')}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium"
              >
                캠페인 둘러보기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlistCampaigns.map((campaign) => {
                const reward = campaign.creator_points_override || campaign.reward_points || 0
                return (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 cursor-pointer active:bg-gray-50"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                  >
                    {/* 썸네일 */}
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift size={24} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* 캠페인 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{campaign.title}</p>
                      <p className="text-xs text-gray-400 mb-2">{campaign.brand}</p>
                      <p className="text-base font-bold text-violet-600">{reward.toLocaleString()}P</p>
                    </div>

                    {/* 찜 해제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromWishlist(campaign.id)
                      }}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                    >
                      <Heart size={20} className="text-red-500 fill-red-500" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 출금 신청 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-in slide-in-from-bottom">
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
                      setWithdrawAmount(parseInt(value).toLocaleString('ko-KR'))
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
                  name="resident-number-field"
                  id="resident-number-field"
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
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
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
