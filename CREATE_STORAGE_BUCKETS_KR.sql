-- CNEC Korea - Storage Buckets 생성

-- 1. campaign-images 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. profile-photos 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. creator-materials 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-materials', 'creator-materials', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage 정책 설정 - campaign-images (모두 읽기 가능, 인증된 사용자만 업로드)
CREATE POLICY IF NOT EXISTS "Public Access for campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update own campaign images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete own campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- 5. Storage 정책 설정 - profile-photos
CREATE POLICY IF NOT EXISTS "Public Access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY IF NOT EXISTS "Users can upload own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

-- 6. Storage 정책 설정 - creator-materials (비공개)
CREATE POLICY IF NOT EXISTS "Authenticated users can view creator materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-materials' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can upload own creator materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-materials' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update own creator materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'creator-materials' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete own creator materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'creator-materials' AND auth.role() = 'authenticated');

