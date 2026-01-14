-- Fix video_submissions_version_check constraint to allow versions 1-10
-- This constraint was limiting version to 1-3, causing errors when submitting V4+

-- Step 1: Drop the existing check constraint
ALTER TABLE video_submissions
DROP CONSTRAINT IF EXISTS video_submissions_version_check;

-- Step 2: Add new check constraint allowing versions 1-10
ALTER TABLE video_submissions
ADD CONSTRAINT video_submissions_version_check
CHECK (version >= 1 AND version <= 10);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT video_submissions_version_check ON video_submissions IS 'Version must be between 1 and 10 (V1 to V10)';
