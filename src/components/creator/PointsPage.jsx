import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Wallet, DollarSign, CreditCard, Clock,
  CheckCircle, AlertCircle, Loader2, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Minus
} from 'lucide-react'

const PointsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [pointStats, setPointStats] = useState({
    totalPoints: 0,
    pendingPoints: 0,
    withdrawablePoints: 0
  })
  const [activeTab, setActiveTab] = useState('points') // points, withdrawals
  const [pointHistory, setPointHistory] = useState([])
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadPointsData()
    }
  }, [user])

  const loadPointsData = async () => {
    try {
      setLoading(true)

      // 프로필 가져오기
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // 지원 내역에서 정산 예정금 계산 (조인 대신 별도 쿼리)
      const { data: appsData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)

      // 캠페인 정보 별도 조회
      let applicationsData = appsData || []
      if (applicationsData.length > 0) {
        const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))]
        if (campaignIds.length > 0) {
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('id, title, reward_points, creator_points_override')
            .in('id', campaignIds)

          // 캠페인 데이터 병합
          applicationsData = applicationsData.map(app => ({
            ...app,
            campaigns: campaignsData?.find(c => c.id === app.campaign_id) || null
          }))
        }
      }

      const approved = applicationsData?.filter(a =>
        a.status === 'approved' || a.status === 'selected'
      ) || []

      const pendingPoints = approved.reduce((sum, a) => {
        return sum + (a.campaigns?.creator_points_override || a.campaigns?.reward_points || 0)
      }, 0)

      // 출금 내역 가져오기 (withdrawal_requests 테이블 - Master DB 표준)
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const pendingWithdrawals = withdrawalsData?.filter(w =>
        w.status === 'pending' || w.status === 'processing'
      ) || []

      const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)

      const totalPoints = profileData?.points || 0
      const withdrawablePoints = Math.max(0, totalPoints - pendingWithdrawalAmount)

      setPointStats({
        totalPoints,
        pendingPoints,
        withdrawablePoints
      })

      // 포인트 거래 내역 가져오기 (point_transactions 테이블 - 레거시 표준)
      const { data: transactionsData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const pointHistoryData = (transactionsData || []).map(t => ({
        id: t.id,
        type: t.amount > 0 ? 'credit' : 'debit',
        amount: Math.abs(t.amount),
        description: t.description || (t.type === 'earn' ? '포인트 적립' : t.type === 'withdraw' ? '출금' : t.type),
        date: t.created_at
      }))

      setPointHistory(pointHistoryData)
      setWithdrawalHistory(withdrawalsData || [])

    } catch (error) {
      console.error('포인트 데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 출금 신청 - 레거시 MyPageKorea.jsx 로직 적용
  const handleWithdrawRequest = async () => {
    const amount = parseInt(withdrawAmount)

    if (!amount || amount <= 0) {
      setError('올바른 금액을 입력해주세요')
      return
    }

    // 최소 출금 금액 검증 (레거시 기준: 10,000)
    if (amount < 10000) {
      setError('최소 출금 금액은 10,000원입니다')
      return
    }

    if (amount > pointStats.withdrawablePoints) {
      setError('출금 가능한 금액을 초과했습니다')
      return
    }

    if (!profile?.bank_name || !profile?.account_number) {
      setError('계좌 정보를 먼저 등록해주세요')
      return
    }

    try {
      setProcessing(true)
      setError('')

      // 1. 출금 신청 생성 (withdrawal_requests 테이블 - Master DB 표준)
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          bank_name: profile.bank_name,
          account_number: profile.account_number,
          account_holder: profile.account_holder,
          status: 'pending'
        })

      if (withdrawalError) throw withdrawalError

      // 2. 포인트 차감 (레거시 로직)
      const newPoints = (profile.points || 0) - amount
      const { error: pointsError } = await supabase
        .from('user_profiles')
        .update({ points: newPoints })
        .eq('id', user.id)

      if (pointsError) throw pointsError

      // 3. 포인트 거래 내역 추가 (레거시 로직)
      await supabase.from('point_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'withdraw',
        description: `출금 신청: ${amount.toLocaleString()}원 (${profile.bank_name} ${profile.account_number})`,
        platform_region: 'kr',
        country_code: 'KR'
      })

      setSuccess('출금 신청이 완료되었습니다. 영업일 기준 3-5일 내에 처리됩니다.')
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      loadPointsData()

      setTimeout(() => setSuccess(''), 5000)

    } catch (error) {
      console.error('출금 신청 오류:', error)
      setError('출금 신청 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getWithdrawalStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: '신청됨', color: 'bg-yellow-100 text-yellow-700' }
      case 'processing':
        return { label: '처리중', color: 'bg-blue-100 text-blue-700' }
      case 'completed':
        return { label: '완료', color: 'bg-green-100 text-green-700' }
      case 'rejected':
        return { label: '거절됨', color: 'bg-red-100 text-red-700' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/mypage')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">포인트 / 정산</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* 알림 메시지 */}
        {(error || success) && (
          <div className={`p-4 rounded-xl text-sm font-medium ${
            error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {error || success}
          </div>
        )}

        {/* 포인트 요약 카드 */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} />
            <span className="text-sm text-violet-200">보유 포인트</span>
          </div>
          <p className="text-4xl font-bold mb-4">{formatCurrency(pointStats.totalPoints)}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-violet-200 mb-1">정산 예정</p>
              <p className="text-lg font-bold">{formatCurrency(pointStats.pendingPoints)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-violet-200 mb-1">출금 가능</p>
              <p className="text-lg font-bold">{formatCurrency(pointStats.withdrawablePoints)}</p>
            </div>
          </div>
        </div>

        {/* 출금 신청 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">출금 신청</h3>

          {profile?.bank_name && profile?.account_number ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">등록된 계좌</p>
                    <p className="font-medium text-gray-900">
                      {profile.bank_name} {profile.account_number}
                    </p>
                    <p className="text-sm text-gray-600">{profile.account_holder}</p>
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-sm text-violet-600 font-medium"
                  >
                    변경
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={pointStats.withdrawablePoints <= 0}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                출금 신청하기
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm mb-4">정산받을 계좌를 먼저 등록해주세요</p>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700"
              >
                계좌 등록하기
              </button>
            </div>
          )}
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'points'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            포인트 내역
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'withdrawals'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            출금 내역
          </button>
        </div>

        {/* 포인트 내역 */}
        {activeTab === 'points' && (
          <div className="space-y-3">
            {pointHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <DollarSign size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">포인트 내역이 없습니다</p>
              </div>
            ) : (
              pointHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {item.type === 'credit' ? (
                      <ArrowDownLeft size={18} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={18} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                  </div>
                  <p className={`font-bold ${
                    item.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 출금 내역 */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawalHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">출금 내역이 없습니다</p>
              </div>
            ) : (
              withdrawalHistory.map((item, idx) => {
                const status = getWithdrawalStatusBadge(item.status)
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {item.bank_name} {item.account_number?.slice(-4)}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                    </div>
                    {item.processed_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        처리일: {formatDate(item.processed_at)}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* 출금 신청 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">출금 신청</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">출금 금액</label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-lg font-bold text-right pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                출금 가능: {formatCurrency(pointStats.withdrawablePoints)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">입금 계좌</p>
              <p className="font-medium text-gray-900">
                {profile?.bank_name} {profile?.account_number}
              </p>
              <p className="text-sm text-gray-600">{profile?.account_holder}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawAmount('')
                  setError('')
                }}
                className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-bold"
              >
                취소
              </button>
              <button
                onClick={handleWithdrawRequest}
                disabled={processing}
                className="flex-1 py-3.5 bg-violet-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {processing ? '처리 중...' : '신청하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PointsPage
