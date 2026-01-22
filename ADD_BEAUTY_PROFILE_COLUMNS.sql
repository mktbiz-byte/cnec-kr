-- =====================================================
-- 뷰티 크리에이터 프로필 확장 컬럼 추가 (v2)
-- 실행 전 백업 권장
-- =====================================================

-- 1. 단일 선택 필드 추가 (TEXT)
-- =====================================================

-- 헤어타입 (건성, 지성, 보통)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hair_type TEXT;

-- 주요 관심 분야 (피부 미용, 헤어 케어, 다이어트/피트니스, 메이크업, 웰니스)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS primary_interest TEXT;

-- 경험 수준 (초보자, 중급자, 전문가)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS experience_level TEXT;

-- 팔로워 규모 (1K~10K, 10K~100K, 100K~1M, 1M+)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS follower_range TEXT;

-- 업로드 빈도 (주 1회 이상, 월 2~3회, 월 1회 이하)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS upload_frequency TEXT;

-- 성별 (여성, 남성)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS gender TEXT;

-- 직업 공개 여부 (public, private)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS job_visibility TEXT;

-- 직업
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS job TEXT;

-- 아이 출연 가능 여부 (possible, impossible)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS child_appearance TEXT;

-- 커플/가족 출연 가능 여부 (possible, impossible)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS family_appearance TEXT;

-- 영상 길이 스타일 (longform, shortform, both)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS video_length_style TEXT;

-- 숏폼 템포 스타일 (fast, normal, slow)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS shortform_tempo TEXT;


-- 2. 다중 선택 필드 추가 (JSONB 배열)
-- =====================================================

-- 피부 고민 (민감성, 여드름/트러블, 색소침착/기미, 주름/탄력, 모공, 칙칙함/톤, 홍조/혈관, 각질/거칠음)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS skin_concerns JSONB DEFAULT '[]'::jsonb;

-- 헤어 고민 (손상머리, 약한 머리, 비듬/가려움, 두피 지성, 두피 민감, 곱슬머리/프리즈, 매직/펌 손상, 탈색 손상)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hair_concerns JSONB DEFAULT '[]'::jsonb;

-- 다이어트 고민 (전체 체중 감량, 부분 체중 감량, 체중 유지, 근육 증가, 셀룰라이트, 처짐/탄력, 폭식/야식, 영양 불균형, 소화 문제)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS diet_concerns JSONB DEFAULT '[]'::jsonb;

-- 선호 콘텐츠 형식 (숏폼, 롱폼, 카라셀, 라이브, 스토리)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS content_formats JSONB DEFAULT '[]'::jsonb;

-- 협업 선호도 (제품 리뷰, 언박싱, 튜토리얼, 스폰서십, 앰배서더)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS collaboration_preferences JSONB DEFAULT '[]'::jsonb;

-- 영상 스타일 (감성, 리뷰, 튜토리얼, VLOG, 언박싱, 비교, 하울, ASMR)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS video_styles JSONB DEFAULT '[]'::jsonb;

-- 아이 정보 (gender, age 배열)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 가족 구성원 (husband, wife, parents 배열)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb;


-- 3. 인덱스 추가 (검색 성능 향상)
-- =====================================================

