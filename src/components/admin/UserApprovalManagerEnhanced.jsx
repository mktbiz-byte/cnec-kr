import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database, supabase } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { 
  Loader2, User, Mail, Phone, Calendar, Shield, 
  CheckCircle, XCircle, Clock, AlertCircle, 
  Search, Filter, RefreshCw, Eye, Edit, Crown,
  Users, UserCheck, UserX, Settings, Plus, Minus,
  Star, Award, UserPlus, Trash2
} from 'lucide-react'

const UserApprovalManagerEnhanced = () => {
  const { language } = useLanguage()
  
  const [users, setUsers] = useState([])
  const [withdrawalRequests, setWithdrawalRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 필터 및 검색
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [roleChangeModal, setRoleChangeModal] = useState(false)
  const [pointModal, setPointModal] = useState(false)
  const [withdrawalModal, setWithdrawalModal] = useState(false)
  
  // 포인트 관리
  const [pointAmount, setPointAmount] = useState('')
  const [pointDescription, setPointDescription] = useState('')
  
  // 권한 변경
  const [newRole, setNewRole] = useState('')

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '사용자 승인 관리',
      subtitle: '가입한 사용자들을 승인하고 관리합니다',
      totalUsers: '총 사용자',
      pendingUsers: '승인 대기',
      approvedUsers: '승인됨',
      rejectedUsers: '거절됨',
      adminUsers: '관리자',
      vipUsers: 'VIP 사용자',
      managerUsers: '매니저',
      withdrawalRequests: '탈퇴 요청',
      filterByStatus: '상태별 필터',
      filterByRole: '역할별 필터',
      searchPlaceholder: '이름, 이메일로 검색...',
      allStatuses: '모든 상태',
      allRoles: '모든 역할',
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거절됨',
      user: '일반 사용자',
      vip: 'VIP 사용자',
      manager: '매니저',
      admin: '관리자',
      viewDetails: '상세 보기',
      approve: '승인',
      reject: '거절',
      changeRole: '권한 변경',
      addPoints: '포인트 추가',
      subtractPoints: '포인트 차감',
      viewWithdrawals: '탈퇴 요청 보기',
      refresh: '새로고침',
      joinDate: '가입일',
      lastLogin: '최근 로그인',
      points: '포인트',
      status: '상태',
      role: '권한',
      actions: '작업',
      userDetails: '사용자 상세 정보',
      roleChange: '권한 변경',
      pointManagement: '포인트 관리',
      withdrawalManagement: '탈퇴 요청 관리',
      selectNewRole: '새 권한 선택',
      pointAmount: '포인트 수량',
      description: '설명',
      reason: '사유',
      save: '저장',
      cancel: '취소',
      close: '닫기',
      confirm: '확인',
      processing: '처리 중...',
      noUsers: '사용자가 없습니다',
      noWithdrawals: '탈퇴 요청이 없습니다',
      messages: {
        approved: '사용자가 승인되었습니다.',
        rejected: '사용자가 거절되었습니다.',
        roleChanged: '사용자 권한이 변경되었습니다.',
        pointsAdded: '포인트가 추가되었습니다.',
        pointsSubtracted: '포인트가 차감되었습니다.',
        withdrawalProcessed: '탈퇴 요청이 처리되었습니다.',
        error: '오류가 발생했습니다.'
      }
    },
    ja: {
      title: '사용자 승인管理',
      subtitle: '登録ユーザーを승인・管理します',
      totalUsers: '総ユーザー数',
      pendingUsers: '승인待ち',
      approvedUsers: '승인됨',
      rejectedUsers: '拒否',
      adminUsers: '관리자',
      vipUsers: 'VIPユーザー',
      managerUsers: 'マネージャー',
      withdrawalRequests: '退会申請',
      filterByStatus: 'ステータス別フィルター',
      filterByRole: '役割別フィルター',
      searchPlaceholder: '名前、メールで검색...',
      allStatuses: '全てのステータス',
      allRoles: '全ての役割',
      pending: '승인待ち',
      approved: '승인됨',
      rejected: '拒否',
      user: '一般ユーザー',
      vip: 'VIPユーザー',
      manager: 'マネージャー',
      admin: '관리자',
      viewDetails: '상세표시',
      approve: '승인',
      reject: '拒否',
      changeRole: '権限変更',
      addPoints: '포인트추가',
      subtractPoints: '포인트減算',
      viewWithdrawals: '退会申請표시',
      refresh: '업데이트',
      joinDate: '등록일',
      lastLogin: '最終ログイン',
      points: '포인트',
      status: 'ステータス',
      role: '権限',
      actions: '操作',
      userDetails: 'ユーザー상세',
      roleChange: '権限変更',
      pointManagement: '포인트管理',
      withdrawalManagement: '退会申請管理',
      selectNewRole: '新しい権限を選択',
      pointAmount: '포인트数',
      description: '설명',
      reason: '理由',
      save: '저장',
      cancel: '취소',
      close: '닫기',
      confirm: '확인',
      processing: '処理中...',
      noUsers: 'ユーザーがいません',
      noWithdrawals: '退会申請がありません',
      messages: {
        approved: 'ユーザーが승인されました。',
        rejected: 'ユーザーが拒否されました。',
        roleChanged: 'ユーザー権限が変更されました。',
        pointsAdded: '포인트が추가されました。',
        pointsSubtracted: '포인트が減算されました。',
        withdrawalProcessed: '退会申請が処理されました。',
        error: '오류가 발생했습니다。'
      }
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    loadUsers()
    loadWithdrawalRequests()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await database.users.getAll()
      setUsers(data || [])
    } catch (error) {
      console.error('사용자 로드 오류:', error)
      setError(t.messages.error)
    } finally {
      setLoading(false)
    }
  }

  const loadWithdrawalRequests = async () => {
    try {
      // 먼저 탈퇴 요청만 로드
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (withdrawalError) {
        console.error('탈퇴 요청 로드 오류:', withdrawalError)
        setWithdrawalRequests([])
        return
      }
      
      // 사용자 정보를 별도로 로드하여 매칭
      if (withdrawals && withdrawals.length > 0) {
        const userIds = withdrawals.map(w => w.user_id)
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, name, email')
          .in('user_id', userIds)
        
        if (profileError) {
          console.error('사용자 프로필 로드 오류:', profileError)
        }
        
        // 데이터 매칭
        const enrichedWithdrawals = withdrawals.map(withdrawal => ({
          ...withdrawal,
          user_profiles: profiles?.find(p => p.user_id === withdrawal.user_id) || {
            name: '알 수 없음',
            email: '알 수 없음'
          }
        }))
        
        setWithdrawalRequests(enrichedWithdrawals)
      } else {
        setWithdrawalRequests([])
      }
    } catch (error) {
      console.error('탈퇴 요청 로드 오류:', error)
      setWithdrawalRequests([])
    }
  }

  const handleApproval = async (userId, status) => {
    try {
      setProcessing(true)
      await database.users.updateApprovalStatus(userId, status)
      await loadUsers()
      setSuccess(status === 'approved' ? t.messages.approved : t.messages.rejected)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('승인 처리 오류:', error)
      setError(t.messages.error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return
    
    try {
      setProcessing(true)
      
      const { error } = await supabase
        .rpc('change_user_role', {
          target_user_id: selectedUser.user_id,
          new_role: newRole
        })
      
      if (error) throw error
      
      await loadUsers()
      setSuccess(t.messages.roleChanged)
      setRoleChangeModal(false)
      setSelectedUser(null)
      setNewRole('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('권한 변경 오류:', error)
      setError(t.messages.error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handlePointManagement = async (isAdd) => {
    if (!selectedUser || !pointAmount) return
    
    try {
      setProcessing(true)
      
      const amount = parseInt(pointAmount)
      if (isNaN(amount) || amount <= 0) {
        setError(language === 'ko' ? '유효한 포인트 수량을 입력해주세요.' : '有効な포인트数を入力してください。')
        return
      }
      
      const finalAmount = isAdd ? amount : -amount
      const description = pointDescription || (isAdd ? 
        (language === 'ko' ? '관리자 포인트 추가' : '관리자포인트추가') : 
        (language === 'ko' ? '관리자 포인트 차감' : '관리자포인트減算'))
      
      // 포인트 거래 기록 직접 삽입
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: selectedUser.user_id,
          amount: finalAmount,
          transaction_type: isAdd ? 'admin_add' : 'admin_subtract',
          description: description,
          created_at: new Date().toISOString()
        })
      
      if (transactionError) throw transactionError
      
      // 사용자 포인트 업데이트
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          points: selectedUser.points + finalAmount 
        })
        .eq('user_id', selectedUser.user_id)
      
      if (updateError) throw updateError
      
      await loadUsers()
      setSuccess(isAdd ? t.messages.pointsAdded : t.messages.pointsSubtracted)
      setPointModal(false)
      setSelectedUser(null)
      setPointAmount('')
      setPointDescription('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('포인트 관리 오류:', error)
      setError(language === 'ko' ? '포인트 처리 중 오류가 발생했습니다.' : '포인트処理中に오류가 발생했습니다。')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdrawalRequest = async (requestId, status, adminNotes = '') => {
    try {
      setProcessing(true)
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId)
      
      if (error) throw error
      
      await loadWithdrawalRequests()
      setSuccess(t.messages.withdrawalProcessed)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('탈퇴 요청 처리 오류:', error)
      setError(t.messages.error)
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesStatus = !statusFilter || user.approval_status === statusFilter
    const matchesRole = !roleFilter || user.user_role === roleFilter
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesRole && matchesSearch
  })

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: t.pending },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: t.approved },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', text: t.rejected }
    }
    
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  const getRoleBadge = (role) => {
    const badges = {
      user: { icon: User, color: 'bg-gray-100 text-gray-800', text: t.user },
      vip: { icon: Star, color: 'bg-purple-100 text-purple-800', text: t.vip },
      manager: { icon: Award, color: 'bg-blue-100 text-blue-800', text: t.manager },
      admin: { icon: Crown, color: 'bg-red-100 text-red-800', text: t.admin }
    }
    
    const badge = badges[role] || badges.user
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  const userStats = {
    total: users.length,
    pending: users.filter(u => u.approval_status === 'pending').length,
    approved: users.filter(u => u.approval_status === 'approved').length,
    rejected: users.filter(u => u.approval_status === 'rejected').length,
    admin: users.filter(u => u.user_role === 'admin').length,
    vip: users.filter(u => u.user_role === 'vip').length,
    manager: users.filter(u => u.user_role === 'manager').length,
    withdrawals: withdrawalRequests.filter(w => w.status === 'pending').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="mt-2 text-gray-600">{t.subtitle}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setWithdrawalModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.viewWithdrawals}
                {userStats.withdrawals > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {userStats.withdrawals}
                  </span>
                )}
              </button>
              <button
                onClick={loadUsers}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.refresh}
              </button>
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
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

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.totalUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.pendingUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.approvedUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.rejectedUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.vipUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.vip}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.managerUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.manager}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.adminUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.admin}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t.withdrawalRequests}</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.withdrawals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.filterByStatus}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.allStatuses}</option>
                <option value="pending">{t.pending}</option>
                <option value="approved">{t.approved}</option>
                <option value="rejected">{t.rejected}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.filterByRole}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.allRoles}</option>
                <option value="user">{t.user}</option>
                <option value="vip">{t.vip}</option>
                <option value="manager">{t.manager}</option>
                <option value="admin">{t.admin}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.searchPlaceholder}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.role}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.points}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.joinDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {t.noUsers}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || '이름 없음'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.user_role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.points?.toLocaleString() || 0}P
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setDetailModal(true)
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {user.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproval(user.user_id, 'approved')}
                              disabled={processing}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproval(user.user_id, 'rejected')}
                              disabled={processing}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.user_role)
                            setRoleChangeModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setPointModal(true)
                          }}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용자 상세 모달 */}
        {detailModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.userDetails}</h3>
                  <button
                    onClick={() => setDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">이름</label>
                    <p className="text-sm text-gray-900">{selectedUser.name || '이름 없음'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">이메일</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.status}</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.approval_status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.role}</label>
                    <div className="mt-1">{getRoleBadge(selectedUser.user_role)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.points}</label>
                    <p className="text-sm text-gray-900">{selectedUser.points?.toLocaleString() || 0}P</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t.joinDate}</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setDetailModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 권한 변경 모달 */}
        {roleChangeModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.roleChange}</h3>
                  <button
                    onClick={() => setRoleChangeModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.selectNewRole}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="user">{t.user}</option>
                      <option value="vip">{t.vip}</option>
                      <option value="manager">{t.manager}</option>
                      <option value="admin">{t.admin}</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setRoleChangeModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleRoleChange}
                    disabled={processing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {processing ? t.processing : t.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 포인트 관리 모달 */}
        {pointModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.pointManagement}</h3>
                  <button
                    onClick={() => setPointModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      현재 포인트: {selectedUser.points?.toLocaleString() || 0}P
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.pointAmount}
                    </label>
                    <input
                      type="number"
                      value={pointAmount}
                      onChange={(e) => setPointAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="포인트 수량 입력"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.description}
                    </label>
                    <textarea
                      value={pointDescription}
                      onChange={(e) => setPointDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="포인트 지급/차감 사유"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setPointModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => handlePointManagement(false)}
                    disabled={processing || !pointAmount}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4 mr-1 inline" />
                    {t.subtractPoints}
                  </button>
                  <button
                    onClick={() => handlePointManagement(true)}
                    disabled={processing || !pointAmount}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-1 inline" />
                    {t.addPoints}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탈퇴 요청 관리 모달 */}
        {withdrawalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.withdrawalManagement}</h3>
                  <button
                    onClick={() => setWithdrawalModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.reason}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          요청일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.status}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawalRequests.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            {t.noWithdrawals}
                          </td>
                        </tr>
                      ) : (
                        withdrawalRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {request.user_profiles?.name || '이름 없음'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user_profiles?.email}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {request.reason || '사유 없음'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(request.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleWithdrawalRequest(request.id, 'approved')}
                                    disabled={processing}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleWithdrawalRequest(request.id, 'rejected')}
                                    disabled={processing}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setWithdrawalModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.close}
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

export default UserApprovalManagerEnhanced
