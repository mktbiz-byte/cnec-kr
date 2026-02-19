import { usePCView } from '../../contexts/PCViewContext'
import { useLocation } from 'react-router-dom'
import { Monitor, Smartphone, Layout, ChevronRight } from 'lucide-react'

const ADMIN_ROUTES = [
  '/dashboard', '/campaigns-manage', '/campaign-create',
  '/applications-manage', '/applications-report', '/confirmed-creators',
  '/sns-uploads', '/campaign-report', '/email-templates',
  '/user-approval', '/withdrawals-manage', '/system-settings',
  '/email-settings', '/secret-admin-login', '/test-admin-login'
]

const PAGE_TITLES = {
  '/': '홈',
  '/campaigns': '캠페인 목록',
  '/mypage': '마이페이지',
  '/my/applications': '지원 내역',
  '/my/grade': '등급 상세',
  '/my/points': '포인트',
  '/my/ai-guide': 'AI 가이드',
  '/guide': '크리에이터 가이드',
  '/profile': '프로필 설정',
  '/profile-settings': '프로필 설정',
  '/settings/notifications': '알림 설정',
  '/login': '로그인',
  '/signup': '회원가입',
  '/welcome': '환영합니다',
}

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/campaign/') && pathname.endsWith('/apply')) return '캠페인 지원'
  if (pathname.startsWith('/campaign/')) return '캠페인 상세'
  if (pathname.startsWith('/submit-video/')) return '영상 제출'
  if (pathname.startsWith('/submit-oliveyoung-video/')) return '올리브영 영상 제출'
  if (pathname.startsWith('/submit-4week-video/')) return '4주 챌린지 영상 제출'
  if (pathname.startsWith('/company-report/')) return '기업 리포트'
  return '페이지'
}

function PCExpandedPanel() {
  const { expandedContent } = usePCView()
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="border-b border-gray-100 px-8 py-5 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-xl">
            <Layout size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pageTitle}</h2>
            <p className="text-sm text-gray-500">PC 확장 보기</p>
          </div>
        </div>
      </div>

      {/* 패널 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-8">
        {expandedContent ? (
          <div className="max-w-4xl">
            {expandedContent}
          </div>
        ) : (
          <DefaultExpandedContent pageTitle={pageTitle} />
        )}
      </div>
    </div>
  )
}

function DefaultExpandedContent({ pageTitle }) {
  return (
    <div className="max-w-2xl">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center gap-3 mb-4">
          <Monitor size={24} className="text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900">PC 확장 보기</h3>
        </div>
        <p className="text-sm text-purple-800 leading-relaxed mb-6">
          현재 <span className="font-bold">{pageTitle}</span> 페이지를 보고 있습니다.
          왼쪽 모바일 화면에서 콘텐츠를 탐색하면, 이 패널에 확장된 정보가 표시됩니다.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-purple-100">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Smartphone size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">모바일 화면</p>
              <p className="text-xs text-gray-500">왼쪽에서 기존 모바일 화면 그대로 사용</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-purple-100">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <ChevronRight size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">확장 콘텐츠</p>
              <p className="text-xs text-gray-500">중요 정보를 크게 확장하여 보기</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PCViewLayout({ children }) {
  const { isPCView } = usePCView()
  const location = useLocation()

  const isAdminRoute = ADMIN_ROUTES.some(route => location.pathname.startsWith(route))

  if (!isPCView || isAdminRoute) {
    return children
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 왼쪽: 모바일 폰 프레임 */}
      <div className="flex-shrink-0 w-[480px] flex flex-col items-center py-6 px-4">
        <div className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Smartphone size={14} />
          모바일 미리보기
        </div>
        <div
          className="w-[448px] bg-white rounded-3xl shadow-2xl border border-gray-200 relative flex flex-col overflow-hidden"
          style={{ height: 'calc(100vh - 100px)' }}
        >
          {/* 폰 노치 */}
          <div className="flex-shrink-0 h-7 bg-white relative z-50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl" />
          </div>
          {/* 콘텐츠 영역 - pc-view-mobile-frame 클래스로 CSS 오버라이드 적용 */}
          <div className="flex-1 overflow-y-auto pc-view-mobile-frame relative">
            {children}
          </div>
        </div>
      </div>

      {/* 오른쪽: 확장 콘텐츠 패널 */}
      <div className="flex-1 overflow-hidden bg-white border-l border-gray-200 shadow-inner">
        <PCExpandedPanel />
      </div>
    </div>
  )
}
