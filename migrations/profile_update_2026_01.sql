-- ============================================
-- 프로필 업데이트 마이그레이션 (2026년 1월)
-- 피부 호수/퍼스널 컬러 분리, 피부 고민 업데이트, 관심 카테고리 업데이트
-- ============================================

-- 1. 새로운 컬럼 추가
-- 피부 호수 (skin_shade) 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS skin_shade TEXT;

-- 퍼스널 컬러 (personal_color) 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS personal_color TEXT;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN user_profiles.skin_shade IS '피부 호수 (shade_13, shade_17, shade_21, shade_23, shade_25)';
COMMENT ON COLUMN user_profiles.personal_color IS '퍼스널 컬러 (spring_warm, summer_cool, autumn_warm, winter_cool, warm_neutral, cool_neutral, true_neutral)';

-- 2. 기존 skin_tone 데이터를 새 컬럼으로 마이그레이션
-- 호수 데이터 마이그레이션 (tone_13 -> shade_13 등)
UPDATE user_profiles
SET skin_shade = CASE
    WHEN skin_tone = 'tone_13' THEN 'shade_13'
    WHEN skin_tone = 'tone_21' THEN 'shade_21'
    WHEN skin_tone = 'tone_23' THEN 'shade_23'
    ELSE NULL
END
WHERE skin_tone IN ('tone_13', 'tone_21', 'tone_23')
  AND skin_shade IS NULL;

-- 퍼스널 컬러 데이터 마이그레이션 (warm -> spring_warm, cool -> summer_cool, neutral -> true_neutral)
UPDATE user_profiles
SET personal_color = CASE
    WHEN skin_tone = 'warm' THEN 'spring_warm'
    WHEN skin_tone = 'cool' THEN 'summer_cool'
    WHEN skin_tone = 'neutral' THEN 'true_neutral'
    ELSE NULL
END
WHERE skin_tone IN ('warm', 'cool', 'neutral')
  AND personal_color IS NULL;

-- 3. 피부 고민 데이터 마이그레이션 (dryness -> inner_dryness)
-- skin_concerns는 JSONB 배열이므로 array_replace 사용
UPDATE user_profiles
SET skin_concerns = (
    SELECT jsonb_agg(
        CASE WHEN elem = 'dryness' THEN 'inner_dryness' ELSE elem END
    )
    FROM jsonb_array_elements_text(skin_concerns) AS elem
)
WHERE skin_concerns IS NOT NULL
  AND skin_concerns @> '"dryness"';

-- ============================================
-- 새로운 옵션 값 참조 정보 (코드용)
-- ============================================

/*
[피부 호수 (skin_shade)]
- shade_13: 13호 (밝은 피부)
- shade_17: 17호
- shade_21: 21호 (보통 피부)
- shade_23: 23호 (어두운 피부)
- shade_25: 25호 이상

[퍼스널 컬러 (personal_color)]
- spring_warm: 봄 웜톤 (밝고 화사한 컬러)
- summer_cool: 여름 쿨톤 (부드럽고 차분한 컬러)
- autumn_warm: 가을 웜톤 (깊고 따뜻한 컬러)
- winter_cool: 겨울 쿨톤 (선명하고 차가운 컬러)
- warm_neutral: 웜 뉴트럴 (다양한 웜톤 소화 가능)
- cool_neutral: 쿨 뉴트럴 (다양한 쿨톤 소화 가능)
- true_neutral: 뉴트럴 (웜/쿨 모두 소화 가능)

[피부 고민 (skin_concerns) 업데이트]
- 추가: trouble (트러블)
- 변경: dryness -> inner_dryness (속건조)

[관심 카테고리 (category) 추가]
- health_supplement: 건기식

[채널 주요 컨텐츠 (primary_interest) 추가]
- fashion: 패션
- travel: 여행
- parenting: 육아
*/

-- ============================================
-- 마이그레이션 확인 쿼리
-- ============================================

-- 마이그레이션 결과 확인
SELECT
    COUNT(*) as total_users,
    COUNT(skin_shade) as users_with_skin_shade,
    COUNT(personal_color) as users_with_personal_color,
    COUNT(skin_tone) as users_with_legacy_skin_tone
FROM user_profiles;

-- skin_shade 분포 확인
SELECT skin_shade, COUNT(*) as count
FROM user_profiles
WHERE skin_shade IS NOT NULL
GROUP BY skin_shade
ORDER BY count DESC;

-- personal_color 분포 확인
SELECT personal_color, COUNT(*) as count
FROM user_profiles
WHERE personal_color IS NOT NULL
GROUP BY personal_color
ORDER BY count DESC;
