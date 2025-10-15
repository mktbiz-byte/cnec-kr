import { NavLink } from 'react-router-dom'

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h3>관리자 메뉴</h3>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/admin" 
              end
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              대시보드
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/companies" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              기업 관리
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              사용자 관리
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/approvals" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              기업 회원 승인
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default AdminSidebar
