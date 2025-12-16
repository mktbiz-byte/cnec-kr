import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle, ArrowLeft } from 'lucide-react'

const ResetPasswordPage = () => {
  const { updatePassword, user } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(true)

  useEffect(() => {
    // URL에서 해시 파라미터 확인 (Supabase 리다이렉트 후)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    // recovery 타입이 아니거나 토큰이 없으면 유효하지 않은 세션
    if (!accessToken && !user) {
      setIsValidSession(false)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await updatePassword(password)
      setSuccess(true)

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error('Password update error:', error)

      let errorMessage = error.message
      if (error.message.includes('same_password')) {
        errorMessage = '이전과 동일한 비밀번호는 사용할 수 없습니다.'
      } else if (error.message.includes('weak_password')) {
        errorMessage = '비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 유효하지 않은 세션
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <div className="text-4xl mb-4">⚠️</div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                유효하지 않은 링크
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                새로운 비밀번호 재설정 링크를 요청해주세요.
              </p>

              <div className="flex flex-col gap-3">
                <Link to="/forgot-password" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    비밀번호 재설정 다시 요청
                  </Button>
                </Link>

                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    로그인 페이지로 이동
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
                비밀번호 변경 완료
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                비밀번호가 성공적으로 변경되었습니다.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                잠시 후 로그인 페이지로 이동합니다...
              </p>

              <Link to="/login" className="w-full block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  지금 로그인하기
                </Button>
              </Link>
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

        {/* 비밀번호 재설정 카드 */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="text-4xl mb-4">🔑</div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              새 비밀번호 설정
            </CardTitle>
            <CardDescription className="text-gray-600">
              새로운 비밀번호를 입력해주세요.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-600 font-medium">
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="새 비밀번호 (최소 6자)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-green-600 font-medium">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                비밀번호 변경하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
