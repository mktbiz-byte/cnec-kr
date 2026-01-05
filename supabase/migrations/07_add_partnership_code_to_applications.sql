-- Add partnership_code column to applications table
-- This allows creators to submit their Instagram partnership ad code

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS partnership_code TEXT;

-- Add index for searching by partnership code
CREATE INDEX IF NOT EXISTS idx_applications_partnership_code
  ON applications(partnership_code);

COMMENT ON COLUMN applications.partnership_code IS 'Instagram partnership advertising code submitted by creator';
