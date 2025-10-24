-- 크리에이터 영상 레퍼런스 테이블 생성
CREATE TABLE IF NOT EXISTS creator_video_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'other')),
  title TEXT,
  description TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_video_refs_user_id ON creator_video_references(user_id);

-- RLS 활성화
ALTER TABLE creator_video_references ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY IF NOT EXISTS "Users can view their own video references"
  ON creator_video_references FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own video references"
  ON creator_video_references FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own video references"
  ON creator_video_references FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own video references"
  ON creator_video_references FOR DELETE
  USING (auth.uid() = user_id);

-- 관리자는 모든 영상 레퍼런스 조회 가능
CREATE POLICY IF NOT EXISTS "Admins can view all video references"
  ON creator_video_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

