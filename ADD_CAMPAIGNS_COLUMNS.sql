-- campaigns 테이블에 누락된 컬럼 추가

-- brand 컬럼 추가 (브랜드명)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand TEXT;

-- requirements 컬럼 추가 (참여 요구사항)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS requirements TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name IN ('brand', 'requirements');

