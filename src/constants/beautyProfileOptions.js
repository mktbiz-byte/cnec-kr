/**
 * 뷰티 크리에이터 프로필 옵션 상수
 * 단일 선택(Single Select)과 다중 선택(Multi Select) 구분
 */

// ==========================================
// 단일 선택 (Single Select) - 총 7개
// ==========================================

// 1. 피부타입 (필수)
export const SKIN_TYPES = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'sensitive', label: '민감성' }
]

// 2. 주요 관심 분야 (선택)
export const PRIMARY_INTERESTS = [
  { value: 'skincare', label: '피부 미용' },
  { value: 'haircare', label: '헤어 케어' },
  { value: 'diet_fitness', label: '다이어트/피트니스' },
  { value: 'makeup', label: '메이크업' },
  { value: 'wellness', label: '웰니스' }
]

// 3. 경험 수준 (선택)
export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: '초보자' },
  { value: 'intermediate', label: '중급자' },
  { value: 'expert', label: '전문가' }
]

// 4. 팔로워 규모 (선택)
export const FOLLOWER_RANGES = [
  { value: '1k_10k', label: '1K~10K' },
  { value: '10k_100k', label: '10K~100K' },
  { value: '100k_1m', label: '100K~1M' },
  { value: '1m_plus', label: '1M+' }
]

// 5. 업로드 빈도 (선택)
export const UPLOAD_FREQUENCIES = [
  { value: 'weekly', label: '주 1회 이상' },
  { value: 'biweekly', label: '월 2~3회' },
  { value: 'monthly', label: '월 1회 이하' }
]

// 6. 타겟 성별 (선택)
export const TARGET_GENDERS = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'all', label: '무관' }
]

// 7. 타겟 연령대 (선택)
export const TARGET_AGE_GROUPS = [
  { value: 'teens', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s_plus', label: '40대+' },
  { value: 'all', label: '무관' }
]

// ==========================================
// 다중 선택 (Multi Select) - 총 6개
// ==========================================

// 1. 피부 고민 (필수)
export const SKIN_CONCERNS = [
  { value: 'dryness', label: '건성 피부' },
  { value: 'oiliness', label: '지성 피부' },
  { value: 'combination_skin', label: '복합성 피부' },
  { value: 'sensitivity', label: '민감성 피부' },
  { value: 'acne', label: '여드름/트러블' },
  { value: 'pigmentation', label: '색소침착/기미' },
  { value: 'wrinkles', label: '주름/탄력' },
  { value: 'pores', label: '모공' },
  { value: 'dullness', label: '칙칙함/톤' },
  { value: 'redness', label: '홍조/혈관' },
  { value: 'texture', label: '각질/거칠음' }
]

// 2. 헤어 고민 (필수)
export const HAIR_CONCERNS = [
  { value: 'dry_hair', label: '건성 머리' },
  { value: 'oily_hair', label: '지성 머리' },
  { value: 'damaged', label: '손상머리' },
  { value: 'weak', label: '약한 머리' },
  { value: 'dandruff', label: '비듬/가려움' },
  { value: 'oily_scalp', label: '두피 지성' },
  { value: 'sensitive_scalp', label: '두피 민감' },
  { value: 'frizzy', label: '곱슬머리/프리즈' },
  { value: 'perm_damage', label: '매직/펌 손상' },
  { value: 'bleach_damage', label: '탈색 손상' }
]

// 3. 다이어트 고민 (필수)
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

// 4. 선호 콘텐츠 형식 (선택)
export const CONTENT_FORMATS = [
  { value: 'shorts', label: '숏폼(Shorts/Reels)' },
  { value: 'longform', label: '롱폼(YouTube)' },
  { value: 'carousel', label: '카라셀(Carousel)' },
  { value: 'live', label: '라이브' },
  { value: 'story', label: '스토리' }
]

// 5. 협업 선호도 (선택)
export const COLLABORATION_PREFERENCES = [
  { value: 'product_review', label: '제품 리뷰' },
  { value: 'unboxing', label: '언박싱' },
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'sponsorship', label: '스폰서십' },
  { value: 'ambassador', label: '앰배서더' }
]

// 6. 타겟 관심사 (선택)
export const TARGET_INTERESTS = [
  { value: 'natural_organic', label: '천연/오가닉' },
  { value: 'luxury', label: '럭셔리' },
  { value: 'value', label: '가성비' },
  { value: 'health_wellness', label: '건강/웰니스' },
  { value: 'trendy', label: '트렌디' },
  { value: 'premium', label: '프리미엄' }
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
  primary_interest: '',
  experience_level: '',
  follower_range: '',
  upload_frequency: '',
  target_gender: '',
  target_age_group: '',

  // 다중 선택 필드 (배열)
  skin_concerns: [],
  hair_concerns: [],
  diet_concerns: [],
  content_formats: [],
  collaboration_preferences: [],
  target_interests: []
}

// ==========================================
// 전체 옵션 Export
// ==========================================
export const PROFILE_OPTIONS = {
  singleSelect: {
    skinTypes: SKIN_TYPES,
    primaryInterests: PRIMARY_INTERESTS,
    experienceLevels: EXPERIENCE_LEVELS,
    followerRanges: FOLLOWER_RANGES,
    uploadFrequencies: UPLOAD_FREQUENCIES,
    targetGenders: TARGET_GENDERS,
    targetAgeGroups: TARGET_AGE_GROUPS
  },
  multiSelect: {
    skinConcerns: SKIN_CONCERNS,
    hairConcerns: HAIR_CONCERNS,
    dietConcerns: DIET_CONCERNS,
    contentFormats: CONTENT_FORMATS,
    collaborationPreferences: COLLABORATION_PREFERENCES,
    targetInterests: TARGET_INTERESTS
  },
  categories: CATEGORIES
}

export default PROFILE_OPTIONS
