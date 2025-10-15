import { NavLink } from 'react-router-dom'

const CompanySidebar = () => {
  return (
    <aside className="company-sidebar">
      <div className="sidebar-header">
        <h3>기업 메뉴</h3>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/company" 
              end
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              대시보드
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/company/profile" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              기업 정보
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default CompanySidebar
