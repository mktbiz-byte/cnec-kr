-- =====================================================
-- 프로필 컬럼 확인 및 누락 체크 SQL
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 현재 user_profiles 테이블의 모든 컬럼 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;


-- 2. 프로필에서 사용하는 모든 필드 체크 (있으면 ✓, 없으면 ✗)
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    -- 기본 정보
    'id', 'name', 'email', 'phone', 'age', 'bio', 'profile_image', 'role',
    -- 주소
    'postcode', 'address', 'detail_address',
    -- SNS 계정
    'instagram_url', 'youtube_url', 'tiktok_url', 'blog_url',
    'instagram_followers', 'youtube_subscribers', 'tiktok_followers',
    -- 채널 정보
    'channel_name', 'followers', 'avg_views', 'target_audience',
    -- 단일 선택 (뷰티)
    'skin_type', 'hair_type', 'category', 'primary_interest',
    'editing_level', 'shooting_level',
    'follower_range', 'upload_frequency',
    'gender', 'job_visibility', 'job',
    'child_appearance', 'family_appearance',
    'offline_visit', 'offline_region',
    'linktree_available',
    'video_length_style', 'shortform_tempo',
    -- 다중 선택 (JSONB 배열)
    'skin_concerns', 'hair_concerns', 'diet_concerns',
    'content_formats', 'collaboration_preferences', 'video_styles',
    'children', 'family_members', 'offline_locations',
    'languages', 'linktree_channels'
  ]) AS column_name
),
actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
)
SELECT
  e.column_name AS "필드명",
  CASE WHEN a.column_name IS NOT NULL THEN '✓ 존재' ELSE '✗ 누락' END AS "상태"
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY
  CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
  e.column_name;


-- 3. 누락된 컬럼만 표시
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'name', 'email', 'phone', 'age', 'bio', 'profile_image', 'role',
    'postcode', 'address', 'detail_address',
    'instagram_url', 'youtube_url', 'tiktok_url', 'blog_url',
    'instagram_followers', 'youtube_subscribers', 'tiktok_followers',
    'channel_name', 'followers', 'avg_views', 'target_audience',
    'skin_type', 'hair_type', 'category', 'primary_interest',
    'editing_level', 'shooting_level',
    'follower_range', 'upload_frequency',
    'gender', 'job_visibility', 'job',
    'child_appearance', 'family_appearance',
    'offline_visit', 'offline_region',
    'linktree_available',
    'video_length_style', 'shortform_tempo',
    'skin_concerns', 'hair_concerns', 'diet_concerns',
    'content_formats', 'collaboration_preferences', 'video_styles',
    'children', 'family_members', 'offline_locations',
    'languages', 'linktree_channels'
  ]) AS column_name
),
actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
)
SELECT e.column_name AS "누락된 컬럼"
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
WHERE a.column_name IS NULL;


-- 4. 누락된 컬럼 자동 생성 SQL 출력
WITH expected_columns AS (
  SELECT * FROM (VALUES
    ('age', 'INTEGER', NULL),
    ('bio', 'TEXT', NULL),
    ('profile_image', 'TEXT', NULL),
    ('postcode', 'TEXT', NULL),
    ('address', 'TEXT', NULL),
    ('detail_address', 'TEXT', NULL),
    ('instagram_url', 'TEXT', NULL),
    ('youtube_url', 'TEXT', NULL),
    ('tiktok_url', 'TEXT', NULL),
    ('blog_url', 'TEXT', NULL),
    ('instagram_followers', 'INTEGER', NULL),
    ('youtube_subscribers', 'INTEGER', NULL),
    ('tiktok_followers', 'INTEGER', NULL),
    ('channel_name', 'TEXT', NULL),
    ('followers', 'INTEGER', NULL),
    ('avg_views', 'INTEGER', NULL),
    ('target_audience', 'TEXT', NULL),
    ('skin_type', 'TEXT', NULL),
    ('hair_type', 'TEXT', NULL),
    ('category', 'TEXT', NULL),
    ('primary_interest', 'TEXT', NULL),
    ('editing_level', 'TEXT', NULL),
    ('shooting_level', 'TEXT', NULL),
    ('follower_range', 'TEXT', NULL),
    ('upload_frequency', 'TEXT', NULL),
    ('gender', 'TEXT', NULL),
    ('job_visibility', 'TEXT', NULL),
    ('job', 'TEXT', NULL),
    ('child_appearance', 'TEXT', NULL),
    ('family_appearance', 'TEXT', NULL),
    ('offline_visit', 'TEXT', NULL),
    ('offline_region', 'TEXT', NULL),
    ('linktree_available', 'TEXT', NULL),
    ('video_length_style', 'TEXT', NULL),
    ('shortform_tempo', 'TEXT', NULL),
    ('skin_concerns', 'JSONB', '''[]''::jsonb'),
    ('hair_concerns', 'JSONB', '''[]''::jsonb'),
    ('diet_concerns', 'JSONB', '''[]''::jsonb'),
    ('content_formats', 'JSONB', '''[]''::jsonb'),
    ('collaboration_preferences', 'JSONB', '''[]''::jsonb'),
    ('video_styles', 'JSONB', '''[]''::jsonb'),
    ('children', 'JSONB', '''[]''::jsonb'),
    ('family_members', 'JSONB', '''[]''::jsonb'),
    ('offline_locations', 'JSONB', '''[]''::jsonb'),
    ('languages', 'JSONB', '''[]''::jsonb'),
    ('linktree_channels', 'JSONB', '''[]''::jsonb')
  ) AS t(column_name, data_type, default_value)
),
actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
)
SELECT
  'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ' ||
  e.column_name || ' ' || e.data_type ||
  COALESCE(' DEFAULT ' || e.default_value, '') || ';' AS "실행할 SQL"
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
WHERE a.column_name IS NULL;


-- =====================================================
-- 위 쿼리 결과에서 "실행할 SQL"에 나온 것들을 복사해서 실행하세요
-- =====================================================
