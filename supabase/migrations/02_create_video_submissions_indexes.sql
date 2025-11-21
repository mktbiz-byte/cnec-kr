-- Step 2: Create indexes for video_submissions table
CREATE INDEX IF NOT EXISTS idx_video_submissions_application_id ON video_submissions(application_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_campaign_id ON video_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_user_id ON video_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON video_submissions(status);
