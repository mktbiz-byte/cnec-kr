import { Monitor, Smartphone } from 'lucide-react'
import { usePCView } from '../../contexts/PCViewContext'

export default function PCViewToggleButton() {
  const { isPCView, togglePCView, isDesktop } = usePCView()

  if (!isDesktop) return null

  return (
    <button
      onClick={togglePCView}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-xl transition-all"
      title={isPCView ? '모바일 보기로 전환' : 'PC 보기로 전환'}
    >
      {isPCView ? (
        <>
          <Smartphone size={16} />
          <span>모바일 보기</span>
        </>
      ) : (
        <>
          <Monitor size={16} />
          <span>PC 보기</span>
        </>
      )}
    </button>
  )
}
