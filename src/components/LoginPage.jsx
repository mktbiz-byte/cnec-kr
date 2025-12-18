import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import cnecLogo from '../assets/cnec-logo-final.png'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

const LoginPage = () => {
  const { signInWithEmail, signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 로그인 후 리다이렉트할 경로
  const from = location.state?.from?.pathname || '/'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await signInWithEmail(formData.email, formData.password)

      // 로그인 성공 시 리다이렉트
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)

      // 에러 메시지 번역
      let errorMessage = error.message
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 필요합니다. 메일을 확인해주세요.'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError('')

      await signInWithGoogle()
      // 구글 로그인은 리다이렉트되므로 여기서 navigate 하지 않음
    } catch (error) {
      console.error('Google login error:', error)
      setError('구글 로그인에 실패했습니다. 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <img src={cnecLogo} alt="CNEC" className="h-6 mx-auto" />
          <div className="w-8"></div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-5 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
          <p className="text-sm text-gray-500">CNEC에 가입하고 캠페인에 참여하세요</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          {/* 구글 로그인 */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || loading}
            className="w-full py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 로그인
          </button>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">또는</span>
            </div>
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력하세요"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              로그인
            </button>
          </form>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500">계정이 없으신가요? </span>
          <Link to="/signup" className="text-sm text-purple-600 font-medium hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
