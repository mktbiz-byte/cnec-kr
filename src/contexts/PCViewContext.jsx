import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const PCViewContext = createContext({})

const STORAGE_KEY = 'cnec-pc-view-mode'
const DESKTOP_BREAKPOINT = 1024

export const usePCView = () => {
  const context = useContext(PCViewContext)
  if (!context) {
    return { isPCView: false, togglePCView: () => {}, isDesktop: false, expandedContent: null, setExpandedContent: () => {} }
  }
  return context
}

export const PCViewProvider = ({ children }) => {
  const [rawPCView, setRawPCView] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [isDesktop, setIsDesktop] = useState(false)
  const [expandedContent, setExpandedContent] = useState(null)

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    setIsDesktop(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, rawPCView.toString())
    } catch {}
  }, [rawPCView])

  const togglePCView = useCallback(() => {
    setRawPCView(prev => !prev)
  }, [])

  // PC view is active only when user toggled it ON and screen is desktop-wide
  const isPCView = rawPCView && isDesktop

  return (
    <PCViewContext.Provider value={{ isPCView, togglePCView, isDesktop, rawPCView, expandedContent, setExpandedContent }}>
      {children}
    </PCViewContext.Provider>
  )
}
