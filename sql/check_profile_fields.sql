-- ============================================
-- CNEC 프로필 필드 검증 SQL 쿼리
-- 프로필 설정 페이지에서 사용되는 모든 필드 체크
-- ============================================

-- 1. 특정 사용자의 전체 프로필 데이터 확인
-- (user_id를 실제 사용자 ID로 변경해서 사용)
SELECT
  id,
  email,
  name,
  phone,
  age,
  bio,
  profile_image,

  -- 주소 정보
  postcode,
  address,
  detail_address,

  -- SNS 채널 정보
  instagram_url,
  instagram_followers,
  youtube_url,
  youtube_subscribers,
  tiktok_url,
  tiktok_followers,
  blog_url,
  channel_name,
  followers,
  avg_views,
  target_audience,

  -- 뷰티 프로필
  skin_type,
  skin_tone,
  skin_concerns,
  hair_type,
  hair_concerns,
  nail_usage,
  circle_lens_usage,
  glasses_usage,

  -- 다이어트/건강
  diet_concerns,

  -- 크리에이터 정보
  primary_interest,
  category,
  editing_level,
  shooting_level,

  -- 채널 정보
  follower_range,
  upload_frequency,
  content_formats,
  collaboration_preferences,

  -- 링크트리/미러링/스마트스토어
  linktree_available,
  linktree_channels,
  mirroring_available,
  mirroring_channels,
  smartstore_purchase,

  -- 영상 스타일
  video_length_style,
  shortform_tempo,
  video_styles,

  -- 개인 정보
  gender,
  job_visibility,
  job,
  child_appearance,
  children,
  family_appearance,
  family_members,
  offline_visit,
  offline_region,
  offline_locations,
  languages,

  -- AI 프로필
  ai_profile_text,

  -- 메타 정보
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'USER_ID_HERE'  -- 여기에 실제 user_id 입력
;

-- ============================================
-- 2. 필드별 NULL 값 통계 (전체 사용자)
-- 저장 오류 또는 누락 필드 확인용
-- ============================================
SELECT
  COUNT(*) as total_profiles,

  -- 기본 정보 필드
  COUNT(name) as has_name,
  COUNT(phone) as has_phone,
  COUNT(age) as has_age,
  COUNT(profile_image) as has_profile_image,
  COUNT(address) as has_address,

  -- SNS 필드
  COUNT(instagram_url) as has_instagram,
  COUNT(youtube_url) as has_youtube,
  COUNT(tiktok_url) as has_tiktok,

  -- 뷰티 필드
  COUNT(skin_type) as has_skin_type,
  COUNT(hair_type) as has_hair_type,
  COUNT(CASE WHEN skin_concerns IS NOT NULL AND skin_concerns != '[]'::jsonb THEN 1 END) as has_skin_concerns,
  COUNT(CASE WHEN hair_concerns IS NOT NULL AND hair_concerns != '[]'::jsonb THEN 1 END) as has_hair_concerns,

  -- 스타일 필드
  COUNT(nail_usage) as has_nail_usage,
  COUNT(circle_lens_usage) as has_circle_lens_usage,
  COUNT(glasses_usage) as has_glasses_usage,

  -- 크리에이터 정보
  COUNT(primary_interest) as has_primary_interest,
  COUNT(category) as has_category,
  COUNT(editing_level) as has_editing_level,
  COUNT(shooting_level) as has_shooting_level,

  -- 채널 정보
  COUNT(follower_range) as has_follower_range,
  COUNT(upload_frequency) as has_upload_frequency,
  COUNT(CASE WHEN content_formats IS NOT NULL AND content_formats != '[]'::jsonb THEN 1 END) as has_content_formats,
  COUNT(CASE WHEN collaboration_preferences IS NOT NULL AND collaboration_preferences != '[]'::jsonb THEN 1 END) as has_collaboration_prefs,

  -- 특별 기능
  COUNT(linktree_available) as has_linktree_available,
  COUNT(CASE WHEN linktree_channels IS NOT NULL AND linktree_channels != '[]'::jsonb THEN 1 END) as has_linktree_channels,
  COUNT(mirroring_available) as has_mirroring_available,
  COUNT(CASE WHEN mirroring_channels IS NOT NULL AND mirroring_channels != '[]'::jsonb THEN 1 END) as has_mirroring_channels,
  COUNT(smartstore_purchase) as has_smartstore_purchase,

  -- 영상 스타일
  COUNT(video_length_style) as has_video_length_style,
  COUNT(shortform_tempo) as has_shortform_tempo,
  COUNT(CASE WHEN video_styles IS NOT NULL AND video_styles != '[]'::jsonb THEN 1 END) as has_video_styles,

  -- 개인 정보
  COUNT(gender) as has_gender,
  COUNT(job_visibility) as has_job_visibility,
  COUNT(child_appearance) as has_child_appearance,
  COUNT(CASE WHEN children IS NOT NULL AND children != '[]'::jsonb THEN 1 END) as has_children,
  COUNT(family_appearance) as has_family_appearance,
  COUNT(CASE WHEN family_members IS NOT NULL AND family_members != '[]'::jsonb THEN 1 END) as has_family_members,
  COUNT(offline_visit) as has_offline_visit,
  COUNT(CASE WHEN offline_locations IS NOT NULL AND offline_locations != '[]'::jsonb THEN 1 END) as has_offline_locations,
  COUNT(CASE WHEN languages IS NOT NULL AND languages != '[]'::jsonb THEN 1 END) as has_languages

