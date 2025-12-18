import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle, FileText,
  Upload, Target, Loader2, Calendar, Truck, Camera
} from 'lucide-react'

const ApplicationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0
  })

  const filters = [
    { id: 'all', label: '전체' },
    { id: 'pending', label: '신청중' },
    { id: 'approved', label: '선정됨' },
    { id: 'inProgress', label: '진행중' },
    { id: 'completed', label: '완료' }
  ]

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    try {
      setLoading(true)

      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns (
            id, title, brand, image_url, reward_points,
            creator_points_override, application_deadline,
            content_submission_deadline, campaign_type,
            product_shipping_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(applicationsData || [])

      // 카운트 계산
      const all = applicationsData?.length || 0
      const pending = applicationsData?.filter(a => a.status === 'pending').length || 0
      const approved = applicationsData?.filter(a =>
        ['approved', 'selected', 'virtual_selected'].includes(a.status)
      ).length || 0
      const inProgress = applicationsData?.filter(a =>
        ['filming', 'video_submitted'].includes(a.status)
      ).length || 0
      const completed = applicationsData?.filter(a =>
        ['completed', 'paid'].includes(a.status)
      ).length || 0

      setCounts({ all, pending, approved, inProgress, completed })

    } catch (error) {
      console.error('지원 내역 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredApplications = () => {
    switch (activeFilter) {
      case 'pending':
        return applications.filter(a => a.status === 'pending')
      case 'approved':
        return applications.filter(a =>
          ['approved', 'selected', 'virtual_selected'].includes(a.status)
        )
      case 'inProgress':
        return applications.filter(a =>
          ['filming', 'video_submitted'].includes(a.status)
        )
      case 'completed':
        return applications.filter(a =>
          ['completed', 'paid'].includes(a.status)
        )
      default:
        return applications
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: '선정 대기중', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'approved':
      case 'selected':
        return { label: '선정됨', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'virtual_selected':
        return { label: '가선정', color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
      case 'filming':
        return { label: '촬영 진행중', color: 'bg-orange-100 text-orange-700', icon: Camera }
      case 'video_submitted':
        return { label: '영상 제출됨', color: 'bg-purple-100 text-purple-700', icon: Upload }
      case 'completed':
        return { label: '완료', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
      case 'paid':
        return { label: '정산완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
      case 'rejected':
        return { label: '미선정', color: 'bg-red-100 text-red-700', icon: null }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: null }
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDDay = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))

    if (diff < 0) return { text: '마감', urgent: true }
    if (diff === 0) return { text: 'D-Day', urgent: true }
    if (diff <= 3) return { text: `D-${diff}`, urgent: true }
    return { text: `D-${diff}`, urgent: false }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0원'
    return `${amount.toLocaleString()}원`
  }

  const filteredApps = getFilteredApplications()

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
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-900">지원 내역</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 space-y-5">
        {/* 상태 플로우 시각화 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-gray-900">{counts.pending}</p>
              <p className="text-xs text-gray-500 mt-1">신청</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-violet-600">{counts.approved}</p>
              <p className="text-xs text-gray-500 mt-1">선정</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-amber-500">{counts.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">진행중</p>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-emerald-500">{counts.completed}</p>
              <p className="text-xs text-gray-500 mt-1">완료</p>
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {filter.label}
              {filter.id !== 'all' && (
                <span className="ml-1 opacity-70">
                  {counts[filter.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 캠페인 목록 */}
        <div className="space-y-3">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                {activeFilter === 'all'
                  ? '아직 지원한 캠페인이 없습니다'
                  : '해당 상태의 캠페인이 없습니다'
                }
              </p>
            </div>
          ) : (
            filteredApps.map((app, idx) => {
              const statusInfo = getStatusInfo(app.status)
              const StatusIcon = statusInfo.icon
              const deadline = app.campaigns?.content_submission_deadline
              const dDay = getDDay(deadline)
              const reward = app.campaigns?.creator_points_override || app.campaigns?.reward_points

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    {/* 썸네일 */}
                    {app.campaigns?.image_url ? (
                      <img
                        src={app.campaigns.image_url}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <Target size={24} className="text-gray-300" />
                      </div>
                    )}

                    {/* 캠페인 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {dDay && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            dDay.urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {dDay.text}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mb-0.5">{app.campaigns?.brand}</p>
                      <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                        {app.campaigns?.title}
                      </p>

                      {/* 상태별 추가 정보 */}
                      {app.status === 'pending' && (
                        <p className="text-xs text-gray-400">
                          지원일: {formatDate(app.created_at)}
                        </p>
                      )}

                      {['approved', 'selected', 'virtual_selected'].includes(app.status) && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {app.campaigns?.product_shipping_date && (
                            <span className="flex items-center gap-1">
                              <Truck size={12} />
                              발송: {formatDate(app.campaigns.product_shipping_date)}
                            </span>
                          )}
                          {deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              마감: {formatDate(deadline)}
                            </span>
                          )}
                        </div>
                      )}

                      {['filming', 'video_submitted'].includes(app.status) && deadline && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <Clock size={12} />
                          촬영 마감: {formatDate(deadline)}
                        </div>
                      )}

                      {['completed', 'paid'].includes(app.status) && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            완료일: {formatDate(app.updated_at)}
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            +{formatCurrency(reward)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 진행중 상태일 때 업로드 버튼 */}
                  {app.status === 'filming' && (
                    <button
                      onClick={() => navigate(`/submit-video/${app.campaigns?.id}`)}
                      className="w-full mt-3 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
                    >
                      영상 업로드하기
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationsPage
