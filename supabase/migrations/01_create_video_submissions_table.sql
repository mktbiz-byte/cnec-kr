-- Step 1: Create video_submissions table only
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

-- Add comment to table
COMMENT ON TABLE video_submissions IS 'Stores video file submissions from creators with SNS upload info, status tracking and company feedback';
