import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { 
  Home, LogOut, Globe, User, Settings,
  ChevronDown, Menu, X
} from 'lucide-react'

const AdminHeader = ({ title, subtitle }) => {
  const { user, signOut } = useAuth()
  const { language, changeLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 다국어 텍스트
  const texts = {
    ko: {
      adminDashboard: 'CNEC 관리자 대시보드',
      language: '언어',
      korean: '한국어',
      japanese: '日本語',
      backToSite: '사이트로 돌아가기',
      logout: '로그아웃',
      menu: '메뉴',
      dashboard: '대시보드',
      campaigns: '캠페인 관리',
      applications: '신청서 관리',
      users: '사용자 승인',
      withdrawals: '출금 관리',
      emailTemplates: '이메일 템플릿',
      confirmedCreators: '확정 크리에이터',
      snsUploads: 'SNS 업로드'
    },
    ja: {
      adminDashboard: 'CNEC 관리자대시보드',
      language: '言語',
      korean: '한국어',
      japanese: '日本語',
      backToSite: 'サイトに돌아가기',
      logout: '로그아웃',
      menu: 'メニュー',
      dashboard: '대시보드',
      campaigns: '캠페인 관리',
      applications: '지원 관리',
      users: '사용자 승인',
      withdrawals: '출금 관리',
      emailTemplates: '이메일 템플릿',
      confirmedCreators: '확정 크리에이터',
      snsUploads: 'SNS 업로드'
    }
  }

  const currentTexts = texts[language] || texts.ja

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: currentTexts.dashboard, icon: Home },
    { path: '/campaigns-manage', label: currentTexts.campaigns, icon: Settings },
    { path: '/applications-manage', label: currentTexts.applications, icon: User },
    { path: '/user-approval', label: currentTexts.users, icon: User },
    { path: '/withdrawals-manage', label: currentTexts.withdrawals, icon: Settings },
    { path: '/email-templates', label: currentTexts.emailTemplates, icon: Settings },
    { path: '/confirmed-creators', label: currentTexts.confirmedCreators, icon: User },
    { path: '/sns-uploads', label: currentTexts.snsUploads, icon: Settings }
  ]

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 제목 */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {currentTexts.adminDashboard}
              </span>
            </Link>
            
            {title && (
              <div className="hidden md:block">
                <span className="text-gray-400">|</span>
                <span className="ml-4 text-lg font-medium text-gray-700">{title}</span>
                {subtitle && (
                  <span className="ml-2 text-sm text-gray-500">{subtitle}</span>
                )}
              </div>
            )}
          </div>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            {/* 언어 선택 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{currentTexts.language}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => changeLanguage('ko')}
                  className={language === 'ko' ? 'bg-purple-50' : ''}
                >
                  {currentTexts.korean}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => changeLanguage('ja')}
                  className={language === 'ja' ? 'bg-purple-50' : ''}
                >
                  {currentTexts.japanese}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 사용자 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>{currentTexts.backToSite}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {currentTexts.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* 네비게이션 메뉴 */}
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {/* 언어 선택 */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-700 mb-2">{currentTexts.language}</div>
                <div className="flex space-x-2">
                  <Button
                    variant={language === 'ko' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeLanguage('ko')}
                  >
                    {currentTexts.korean}
                  </Button>
                  <Button
                    variant={language === 'ja' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeLanguage('ja')}
                  >
                    {currentTexts.japanese}
                  </Button>
                </div>
              </div>
              
              {/* 사용자 정보 */}
              <div className="px-3 py-2 border-t">
                <div className="text-sm text-gray-500 mb-2">{user?.email}</div>
                <div className="flex space-x-2">
                  <Link to="/">
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Home className="h-3 w-3" />
                      <span>{currentTexts.backToSite}</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>{currentTexts.logout}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default AdminHeader
