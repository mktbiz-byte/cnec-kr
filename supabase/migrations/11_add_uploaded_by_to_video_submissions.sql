-- video_submissions 테이블에 uploaded_by 컬럼 추가
-- 관리자가 업로드한 영상과 크리에이터가 업로드한 영상을 구분
ALTER TABLE video_submissions ADD COLUMN IF NOT EXISTS uploaded_by TEXT DEFAULT 'creator';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_video_submissions_uploaded_by ON video_submissions(uploaded_by);

COMMENT ON COLUMN video_submissions.uploaded_by IS '영상 업로드 주체 (creator: 크리에이터, admin: 관리자)';
