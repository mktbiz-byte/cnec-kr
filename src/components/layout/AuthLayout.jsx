import { Outlet } from 'react-router-dom'
import Header from '../common/Header'

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <Header minimal={true} />
      <main className="auth-container">
        <div className="auth-card">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
