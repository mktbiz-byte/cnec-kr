-- Add company_phone column to campaigns table
-- This allows storing company contact phone for notifications

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS company_phone TEXT;

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_company_phone
  ON campaigns(company_phone);

COMMENT ON COLUMN campaigns.company_phone IS 'Company contact phone number for notifications (알림톡)';
