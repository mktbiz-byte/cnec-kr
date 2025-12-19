import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { database } from '../../lib/supabase'

const CampaignReport = () => {
  const { campaignId } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReportData()
  }, [campaignId])

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

  const handleVirtualSelect = async (applicationId) => {
    try {
      await database.applications.updateStatus(applicationId, 'virtual_selected')
      
      // 상태 업데이트 후 목록 새로고침
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'virtual_selected' }
            : app
        )
      )
    } catch (error) {
      console.error('가상 선택 처리 오류:', error)
      alert('가상 선택 처리 중 오류가 발생했습니다.')
    }
  }

  const handleCancelVirtualSelect = async (applicationId) => {
    try {
      await database.applications.updateStatus(applicationId, 'pending')
      
      // 상태 업데이트 후 목록 새로고침
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'pending' }
            : app
        )
      )
    } catch (error) {
      console.error('가상 선택 취소 처리 오류:', error)
      alert('가상 선택 취소 처리 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>보고서 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 캠페인이 존재하지 않습니다.</p>
        </div>
      </div>
    )
  }

  const totalApplications = applications.length
  const approvedApplications = applications.filter(app => app.status === 'approved').length
  const pendingApplications = applications.filter(app => app.status === 'pending').length
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">캠페인 보고서</h1>
            <div className="text-sm text-gray-500">
              생성일: {formatDate(new Date().toISOString())}
            </div>
          </div>
          
          {/* 캠페인 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">캠페인명</label>
              <p className="text-lg font-semibold text-gray-900">{campaign.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">브랜드</label>
              <p className="text-lg font-semibold text-gray-900">{campaign.brand}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">보상금</label>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(campaign.reward_amount)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">모집인원</label>
              <p className="text-lg font-semibold text-gray-900">{campaign.max_participants}명</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">신청 마감일</label>
              <p className="text-lg font-semibold text-gray-900">{formatDate(campaign.application_deadline)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">캠페인 설명</label>
              <p className="text-gray-900">{campaign.description}</p>
            </div>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">총 신청자</h3>
            <p className="text-3xl font-bold text-blue-600">{totalApplications}명</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">승인</h3>
            <p className="text-3xl font-bold text-green-600">{approvedApplications}명</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">대기중</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingApplications}명</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">거절</h3>
            <p className="text-3xl font-bold text-red-600">{rejectedApplications}명</p>
          </div>
        </div>

        {/* 신청자 목록 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">신청자 목록</h2>
          </div>
          
          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                  {applications.map((application) => (
                    <tr key={application.id}>
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
                        <div className="space-y-1">
                          {application.instagram_url && (
                            <div>
                              <a href={application.instagram_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-pink-600 hover:text-pink-800">
                                Instagram
                              </a>
                            </div>
                          )}
                          {application.tiktok_url && (
                            <div>
                              <a href={application.tiktok_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-black hover:text-gray-800">
                                TikTok
                              </a>
                            </div>
                          )}
                          {application.youtube_url && (
                            <div>
                              <a href={application.youtube_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-red-600 hover:text-red-800">
                                YouTube
                              </a>
                            </div>
                          )}
                          {application.blog_url && (
                            <div>
                              <a href={application.blog_url} target="_blank" rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-800">
                                블로그
                              </a>
                            </div>
                          )}
                          {!application.instagram_url && !application.tiktok_url && !application.youtube_url && !application.blog_url && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-2 max-w-xs">
                          {application.question1_answer && (
                            <div>
                              <div className="font-medium text-gray-700">Q1:</div>
                              <div className="text-xs">{application.question1_answer}</div>
                            </div>
                          )}
                          {application.question2_answer && (
                            <div>
                              <div className="font-medium text-gray-700">Q2:</div>
                              <div className="text-xs">{application.question2_answer}</div>
                            </div>
                          )}
                          {application.question3_answer && (
                            <div>
                              <div className="font-medium text-gray-700">Q3:</div>
                              <div className="text-xs">{application.question3_answer}</div>
                            </div>
                          )}
                          {application.question4_answer && (
                            <div>
                              <div className="font-medium text-gray-700">Q4:</div>
                              <div className="text-xs">{application.question4_answer}</div>
                            </div>
                          )}
                          {!application.question1_answer && !application.question2_answer && !application.question3_answer && !application.question4_answer && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {application.status === 'pending' && (
                          <button
                            onClick={() => handleVirtualSelect(application.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            가상 선택
                          </button>
                        )}
                        {application.status === 'virtual_selected' && (
                          <button
                            onClick={() => handleCancelVirtualSelect(application.id)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            선택 취소
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">아직 신청자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>CNEC 캠페인 관리 시스템 | 생성일: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  )
}

export default CampaignReport
