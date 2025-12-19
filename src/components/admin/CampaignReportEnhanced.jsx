import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../../lib/supabase'
import AdminNavigation from './AdminNavigation'
import { 
  ArrowLeft, Users, CheckCircle, XCircle, Clock, Eye,
  Download, RefreshCw, Filter, Search, AlertTriangle,
  Instagram, Youtube, Video, ExternalLink, FileText
} from 'lucide-react'

const CampaignReportEnhanced = () => {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplications, setSelectedApplications] = useState([])

  useEffect(() => {
    loadReportData()
  }, [campaignId])

  useEffect(() => {
    filterApplications()
  }, [applications, statusFilter, searchTerm])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')

      // 캠페인 정보 로드
      const campaignData = await database.campaigns.getById(campaignId)
      setCampaign(campaignData)

      // 해당 캠페인의 신청서 로드
      const applicationData = await database.applications.getByCampaign(campaignId)
      setApplications(applicationData || [])

    } catch (error) {
      console.error('보고서 데이터 로드 오류:', error)
      setError('보고서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(app => 
        (app.applicant_name || '').toLowerCase().includes(searchLower) ||
        (app.user_profiles?.email || '').toLowerCase().includes(searchLower)
      )
    }

    setFilteredApplications(filtered)
  }

  const handleVirtualSelect = async (applicationId) => {
    try {
      setProcessing(true)
      await database.applications.updateStatus(applicationId, 'virtual_selected')
      
      // 상태 업데이트 후 목록 새로고침
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'virtual_selected', virtual_selected_at: new Date().toISOString() }
            : app
        )
      )
      
      setSuccess('가상 선택이 완료되었습니다.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('가상 선택 처리 오류:', error)
      setError('가상 선택 처리 중 오류가 발생했습니다.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelVirtualSelect = async (applicationId) => {
    try {
      setProcessing(true)
      await database.applications.updateStatus(applicationId, 'pending')
      
      // 상태 업데이트 후 목록 새로고침
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'pending', virtual_selected_at: null }
            : app
        )
      )
      
      setSuccess('가상 선택이 취소되었습니다.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('가상 선택 취소 처리 오류:', error)
      setError('가상 선택 취소 처리 중 오류가 발생했습니다.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkVirtualSelect = async () => {
    if (selectedApplications.length === 0) {
      setError('선택된 신청서가 없습니다.')
      return
    }

    try {
      setProcessing(true)
      
      // 선택된 신청서들을 가상선택으로 변경
      const promises = selectedApplications.map(id => 
        database.applications.updateStatus(id, 'virtual_selected')
      )
      
      await Promise.all(promises)
      
      // 상태 업데이트
      setApplications(prevApplications => 
        prevApplications.map(app => 
          selectedApplications.includes(app.id)
            ? { ...app, status: 'virtual_selected', virtual_selected_at: new Date().toISOString() }
            : app
        )
      )
      
      setSelectedApplications([])
      setSuccess(`${selectedApplications.length}개의 신청서가 가상 선택되었습니다.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('일괄 가상 선택 오류:', error)
      setError('일괄 가상 선택 처리 중 오류가 발생했습니다.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const handleSelectAll = () => {
    const pendingApplications = filteredApplications
      .filter(app => app.status === 'pending')
      .map(app => app.id)
    
    if (selectedApplications.length === pendingApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(pendingApplications)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'virtual_selected': return '가선택'
      case 'approved': return '승인'
      case 'rejected': return '거절'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'virtual_selected': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'virtual_selected': return <Eye className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const exportToCSV = () => {
    const headers = [
      '이름', '나이', '피부타입', 'Instagram', 'TikTok', 'YouTube', '기타 SNS',
      'Q1 답변', 'Q2 답변', 'Q3 답변', 'Q4 답변', '신청일', '상태'
    ]
    
    const csvData = filteredApplications.map(app => [
      app.applicant_name || '-',
      app.age || '-',
      app.skin_type || '-',
      app.instagram_url || '-',
      app.tiktok_url || '-',
      app.youtube_url || '-',
      app.blog_url || '-',
      app.question1_answer || '-',
      app.question2_answer || '-',
      app.question3_answer || '-',
      app.question4_answer || '-',
      formatDate(app.created_at),
      getStatusText(app.status)
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `campaign_${campaignId}_report.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>보고서 로딩 중...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/applications-manage')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              신청서 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalApplications = applications.length
  const pendingApplications = applications.filter(app => app.status === 'pending').length
  const virtualSelectedApplications = applications.filter(app => app.status === 'virtual_selected').length
  const approvedApplications = applications.filter(app => app.status === 'approved').length
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/applications-manage')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">캠페인 보고서</h1>
                <p className="text-gray-600 mt-1">{campaign?.title || '캠페인 제목'}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadReportData}
                disabled={loading}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 신청</p>
                <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">가선택</p>
                <p className="text-2xl font-bold text-gray-900">{virtualSelectedApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인</p>
                <p className="text-2xl font-bold text-gray-900">{approvedApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">거절</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-gray-500 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">모든 상태</option>
                  <option value="pending">대기중</option>
                  <option value="virtual_selected">가선택</option>
                  <option value="approved">승인</option>
                  <option value="rejected">거절</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <Search className="h-4 w-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="이름, 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedApplications.length > 0 && (
                <button
                  onClick={handleBulkVirtualSelect}
                  disabled={processing}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  선택된 {selectedApplications.length}개 가상선택
                </button>
              )}
              
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                {selectedApplications.length === filteredApplications.filter(app => app.status === 'pending').length 
                  ? '전체 해제' : '전체 선택'}
              </button>
            </div>
          </div>
        </div>

        {/* 신청자 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              신청자 목록 ({filteredApplications.length}명)
            </h2>
          </div>
          
          {filteredApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedApplications.length === filteredApplications.filter(app => app.status === 'pending').length && filteredApplications.filter(app => app.status === 'pending').length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      나이
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      피부타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SNS 주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청서 답변
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApplications(prev => [...prev, application.id])
                              } else {
                                setSelectedApplications(prev => prev.filter(id => id !== application.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {application.applicant_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.age || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.skin_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {application.instagram_url && (
                            <a
                              href={application.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-600 hover:text-pink-800"
                              title="Instagram"
                            >
                              <Instagram className="h-4 w-4" />
                            </a>
                          )}
                          {application.tiktok_url && (
                            <a
                              href={application.tiktok_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-black hover:text-gray-800"
                              title="TikTok"
                            >
                              <Video className="h-4 w-4" />
                            </a>
                          )}
                          {application.youtube_url && (
                            <a
                              href={application.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-800"
                              title="YouTube"
                            >
                              <Youtube className="h-4 w-4" />
                            </a>
                          )}
                          {application.blog_url && (
                            <a
                              href={application.blog_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="블로그"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="space-y-1">
                          {[1, 2, 3, 4].map(num => {
                            const answer = application[`question${num}_answer`]
                            return answer ? (
                              <div key={num} className="text-xs">
                                <span className="font-medium">Q{num}:</span> {answer.substring(0, 50)}{answer.length > 50 ? '...' : ''}
                              </div>
                            ) : null
                          })}
                          {application.additional_info && (
                            <div className="text-xs border-t pt-1 mt-1">
                              <span className="font-medium text-blue-600">추가 메시지:</span> {application.additional_info.substring(0, 50)}{application.additional_info.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(application.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {application.status === 'pending' && (
                            <button
                              onClick={() => handleVirtualSelect(application.id)}
                              disabled={processing}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              가상 선택
                            </button>
                          )}
                          {application.status === 'virtual_selected' && (
                            <button
                              onClick={() => handleCancelVirtualSelect(application.id)}
                              disabled={processing}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              선택 취소
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">신청자가 없습니다</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all' || searchTerm 
                  ? '선택한 조건에 맞는 신청자가 없습니다.' 
                  : '아직 이 캠페인에 신청한 사용자가 없습니다.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignReportEnhanced
