import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Bell, Mail, MessageSquare, Loader2 } from 'lucide-react'

const NotificationSettings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState({
    sms_notifications: true,
    kakao_notifications: true,
    email_notifications: true,
    marketing_notifications: false
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('sms_notifications, kakao_notifications, email_notifications, marketing_notifications')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setSettings({
          sms_notifications: data.sms_notifications ?? true,
          kakao_notifications: data.kakao_notifications ?? true,
          email_notifications: data.email_notifications ?? true,
          marketing_notifications: data.marketing_notifications ?? false
        })
      }
    } catch (error) {
      console.error('알림 설정 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key) => {
    const newValue = !settings[key]
    setSettings(prev => ({ ...prev, [key]: newValue }))

    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          [key]: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('저장되었습니다')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('알림 설정 저장 오류:', error)
      // 실패시 원래 값으로 되돌리기
      setSettings(prev => ({ ...prev, [key]: !newValue }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">알림 설정</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 성공 메시지 */}
      {success && (
        <div className="mx-4 mt-4 p-3 rounded-xl text-sm font-medium bg-green-100 text-green-700">
          {success}
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 서비스 알림 */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">서비스 알림</h2>
          <p className="text-sm text-gray-500 mb-4">캠페인 선정, 콘텐츠 제출 마감 등 중요한 알림을 받습니다.</p>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* SMS 알림 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">SMS 알림</p>
                  <p className="text-xs text-gray-500">문자 메시지로 알림 수신</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('sms_notifications')}
                disabled={saving}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.sms_notifications ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 카카오톡 알림 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.76 1.78 5.19 4.5 6.61-.14.53-.52 1.9-.6 2.19-.1.38.14.37.3.27.12-.08 1.94-1.31 2.72-1.84.68.1 1.39.15 2.08.15 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">카카오톡 알림</p>
                  <p className="text-xs text-gray-500">카카오톡으로 알림 수신</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('kakao_notifications')}
                disabled={saving}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.kakao_notifications ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.kakao_notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 이메일 알림 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">이메일 알림</p>
                  <p className="text-xs text-gray-500">이메일로 알림 수신</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('email_notifications')}
                disabled={saving}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.email_notifications ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 마케팅 알림 */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">마케팅 알림</h2>
          <p className="text-sm text-gray-500 mb-4">새로운 캠페인, 이벤트 및 혜택 정보를 받습니다.</p>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-pink-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">마케팅 정보 수신</p>
                  <p className="text-xs text-gray-500">프로모션, 이벤트 알림</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('marketing_notifications')}
                disabled={saving}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.marketing_notifications ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.marketing_notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            • 서비스 알림을 끄면 중요한 정보를 놓칠 수 있습니다.<br />
            • 알림 수신에 동의하셔도 별도의 비용이 발생하지 않습니다.<br />
            • 문의사항은 고객센터로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
