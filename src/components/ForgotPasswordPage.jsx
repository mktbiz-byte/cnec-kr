import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('이메일을 입력해주세요.')
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await resetPassword(email)
      setSuccess(true)
    } catch (error) {
      console.error('Password reset error:', error)

      // 에러 메시지 번역
      let errorMessage = error.message
      if (error.message.includes('User not found')) {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                이메일을 확인해주세요
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                비밀번호 재설정 링크를 보냈습니다
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
                  이메일을 확인하고 링크를 클릭하여 새 비밀번호를 설정해주세요.
                </p>
              </div>

              <div className="text-sm text-gray-500 space-y-2">
                <p>이메일이 오지 않나요?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>스팸 메일함을 확인해주세요</li>
                  <li>이메일 주소가 정확한지 확인해주세요</li>
                  <li>몇 분 정도 기다려주세요</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="w-full"
                >
                  다른 이메일로 다시 시도
                </Button>

                <Link to="/login" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    로그인 페이지로 돌아가기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 bg-green-100 border-green-300 hover:bg-green-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            로그인으로 돌아가기
          </Button>
        </div>

        {/* 비밀번호 찾기 카드 */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="text-4xl mb-4">🔐</div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              비밀번호 찾기
            </CardTitle>
            <CardDescription className="text-gray-600">
              가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-orange-600 font-medium">
                  이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="가입한 이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                비밀번호 재설정 링크 받기
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">
                비밀번호가 기억나셨나요?
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

export default ForgotPasswordPage
