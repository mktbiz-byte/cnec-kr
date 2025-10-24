-- ============================================
-- CNEC Korea - 프로필 사진 컬럼 추가
-- ============================================
-- Supabase SQL Editor에서 실행하세요
-- URL: https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/sql/new
-- ============================================

-- user_profiles 테이블에 profile_photo_url 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

COMMENT ON COLUMN user_profiles.profile_photo_url IS '프로필 사진 URL (Supabase Storage)';

-- 프로필 사진 저장을 위한 Storage Bucket 생성 (UI에서 생성 필요)
-- Bucket 이름: profile-photos
-- Public: true
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 2MB

-- Storage Bucket RLS 정책 (Supabase Dashboard > Storage > profile-photos > Policies에서 설정)
-- 1. 사용자는 자신의 폴더에만 업로드 가능
-- 2. 모든 사용자가 프로필 사진 조회 가능
-- 3. 사용자는 자신의 사진만 삭제 가능

