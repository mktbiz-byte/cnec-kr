-- Step 6: Add new fields to video_submissions table for clean version, video/week numbers, and hashtags

-- Add clean_video_url column for 클린본 (clean version) uploads
ALTER TABLE video_submissions
ADD COLUMN IF NOT EXISTS clean_video_url TEXT;

-- Add video_number column for Oliveyoung campaigns (1 or 2)
ALTER TABLE video_submissions
ADD COLUMN IF NOT EXISTS video_number INTEGER;

-- Add week_number column for 4-week challenge campaigns (1, 2, 3, 4)
ALTER TABLE video_submissions
ADD COLUMN IF NOT EXISTS week_number INTEGER;

-- Add version column for tracking revision versions (V1, V2, V3)
ALTER TABLE video_submissions
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add hashtags column for storing hashtags as text
ALTER TABLE video_submissions
ADD COLUMN IF NOT EXISTS hashtags TEXT;

-- Add comments
COMMENT ON COLUMN video_submissions.clean_video_url IS 'URL of the clean version video (클린본) uploaded to Supabase Storage';
COMMENT ON COLUMN video_submissions.video_number IS 'Video number for Oliveyoung campaigns (1 or 2)';
COMMENT ON COLUMN video_submissions.week_number IS 'Week number for 4-week challenge campaigns (1, 2, 3, or 4)';
COMMENT ON COLUMN video_submissions.version IS 'Version number for tracking revisions (V1, V2, V3)';
COMMENT ON COLUMN video_submissions.hashtags IS 'Hashtags for the video submission';

-- Create index for video_number and week_number queries
CREATE INDEX IF NOT EXISTS idx_video_submissions_video_number ON video_submissions(video_number) WHERE video_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_submissions_week_number ON video_submissions(week_number) WHERE week_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_submissions_version ON video_submissions(version);
