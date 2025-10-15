import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Header = ({ minimal = false, isAdmin = false, isCompany = false }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">
            <h1>CNEC</h1>
          </Link>
        </div>

        {!minimal && (
          <nav className="main-nav">
            <ul>
              <li>
                <Link to="/">홈</Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin">관리자 대시보드</Link>
                </li>
              )}
              {isCompany && (
                <li>
                  <Link to="/company">기업 대시보드</Link>
                </li>
              )}
            </ul>
          </nav>
        )}

        <div className="auth-nav">
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.email}</span>
              <button onClick={handleLogout} className="btn-logout">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                로그인
              </Link>
              <Link to="/register" className="btn-register">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
