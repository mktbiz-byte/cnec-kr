import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Search, User, Bell, Menu, X } from 'lucide-react'
import cnecLogo from '../../assets/cnec-logo-final.png'

const CreatorLayout = ({ children, activeTab, onTabChange }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [userInitial, setUserInitial] = useState('C')

  useEffect(() => {
    // 사용자 이니셜 설정
    if (user?.user_metadata?.name) {
      setUserInitial(user.user_metadata.name.charAt(0).toUpperCase())
    } else if (user?.email) {
      setUserInitial(user.email.charAt(0).toUpperCase())
    }
  }, [user])

  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden">

        {/* Header */}
        <header className="bg-white px-5 py-4 sticky top-0 z-30 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src={cnecLogo} alt="CNEC" className="h-7" />
            <span className="text-xs text-gray-400 font-medium">Creator</span>
          </div>

          <div className="flex items-center gap-3">
            {/* 알림 버튼 */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Bell className="text-gray-400" size={22} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* 프로필 버튼 */}
            <button
              onClick={() => handleTabChange('my')}
              className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            >
              {userInitial}
            </button>
          </div>
        </header>

        {/* 알림 드롭다운 */}
        {showNotifications && (
          <div className="absolute top-16 right-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">알림</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  새로운 알림이 없습니다
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="p-4 border-b border-gray-50 hover:bg-gray-50">
                    <p className="text-sm text-gray-700">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="pb-24 min-h-[calc(100vh-140px)]">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-30 safe-area-bottom">
          <div className="flex justify-around items-center py-2 px-6 pb-6">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">홈</span>
            </button>

            <button
              onClick={() => handleTabChange('search')}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'search'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">캠페인</span>
            </button>

            <button
              onClick={() => handleTabChange('my')}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'my'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User size={24} strokeWidth={activeTab === 'my' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">마이</span>
            </button>
          </div>
        </nav>

        {/* 알림 오버레이 클릭 시 닫기 */}
        {showNotifications && (
          <div
            className="fixed inset-0 z-35"
            onClick={() => setShowNotifications(false)}
          />
        )}
      </div>
    </div>
  )
}

export default CreatorLayout
