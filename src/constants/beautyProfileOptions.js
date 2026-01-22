/**
 * 뷰티 크리에이터 프로필 옵션 상수
 * 단일 선택(Single Select)과 다중 선택(Multi Select) 구분
 */

// ==========================================
// 단일 선택 (Single Select)
// ==========================================

// 1. 피부타입 (단일선택) - 민감성 제거 (피부고민에서 선택)
export const SKIN_TYPES = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' }
]

// 2. 헤어타입 (단일선택) - 건성/지성은 상호배타적
export const HAIR_TYPES = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'normal', label: '보통' }
]

// 3. 주요 관심 분야 (선택)
export const PRIMARY_INTERESTS = [
  { value: 'skincare', label: '피부 미용' },
  { value: 'haircare', label: '헤어 케어' },
  { value: 'diet_fitness', label: '다이어트/피트니스' },
  { value: 'makeup', label: '메이크업' },
  { value: 'wellness', label: '웰니스' }
]

// 4. 경험 수준 (선택)
export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: '초보자' },
  { value: 'intermediate', label: '중급자' },
  { value: 'expert', label: '전문가' }
]

// 5. 팔로워 규모 (선택)
export const FOLLOWER_RANGES = [
  { value: '1k_10k', label: '1K~10K' },
  { value: '10k_100k', label: '10K~100K' },
  { value: '100k_1m', label: '100K~1M' },
  { value: '1m_plus', label: '1M+' }
]

// 6. 업로드 빈도 (선택)
export const UPLOAD_FREQUENCIES = [
  { value: 'weekly', label: '주 1회 이상' },
  { value: 'biweekly', label: '월 2~3회' },
  { value: 'monthly', label: '월 1회 이하' }
]

// 7. 성별 (여성/남성만)
export const GENDERS = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' }
]

// 8. 직업 공개 여부
export const JOB_VISIBILITY = [
  { value: 'public', label: '공개' },
  { value: 'private', label: '비공개' }
]

// 9. 아이 출연 가능 여부
export const CHILD_APPEARANCE = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
]

// 10. 아이 성별
export const CHILD_GENDERS = [
  { value: 'boy', label: '남아' },
  { value: 'girl', label: '여아' }
]

// 11. 영상 길이 스타일 (롱폼/숏폼)
export const VIDEO_LENGTH_STYLES = [
  { value: 'longform', label: '롱폼' },
  { value: 'shortform', label: '숏폼' },
  { value: 'both', label: '둘 다 가능' }
]

// 12. 숏폼 템포 스타일
export const SHORTFORM_TEMPO_STYLES = [
  { value: 'fast', label: '빠름', description: '빠른 컷 전환, 역동적인 편집' },
  { value: 'normal', label: '보통', description: '자연스러운 흐름, 균형 잡힌 편집' },
  { value: 'slow', label: '느림', description: '여유로운 전개, 감성적인 편집' }
]

// 13. 영상 스타일 (다중선택)
export const VIDEO_STYLES = [
  { value: 'emotional', label: '감성' },
  { value: 'review', label: '리뷰' },
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'vlog', label: 'VLOG' },
  { value: 'unboxing', label: '언박싱' },
  { value: 'comparison', label: '비교' },
  { value: 'haul', label: '하울' },
  { value: 'asmr', label: 'ASMR' }
]

// ==========================================
// 다중 선택 (Multi Select)
// ==========================================

// 1. 피부 고민 (다중선택) - 건성/지성/복합성 제거 (피부타입에서 단일선택)
export const SKIN_CONCERNS = [
  { value: 'sensitivity', label: '민감성' },
  { value: 'acne', label: '여드름/트러블' },
  { value: 'pigmentation', label: '색소침착/기미' },
  { value: 'wrinkles', label: '주름/탄력' },
  { value: 'pores', label: '모공' },
  { value: 'dullness', label: '칙칙함/톤' },
  { value: 'redness', label: '홍조/혈관' },
  { value: 'texture', label: '각질/거칠음' }
]

