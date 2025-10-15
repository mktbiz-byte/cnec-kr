import { Outlet } from 'react-router-dom'
import CompanySidebar from '../common/CompanySidebar'
import Header from '../common/Header'
import Footer from '../common/Footer'

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
      <Footer />
    </div>
  )
}

export default CompanyLayout
