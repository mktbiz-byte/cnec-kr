import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const AuthCallbackSafe = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback started')
        
        // URL 파라미터에서 인증 정보 확인
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          setStatus('error')
          setMessage('로그인 중 오류가 발생했습니다: ' + (errorDescription || error))
          return
        }

        // Supabase에서 세션 확인
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('세션 가져오기 중 오류가 발생했습니다')
            return
          }

          if (sessionData?.session) {
            console.log('Session found:', sessionData.session.user.email)
            setStatus('success')
            setMessage('로그인이 완료되었습니다.')
            
            // admin_users 테이블에서 관리자 여부 확인
            const userId = sessionData.session.user.id
            const { data: adminData, error: adminError } = await supabase
              .from('admin_users')
              .select('user_id')
              .eq('user_id', userId)
              .maybeSingle()
            
            const isAdmin = !adminError && adminData !== null
            
            setTimeout(() => {
              if (isAdmin) {
                console.log('Admin user - redirecting to /dashboard')
                navigate('/dashboard', { replace: true })
              } else {
                console.log('Regular user - redirecting to /mypage')
                navigate('/mypage', { replace: true })
              }
            }, 1500)
          } else {
            console.log('No session found, checking URL hash')
            
            // URL 해시에서 토큰 확인 (OAuth 리다이렉트 후)
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const hashAccessToken = hashParams.get('access_token')
            
            if (hashAccessToken) {
              console.log('Found access token in hash')
              setStatus('success')
              setMessage('로그인이 완료되었습니다.')
              
              // 관리자 여부 확인을 위해 세션 재확인
              setTimeout(async () => {
                try {
                  const { data: newSession } = await supabase.auth.getSession()
                  if (newSession?.session) {
                    const userId = newSession.session.user.id
                    const { data: adminData, error: adminError } = await supabase
                      .from('admin_users')
                      .select('user_id')
                      .eq('user_id', userId)
                      .maybeSingle()
                    
                    const isAdmin = !adminError && adminData !== null
                    
                    if (isAdmin) {
                      console.log('Admin user - redirecting to /dashboard')
                      navigate('/dashboard', { replace: true })
                    } else {
                      console.log('Regular user - redirecting to /mypage')
                      navigate('/mypage', { replace: true })
                    }
                  } else {
                    navigate('/mypage', { replace: true })
                  }
                } catch (error) {
                  console.error('Session recheck error:', error)
                  navigate('/mypage', { replace: true })
                }
              }, 1500)
            } else {
              console.log('No authentication data found')
              setStatus('error')
              setMessage('인증 정보를 찾을 수 없습니다. 다시 로그인해 주세요.')
            }
          }
        } catch (sessionError) {
          console.error('Session check error:', sessionError)
          setStatus('error')
          setMessage('세션 확인 중 오류가 발생했습니다')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('로그인 처리 중 예기치 않은 오류가 발생했습니다')
      }
    }

    // 컴포넌트 마운트 시 인증 콜백 처리
    handleAuthCallback()
  }, [navigate])

  // 이미 로그인된 사용자는 마이페이지로 리다이렉트
  useEffect(() => {
    if (user && status === 'loading') {
      console.log('User already logged in, redirecting to mypage')
      navigate('/mypage', { replace: true })
    }
  }, [user, status, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                로그인 처리 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려 주세요.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                로그인 성공!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                로그인 실패
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  다시 로그인
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthCallbackSafe

