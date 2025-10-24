import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, supabase } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { 
  Loader2, CreditCard, Building, User, MapPin, Phone, Mail, 
  AlertCircle, CheckCircle, Clock, DollarSign, FileText, 
  ArrowRight, Copy, ExternalLink, Download, Eye, Edit,
  Search, Filter, RefreshCw, X
} from 'lucide-react'

// PayPal 정보 추출 헬퍼 함수
const extractPayPalFromDescription = (description) => {
  if (!description) return ''
  
  // "PayPal: email@example.com" 형식에서 이메일 추출
  const paypalMatch = description.match(/PayPal:\s*([^)]+)/)
  if (paypalMatch) {
    return paypalMatch[1].trim()
  }
  
  // 이메일 패턴 직접 추출
  const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) {
    return emailMatch[1]
  }
  
  return ''
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
      subtitle: '사용자 출금 요청을 관리합니다',
      withdrawalRequests: '출금 요청',
      bankTransfers: '계좌 이체',
      totalRequests: '총 요청',
      pendingRequests: '대기 중',
      approvedRequests: '승인됨',
      rejectedRequests: '거절됨',
      completedRequests: '완료됨',
      filterByStatus: '상태별 필터',
      searchPlaceholder: '사용자명, 이메일로 검색...',
      allStatuses: '모든 상태',
      pending: '대기 중',
      approved: '승인됨',
      rejected: '거절됨',
      completed: '완료됨',
      processing: '처리 중',
      viewDetails: '상세 보기',
      processRequest: '처리하기',
      amount: '금액',
      requestDate: '요청일',
      status: '상태',
      actions: '작업',
      user: '사용자',
      bankInfo: '계좌 정보',
      bankName: '은행명',
      accountNumber: '계좌번호',
      accountHolder: '예금주',
      requestDetails: '출금 요청 상세',
      userInfo: '사용자 정보',
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      requestedAmount: '요청 금액',
      currentBalance: '현재 잔액',
      adminNotes: '관리자 메모',
      transactionId: '거래 ID',
      processedAt: '처리일',
      close: '닫기',
      save: '저장',
      approve: '승인',
      reject: '거절',
      complete: '완료',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다.',
      success: '성공적으로 처리되었습니다.',
      noRequests: '출금 요청이 없습니다.',
      confirmApprove: '이 출금 요청을 승인하시겠습니까?',
      confirmReject: '이 출금 요청을 거절하시겠습니까?',
      confirmComplete: '이 출금을 완료 처리하시겠습니까?',
      exportExcel: 'Excel 내보내기',
      refresh: '새로고침'
    },
    ja: {
      title: '출금 관리',
      subtitle: 'ユーザーの출금リクエストを管理します',
      withdrawalRequests: '출금リクエスト',
      bankTransfers: '銀行振込',
      totalRequests: '総リクエスト',
      pendingRequests: '待機中',
      approvedRequests: '승인됨',
      rejectedRequests: '拒否済み',
      completedRequests: '완료済み',
      filterByStatus: 'ステータス別フィルター',
      searchPlaceholder: 'ユーザー名、メールで검색...',
      allStatuses: 'すべてのステータス',
      pending: '待機中',
      approved: '승인됨',
      rejected: '拒否済み',
      completed: '완료済み',
      processing: '処理中',
      viewDetails: '상세を見る',
      processRequest: '処理する',
      amount: '金額',
      requestDate: 'リクエスト日',
      status: 'ステータス',
      actions: 'アクション',
      user: 'ユーザー',
      bankInfo: '口座情報',
      bankName: '은행명',
      accountNumber: '계좌번호',
      accountHolder: '예금주',
      requestDetails: '출금リクエスト상세',
      userInfo: 'ユーザー情報',
      name: '名前',
      email: 'メール',
      phone: '電話番号',
      requestedAmount: 'リクエスト金額',
      currentBalance: '現在の残高',
      adminNotes: '관리자メモ',
      transactionId: '取引ID',
      processedAt: '処理日',
      close: '닫기',
      save: '저장',
      approve: '승인',
      reject: '拒否',
      complete: '완료',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다。',
      success: '正常に処理されました。',
      noRequests: '출금リクエストがありません。',
      confirmApprove: 'この출금リクエストを승인しますか？',
      confirmReject: 'この출금リクエストを拒否しますか？',
      confirmComplete: 'この출금を완료処理しますか？',
      exportExcel: 'Excel エクスポート',
      refresh: '업데이트'
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    console.log('AdminWithdrawals 마운트됨')
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('출금 데이터 로드 시작')
      
      // 단계별 데이터 로딩으로 흰화면 문제 해결
      
      // 1단계: 출금 요청 데이터 로드 (withdrawal_requests 테이블 우선, 없으면 point_transactions 사용)
      console.log('1단계: 출금 요청 데이터 로드...')
      try {
        let withdrawalsData = null
        let error = null
        
        // point_transactions 테이블에서 출금 데이터 가져오기 (직접 사용)
        console.log('point_transactions 테이블에서 출금 데이터 로드 시작...')
        const result = await supabase
          .from('point_transactions')
          .select('*')
          .lt('amount', 0) // 음수 금액 (출금)
          .order('created_at', { ascending: false })
        
        withdrawalsData = result.data
        error = result.error
        console.log('point_transactions에서 출금 데이터 로드:', withdrawalsData?.length || 0, '건')
        
        if (error) {
          console.error('point_transactions 출금 데이터 로드 실패:', error)
          throw error
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
          
          return {
            id: item.id,
            user_id: item.user_id,
            amount: Math.abs(item.amount),
            points_amount: Math.abs(item.amount),
            status: item.transaction_type === 'approved' ? 'approved' : 
                    item.transaction_type === 'rejected' ? 'rejected' :
                    item.transaction_type === 'completed' ? 'completed' : 'pending',
            created_at: item.created_at,
            updated_at: item.updated_at,
            reason: item.description,
            paypal_email: paypalInfo,
            paypal_name: paypalInfo,
            user_name: userInfo.name || '-',
            user_email: userInfo.email || '-',
            user_phone: userInfo.phone || '-',
            bank_name: 'PayPal',
            account_number: paypalInfo,
            account_holder: paypalInfo,
            withdrawal_method: 'paypal'
          }
        }))
        
        // 중복 제거: 같은 사용자, 같은 금액, 같은 날짜의 출금 신청을 하나로 합침
        const uniqueWithdrawals = []
        const seen = new Set()
        
        for (const withdrawal of processedData) {
          const key = `${withdrawal.user_id}-${withdrawal.amount}-${withdrawal.created_at.split('T')[0]}`
          if (!seen.has(key)) {
            seen.add(key)
            uniqueWithdrawals.push(withdrawal)
          }
        }
        
        setWithdrawals(uniqueWithdrawals)
        console.log('출금 요청 데이터 로드 성공:', uniqueWithdrawals.length, '(중복 제거 후)')
        
      } catch (error) {
        console.warn('출금 요청 데이터 로드 실패:', error)
        setWithdrawals([])
      }
      
      // 2단계: 계좌 이체 데이터 로드 (있다면)
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

  const updateWithdrawalStatus = async (withdrawalId, newStatus, adminNotes = '', transactionId = '') => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('출금 상태 업데이트:', withdrawalId, newStatus)

      // point_transactions 테이블에서 상태 업데이트
      // 실제로는 상태를 변경하는 대신 새로운 레코드를 생성하거나 기존 레코드를 업데이트
      if (newStatus === 'approved') {
        // 승인 시: transaction_type을 'approved'로 업데이트
        const { error } = await supabase
          .from('point_transactions')
          .update({ 
            transaction_type: 'approved'
          })
          .eq('id', withdrawalId)
        
        if (error) {
          throw error
        }
        
        console.log('출금 승인 완료')
        setSuccess('출금이 승인되었습니다.')
        
      } else if (newStatus === 'rejected') {
        // 거부 시: transaction_type을 'rejected'로 업데이트
        const { error } = await supabase
          .from('point_transactions')
          .update({ 
            transaction_type: 'rejected'
          })
          .eq('id', withdrawalId)
        
        if (error) {
          throw error
        }
        
        console.log('출금 거부 완료')
        setSuccess('출금이 거부되었습니다.')
        
      } else if (newStatus === 'completed') {
        // 완료 시: transaction_type을 'completed'로 업데이트
        const { error } = await supabase
          .from('point_transactions')
          .update({ 
            transaction_type: 'completed'
          })
          .eq('id', withdrawalId)
        
        if (error) {
          throw error
        }
        
        console.log('출금 완료 처리')
        setSuccess('출금이 완료되었습니다.')
      }
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadData()
      }, 1000)
      
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      setError(`상태 업데이트에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleStatusChange = async (withdrawal, newStatus) => {
    console.log('상태 변경 요청:', withdrawal.id, newStatus)
    
    // 확인 없이 바로 실행 (테스트용)
    await updateWithdrawalStatus(withdrawal.id, newStatus)
  }

  const openProcessModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setProcessForm({
      status: withdrawal.status,
      admin_notes: withdrawal.admin_notes || '',
      transaction_id: withdrawal.transaction_id || ''
    })
    setProcessModal(true)
  }

  const handleProcessSubmit = async () => {
    if (!selectedWithdrawal) return

    await updateWithdrawalStatus(
      selectedWithdrawal.id,
      processForm.status,
      processForm.admin_notes,
      processForm.transaction_id
    )
    
    setProcessModal(false)
  }

  const openDetailModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setDetailModal(true)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: t.pending, icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', text: t.approved, icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: t.rejected, icon: X },
      completed: { color: 'bg-green-100 text-green-800', text: t.completed, icon: CheckCircle },
      processing: { color: 'bg-purple-100 text-purple-800', text: t.processing, icon: Loader2 }
    }
    
    const statusInfo = statusMap[status] || statusMap.pending
    const IconComponent = statusInfo.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusInfo.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ja-JP')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'ja-JP', {
      style: 'currency',
      currency: language === 'ko' ? 'KRW' : 'JPY'
    }).format(amount)
  }

  // 필터링된 출금 요청
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesStatus = !statusFilter || withdrawal.status === statusFilter
    const matchesSearch = !searchTerm || 
      withdrawal.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // 통계 계산
  const stats = {
    total: filteredWithdrawals.length,
    pending: filteredWithdrawals.filter(w => w.status === 'pending').length,
    approved: filteredWithdrawals.filter(w => w.status === 'approved').length,
    rejected: filteredWithdrawals.filter(w => w.status === 'rejected').length,
    completed: filteredWithdrawals.filter(w => w.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t.loading}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-2">{t.subtitle}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.refresh}
              </button>
              <button
                onClick={() => {/* Excel 내보내기 기능 */}}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                {t.exportExcel}
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
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
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t.withdrawalRequests}
                </div>
              </button>
              <button
                onClick={() => setSelectedTab('bank-transfers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'bank-transfers'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {t.bankTransfers}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {selectedTab === 'withdrawals' && (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{t.totalRequests}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{t.pendingRequests}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{t.approvedRequests}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <X className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{t.rejectedRequests}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{t.completedRequests}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 필터 및 검색 */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      {t.filterByStatus}
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">{t.allStatuses}</option>
                      <option value="pending">{t.pending}</option>
                      <option value="approved">{t.approved}</option>
                      <option value="rejected">{t.rejected}</option>
                      <option value="completed">{t.completed}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      검색
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="search"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 출금 요청 목록 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <li key={withdrawal.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <DollarSign className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {withdrawal.user_name || '이름 없음'}
                              </p>
                              <div className="ml-2">
                                {getStatusBadge(withdrawal.status)}
                              </div>
                            </div>
                            <div className="mt-2 flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <p>{withdrawal.user_email || '-'}</p>
                              </div>
                              <div className="ml-6 flex items-center text-sm text-gray-500">
                                <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <p>{formatCurrency(withdrawal.amount)}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                요청일: {formatDate(withdrawal.created_at)}
                              </p>
                              {withdrawal.bank_name && (
                                <p className="text-sm text-gray-600">
                                  은행: {withdrawal.bank_name} ({withdrawal.account_number})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => openDetailModal(withdrawal)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.viewDetails}
                          </button>

                          <button
                            onClick={() => openProcessModal(withdrawal)}
                            className="inline-flex items-center px-3 py-1.5 border border-indigo-300 shadow-sm text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {t.processRequest}
                          </button>

                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(withdrawal, 'approved')}
                                disabled={processing}
                                className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t.approve}
                              </button>
                              <button
                                onClick={() => handleStatusChange(withdrawal, 'rejected')}
                                disabled={processing}
                                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <X className="h-3 w-3 mr-1" />
                                {t.reject}
                              </button>
                            </>
                          )}

                          {withdrawal.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(withdrawal, 'completed')}
                              disabled={processing}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t.complete}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {filteredWithdrawals.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noRequests}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    선택한 조건에 맞는 출금 요청이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedTab === 'bank-transfers' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">계좌 이체 관리</h3>
                <p className="mt-1 text-sm text-gray-500">
                  계좌 이체 기능은 준비 중입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 상세 정보 모달 */}
        {detailModal && selectedWithdrawal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {t.requestDetails}
                      </h3>
                      <button
                        onClick={() => setDetailModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* 사용자 정보 */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">{t.userInfo}</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t.name}:</p>
                              <p className="font-medium">{selectedWithdrawal.user_name || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.email}:</p>
                              <p className="font-medium">{selectedWithdrawal.user_email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.phone}:</p>
                              <p className="font-medium">{selectedWithdrawal.user_phone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.status}:</p>
                              <div className="mt-1">
                                {getStatusBadge(selectedWithdrawal.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 출금 정보 */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">출금 정보</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t.requestedAmount}:</p>
                              <p className="font-medium text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.requestDate}:</p>
                              <p className="font-medium">{formatDate(selectedWithdrawal.created_at)}</p>
                            </div>
                            {selectedWithdrawal.processed_at && (
                              <div>
                                <p className="text-sm text-gray-600">{t.processedAt}:</p>
                                <p className="font-medium">{formatDate(selectedWithdrawal.processed_at)}</p>
                              </div>
                            )}
                            {selectedWithdrawal.transaction_id && (
                              <div>
                                <p className="text-sm text-gray-600">{t.transactionId}:</p>
                                <p className="font-medium">{selectedWithdrawal.transaction_id}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 계좌 정보 */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">{t.bankInfo}</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t.bankName}:</p>
                              <p className="font-medium">{selectedWithdrawal.bank_name || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.accountNumber}:</p>
                              <p className="font-medium">{selectedWithdrawal.account_number || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.accountHolder}:</p>
                              <p className="font-medium">{selectedWithdrawal.account_holder || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 관리자 메모 */}
                      {selectedWithdrawal.admin_notes && (
                        <div>
                          <h4 className="text-md font-semibold mb-3">{t.adminNotes}</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-800">{selectedWithdrawal.admin_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setDetailModal(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {t.close}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 처리 모달 */}
        {processModal && selectedWithdrawal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {t.processRequest}
                      </h3>
                      <button
                        onClick={() => setProcessModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          {t.status}
                        </label>
                        <select
                          id="status"
                          value={processForm.status}
                          onChange={(e) => setProcessForm(prev => ({ ...prev, status: e.target.value }))}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="pending">{t.pending}</option>
                          <option value="approved">{t.approved}</option>
                          <option value="rejected">{t.rejected}</option>
                          <option value="completed">{t.completed}</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700">
                          {t.transactionId}
                        </label>
                        <input
                          type="text"
                          id="transaction_id"
                          value={processForm.transaction_id}
                          onChange={(e) => setProcessForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                          placeholder="거래 ID를 입력하세요"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700">
                          {t.adminNotes}
                        </label>
                        <textarea
                          id="admin_notes"
                          value={processForm.admin_notes}
                          onChange={(e) => setProcessForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                          placeholder="관리자 메모를 입력하세요"
                          rows={3}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setProcessModal(false)}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={handleProcessSubmit}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {t.save}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminWithdrawals
