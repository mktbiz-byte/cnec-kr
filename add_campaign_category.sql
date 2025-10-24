-- campaigns 테이블에 category 컬럼 추가
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'youtube' 
CHECK (category IN ('youtube', 'instagram', '4week_challenge', 'other'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);

-- 기존 캠페인에 기본 카테고리 설정
UPDATE campaigns 
SET category = 'youtube' 
WHERE category IS NULL;