// 2. 헤어 고민 (다중선택) - 건성/지성 제거 (헤어타입에서 단일선택)
export const HAIR_CONCERNS = [
  { value: 'damaged', label: '손상머리' },
  { value: 'weak', label: '약한 머리' },
  { value: 'dandruff', label: '비듬/가려움' },
  { value: 'oily_scalp', label: '두피 지성' },
  { value: 'sensitive_scalp', label: '두피 민감' },
  { value: 'frizzy', label: '곱슬머리/프리즈' },
  { value: 'perm_damage', label: '매직/펌 손상' },
  { value: 'bleach_damage', label: '탈색 손상' }
]

// 3. 다이어트 고민 (다중선택)
export const DIET_CONCERNS = [
  { value: 'overall_weight', label: '전체 체중 감량' },
  { value: 'spot_reduction', label: '부분 체중 감량' },
  { value: 'weight_maintain', label: '체중 유지' },
  { value: 'muscle_gain', label: '근육 증가' },
  { value: 'cellulite', label: '셀룰라이트' },
  { value: 'skin_elasticity', label: '처짐/탄력' },
  { value: 'binge_eating', label: '폭식/야식' },
  { value: 'nutrition', label: '영양 불균형' },
  { value: 'digestion', label: '소화 문제' }
]

// 4. 선호 콘텐츠 형식 (다중선택)
export const CONTENT_FORMATS = [
  { value: 'shorts', label: '숏폼(Shorts/Reels)' },
  { value: 'longform', label: '롱폼(YouTube)' },
  { value: 'carousel', label: '카라셀(Carousel)' },
  { value: 'live', label: '라이브' },
  { value: 'story', label: '스토리' }
]

// 5. 협업 선호도 (다중선택)
export const COLLABORATION_PREFERENCES = [
  { value: 'product_review', label: '제품 리뷰' },
  { value: 'unboxing', label: '언박싱' },
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'sponsorship', label: '스폰서십' },
  { value: 'ambassador', label: '앰배서더' }
]

// ==========================================
// 기존 호환용 - 관심 카테고리
// ==========================================
export const CATEGORIES = [
  { value: 'skincare', label: '기초' },
  { value: 'makeup', label: '메이크업' },
  { value: 'maskpack', label: '마스크팩' },
  { value: 'suncare', label: '선케어' },
  { value: 'haircare', label: '헤어' },
  { value: 'bodycare', label: '바디케어' },
  { value: 'fragrance', label: '향수' },
  { value: 'other', label: '기타' }
]

// ==========================================
// 프로필 데이터 기본값
// ==========================================
export const DEFAULT_BEAUTY_PROFILE = {
  // 기본 정보 (텍스트/숫자 입력)
  age: '',

  // 단일 선택 필드
  skin_type: '',
  hair_type: '',
  primary_interest: '',
  experience_level: '',
  follower_range: '',
  upload_frequency: '',
  gender: '',
  job_visibility: '',
  job: '',
  child_appearance: '',
  video_length_style: '',
  shortform_tempo: '',

  // 다중 선택 필드 (배열)
  skin_concerns: [],
  hair_concerns: [],
  diet_concerns: [],
  content_formats: [],
  collaboration_preferences: [],
  video_styles: [],
  children: [] // [{gender: 'boy', age: 5}, ...]
}

// ==========================================
// 전체 옵션 Export
// ==========================================
export const PROFILE_OPTIONS = {
  singleSelect: {
    skinTypes: SKIN_TYPES,
    hairTypes: HAIR_TYPES,
    primaryInterests: PRIMARY_INTERESTS,
    experienceLevels: EXPERIENCE_LEVELS,
    followerRanges: FOLLOWER_RANGES,
    uploadFrequencies: UPLOAD_FREQUENCIES,
    genders: GENDERS,
    jobVisibility: JOB_VISIBILITY,
    childAppearance: CHILD_APPEARANCE,
    childGenders: CHILD_GENDERS,
    videoLengthStyles: VIDEO_LENGTH_STYLES,
    shortformTempoStyles: SHORTFORM_TEMPO_STYLES
  },
  multiSelect: {
    skinConcerns: SKIN_CONCERNS,
    hairConcerns: HAIR_CONCERNS,
    dietConcerns: DIET_CONCERNS,
    contentFormats: CONTENT_FORMATS,
    collaborationPreferences: COLLABORATION_PREFERENCES,
    videoStyles: VIDEO_STYLES
  },
  categories: CATEGORIES
}

export default PROFILE_OPTIONS
