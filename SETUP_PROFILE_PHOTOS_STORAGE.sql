-- ============================================
-- CNEC Korea - 프로필 사진 Storage Bucket 설정
-- ============================================
-- Supabase Dashboard에서 수동으로 설정하거나 SQL로 실행
-- ============================================

-- Storage Bucket 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,  -- public bucket
  2097152,  -- 2MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 설정

-- 1. 모든 사용자가 프로필 사진 조회 가능 (public bucket이므로 기본적으로 가능)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- 2. 인증된 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. 사용자는 자신의 사진만 업데이트 가능
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. 사용자는 자신의 사진만 삭제 가능
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 완료 메시지
SELECT 'Profile photos storage bucket setup complete!' AS status;

