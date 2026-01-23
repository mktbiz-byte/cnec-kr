/**
 * 뷰티 크리에이터 프로필 옵션 상수
 * 단일 선택(Single Select)과 다중 선택(Multi Select) 구분
 */

// ==========================================
// 단일 선택 (Single Select)
// ==========================================

// 1. 피부타입 (단일선택)
export const SKIN_TYPES = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'sensitive', label: '민감성' }
]

// 1-2. 피부 톤 (단일선택) - 퍼스널 컬러
export const SKIN_TONES = [
  { value: 'tone_13', label: '13호' },
  { value: 'tone_21', label: '21호' },
  { value: 'tone_23', label: '23호' },
  { value: 'warm', label: '웜톤' },
  { value: 'cool', label: '쿨톤' },
  { value: 'neutral', label: '뉴트럴' }
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

// 4. 편집 수준 (선택) - 설명 포함
export const EDITING_LEVELS = [
  { value: 'beginner', label: '초급', description: '캡컷으로 간단한 컷편집, 자막 가능' },
  { value: 'intermediate', label: '중급', description: '프리미어/파컷 활용, 효과음/트랜지션 편집' },
  { value: 'expert', label: '고급', description: '전문 편집툴 활용, 모션그래픽/색보정 가능' }
]

// 4-2. 촬영 수준 (선택) - 설명 포함
export const SHOOTING_LEVELS = [
  { value: 'beginner', label: '초급', description: '스마트폰 기본 촬영' },
  { value: 'intermediate', label: '중급', description: '조명/삼각대 활용, 구도 이해' },
  { value: 'expert', label: '고급', description: '미러리스/DSLR 촬영, 조명 세팅 가능' }
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

// 10. 커플/가족 출연 가능 여부
export const FAMILY_APPEARANCE = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
]

// 10-2. 오프라인 방문촬영 가능 여부
export const OFFLINE_VISIT = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
]

// 10-3. 오프라인 촬영 장소 (다중선택)
export const OFFLINE_LOCATIONS = [
  { value: 'popup', label: '팝업스토어' },
  { value: 'oliveyoung', label: '올리브영' },
  { value: 'department', label: '백화점' },
  { value: 'daiso', label: '다이소' },
  { value: 'other', label: '기타' }
]

// 11. 가족 구성원 (다중선택)
export const FAMILY_MEMBERS = [
  { value: 'husband', label: '남편' },
  { value: 'wife', label: '아내' },
  { value: 'parents', label: '부모님' }
]

// 12. 아이 성별
export const CHILD_GENDERS = [
  { value: 'boy', label: '남아' },
  { value: 'girl', label: '여아' }
]

// 13. 영상 길이 스타일 (롱폼/숏폼)
export const VIDEO_LENGTH_STYLES = [
  { value: 'longform', label: '롱폼' },
  { value: 'shortform', label: '숏폼' },
  { value: 'both', label: '둘 다 가능' }
]

// 14. 숏폼 템포 스타일
export const SHORTFORM_TEMPO_STYLES = [
  { value: 'fast', label: '빠름', description: '빠른 컷 전환, 역동적인 편집' },
  { value: 'normal', label: '보통', description: '자연스러운 흐름, 균형 잡힌 편집' },
  { value: 'slow', label: '느림', description: '여유로운 전개, 감성적인 편집' }
]

// 15. 영상 스타일 (다중선택)
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

// 1. 피부 고민 (다중선택)
export const SKIN_CONCERNS = [
  { value: 'acne', label: '여드름' },
  { value: 'pores', label: '모공' },
  { value: 'pigmentation', label: '기미/잡티' },
  { value: 'wrinkles', label: '주름' },
  { value: 'redness', label: '홍조' },
  { value: 'atopy', label: '아토피' },
  { value: 'dryness', label: '건조함' },
  { value: 'oiliness', label: '유분과다' }
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
  { value: 'feed', label: '피드(사진/이미지)' },
  { value: 'live', label: '라이브' },
  { value: 'story', label: '스토리' },
  { value: 'group_buy', label: '공동구매' }
]

// 5. 협업 선호도 (다중선택)
export const COLLABORATION_PREFERENCES = [
  { value: 'product_review', label: '제품 리뷰' },
  { value: 'unboxing', label: '언박싱' },
  { value: 'tutorial', label: '튜토리얼' },
  { value: 'sponsorship', label: '스폰서십' },
  { value: 'ambassador', label: '앰배서더' }
]

// 6. 언어 능력 (다중선택)
export const LANGUAGES = [
  { value: 'korean', label: '한국어' },
  { value: 'english', label: '영어' },
  { value: 'japanese', label: '일본어' },
  { value: 'chinese', label: '중국어' }
]

// 7. 링크트리 설정 가능 여부 (인스타/틱톡/유튜브)
export const LINKTREE_AVAILABLE = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
]

// 7-2. 링크트리 설정 가능 채널 (다중선택)
export const LINKTREE_CHANNELS = [
  { value: 'instagram', label: '인스타그램' },
  { value: 'tiktok', label: '틱톡' },
  { value: 'youtube', label: '유튜브' }
]

