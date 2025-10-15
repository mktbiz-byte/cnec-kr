import { Outlet } from 'react-router-dom'
import AdminSidebar from '../common/AdminSidebar'
import Header from '../common/Header'

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Header isAdmin={true} />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
