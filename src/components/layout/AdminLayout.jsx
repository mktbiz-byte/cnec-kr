import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/auth/admin-login');
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">CNEC 관리자</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`
                }
              >
                대시보드
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/approvals"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`
                }
              >
                기업 승인 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/companies"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`
                }
              >
                기업 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`
                }
              >
                사용자 관리
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/sales"
                className={({ isActive }) =>
                  `block p-2 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`
                }
              >
                매출 보고서
              </NavLink>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="block w-full text-left p-2 rounded-md hover:bg-gray-700"
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

export default AdminLayout;
