-- Storage 버킷에 대한 RLS 정책 생성

-- campaign-images 버킷에 대한 업로드 권한 (인증된 사용자)
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-images');

-- campaign-images 버킷에 대한 읽기 권한 (모든 사용자)
CREATE POLICY "Anyone can view campaign images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-images');

-- campaign-images 버킷에 대한 삭제 권한 (인증된 사용자)
CREATE POLICY "Authenticated users can delete campaign images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-images');

-- profile-photos 버킷에 대한 업로드 권한 (인증된 사용자)
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- profile-photos 버킷에 대한 읽기 권한 (모든 사용자)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- profile-photos 버킷에 대한 삭제 권한 (인증된 사용자, 본인 파일만)
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

