-- 세금계산서 및 정산 관련 필드 추가
ALTER TABLE public.corporate_accounts
ADD COLUMN IF NOT EXISTS tax_email TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT;
