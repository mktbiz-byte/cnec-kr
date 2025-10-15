import { Outlet } from 'react-router-dom'
import CompanySidebar from '../common/CompanySidebar'
import Header from '../common/Header'

const CompanyLayout = () => {
  return (
    <div className="company-layout">
      <Header isCompany={true} />
      <div className="company-container">
        <CompanySidebar />
        <main className="company-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CompanyLayout
