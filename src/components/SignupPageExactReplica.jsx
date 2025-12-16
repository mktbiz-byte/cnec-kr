import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react'

const SignupPageExactReplica = () => {
  const { signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showBrowserWarning, setShowBrowserWarning] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  // iPhone 브라우저 감지
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const isIPhone = /iPhone/i.test(userAgent)
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent) && !/CriOS/i.test(userAgent)
    const isChrome = /CriOS/i.test(userAgent)
    
    // iPhone에서 Safari나 Chrome이 아닌 브라우저를 사용하는 경우
    if (isIPhone && !isSafari && !isChrome) {
      setShowBrowserWarning(true)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
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

      await signUpWithEmail(formData.email, formData.password, formData.name)
      
      setSuccess(true)
    } catch (error) {
      console.error('Signup error:', error)

      if (error.message.includes('already registered')) {
        setError('이미 가입된 이메일입니다.')
      } else if (error.message.includes('weak password')) {
        setError('비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }


  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-xl p-8">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            이메일 확인이 필요합니다
          </h2>          <p className="text-gray-600 mb-6">
            회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              로그인 페이지로
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 - 참조 사이트와 동일한 스타일 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 bg-green-100 border-green-300 hover:bg-green-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="text-4xl mb-4">🎬</div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              회원가입
            </CardTitle>
            <CardDescription className="text-gray-600">
              CNEC Korea에 가입하고 캠페인에 참여하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* iPhone 브라우저 경고 */}
            {showBrowserWarning && (
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertDescription className="text-yellow-800">
                  <strong>⚠️ 브라우저 호환성 경고</strong>
                  <p className="mt-1 text-sm">
                    iPhone에서 회원가입 문제가 발생할 수 있습니다. Safari 또는 Chrome 브라우저를 사용해 주세요.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            {/* 이메일 회원가입 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-600 font-medium">
                  이름
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="이름을 입력하세요"
                    className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-orange-600 font-medium">
                  이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="이메일을 입력하세요"
                    className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-600 font-medium">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호을 입력하세요"
                    className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-600 font-medium">
                  비밀번호확인
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="비밀번호을 다시 입력하세요"
                    className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                회원가입
              </Button>
            </form>

            {/* 로그인 링크 - 참조 사이트와 동일 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">
                이미 계정이 있으신가요?
              </span>{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-medium underline">
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SignupPageExactReplica
