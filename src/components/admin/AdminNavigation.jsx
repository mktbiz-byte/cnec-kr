import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { 
  Home,
  Award, 
  FileText, 
  Users, 
  CreditCard, 
  Settings, 
  Mail,
  BarChart3,
  Menu,
  X
} from 'lucide-react'

const AdminNavigation = () => {
  const { language } = useLanguage()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 다국어 텍스트
  const texts = {
    ko: {
      dashboard: '대시보드',
      campaigns: '캠페인 관리',
      applications: '신청서 관리',
      confirmedCreators: '확정 크리에이터',
      snsUploads: 'SNS 업로드',
      users: '사용자 승인',
      withdrawals: '출금 관리',
      emailTemplates: '이메일 템플릿',
      statistics: '통계 분석',
      settings: '시스템 설정'
    },
    ja: {
      dashboard: '대시보드',
      campaigns: '캠페인 관리',
      applications: '申請書管理',
      confirmedCreators: '확정 크리에이터',
      snsUploads: 'SNS 업로드',
      users: '사용자 승인',
      withdrawals: '출금 관리',
      emailTemplates: '이메일 템플릿',
      statistics: '統計分析',
      settings: 'システム설정'
    }
  }

  const t = texts[language] || texts.ko

  // 네비게이션 메뉴 항목들
  const navigationItems = [
    {
      path: '/dashboard',
      label: t.dashboard,
      icon: Home,
      exact: true
    },
    {
      path: '/campaigns-manage',
      label: t.campaigns,
      icon: Award
    },
    {
      path: '/applications-manage',
      label: t.applications,
      icon: FileText
    },
    {
      path: '/confirmed-creators',
      label: t.confirmedCreators,
      icon: Users
    },
    {
      path: '/sns-uploads',
      label: t.snsUploads,
      icon: BarChart3
    },
    {
      path: '/user-approval',
      label: t.users,
      icon: Users
    },
    {
      path: '/withdrawals-manage',
      label: t.withdrawals,
      icon: CreditCard
    },
    {
      path: '/email-templates',
      label: t.emailTemplates,
      icon: Mail
    },
    {
      path: '/system-settings',
      label: t.settings,
      icon: Settings
    }
  ]

  // 현재 경로가 활성 상태인지 확인
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex md:space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              
              if (item.disabled) {
                return (
                  <div
                    key={item.path}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </div>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 네비게이션 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              
              if (item.disabled) {
                return (
                  <div
                    key={item.path}
                    className="flex items-center pl-3 pr-4 py-2 text-base font-medium text-gray-400 cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                    active
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

export default AdminNavigation
