import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { database } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { 
  Loader2, User, Mail, Phone, Calendar, Shield, 
  CheckCircle, XCircle, Clock, AlertCircle, 
  Search, Filter, RefreshCw, Eye, Edit, Crown,
  Users, UserCheck, UserX, Settings
} from 'lucide-react'

const UserApprovalManager = () => {
  const { language } = useLanguage()
  
  const [users, setUsers] = useState([])
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
  const [adminModal, setAdminModal] = useState(false)

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
      filterByStatus: '상태별 필터',
      filterByRole: '역할별 필터',
      searchPlaceholder: '이름, 이메일로 검색...',
      allStatuses: '모든 상태',
      allRoles: '모든 역할',
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거절됨',
      user: '일반 사용자',
      admin: '관리자',
      viewDetails: '상세 보기',
      approve: '승인',
      reject: '거절',
      makeAdmin: '관리자로 변경',
      removeAdmin: '관리자 해제',
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      joinDate: '가입일',
      status: '상태',
      role: '역할',
      actions: '작업',
      userDetails: '사용자 상세 정보',
      userInfo: '사용자 정보',
      profileInfo: '프로필 정보',
      age: '나이',
      skinType: '피부 타입',
      instagram: '인스타그램',
      youtube: '유튜브',
      tiktok: '틱톡',
      bio: '자기소개',
      close: '닫기',
      save: '저장',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다.',
      success: '성공적으로 처리되었습니다.',
      noUsers: '사용자가 없습니다.',
      confirmApprove: '이 사용자를 승인하시겠습니까?',
      confirmReject: '이 사용자를 거절하시겠습니까?',
      confirmMakeAdmin: '이 사용자를 관리자로 변경하시겠습니까?',
      confirmRemoveAdmin: '이 사용자의 관리자 권한을 해제하시겠습니까?',
      adminManagement: '관리자 권한 관리',
      adminWarning: '관리자 권한을 부여하면 모든 관리 기능에 접근할 수 있습니다.',
      refresh: '새로고침'
    },
    ja: {
      title: '사용자 승인管理',
      subtitle: '登録されたユーザーを승인・管理します',
      totalUsers: '総ユーザー',
      pendingUsers: '승인待ち',
      approvedUsers: '승인됨',
      rejectedUsers: '拒否済み',
      adminUsers: '관리자',
      filterByStatus: 'ステータス別フィルター',
      filterByRole: '役割別フィルター',
      searchPlaceholder: '名前、メールで검색...',
      allStatuses: 'すべてのステータス',
      allRoles: 'すべての役割',
      pending: '승인待ち',
      approved: '승인됨',
      rejected: '拒否済み',
      user: '一般ユーザー',
      admin: '관리자',
      viewDetails: '상세を見る',
      approve: '승인',
      reject: '拒否',
      makeAdmin: '관리자に変更',
      removeAdmin: '관리자解除',
      name: '名前',
      email: 'メール',
      phone: '電話番号',
      joinDate: '등록일',
      status: 'ステータス',
      role: '役割',
      actions: 'アクション',
      userDetails: 'ユーザー상세情報',
      userInfo: 'ユーザー情報',
      profileInfo: '프로필情報',
      age: '年齢',
      skinType: '肌タイプ',
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      bio: '自己紹介',
      close: '닫기',
      save: '저장',
      cancel: '취소',
      loading: '로딩 중...',
      error: '오류가 발생했습니다。',
      success: '正常に処理されました。',
      noUsers: 'ユーザーがいません。',
      confirmApprove: 'このユーザーを승인しますか？',
      confirmReject: 'このユーザーを拒否しますか？',
      confirmMakeAdmin: 'このユーザーを관리자に変更しますか？',
      confirmRemoveAdmin: 'このユーザーの관리자権限を解除しますか？',
      adminManagement: '관리자権限管理',
      adminWarning: '관리자権限を付与すると、すべての管理機能にアクセスできます。',
      refresh: '업데이트'
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    console.log('UserApprovalManager 마운트됨')
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('사용자 데이터 로드 시작')
      
      // 사용자 프로필 데이터 로드
      try {
        const usersData = await database.userProfiles?.getAll() || []
        setUsers(usersData)
        console.log('사용자 데이터 로드 성공:', usersData.length)
      } catch (error) {
        console.warn('사용자 데이터 로드 실패:', error)
        setUsers([])
      }
      
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(`${t.error}: ${error.message}`)
    } finally {
      setLoading(false)
      console.log('데이터 로드 완료')
    }
  }

  const updateUserStatus = async (userId, newStatus) => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('사용자 상태 업데이트:', userId, newStatus)

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      await database.userProfiles.update(userId, updateData)
      
      console.log('상태 업데이트 완료')
      setSuccess(t.success)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadUsers()
      }, 1000)
      
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      setError(`상태 업데이트에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      setProcessing(true)
      setError('')
      setSuccess('')
      
      console.log('사용자 역할 업데이트:', userId, newRole)

      const updateData = {
        role: newRole,
        updated_at: new Date().toISOString()
      }

      await database.userProfiles.update(userId, updateData)
      
      console.log('역할 업데이트 완료')
      setSuccess(t.success)
      
      // 데이터 다시 로드
      setTimeout(() => {
        loadUsers()
      }, 1000)
      
    } catch (error) {
      console.error('역할 업데이트 오류:', error)
      setError(`역할 업데이트에 실패했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleStatusChange = async (user, newStatus) => {
    let confirmMessage = ''
    
    switch (newStatus) {
      case 'approved':
        confirmMessage = t.confirmApprove
        break
      case 'rejected':
        confirmMessage = t.confirmReject
        break
      default:
        return
    }

    if (confirm(confirmMessage)) {
      await updateUserStatus(user.id, newStatus)
    }
  }

  const handleRoleChange = async (user, newRole) => {
    let confirmMessage = ''
    
    if (newRole === 'admin') {
      confirmMessage = t.confirmMakeAdmin
    } else {
      confirmMessage = t.confirmRemoveAdmin
    }

    if (confirm(confirmMessage)) {
      await updateUserRole(user.id, newRole)
    }
  }

  const openDetailModal = (user) => {
    setSelectedUser(user)
    setDetailModal(true)
  }

  const openAdminModal = (user) => {
    setSelectedUser(user)
    setAdminModal(true)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: t.pending, icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', text: t.approved, icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: t.rejected, icon: XCircle }
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

  const getRoleBadge = (role) => {
    const roleMap = {
      user: { color: 'bg-blue-100 text-blue-800', text: t.user, icon: User },
      admin: { color: 'bg-purple-100 text-purple-800', text: t.admin, icon: Crown }
    }
    
    const roleInfo = roleMap[role] || roleMap.user
    const IconComponent = roleInfo.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {roleInfo.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')
  }

  // 필터링된 사용자
  const filteredUsers = users.filter(user => {
    const matchesStatus = !statusFilter || user.status === statusFilter
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesRole && matchesSearch
  })

  // 통계 계산
  const stats = {
    total: filteredUsers.length,
    pending: filteredUsers.filter(u => u.status === 'pending').length,
    approved: filteredUsers.filter(u => u.status === 'approved').length,
    rejected: filteredUsers.filter(u => u.status === 'rejected').length,
    admin: filteredUsers.filter(u => u.role === 'admin').length
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
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.refresh}
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

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t.totalUsers}</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">{t.pendingUsers}</dt>
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
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t.approvedUsers}</dt>
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
                  <UserX className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t.rejectedUsers}</dt>
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
                  <Crown className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t.adminUsers}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.admin}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </select>
              </div>

              <div>
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                  {t.filterByRole}
                </label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">{t.allRoles}</option>
                  <option value="user">{t.user}</option>
                  <option value="admin">{t.admin}</option>
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

        {/* 사용자 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {user.name || '이름 없음'}
                          </p>
                          <div className="ml-2 flex space-x-1">
                            {getStatusBadge(user.status)}
                            {getRoleBadge(user.role || 'user')}
                          </div>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>{user.email || '-'}</p>
                          </div>
                          {user.age && (
                            <div className="ml-6 flex items-center text-sm text-gray-500">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{user.age}세</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            가입일: {formatDate(user.created_at)}
                          </p>
                          {user.skin_type && (
                            <p className="text-sm text-gray-600">
                              피부 타입: {user.skin_type}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => openDetailModal(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t.viewDetails}
                      </button>

                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(user, 'approved')}
                            disabled={processing}
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t.approve}
                          </button>
                          <button
                            onClick={() => handleStatusChange(user, 'rejected')}
                            disabled={processing}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            {t.reject}
                          </button>
                        </>
                      )}

                      {user.status === 'approved' && (
                        <button
                          onClick={() => openAdminModal(user)}
                          className="inline-flex items-center px-3 py-1.5 border border-purple-300 shadow-sm text-xs font-medium rounded text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          {user.role === 'admin' ? t.removeAdmin : t.makeAdmin}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noUsers}</h3>
              <p className="mt-1 text-sm text-gray-500">
                선택한 조건에 맞는 사용자가 없습니다.
              </p>
            </div>
          )}
        </div>

        {/* 상세 정보 모달 */}
        {detailModal && selectedUser && (
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
                        {t.userDetails}
                      </h3>
                      <button
                        onClick={() => setDetailModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">{t.userInfo}</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t.name}:</p>
                              <p className="font-medium">{selectedUser.name || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.email}:</p>
                              <p className="font-medium">{selectedUser.email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.age}:</p>
                              <p className="font-medium">{selectedUser.age || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.skinType}:</p>
                              <p className="font-medium">{selectedUser.skin_type || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.status}:</p>
                              <div className="mt-1">
                                {getStatusBadge(selectedUser.status)}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">{t.role}:</p>
                              <div className="mt-1">
                                {getRoleBadge(selectedUser.role || 'user')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SNS 정보 */}
                      <div>
                        <h4 className="text-md font-semibold mb-3">SNS 정보</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 gap-4">
                            {selectedUser.instagram_url && (
                              <div>
                                <p className="text-sm text-gray-600">{t.instagram}:</p>
                                <a 
                                  href={selectedUser.instagram_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                  {selectedUser.instagram_url}
                                </a>
                              </div>
                            )}
                            {selectedUser.youtube_url && (
                              <div>
                                <p className="text-sm text-gray-600">{t.youtube}:</p>
                                <a 
                                  href={selectedUser.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                  {selectedUser.youtube_url}
                                </a>
                              </div>
                            )}
                            {selectedUser.tiktok_url && (
                              <div>
                                <p className="text-sm text-gray-600">{t.tiktok}:</p>
                                <a 
                                  href={selectedUser.tiktok_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                  {selectedUser.tiktok_url}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 자기소개 */}
                      {selectedUser.bio && (
                        <div>
                          <h4 className="text-md font-semibold mb-3">{t.bio}</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-800">{selectedUser.bio}</p>
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

        {/* 관리자 권한 모달 */}
        {adminModal && selectedUser && (
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
                        {t.adminManagement}
                      </h3>
                      <button
                        onClick={() => setAdminModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">{t.adminWarning}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedUser.name}</p>
                            <p className="text-sm text-gray-600">{selectedUser.email}</p>
                            <div className="mt-2">
                              {getRoleBadge(selectedUser.role || 'user')}
                            </div>
                          </div>
                          <Crown className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setAdminModal(false)}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={() => {
                          const newRole = selectedUser.role === 'admin' ? 'user' : 'admin'
                          handleRoleChange(selectedUser, newRole)
                          setAdminModal(false)
                        }}
                        disabled={processing}
                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          selectedUser.role === 'admin' 
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                            : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                        }`}
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Crown className="h-4 w-4 mr-2" />
                        )}
                        {selectedUser.role === 'admin' ? t.removeAdmin : t.makeAdmin}
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

export default UserApprovalManager
