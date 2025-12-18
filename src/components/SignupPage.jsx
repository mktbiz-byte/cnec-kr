import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import cnecLogo from '../assets/cnec-logo-final.png'
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react'

const SignupPage = () => {
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return '모든 필드를 입력해주세요.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return '올바른 이메일 형식을 입력해주세요.'
    }

    if (formData.password.length < 6) {
      return '비밀번호는 6자 이상이어야 합니다.'
    }

    if (formData.password !== formData.confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError('')

      await signUpWithEmail(formData.email, formData.password, {
        name: formData.name
      })

      setSuccess(true)
    } catch (error) {
      console.error('Signup error:', error)

      if (error.message.includes('already registered')) {
        setError('이미 등록된 이메일입니다.')
      } else if (error.message.includes('weak password')) {
        setError('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      setError('')

      await signInWithGoogle()
    } catch (error) {
      console.error('Google signup error:', error)
      setError('Google 회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-center">
            <img src={cnecLogo} alt="CNEC" className="h-6" />
          </div>
        </header>

        <div className="flex-1 max-w-md mx-auto w-full px-5 py-8 flex items-center">
          <div className="w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">이메일 확인이 필요합니다</h2>
            <p className="text-sm text-gray-500 mb-6">
              회원가입이 완료되었습니다!<br />이메일을 확인하여 계정을 활성화해주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
              >
                로그인 페이지로
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-sm text-gray-500">CNEC에 가입하고 캠페인에 참여하세요</p>
        </div>

        {/* 회원가입 카드 */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          {/* 구글 회원가입 */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 회원가입
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

          {/* 이메일 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력하세요"
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
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              회원가입
            </button>
          </form>
        </div>

        {/* 로그인 링크 */}
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
          <Link to="/login" className="text-sm text-purple-600 font-medium hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
