import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CreatorLayout from './CreatorLayout'
import CreatorHome from './CreatorHome'
import CampaignPolicyModal, { shouldShowPolicyPopup } from './CampaignPolicyModal'
import { Loader2 } from 'lucide-react'

const HomePage = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPolicyPopup, setShowPolicyPopup] = useState(false)

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // 메인 페이지 진입 시 캠페인 정책 팝업 자동 표시 (24시간 보지 않기 체크)
  useEffect(() => {
    if (shouldShowPolicyPopup()) {
      const timer = setTimeout(() => setShowPolicyPopup(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-md bg-white min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <CreatorLayout>
        <CreatorHome />
      </CreatorLayout>

      {/* 캠페인 정책 자동 팝업 - CreatorLayout의 overflow-hidden 바깥에서 렌더링 */}
      <CampaignPolicyModal
        isOpen={showPolicyPopup}
        onClose={() => setShowPolicyPopup(false)}
        autoMode={true}
      />
    </>
  )
}

export default HomePage
