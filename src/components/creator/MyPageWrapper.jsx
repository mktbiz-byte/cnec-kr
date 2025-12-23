import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CreatorLayout from './CreatorLayout'
import CreatorMyPage from './CreatorMyPage'
import { Loader2 } from 'lucide-react'

const MyPageWrapper = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // 로그인 체크
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-md bg-white min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <CreatorLayout>
      <CreatorMyPage />
    </CreatorLayout>
  )
}

export default MyPageWrapper
