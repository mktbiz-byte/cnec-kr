import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

const LoginPage = () => {
  const { signInWithEmail, signInWithGoogle, loading } = useAuth()
  const { language } = useLanguage()
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
      setError(language === 'ko' ? '이메일과 비밀번호를 입력해주세요.' : 'メールアドレスとパスワードを入力してください。')
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
        errorMessage = language === 'ko' 
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : 'メールアドレスまたはパスワードが正しくありません。'
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
      setError(language === 'ko' 
        ? '구글 로그인에 실패했습니다. 다시 시도해주세요.'
        : 'Googleログインに失敗しました。再度お試しください。'
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ko' ? '홈으로 돌아가기' : 'ホームに戻る'}
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">🎬</div>
            <CardTitle className="text-2xl font-bold">
              로그인
            </CardTitle>
            <CardDescription>
              CNEC Korea에 가입하고 캠페인에 참여하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">


            {/* 구글 로그인 */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || loading}
              className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {language === 'ko' ? 'Google로 로그인' : 'Googleでログイン'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {language === 'ko' ? '또는' : 'または'}
                </span>
              </div>
            </div>

            {/* 이메일 로그인 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'ko' ? '이메일' : 'メールアドレス'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={language === 'ko' ? '이메일을 입력하세요' : 'メールアドレスを入力してください'}
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'ko' ? '비밀번호' : 'パスワード'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={language === 'ko' ? '비밀번호를 입력하세요' : 'パスワードを入力してください'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
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
                disabled={isLoading || loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {language === 'ko' ? '로그인' : 'ログイン'}
              </Button>
            </form>

            {/* 회원가입 링크 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">
                {language === 'ko' ? '계정이 없으신가요?' : 'アカウントをお持ちでないですか？'}
              </span>{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                {language === 'ko' ? '회원가입' : '新規登録'}
              </Link>
            </div>


          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
