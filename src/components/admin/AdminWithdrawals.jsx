import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import AdminNavigation from './AdminNavigation'
import {
  ArrowRight, Copy, ExternalLink, Download, Eye, Edit,
  Search, Filter, RefreshCw, X, Check, CheckSquare, Square
} from 'lucide-react'

// PayPal 정보 추출 헬퍼 함수
const extractPayPalFromDescription = (description) => {
  if (!description) return 'No PayPal info'
  
  // "출금 신청: 50000포인트 (PayPal: MKT@HOWLAB.CO.KR)" 형식에서 이메일 추출
  const paypalMatch = description.match(/PayPal:\s*([^)]+)\)/)
  if (paypalMatch) {
    return paypalMatch[1].trim()
  }
  
  // "PayPal: email@example.com" 형식에서 이메일 추출
  const paypalMatch2 = description.match(/PayPal:\s*([^\s,)]+)/)
  if (paypalMatch2) {
    return paypalMatch2[1].trim()
  }
  
  // 이메일 패턴 직접 추출
  const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) {
    return emailMatch[1]
  }
  
  return 'No PayPal info'
}

const AdminWithdrawals = () => {
  const { language } = useLanguage()
  
  const [withdrawals, setWithdrawals] = useState([])
  const [bankTransfers, setBankTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedTab, setSelectedTab] = useState('withdrawals')
  
  // 필터 및 검색
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  
  // 대량 처리를 위한 상태
  const [selectedItems, setSelectedItems] = useState([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  
  // 거부 모달 상태
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectForm, setRejectForm] = useState({
    withdrawalId: null,
    reason: '',
    customReason: '',
    userEmail: '',
    userName: '',
    amount: 0
  })
  
  // 모달 상태
  const [detailModal, setDetailModal] = useState(false)
  const [processModal, setProcessModal] = useState(false)
  const [processForm, setProcessForm] = useState({
    status: '',
    admin_notes: '',
    transaction_id: ''
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '출금 관리',
      subtitle: '사용자의 출금 리퀘스트를 관리합니다',
      withdrawalRequests: '출금 리퀘스트',
      bankTransfers: '은행 송금',
      totalRequests: '총 리퀘스트',
      pending: '대기중',
      approved: '승인됨',
      rejected: '거부됨',
      completed: '완료됨',
      statusFilter: '상태별 필터',
      allStatuses: '모든 상태',
      search: '검색',
      searchPlaceholder: '사용자명, 메일로 검색...',
      refresh: '새로고침',
      export: 'Excel 엑스포트',
      viewDetails: '상세보기',
      process: '처리하기',
      approve: '승인',
      reject: '거부',
      complete: '완료',
      bulkApprove: '선택 항목 승인',
      bulkComplete: '선택 항목 완료',
      selectAll: '전체 선택',
      selected: '개 선택됨',
      rejectWithReason: '거부 사유 선택',
      rejectReason: '거부 사유',
      selectReason: '사유를 선택해주세요',
      customReason: '직접 입력',
      customReasonPlaceholder: '거부 사유를 직접 입력해주세요...',
      sendRejectEmail: '거부 메일 발송',
      cancel: '취소',
      emailSent: '거부 메일이 발송되었습니다',
      emailSendFailed: '메일 발송에 실패했습니다'
    },
    ja: {
      title: '출금 관리',
      subtitle: 'ユーザーの출금リクエストを管理します',
      withdrawalRequests: '출금リクエスト',
      bankTransfers: '銀行振込',
      totalRequests: '総リクエスト',
      pending: '待機中',
      approved: '승인됨',
      rejected: '拒否済み',
      completed: '완료済み',
      statusFilter: 'ステータス別フィルター',
      allStatuses: 'すべてのステータス',
      search: '검색',
      searchPlaceholder: 'ユーザー名、メールで검색...',
      refresh: '업데이트',
      export: 'Excel エクスポート',
      viewDetails: '상세を見る',
      process: '処理する',
      approve: '승인',
      reject: '拒否',
      complete: '완료',
      bulkApprove: '選択項目を승인',
      bulkComplete: '選択項目を완료',
      selectAll: '全て選択',
      selected: '個選択中',
      rejectWithReason: '拒否理由選択',
      rejectReason: '拒否理由',
      selectReason: '理由を選択してください',
      customReason: '直接入力',
      customReasonPlaceholder: '拒否理由を直接入力してください...',
      sendRejectEmail: '拒否メール전송',
      cancel: '취소',
      emailSent: '拒否メールが전송されました',
      emailSendFailed: 'メール전송に실패했습니다'
    }
  }

  const t = texts[language] || texts.ko

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('1단계: 출금 데이터 로드...')
      
      // point_transactions에서 출금 데이터 조회 (음수 금액)
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('point_transactions')
        .select('*')
        .lt('amount', 0)
        .order('created_at', { ascending: false })
      
      if (withdrawalsError) {
        console.error('출금 데이터 로드 오류:', withdrawalsError)
        throw withdrawalsError
      }
      
      // point_transactions 데이터를 출금 요청 형식으로 변환
      const processedData = await Promise.all((withdrawalsData || []).map(async (item) => {
        const paypalInfo = extractPayPalFromDescription(item.description || '')
        
        // 사용자 정보 별도 조회
        let userInfo = { name: '-', email: '-', phone: '-' }
        try {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('name, email, phone')
            .eq('id', item.user_id)
            .single()
          
          if (userProfile) {
            userInfo = userProfile
          }
        } catch (userError) {
          console.warn('사용자 정보 조회 실패:', userError)
        }
        
        // 상태 결정 (description에서 상태 정보 추출)
        let status = 'pending'
        if (item.description && item.description.includes('[상태:승인됨]')) {
          status = 'approved'
        } else if (item.description && item.description.includes('[상태:거부됨]')) {
          status = 'rejected'
        } else if (item.description && item.description.includes('[상태:완료됨]')) {
          status = 'completed'
        }
        
        return {
          id: item.id,
          user_id: item.user_id,
          amount: Math.abs(item.amount), // 양수로 변환
          method: 'PayPal',
          paypal_email: paypalInfo,
          status: status,
          created_at: item.created_at,
          user_profiles: userInfo,
          description: item.description
        }
      }))
      
      // 중복 제거 (같은 사용자, 같은 금액, 같은 날짜)
      const uniqueData = []
      const seen = new Set()
      
      for (const item of processedData) {
        const key = `${item.user_id}-${item.amount}-${item.created_at.split('T')[0]}`
        if (!seen.has(key)) {
          seen.add(key)
          uniqueData.push(item)
        }
      }
      
      setWithdrawals(uniqueData)
      console.log('출금 데이터 로드 성공:', uniqueData.length)
      
      console.log('2단계: 계좌 이체 데이터 로드...')
      try {
        const bankTransfersData = await database.bankTransfers?.getAll() || []
        setBankTransfers(bankTransfersData)
        console.log('계좌 이체 데이터 로드 성공:', bankTransfersData.length)
      } catch (error) {
        console.warn('계좌 이체 데이터 로드 실패:', error)
        setBankTransfers([])
      }
      
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`${t.error}: ${error.message}`)
    } finally {
      setLoading(false)
      console.log('데이터 로드 완료')
    }
  }

  // 출금 상태 업데이트
  const updateWithdrawalStatus = async (withdrawalId, newStatus, adminNotes = '', transactionId = '') => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('출금 상태 업데이트 시작:', withdrawalId, newStatus)

      // 먼저 해당 레코드가 존재하는지 확인
      const { data: existingRecord, error: selectError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('id', withdrawalId)
        .single()

      if (selectError) {
        console.error('레코드 조회 오류:', selectError)
        throw new Error(`레코드를 찾을 수 없습니다: ${selectError.message}`)
      }

      console.log('기존 레코드:', existingRecord)

      // description 필드를 사용해서 상태 정보를 저장
      let newDescription = existingRecord.description || ''

      if (newStatus === 'approved') {
        newDescription = newDescription.replace(/\[상태:.*?\]/g, '') + ' [상태:승인됨]'
        console.log('승인 처리 중...')

      } else if (newStatus === 'rejected') {
        newDescription = newDescription.replace(/\[상태:.*?\]/g, '') + ` [상태:거부됨] [사유:${adminNotes}]`
        console.log('거부 처리 중...')

        // 포인트 환불 처리
        const refundAmount = Math.abs(existingRecord.amount)
        const userId = existingRecord.user_id

        if (userId && refundAmount > 0) {
          // 1. 현재 포인트 조회
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', userId)
            .single()

          if (profileError) {
            console.error('프로필 조회 오류:', profileError)
          } else {
            const currentPoints = profileData?.points || 0
            const newPoints = currentPoints + refundAmount

            // 2. 포인트 환불
            const { error: updatePointsError } = await supabase
              .from('user_profiles')
              .update({ points: newPoints })
              .eq('id', userId)

            if (updatePointsError) {
              console.error('포인트 환불 오류:', updatePointsError)
              throw new Error('포인트 환불에 실패했습니다')
            }

            // 3. 환불 기록 추가
            const { error: refundTxError } = await supabase
              .from('point_transactions')
              .insert({
                user_id: userId,
                amount: refundAmount,
                transaction_type: 'refund',
                description: `[출금거절] ${refundAmount.toLocaleString()}원 환불 - ${adminNotes || '관리자 거절'}`
              })

            if (refundTxError) {
              console.error('환불 기록 오류:', refundTxError)
            }

            console.log('포인트 환불 완료:', { userId, refundAmount, newPoints })
          }
        }

        // withdrawals 테이블도 업데이트 (있는 경우)
        try {
          await supabase
            .from('withdrawals')
            .update({
              status: 'rejected',
              admin_notes: adminNotes,
              processed_at: new Date().toISOString()
            })
            .eq('user_id', existingRecord.user_id)
            .eq('amount', Math.abs(existingRecord.amount))
            .eq('status', 'pending')
        } catch (withdrawalUpdateError) {
          console.log('withdrawals 테이블 업데이트 스킵 (테이블 없거나 매칭 레코드 없음)')
        }

      } else if (newStatus === 'completed') {
        newDescription = newDescription.replace(/\[상태:.*?\]/g, '') + ' [상태:완료됨]'
        console.log('완료 처리 중...')

        // withdrawals 테이블도 업데이트 (있는 경우)
        try {
          await supabase
            .from('withdrawals')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('user_id', existingRecord.user_id)
            .eq('amount', Math.abs(existingRecord.amount))
            .eq('status', 'approved')
        } catch (withdrawalUpdateError) {
          console.log('withdrawals 테이블 업데이트 스킵')
        }
      }

      // description 필드 업데이트
      const { data: updateResult, error: updateError } = await supabase
        .from('point_transactions')
        .update({ 
          description: newDescription.trim()
        })
        .eq('id', withdrawalId)
        .select()
      
      if (updateError) {
        console.error('업데이트 오류:', updateError)
        throw updateError
      }
      
      console.log('업데이트 결과:', updateResult)
      setSuccess(`출금이 ${newStatus === 'approved' ? '승인' : newStatus === 'rejected' ? '거부' : '완료'}되었습니다.`)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
        setSuccess('')
      }, 1500)
      
    } catch (error) {
      console.error('상태 업데이트 실패:', error)
      setError(`상태 업데이트에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  // 거부 모달 열기
  const openRejectModal = (withdrawal) => {
    setRejectForm({
      withdrawalId: withdrawal.id,
      reason: '',
      customReason: '',
      userEmail: withdrawal.user_profiles?.email || '',
      userName: withdrawal.user_profiles?.name || '',
      amount: withdrawal.amount
    })
    setRejectModal(true)
  }

  // 거부 이메일 발송
  const sendRejectEmail = async () => {
    try {
      setProcessing(true)
      
      const finalReason = rejectForm.reason === 'custom' ? rejectForm.customReason : rejectForm.reason
      
      if (!finalReason) {
        setError('거부 사유를 선택하거나 입력해주세요.')
        return
      }

      // 1. 출금 상태를 거부로 업데이트
      await updateWithdrawalStatus(rejectForm.withdrawalId, 'rejected', finalReason)

      // 2. 이메일 발송
      const emailData = {
        to: rejectForm.userEmail,
        subject: '출금 신청 거부 안내',
        template: 'withdrawal_rejected',
        data: {
          userName: rejectForm.userName,
          amount: rejectForm.amount,
          reason: finalReason,
          date: new Date().toLocaleDateString('ko-KR')
        }
      }

      const response = await fetch('/.netlify/functions/send-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      })

      if (response.ok) {
        setSuccess(t.emailSent)
        setRejectModal(false)
        setRejectForm({
          withdrawalId: null,
          reason: '',
          customReason: '',
          userEmail: '',
          userName: '',
          amount: 0
        })
      } else {
        throw new Error('이메일 발송 실패')
      }

    } catch (error) {
      console.error('거부 이메일 발송 오류:', error)
      setError(t.emailSendFailed + ': ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  // 대량 처리 함수
  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      setError('처리할 항목을 선택해주세요.')
      return
    }

    setBulkProcessing(true)
    setError('')
    setSuccess('')

    try {
      const promises = selectedItems.map(id => 
        updateWithdrawalStatus(id, action)
      )
      
      await Promise.all(promises)
      
      setSuccess(`${selectedItems.length}개 항목이 ${action === 'approved' ? '승인' : '완료'}되었습니다.`)
      setSelectedItems([])
      
    } catch (error) {
      setError(`대량 처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setBulkProcessing(false)
    }
  }

  // 체크박스 관련 함수들
  const handleSelectAll = () => {
    if (selectedItems.length === filteredWithdrawals.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredWithdrawals.map(item => item.id))
    }
  }

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // 필터링된 출금 데이터
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesStatus = !statusFilter || withdrawal.status === statusFilter
    const matchesSearch = !searchTerm || 
      withdrawal.user_profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // 상태별 카운트
  const statusCounts = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    completed: withdrawals.filter(w => w.status === 'completed').length
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 로드하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('withdrawals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'withdrawals'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.withdrawalRequests}
            </button>
            <button
              onClick={() => setSelectedTab('transfers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'transfers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.bankTransfers}
            </button>
          </nav>
        </div>
      </div>

      {selectedTab === 'withdrawals' && (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Copy className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalRequests}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.pending}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.approved}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.rejected}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.completed}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white p-4 rounded-lg shadow border mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">{t.statusFilter}</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.allStatuses}</option>
                    <option value="pending">{t.pending}</option>
                    <option value="approved">{t.approved}</option>
                    <option value="rejected">{t.rejected}</option>
                    <option value="completed">{t.completed}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">{t.search}</label>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {t.refresh}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  {t.export}
                </button>
              </div>
            </div>
          </div>

          {/* 대량 처리 컨트롤 */}
          {selectedItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedItems.length}{t.selected}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approved')}
                    disabled={bulkProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {bulkProcessing ? '처리중...' : t.bulkApprove}
                  </button>
                  <button
                    onClick={() => handleBulkAction('completed')}
                    disabled={bulkProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {bulkProcessing ? '처리중...' : t.bulkComplete}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 출금 요청 테이블 */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2"
                      >
                        {selectedItems.length === filteredWithdrawals.length && filteredWithdrawals.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.selectAll}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      크리에이터
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출금방법
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      스테이터스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      처리일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectItem(withdrawal.id)}
                          className="flex items-center"
                        >
                          {selectedItems.includes(withdrawal.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {withdrawal.user_profiles?.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {withdrawal.user_profiles?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.user_profiles?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">PayPal</div>
                        <div className="text-sm text-gray-500">
                          {extractPayPalFromDescription(withdrawal.description)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₩{withdrawal.amount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {withdrawal.status === 'pending' ? t.pending :
                           withdrawal.status === 'approved' ? t.approved :
                           withdrawal.status === 'rejected' ? t.rejected :
                           withdrawal.status === 'completed' ? t.completed :
                           withdrawal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal)
                              setProcessModal(true)
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                                disabled={processing}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                              >
                                {t.approve}
                              </button>
                              <button
                                onClick={() => openRejectModal(withdrawal)}
                                disabled={processing}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                {t.reject}
                              </button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <button
                              onClick={() => updateWithdrawalStatus(withdrawal.id, 'completed')}
                              disabled={processing}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              {t.complete}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredWithdrawals.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Copy className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">출금 리퀘스트가 없습니다</p>
              </div>
            )}
          </div>
        </>
      )}

      {selectedTab === 'transfers' && (
        <div className="bg-white rounded-lg shadow border p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Copy className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">계좌 이체 관리</h3>
            <p className="text-gray-500">계좌 이체 기능은 준비 중입니다.</p>
          </div>
        </div>
      )}

      {/* 거부 사유 모달 */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.rejectWithReason}
            </h3>
            
            <div className="space-y-4">
              {/* 사용자 정보 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>사용자:</strong> {rejectForm.userName} ({rejectForm.userEmail})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>출금 금액:</strong> ₩{rejectForm.amount?.toLocaleString()}
                </p>
              </div>

              {/* 거부 사유 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.rejectReason}
                </label>
                <select
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.selectReason}</option>
                  <option value="계정 정보 불일치">계정 정보 불일치</option>
                  <option value="최소 출금 금액 미달">최소 출금 금액 미달</option>
                  <option value="PayPal 계정 오류">PayPal 계정 오류</option>
                  <option value="서류 미제출">필요 서류 미제출</option>
                  <option value="중복 신청">중복 신청</option>
                  <option value="계정 제재">계정 제재 상태</option>
                  <option value="기타 정책 위반">기타 정책 위반</option>
                  <option value="custom">{t.customReason}</option>
                </select>
              </div>

              {/* 직접 입력 */}
              {rejectForm.reason === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상세 사유
                  </label>
                  <textarea
                    value={rejectForm.customReason}
                    onChange={(e) => setRejectForm(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder={t.customReasonPlaceholder}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectModal(false)
                  setRejectForm({
                    withdrawalId: null,
                    reason: '',
                    customReason: '',
                    userEmail: '',
                    userName: '',
                    amount: 0
                  })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={sendRejectEmail}
                disabled={processing || (!rejectForm.reason || (rejectForm.reason === 'custom' && !rejectForm.customReason))}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? '처리중...' : t.sendRejectEmail}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminWithdrawals
