-- Add clean_video_url column to applications table for SNS upload clean version requirement

-- 클린본 URL 저장 컬럼 추가
ALTER TABLE applications ADD COLUMN IF NOT EXISTS clean_video_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN applications.clean_video_url IS 'URL of the clean version video (클린본) uploaded during SNS submission - required for point payment';