FROM user_profiles;

-- ============================================
-- 3. 최근 업데이트된 프로필 확인
-- 저장이 정상적으로 작동하는지 확인
-- ============================================
SELECT
  id,
  name,
  email,
  updated_at,
  created_at,
  -- 주요 필드 존재 여부 확인
  CASE WHEN skin_type IS NOT NULL THEN '✓' ELSE '✗' END as skin,
  CASE WHEN gender IS NOT NULL THEN '✓' ELSE '✗' END as gender,
  CASE WHEN video_length_style IS NOT NULL THEN '✓' ELSE '✗' END as video,
  CASE WHEN mirroring_available IS NOT NULL THEN '✓' ELSE '✗' END as mirroring,
  CASE WHEN smartstore_purchase IS NOT NULL THEN '✓' ELSE '✗' END as smartstore
FROM user_profiles
ORDER BY updated_at DESC NULLS LAST
LIMIT 20;

-- ============================================
-- 4. 필드 값 유효성 검사
-- 잘못된 값이 저장되었는지 확인
-- ============================================

-- 피부타입 유효값 확인
SELECT DISTINCT skin_type, COUNT(*) as cnt
FROM user_profiles
WHERE skin_type IS NOT NULL
GROUP BY skin_type;

-- 성별 유효값 확인
SELECT DISTINCT gender, COUNT(*) as cnt
FROM user_profiles
WHERE gender IS NOT NULL
GROUP BY gender;

-- 미러링 가능 여부 확인
SELECT DISTINCT mirroring_available, COUNT(*) as cnt
FROM user_profiles
WHERE mirroring_available IS NOT NULL
GROUP BY mirroring_available;

-- 스마트스토어 구매 가능 확인
SELECT DISTINCT smartstore_purchase, COUNT(*) as cnt
FROM user_profiles
WHERE smartstore_purchase IS NOT NULL
GROUP BY smartstore_purchase;

-- 링크트리 가능 여부 확인
SELECT DISTINCT linktree_available, COUNT(*) as cnt
FROM user_profiles
WHERE linktree_available IS NOT NULL
GROUP BY linktree_available;

-- 영상 길이 스타일 확인
SELECT DISTINCT video_length_style, COUNT(*) as cnt
FROM user_profiles
WHERE video_length_style IS NOT NULL
GROUP BY video_length_style;

-- ============================================
-- 5. 배열 필드 데이터 검증
-- JSONB 배열 필드의 값 확인
-- ============================================

