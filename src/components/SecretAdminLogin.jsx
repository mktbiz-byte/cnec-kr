import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react'

const SecretAdminLogin = () => {
  const { signInWithEmail, signInWithGoogle, user, loading } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 관리자 권한이 있는 사용자만 관리자 페이지로 리다이렉트
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (user) {
        try {
          // 사용자 프로필에서 관리자 권한 확인
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()
          
          console.log('사용자 프로필 확인:', profile)
          
          // 관리자 또는 매니저 권한이 있는 경우에만 리다이렉트
          if (profile?.role === 'admin' || profile?.role === 'manager') {
            console.log('관리자 권한 확인됨, 관리자 페이지로 이동')
            navigate('/dashboard')
          } else {
            console.log('관리자 권한 없음:', profile?.role)
          }
        } catch (error) {
          console.error('Admin access check error:', error)
        }
      }
    }
    
    checkAdminAccess()
  }, [user, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      await signInWithGoogle()
      
      // Google 로그인 성공 시 관리자 페이지로 이동
      navigate('/dashboard')
      
    } catch (error) {
      console.error('Google admin login error:', error)
      setError('Google 로그인에 실패했습니다. 관리자 계정으로 로그인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      const result = await signInWithEmail(formData.email, formData.password)
      console.log('로그인 결과:', result)
      
      // 로그인 성공 시 잠시 대기 후 관리자 페이지로 이동
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
      
    } catch (error) {
      console.error('Admin login error:', error)
      setError('로그인에 실패했습니다. 관리자 계정 정보를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-md">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-purple-300" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              관리자 인증
            </CardTitle>
            <CardDescription className="text-purple-200">
              CNEC 플랫폼 관리자 전용 로그인
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-200">
                  관리자 이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@cnec.test"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/10 border-purple-300/30 text-white placeholder:text-purple-200/60 focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200">
                  관리자 비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/10 border-purple-300/30 text-white placeholder:text-purple-200/60 focus:border-purple-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-purple-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-400/30">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                관리자 로그인
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-300/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-purple-200">또는</span>
              </div>
            </div>

            {/* Google 로그인 */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || loading}
              variant="outline"
              className="w-full bg-white/10 border-purple-300/30 text-white hover:bg-white/20"
              size="lg"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleで관리자ログイン
            </Button>

            {/* 보안 경고 */}
            <div className="text-center text-xs text-purple-300/60">
              <p>이 페이지는 관리자 전용입니다.</p>
              <p>무단 접근 시 법적 책임을 질 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SecretAdminLogin
