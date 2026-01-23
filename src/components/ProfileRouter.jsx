/**
 * ProfileRouter - 프로필 완료 여부에 따라 적절한 페이지로 라우팅
 * - 프로필 미완성: ProfileSettingsTest (프로필 설정 페이지)
 * - 프로필 100% 완성: ProfileViewTest (프로필 뷰 페이지)
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Loader2 } from 'lucide-react'
import ProfileSettingsTest from './ProfileSettingsTest'
import ProfileViewTest from './ProfileViewTest'

const ProfileRouter = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  useEffect(() => {
    if (user) {
      checkProfileCompletion()
    }
  }, [user])

  const checkProfileCompletion = async () => {
    try {
      setLoading(true)
      const data = await database.userProfiles.get(user.id)

      if (!data) {
        setIsProfileComplete(false)
        setLoading(false)
        return
      }

      // 프로필 완료 조건 체크 (모든 필수 단계 완료)
      const basicComplete = data.name && data.phone && data.profile_image
      const beautyComplete = data.skin_type && data.skin_concerns?.length > 0 &&
                            data.hair_type && data.hair_concerns?.length > 0
      // SNS: URL 미입력 시 자동으로 채널 없음 처리
      const snsComplete = true
      const videoComplete = !!data.video_length_style
      const detailComplete = !!data.gender

      const allComplete = basicComplete && beautyComplete && snsComplete && videoComplete && detailComplete
      setIsProfileComplete(allComplete)
    } catch (error) {
      console.error('프로필 체크 오류:', error)
      setIsProfileComplete(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // 프로필 완성 여부에 따라 다른 컴포넌트 렌더링
  return isProfileComplete ? <ProfileViewTest /> : <ProfileSettingsTest />
}

export default ProfileRouter
