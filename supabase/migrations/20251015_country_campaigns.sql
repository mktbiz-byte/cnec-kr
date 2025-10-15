-- 국가별 캠페인 관리 시스템 통합을 위한 마이그레이션 파일
-- 작성일: 2025-10-15

-- 국가 테이블 생성
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  currency_symbol VARCHAR(10) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 국가 데이터 삽입
INSERT INTO countries (code, name, currency_code, currency_symbol, tax_rate)
VALUES 
  ('kr', '한국', 'KRW', '₩', 10.00),
  ('jp', '일본', 'JPY', '¥', 10.00),
  ('us', '미국', 'USD', '$', 0.00),
  ('tw', '대만', 'TWD', 'NT$', 5.00)
ON CONFLICT (code) DO NOTHING;

-- 캠페인 테이블에 국가 필드 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id),
ADD COLUMN IF NOT EXISTS country_specific_data JSONB;

-- 기존 캠페인은 한국으로 설정
UPDATE campaigns
SET country_id = (SELECT id FROM countries WHERE code = 'kr')
WHERE country_id IS NULL;

-- 국가별 캠페인 설정 테이블
CREATE TABLE IF NOT EXISTS country_campaign_settings (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  min_campaign_amount DECIMAL(12, 2) NOT NULL,
  max_campaign_amount DECIMAL(12, 2) NOT NULL,
  default_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_id)
);

-- 기본 국가별 캠페인 설정 삽입
INSERT INTO country_campaign_settings (country_id, min_campaign_amount, max_campaign_amount, default_fee_percentage)
VALUES 
  ((SELECT id FROM countries WHERE code = 'kr'), 100000, 10000000, 10.00),
  ((SELECT id FROM countries WHERE code = 'jp'), 10000, 1000000, 10.00),
  ((SELECT id FROM countries WHERE code = 'us'), 100, 10000, 10.00),
  ((SELECT id FROM countries WHERE code = 'tw'), 3000, 300000, 10.00)
ON CONFLICT (country_id) DO NOTHING;

-- 국가별 결제 방법 테이블
CREATE TABLE IF NOT EXISTS country_payment_methods (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_id, payment_method_id)
);

-- 기본 국가별 결제 방법 삽입
INSERT INTO country_payment_methods (country_id, payment_method_id)
SELECT c.id, pm.id
FROM countries c
CROSS JOIN payment_methods pm
WHERE c.code IN ('kr', 'jp', 'us', 'tw')
  AND pm.code IN ('bank_transfer', 'credit_card')
ON CONFLICT (country_id, payment_method_id) DO NOTHING;

-- 국가별 API 설정 테이블
CREATE TABLE IF NOT EXISTS country_api_settings (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  api_type VARCHAR(50) NOT NULL,
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  api_endpoint VARCHAR(255),
  api_version VARCHAR(50),
  additional_settings JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_id, api_type)
);

-- 국가별 통계 뷰 생성
CREATE OR REPLACE VIEW country_campaign_stats AS
SELECT 
  c.id AS country_id,
  c.code AS country_code,
  c.name AS country_name,
  COUNT(cam.id) AS total_campaigns,
  SUM(CASE WHEN cam.status = 'active' THEN 1 ELSE 0 END) AS active_campaigns,
  SUM(CASE WHEN cam.status = 'completed' THEN 1 ELSE 0 END) AS completed_campaigns,
  SUM(CASE WHEN cam.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_campaigns,
  SUM(p.total_amount) AS total_revenue,
  SUM(p.fee_amount) AS total_fees
FROM 
  countries c
LEFT JOIN 
  campaigns cam ON c.id = cam.country_id
LEFT JOIN 
  payments p ON cam.id = p.campaign_id
GROUP BY 
  c.id, c.code, c.name;

-- 국가별 캠페인 통합 뷰 생성
CREATE OR REPLACE VIEW integrated_campaigns AS
SELECT 
  cam.id,
  cam.title,
  cam.description,
  cam.status,
  cam.start_date,
  cam.end_date,
  cam.budget,
  cam.created_at,
  cam.updated_at,
  c.id AS country_id,
  c.code AS country_code,
  c.name AS country_name,
  ca.id AS company_id,
  ca.name AS company_name,
  b.id AS brand_id,
  b.name AS brand_name,
  p.id AS payment_id,
  p.status AS payment_status,
  p.total_amount AS payment_amount,
  p.payment_date
FROM 
  campaigns cam
JOIN 
  countries c ON cam.country_id = c.id
JOIN 
  corporate_accounts ca ON cam.company_id = ca.id
LEFT JOIN 
  brands b ON cam.brand_id = b.id
LEFT JOIN 
  payments p ON cam.id = p.campaign_id;

-- 국가별 캠페인 통합 함수 생성
CREATE OR REPLACE FUNCTION get_campaigns_by_country(country_code_param VARCHAR)
RETURNS TABLE (
  id INTEGER,
  title VARCHAR,
  description TEXT,
  status VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget DECIMAL,
  country_name VARCHAR,
  company_name VARCHAR,
  brand_name VARCHAR,
  payment_status VARCHAR,
  payment_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cam.id,
    cam.title,
    cam.description,
    cam.status,
    cam.start_date,
    cam.end_date,
    cam.budget,
    c.name AS country_name,
    ca.name AS company_name,
    b.name AS brand_name,
    p.status AS payment_status,
    p.total_amount AS payment_amount
  FROM 
    campaigns cam
  JOIN 
    countries c ON cam.country_id = c.id
  JOIN 
    corporate_accounts ca ON cam.company_id = ca.id
  LEFT JOIN 
    brands b ON cam.brand_id = b.id
  LEFT JOIN 
    payments p ON cam.id = p.campaign_id
  WHERE 
    c.code = country_code_param;
END;
$$ LANGUAGE plpgsql;
