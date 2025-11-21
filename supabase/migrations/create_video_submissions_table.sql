-- Create video_submissions table for tracking video uploads and revisions
CREATE TABLE IF NOT EXISTS video_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Video file information (uploaded to Supabase Storage)
  video_file_url TEXT NOT NULL,
  
  -- SNS upload information
  sns_title TEXT,
  sns_content TEXT,
  sns_upload_url TEXT,
  partnership_code TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'revision_requested', 'approved', 'rejected')),
  
  -- Company feedback
  feedback TEXT,
  feedback_data JSONB,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resubmitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  sns_uploaded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_submissions_application_id ON video_submissions(application_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_campaign_id ON video_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_user_id ON video_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON video_submissions(status);

-- Enable Row Level Security
ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified)

-- 1. Creators can manage their own video submissions
CREATE POLICY "video_submissions_creator_policy"
  ON video_submissions
  FOR ALL
  USING (auth.uid() = video_submissions.user_id)
  WITH CHECK (auth.uid() = video_submissions.user_id);

-- 2. Companies can view and update video submissions for their campaigns
CREATE POLICY "video_submissions_company_policy"
  ON video_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = video_submissions.campaign_id
      AND campaigns.company_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_submissions_updated_at_trigger
  BEFORE UPDATE ON video_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_video_submissions_updated_at();

-- Add comment to table
COMMENT ON TABLE video_submissions IS 'Stores video file submissions from creators with SNS upload info, status tracking and company feedback';
