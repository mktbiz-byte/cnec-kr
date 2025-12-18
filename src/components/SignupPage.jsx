import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import cnecLogo from '../assets/cnec-logo-final.png'
import { Loader2, Mail, Lock, User, ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

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
    setFormData(prev => ({ ...prev, [name]: value }))
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
      await signUpWithEmail(formData.email, formData.password, { name: formData.name })
      setSuccess(true)
    } catch (error) {
      console.error('Signup error:', error)
      if (error.message.includes('already registered')) {
        setError('이미 등록된 이메일입니다.')
      } else if (error.message.includes('weak password')) {
        setError('비밀번호가 너무 약합니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다.')
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 flex flex-col">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="flex-1 relative z-10 flex items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">환영합니다!</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                이메일 인증 링크를 보내드렸어요.<br />
                메일함을 확인해주세요!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  로그인하러 가기
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 py-4">
        <div className="max-w-md mx-auto flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative z-10 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-sm font-medium text-white/90">뷰티 크리에이터 플랫폼</span>
            </div>
            <img src={cnecLogo} alt="CNEC" className="h-8 mx-auto mb-4 brightness-0 invert opacity-90" />
            <h1 className="text-2xl font-black text-white mb-2">크리에이터로 시작하기</h1>
            <p className="text-sm text-white/60">가입하고 브랜드와 협업하세요</p>
          </div>

          {/* Signup Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            {/* Google Signup */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-200 transition-all disabled:opacity-50 shadow-sm"
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
              Google로 시작하기
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400 font-medium">또는 이메일로 가입</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="6자 이상 입력"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="비밀번호 재입력"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                회원가입
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Terms */}
            <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
              가입 시 <a href="#" className="text-purple-600 hover:underline">이용약관</a> 및{' '}
              <a href="#" className="text-purple-600 hover:underline">개인정보처리방침</a>에 동의합니다.
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <span className="text-sm text-white/60">이미 계정이 있으신가요? </span>
            <Link to="/login" className="text-sm text-white font-bold hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