-- 피부 고민 값 확인
SELECT
  elem as skin_concern,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(skin_concerns, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- 헤어 고민 값 확인
SELECT
  elem as hair_concern,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(hair_concerns, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- 미러링 채널 값 확인
SELECT
  elem as mirroring_channel,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(mirroring_channels, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- 링크트리 채널 값 확인
SELECT
  elem as linktree_channel,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(linktree_channels, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- 콘텐츠 형식 값 확인
SELECT
  elem as content_format,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(content_formats, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- 언어 능력 값 확인
SELECT
  elem as language,
  COUNT(*) as cnt
FROM user_profiles,
LATERAL jsonb_array_elements_text(COALESCE(languages, '[]'::jsonb)) as elem
GROUP BY elem
ORDER BY cnt DESC;

-- ============================================
-- 6. 프로필 완성도 확인
-- 필수 필드 기준 완성도 계산
-- ============================================
SELECT
  id,
  name,
  email,
  -- 필수 필드 체크 (각 10점)
  (
    (CASE WHEN name IS NOT NULL AND name != '' THEN 10 ELSE 0 END) +
    (CASE WHEN phone IS NOT NULL AND phone != '' THEN 10 ELSE 0 END) +
    (CASE WHEN profile_image IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN skin_type IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN skin_concerns IS NOT NULL AND skin_concerns != '[]'::jsonb THEN 10 ELSE 0 END) +
    (CASE WHEN hair_type IS NOT NULL THEN 5 ELSE 0 END) +
    (CASE WHEN hair_concerns IS NOT NULL AND hair_concerns != '[]'::jsonb THEN 5 ELSE 0 END) +
    (CASE WHEN instagram_url IS NOT NULL OR youtube_url IS NOT NULL OR tiktok_url IS NOT NULL THEN 15 ELSE 0 END) +
    (CASE WHEN video_length_style IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN gender IS NOT NULL THEN 10 ELSE 0 END) +
    -- 보너스 필드 (추가 점수)
    (CASE WHEN mirroring_available IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN smartstore_purchase IS NOT NULL THEN 2 ELSE 0 END) +
    (CASE WHEN linktree_available IS NOT NULL THEN 1 ELSE 0 END)
  ) as profile_score,
  updated_at
FROM user_profiles
ORDER BY profile_score DESC, updated_at DESC NULLS LAST;

-- ============================================
-- 7. 저장 오류 탐지
-- NULL이면 안 되는 필드에 NULL이 있는지 확인
-- ============================================
SELECT
  id,
  name,
  email,
  'Missing required fields' as issue,
  CONCAT_WS(', ',
    CASE WHEN name IS NULL OR name = '' THEN 'name' END,
    CASE WHEN email IS NULL OR email = '' THEN 'email' END
  ) as missing_fields
FROM user_profiles
WHERE name IS NULL OR name = '' OR email IS NULL OR email = '';

-- ============================================
-- 8. 새로 추가된 필드 (mirroring/smartstore) 저장 확인
-- 최신 기능 필드가 제대로 저장되는지 확인
-- ============================================
SELECT
  id,
  name,
  mirroring_available,
  mirroring_channels,
  smartstore_purchase,
  updated_at
FROM user_profiles
WHERE mirroring_available IS NOT NULL
   OR smartstore_purchase IS NOT NULL
ORDER BY updated_at DESC
LIMIT 50;

-- ============================================
-- 9. 데이터 무결성 확인
-- 논리적으로 맞지 않는 데이터 찾기
-- ============================================

-- 미러링 가능인데 채널이 비어있는 경우
SELECT id, name, mirroring_available, mirroring_channels
FROM user_profiles
WHERE mirroring_available = 'possible'
  AND (mirroring_channels IS NULL OR mirroring_channels = '[]'::jsonb);

-- 링크트리 가능인데 채널이 비어있는 경우
SELECT id, name, linktree_available, linktree_channels
FROM user_profiles
WHERE linktree_available = 'possible'
  AND (linktree_channels IS NULL OR linktree_channels = '[]'::jsonb);

-- 아이 출연 가능인데 아이 정보가 없는 경우
SELECT id, name, child_appearance, children
FROM user_profiles
WHERE child_appearance = 'possible'
  AND (children IS NULL OR children = '[]'::jsonb);

-- 오프라인 방문 가능인데 장소 정보가 없는 경우
SELECT id, name, offline_visit, offline_locations, offline_region
FROM user_profiles
WHERE offline_visit = 'possible'
  AND (offline_locations IS NULL OR offline_locations = '[]'::jsonb)
  AND (offline_region IS NULL OR offline_region = '');

-- ============================================
-- 10. 테이블 스키마 확인
-- 현재 테이블에 모든 필드가 존재하는지 확인
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
