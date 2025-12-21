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
        <header className="bg-white px-6 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-extrabold text-purple-600 tracking-tighter hover:opacity-80 transition-opacity"
          >
            C·NEC <span className="text-xs text-gray-400 font-normal ml-1">Creator</span>
          </button>

          <div className="flex items-center gap-4">
            {/* 알림 버튼 */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="text-gray-400" size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* 프로필 버튼 - /profile로 이동 */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm hover:bg-purple-200 transition-colors"
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-30">
          <div className="flex justify-between items-center py-3 px-8 pb-6">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'home' ? 'text-gray-900' : 'text-gray-300'
              }`}
            >
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">홈</span>
            </button>

            <button
              onClick={() => handleTabChange('search')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'search' ? 'text-gray-900' : 'text-gray-300'
              }`}
            >
              <Search size={24} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">캠페인</span>
            </button>

            <button
              onClick={() => handleTabChange('my')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'my' ? 'text-purple-600' : 'text-gray-300'
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
