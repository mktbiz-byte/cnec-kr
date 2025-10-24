-- CNEC Plus 지원 테이블 생성
CREATE TABLE IF NOT EXISTS cnecplus_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram_handle TEXT,
  youtube_channel TEXT,
  tiktok_handle TEXT,
  follower_count INTEGER NOT NULL,
  content_category TEXT NOT NULL,
  portfolio_links TEXT NOT NULL,
  motivation TEXT NOT NULL,
  experience TEXT,
  preferred_brands TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'meeting_scheduled')),
  admin_notes TEXT,
  meeting_date TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cnecplus_user_id ON cnecplus_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cnecplus_status ON cnecplus_applications(status);
CREATE INDEX IF NOT EXISTS idx_cnecplus_applied_at ON cnecplus_applications(applied_at DESC);

-- RLS 활성화
ALTER TABLE cnecplus_applications ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY IF NOT EXISTS "Users can view their own applications"
  ON cnecplus_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own applications"
  ON cnecplus_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 지원서 조회/수정 가능
CREATE POLICY IF NOT EXISTS "Admins can view all applications"
  ON cnecplus_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update all applications"
  ON cnecplus_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

