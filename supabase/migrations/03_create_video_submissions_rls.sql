-- Step 3: Enable RLS and create policies for video_submissions table

-- Enable Row Level Security
ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Creators can manage their own video submissions
CREATE POLICY "video_submissions_creator_policy"
  ON video_submissions
  FOR ALL
  USING (auth.uid() = video_submissions.user_id)
  WITH CHECK (auth.uid() = video_submissions.user_id);

-- RLS Policy 2: Companies can view and update video submissions for their campaigns
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
