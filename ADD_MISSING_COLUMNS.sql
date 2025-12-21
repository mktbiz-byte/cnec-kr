-- ============================================
-- CNEC Korea - user_profiles 테이블 누락 컬럼 추가
-- ============================================
-- Supabase SQL Editor에서 실행하세요
-- URL: https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/sql/new
-- ============================================

-- 대표 채널 정보 컬럼
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS channel_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS followers INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avg_views INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- 카테고리
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS category TEXT;

-- SNS 개별 팔로워/구독자 수
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS instagram_followers INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS youtube_subscribers INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER;

-- 프로필 이미지
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 코멘트 추가
COMMENT ON COLUMN user_profiles.channel_name IS '대표 채널명';
COMMENT ON COLUMN user_profiles.followers IS '대표 채널 팔로워/구독자 수';
COMMENT ON COLUMN user_profiles.avg_views IS '평균 조회수';
COMMENT ON COLUMN user_profiles.target_audience IS '타겟 오디언스';
COMMENT ON COLUMN user_profiles.category IS '카테고리 (beauty, fashion, lifestyle 등)';
COMMENT ON COLUMN user_profiles.instagram_followers IS '인스타그램 팔로워 수';
COMMENT ON COLUMN user_profiles.youtube_subscribers IS '유튜브 구독자 수';
COMMENT ON COLUMN user_profiles.tiktok_followers IS '틱톡 팔로워 수';
COMMENT ON COLUMN user_profiles.profile_image IS '프로필 사진 URL';

-- 완료 메시지
SELECT 'user_profiles 테이블에 누락된 컬럼이 추가되었습니다.' as result;
