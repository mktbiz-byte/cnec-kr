import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CompanyLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">CNEC 기업 관리</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/company"
                end
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                대시보드
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/company/campaigns"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                캠페인 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/company/brands"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                브랜드 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/company/profile"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                회사 정보 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/company/change-password"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                비밀번호 변경
              </NavLink>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="block w-full text-left p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1">
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-end">
            <NavLink to="/" className="text-blue-600 hover:underline">
              메인 페이지로 이동
            </NavLink>
          </div>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;
