import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaUser, 
  FaTags, 
  FaBullhorn, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaLock
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const CompanyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  // 네비게이션 메뉴 항목
  const navItems = [
    { name: '대시보드', path: '/company', icon: <FaHome className="w-5 h-5" /> },
    { name: '캠페인 관리', path: '/company/campaigns', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: '브랜드 관리', path: '/company/brands', icon: <FaTags className="w-5 h-5" /> },
    { name: '회사 정보 관리', path: '/company/profile', icon: <FaUser className="w-5 h-5" /> },
    { name: '비밀번호 변경', path: '/company/change-password', icon: <FaLock className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 (데스크톱) */}
      <div 
        className={`bg-white shadow-lg ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden md:block transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* 로고 */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {sidebarOpen ? (
              <Link to="/company" className="text-xl font-bold text-blue-600">
                CNEC 기업 관리
              </Link>
            ) : (
              <Link to="/company" className="text-xl font-bold text-blue-600">
                CNEC
              </Link>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-200 focus:outline-none"
            >
              {sidebarOpen ? (
                <FaChevronLeft className="w-5 h-5 text-gray-500" />
              ) : (
                <FaChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/company'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <div className="flex items-center">
                  {item.icon}
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                </div>
              </NavLink>
            ))}
            
            {/* 로그아웃 버튼 */}
            {sidebarOpen ? (
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="ml-3">로그아웃</span>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt className="w-5 h-5" />
              </button>
            )}
          </nav>

          {/* 사용자 정보 */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.email || '사용자'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleMobileMenu}
          ></div>

          {/* 사이드바 내용 */}
          <div className="relative flex flex-col w-full max-w-xs h-full bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link to="/company" className="text-xl font-bold text-blue-600">
                CNEC 기업 관리
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="p-1 rounded-md hover:bg-gray-200 focus:outline-none"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/company'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </div>
                </NavLink>
              ))}
              
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="ml-3">로그아웃</span>
              </button>
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.email || '사용자'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 상단 헤더 */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                <FaBars className="w-6 h-6" />
              </button>

              {/* 페이지 제목 */}
              <h1 className="text-lg font-semibold text-gray-900">
                {navItems.find((item) => 
                  location.pathname === item.path || 
                  (item.path !== '/company' && location.pathname.startsWith(item.path))
                )?.name || '기업 관리자'}
              </h1>

              {/* 우측 메뉴 */}
              <div className="flex items-center">
                <Link
                  to="/"
                  className="text-blue-600 hover:underline"
                >
                  메인 페이지로 이동
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;
