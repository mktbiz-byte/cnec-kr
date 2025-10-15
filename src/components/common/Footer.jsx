import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-logo">
          <Link to="/">CNEC</Link>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h3>회사 정보</h3>
            <ul>
              <li><Link to="/about">회사 소개</Link></li>
              <li><Link to="/contact">문의하기</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>이용 안내</h3>
            <ul>
              <li><Link to="/terms">이용약관</Link></li>
              <li><Link to="/privacy">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} CNEC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
