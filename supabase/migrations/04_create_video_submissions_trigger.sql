-- Step 4: Create trigger to update updated_at timestamp

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
