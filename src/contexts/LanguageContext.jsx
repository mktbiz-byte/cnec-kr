import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext({})

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    // Context가 없어도 기본값 반환 (에러 방지)
    return {
      language: 'ko',
      changeLanguage: () => {},
      t: (key) => key,
      isKorean: true,
      isJapanese: false
    }
  }
  return context
}

// 번역 데이터 (한국어만)
const translations = {
  ko: {
    // 공통
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    success: '성공했습니다',
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    edit: '편집',
    delete: '삭제',
    create: '생성',
    update: '업데이트',
    
    // 네비게이션
    home: '홈',
    campaigns: '캠페인',
    mypage: '마이페이지',
    login: '로그인',
    register: '회원가입',
    logout: '로그아웃',
    
    // 관리자
    admin: '관리자',
    dashboard: '대시보드',
    campaignManagement: '캠페인 관리',
    creatorManagement: '크리에이터 관리',
    withdrawalManagement: '출금 관리',
    
    // 캠페인
    campaignTitle: '캠페인 제목',
    brand: '브랜드',
    description: '설명',
    reward: '보상',
    status: '상태',
    active: '활성',
    inactive: '비활성',
    draft: '임시저장',
    completed: '완료',
    
    // 신청
    apply: '신청하기',
    application: '신청',
    applications: '신청 목록',
    applicant: '신청자',
    
    // 통계
    totalCampaigns: '총 캠페인',
    totalApplications: '총 신청',
    totalUsers: '총 사용자',
    totalRewards: '총 보상액',
    
    // 메시지
    loginRequired: '로그인이 필요합니다',
    adminRequired: '관리자 권한이 필요합니다',
    noData: '데이터가 없습니다',
    loadingFailed: '데이터 로딩에 실패했습니다'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language] = useState('ko') // 한국어 고정

  const changeLanguage = () => {
    // 한국어 고정이므로 아무 동작도 하지 않음
  }

  const t = (key) => {
    return translations.ko[key] || key
  }

  const value = {
    language: 'ko',
    changeLanguage,
    t,
    isKorean: true,
    isJapanese: false
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