-- 단일 선택 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_hair_type ON user_profiles(hair_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_interest ON user_profiles(primary_interest);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_level ON user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_follower_range ON user_profiles(follower_range);
CREATE INDEX IF NOT EXISTS idx_user_profiles_upload_frequency ON user_profiles(upload_frequency);
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_user_profiles_job_visibility ON user_profiles(job_visibility);
CREATE INDEX IF NOT EXISTS idx_user_profiles_child_appearance ON user_profiles(child_appearance);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_appearance ON user_profiles(family_appearance);
CREATE INDEX IF NOT EXISTS idx_user_profiles_video_length_style ON user_profiles(video_length_style);
CREATE INDEX IF NOT EXISTS idx_user_profiles_shortform_tempo ON user_profiles(shortform_tempo);

-- JSONB 배열 필드에 대한 GIN 인덱스 (배열 요소 검색용)
CREATE INDEX IF NOT EXISTS idx_user_profiles_skin_concerns ON user_profiles USING GIN (skin_concerns);
CREATE INDEX IF NOT EXISTS idx_user_profiles_hair_concerns ON user_profiles USING GIN (hair_concerns);
CREATE INDEX IF NOT EXISTS idx_user_profiles_diet_concerns ON user_profiles USING GIN (diet_concerns);
CREATE INDEX IF NOT EXISTS idx_user_profiles_content_formats ON user_profiles USING GIN (content_formats);
CREATE INDEX IF NOT EXISTS idx_user_profiles_collaboration_preferences ON user_profiles USING GIN (collaboration_preferences);
CREATE INDEX IF NOT EXISTS idx_user_profiles_video_styles ON user_profiles USING GIN (video_styles);
CREATE INDEX IF NOT EXISTS idx_user_profiles_children ON user_profiles USING GIN (children);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_members ON user_profiles USING GIN (family_members);


-- 4. 코멘트 추가 (문서화)
-- =====================================================

COMMENT ON COLUMN user_profiles.hair_type IS '헤어타입: dry, oily, normal';
COMMENT ON COLUMN user_profiles.primary_interest IS '주요 관심 분야: skincare, haircare, diet_fitness, makeup, wellness';
COMMENT ON COLUMN user_profiles.experience_level IS '경험 수준: beginner, intermediate, expert';
COMMENT ON COLUMN user_profiles.follower_range IS '팔로워 규모: 1k_10k, 10k_100k, 100k_1m, 1m_plus';
COMMENT ON COLUMN user_profiles.upload_frequency IS '업로드 빈도: weekly, biweekly, monthly';
COMMENT ON COLUMN user_profiles.gender IS '성별: female, male';
COMMENT ON COLUMN user_profiles.job_visibility IS '직업 공개 여부: public, private';
COMMENT ON COLUMN user_profiles.job IS '직업 (job_visibility가 public일 때만 사용)';
COMMENT ON COLUMN user_profiles.child_appearance IS '아이 출연 가능 여부: possible, impossible';
COMMENT ON COLUMN user_profiles.family_appearance IS '커플/가족 출연 가능 여부: possible, impossible';
COMMENT ON COLUMN user_profiles.video_length_style IS '영상 길이 스타일: longform, shortform, both';
COMMENT ON COLUMN user_profiles.shortform_tempo IS '숏폼 템포 스타일: fast, normal, slow';
COMMENT ON COLUMN user_profiles.skin_concerns IS '피부 고민 (JSONB 배열): sensitivity, acne, pigmentation, wrinkles, pores, dullness, redness, texture';
COMMENT ON COLUMN user_profiles.hair_concerns IS '헤어 고민 (JSONB 배열): damaged, weak, dandruff, oily_scalp, sensitive_scalp, frizzy, perm_damage, bleach_damage';
COMMENT ON COLUMN user_profiles.diet_concerns IS '다이어트 고민 (JSONB 배열): overall_weight, spot_reduction, weight_maintain, muscle_gain, cellulite, skin_elasticity, binge_eating, nutrition, digestion';
COMMENT ON COLUMN user_profiles.content_formats IS '선호 콘텐츠 형식 (JSONB 배열): shorts, longform, carousel, live, story';
COMMENT ON COLUMN user_profiles.collaboration_preferences IS '협업 선호도 (JSONB 배열): product_review, unboxing, tutorial, sponsorship, ambassador';
COMMENT ON COLUMN user_profiles.video_styles IS '영상 스타일 (JSONB 배열): emotional, review, tutorial, vlog, unboxing, comparison, haul, asmr';
COMMENT ON COLUMN user_profiles.children IS '아이 정보 (JSONB 배열): [{gender: "boy"|"girl", age: number}]';
COMMENT ON COLUMN user_profiles.family_members IS '가족 구성원 (JSONB 배열): ["husband", "wife", "parents"]';


-- 5. 검증 쿼리 (실행 후 확인용)
-- =====================================================
/*
-- 새로 추가된 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
    'hair_type',
    'primary_interest',
    'experience_level',
    'follower_range',
    'upload_frequency',
    'gender',
    'job_visibility',
    'job',
    'child_appearance',
    'family_appearance',
    'video_length_style',
    'shortform_tempo',
    'skin_concerns',
    'hair_concerns',
    'diet_concerns',
    'content_formats',
    'collaboration_preferences',
    'video_styles',
    'children',
    'family_members'
);

-- 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
AND indexname LIKE 'idx_user_profiles_%';
*/


-- 6. 롤백 스크립트 (필요 시 사용)
-- =====================================================
/*
-- 주의: 아래 스크립트는 데이터 손실을 초래합니다
-- 백업 후 신중히 실행하세요

ALTER TABLE user_profiles DROP COLUMN IF EXISTS hair_type;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS primary_interest;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS experience_level;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS follower_range;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS upload_frequency;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS gender;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS job_visibility;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS job;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS child_appearance;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS family_appearance;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS video_length_style;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS shortform_tempo;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS skin_concerns;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS hair_concerns;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS diet_concerns;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS content_formats;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS collaboration_preferences;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS video_styles;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS children;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS family_members;
*/


-- =====================================================
-- 실행 완료
-- =====================================================