// 8. 네일 사용 여부
export const NAIL_USAGE = [
  { value: 'always', label: '항상 함' },
  { value: 'sometimes', label: '가끔' },
  { value: 'never', label: '안함' }
]

// 9. 써클렌즈/컬러렌즈 사용 여부
export const CIRCLE_LENS_USAGE = [
  { value: 'always', label: '항상 착용' },
  { value: 'sometimes', label: '가끔 착용' },
  { value: 'never', label: '착용 안함' }
]

// 10. 안경 착용 여부
export const GLASSES_USAGE = [
  { value: 'always', label: '항상 착용' },
  { value: 'sometimes', label: '가끔 착용' },
  { value: 'never', label: '착용 안함' }
]

// 11. 미러링 가능 여부
export const MIRRORING_AVAILABLE = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
]

// 11-2. 미러링 가능 채널 (다중선택)
export const MIRRORING_CHANNELS = [
  { value: 'naver_clip', label: '네이버 클립' },
  { value: 'youtube', label: '유튜브' },
  { value: 'instagram', label: '인스타' },
  { value: 'tiktok', label: '틱톡' }
]

// 12. 네이버 스마트스토어 한달 구매 가능 여부 (4주 챌린지)
export const SMARTSTORE_PURCHASE = [
  { value: 'possible', label: '가능' },
  { value: 'impossible', label: '불가능' }
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
  skin_tone: '', // 피부 톤 (퍼스널 컬러)
  hair_type: '',
  primary_interest: '',
  editing_level: '',
  shooting_level: '',
  follower_range: '',
  upload_frequency: '',
  gender: '',
  job_visibility: '',
  job: '',
  child_appearance: '',
  family_appearance: '',
  offline_visit: '',
  offline_region: '', // 오프라인 촬영 가능 지역 (텍스트)
  linktree_available: '', // 링크트리 설정 가능 여부
  nail_usage: '', // 네일 사용 여부
  circle_lens_usage: '', // 써클렌즈 사용 여부
  glasses_usage: '', // 안경 착용 여부
  mirroring_available: '', // 미러링 가능 여부
  smartstore_purchase: '', // 스마트스토어 한달 구매 가능 여부
  video_length_style: '',
  shortform_tempo: '',

  // 다중 선택 필드 (배열)
  skin_concerns: [],
  hair_concerns: [],
  diet_concerns: [],
  content_formats: [],
  collaboration_preferences: [],
  video_styles: [],
  children: [], // [{gender: 'boy', age: 5}, ...]
  family_members: [], // ['husband', 'parents']
  offline_locations: [], // ['popup', 'oliveyoung', 'department', 'daiso']
  languages: [], // ['korean', 'english', 'japanese', 'chinese']
  linktree_channels: [], // ['instagram', 'tiktok', 'youtube']
  mirroring_channels: [] // ['naver_clip', 'youtube', 'instagram', 'tiktok']
}

// ==========================================
// 전체 옵션 Export
// ==========================================
export const PROFILE_OPTIONS = {
  singleSelect: {
    skinTypes: SKIN_TYPES,
    skinTones: SKIN_TONES,
    hairTypes: HAIR_TYPES,
    primaryInterests: PRIMARY_INTERESTS,
    editingLevels: EDITING_LEVELS,
    shootingLevels: SHOOTING_LEVELS,
    followerRanges: FOLLOWER_RANGES,
    uploadFrequencies: UPLOAD_FREQUENCIES,
    genders: GENDERS,
    jobVisibility: JOB_VISIBILITY,
    childAppearance: CHILD_APPEARANCE,
    childGenders: CHILD_GENDERS,
    familyAppearance: FAMILY_APPEARANCE,
    familyMembers: FAMILY_MEMBERS,
    offlineVisit: OFFLINE_VISIT,
    offlineLocations: OFFLINE_LOCATIONS,
    linktreeAvailable: LINKTREE_AVAILABLE,
    linktreeChannels: LINKTREE_CHANNELS,
    nailUsage: NAIL_USAGE,
    circleLensUsage: CIRCLE_LENS_USAGE,
    glassesUsage: GLASSES_USAGE,
    mirroringAvailable: MIRRORING_AVAILABLE,
    mirroringChannels: MIRRORING_CHANNELS,
    smartstorePurchase: SMARTSTORE_PURCHASE,
    videoLengthStyles: VIDEO_LENGTH_STYLES,
    shortformTempoStyles: SHORTFORM_TEMPO_STYLES
  },
  multiSelect: {
    skinConcerns: SKIN_CONCERNS,
    hairConcerns: HAIR_CONCERNS,
    dietConcerns: DIET_CONCERNS,
    contentFormats: CONTENT_FORMATS,
    collaborationPreferences: COLLABORATION_PREFERENCES,
    videoStyles: VIDEO_STYLES,
    languages: LANGUAGES
  },
  categories: CATEGORIES
}

export default PROFILE_OPTIONS
