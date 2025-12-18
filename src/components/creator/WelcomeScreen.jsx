import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Video, Crown, Link2, Gift, ArrowRight, CheckCircle
} from 'lucide-react'
import cnecLogo from '../../assets/cnec-logo-final.png'

const WelcomeScreen = () => {
  const navigate = useNavigate()

  const services = [
    {
      icon: Video,
      title: 'CNEC REELS',
      description: '매월 다양한 뷰티 브랜드 캠페인! 숏폼 콘텐츠로 수익을 창출하세요.',
      color: 'bg-violet-500',
      iconBg: 'bg-violet-100'
    },
    {
      icon: Crown,
      title: 'CNEC SELECT',
      description: '프리미엄 크리에이터 전용! 브랜드 직접 제안과 높은 리워드를 받으세요.',
      color: 'bg-amber-500',
      iconBg: 'bg-amber-100'
    },
    {
      icon: Link2,
      title: 'CNEC LINK',
      description: '나만의 포트폴리오 링크! 브랜드에게 당신의 역량을 보여주세요.',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100'
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="px-5 py-6">
        <img src={cnecLogo} alt="CNEC" className="h-6" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-5 pb-8">
        {/* 환영 메시지 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            축하합니다!
          </h1>
          <p className="text-gray-500">
            크넥 크리에이터로 가입되었습니다.
          </p>
        </div>

        {/* 서비스 소개 */}
        <div className="space-y-4 mb-8">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4"
            >
              <div className={`w-12 h-12 ${service.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <service.icon size={24} className={service.color.replace('bg-', 'text-')} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 신규 혜택 */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={20} />
            <span className="font-bold">오직 신규 회원만!</span>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            프로필 완성 시 첫 캠페인 원고비 <span className="font-bold">+10%</span> 추가 지급!
          </p>
        </div>

        {/* 완료 체크리스트 */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-3">시작 전 체크리스트</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-green-500" />
              <span className="text-gray-600">회원가입 완료</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded-full" />
              <span className="text-gray-400">프로필 정보 입력 (피부타입, 주소)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded-full" />
              <span className="text-gray-400">SNS 계정 연결</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="p-5 pb-8 bg-white border-t border-gray-100">
        <button
          onClick={() => navigate('/creator')}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-black transition-colors"
        >
          시작하기
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
