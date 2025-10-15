import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaChartBar, 
  FaUsers, 
  FaGlobe, 
  FaFileInvoiceDollar, 
  FaCog, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaSearch,
  FaCheckCircle,
  FaFileInvoice,
  FaLayerGroup
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // 검색 기능 구현
    console.log('검색어:', searchQuery);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/admin-login');
  };

  // 네비게이션 메뉴 항목
  const navItems = [
    { name: '대시보드', path: '/admin', icon: <FaHome className="w-5 h-5" /> },
    { name: '기업 승인 관리', path: '/admin/approvals', icon: <FaCheckCircle className="w-5 h-5" /> },
    { name: '기업 관리', path: '/admin/companies', icon: <FaUsers className="w-5 h-5" /> },
    { name: '사용자 관리', path: '/admin/users', icon: <FaUsers className="w-5 h-5" /> },
    { name: '통합 캠페인 관리', path: '/admin/campaigns', icon: <FaLayerGroup className="w-5 h-5" /> },
    { name: '매출 보고서', path: '/admin/sales', icon: <FaChartBar className="w-5 h-5" /> },
    { name: '세금계산서 관리', path: '/admin/invoices', icon: <FaFileInvoice className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-purple-600 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 로고 및 타이틀 */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center">
                  <span className="text-purple-600 text-xl font-bold">C</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold">CNEC Admin Hub</h1>
                <p className="text-xs text-purple-200">통합 관리자 시스템</p>
              </div>
            </div>

            {/* 우측 메뉴 */}
            <div className="flex items-center">
              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-white hover:bg-purple-700 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="w-6 h-6" />
                ) : (
                  <FaBars className="w-6 h-6" />
                )}
              </button>

              {/* 사용자 정보 */}
              <div className="hidden md:flex items-center ml-4">
                <div className="relative">
                  <button className="flex items-center text-sm focus:outline-none">
                    <span className="mr-2">{user?.email || '관리자'}</span>
                    <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 검색 바 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
              <input
                type="text"
                placeholder="채널 검색"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full py-2 px-4 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white p-2 px-4 hover:bg-purple-700 focus:outline-none"
              >
                <FaSearch />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-2">
              YouTube 채널 ID 또는 핸들을 입력하세요 (예: @channelname 또는 UC5v_MCY6GNUBTO8-D3XoAg)
            </p>
          </form>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md ${
                          isActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <span className="mr-3"><FaSignOutAlt /></span>
                    로그아웃
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row">
          {/* 사이드바 (데스크톱) */}
          <div className="hidden md:block w-64 mr-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-md ${
                            isActive
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="border-t p-4">
                <Link
                  to="/"
                  className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 mb-2"
                >
                  <span className="mr-3"><FaGlobe /></span>
                  메인 페이지로 이동
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3"><FaSignOutAlt /></span>
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 페이지 콘텐츠 */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6 mt-4 md:mt-0">
            <Outlet />
          </div>
        </div>
      </div>

      {/* 하단 탭 네비게이션 (모바일) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`
              }
            >
              <div className="text-lg">{item.icon}</div>
              <span className="text-xs mt-1">{item.name.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
