import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CreatorLayout from './CreatorLayout'
import CreatorHome from './CreatorHome'
import CreatorSearch from './CreatorSearch'
import CreatorMyPage from './CreatorMyPage'
import CampaignDetailModal from './CampaignDetailModal'
import { Loader2 } from 'lucide-react'

const CreatorApp = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('home')
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign)
    setShowCampaignModal(true)
  }

  const handleCampaignModalClose = () => {
    setShowCampaignModal(false)
    setSelectedCampaign(null)
  }

  const handleApplySuccess = () => {
    // 지원 성공 후 데이터 새로고침
    setRefreshKey(prev => prev + 1)
  }

  const handleViewAllCampaigns = (tab) => {
    if (tab) {
      setActiveTab(tab)
    }
  }

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
      <CreatorLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'home' && (
          <CreatorHome
            key={`home-${refreshKey}`}
            onCampaignClick={handleCampaignClick}
            onViewAllCampaigns={handleViewAllCampaigns}
          />
        )}

        {activeTab === 'search' && (
          <CreatorSearch
            key={`search-${refreshKey}`}
            onCampaignClick={handleCampaignClick}
          />
        )}

        {activeTab === 'my' && (
          <CreatorMyPage
            key={`my-${refreshKey}`}
          />
        )}
      </CreatorLayout>

      {/* 캠페인 상세 모달 */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={showCampaignModal}
        onClose={handleCampaignModalClose}
        onApplySuccess={handleApplySuccess}
      />
    </>
  )
}

export default CreatorApp
