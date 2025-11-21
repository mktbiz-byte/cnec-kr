-- Storage RLS Policies for campaign-videos bucket

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload campaign videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-videos');

-- 2. Allow users to read their own files
CREATE POLICY "Allow users to read campaign videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-videos');

-- 3. Allow users to update their own files
CREATE POLICY "Allow users to update their own campaign videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-videos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'campaign-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Allow users to delete their own files
CREATE POLICY "Allow users to delete their own campaign videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Allow public read access (if bucket is public)
CREATE POLICY "Allow public read access to campaign videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-videos');
