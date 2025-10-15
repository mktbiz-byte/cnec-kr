-- 세금계산서 처리 시스템 관련 테이블 생성 및 수정
-- 작성일: 2025-10-15

-- 세금계산서 상태 테이블
CREATE TABLE IF NOT EXISTS invoice_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세금계산서 테이블
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255) NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status_id INTEGER REFERENCES invoice_statuses(id),
  invoice_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, simplified, etc.
  invoice_url TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  notes TEXT,
  country_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세금계산서 항목 테이블
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  tax_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세금계산서 이력 테이블
CREATE TABLE IF NOT EXISTS invoice_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  status_id INTEGER REFERENCES invoice_statuses(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세금계산서 요청 테이블
CREATE TABLE IF NOT EXISTS invoice_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세금계산서 알림 테이블
CREATE TABLE IF NOT EXISTS invoice_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 세금계산서 상태 데이터 삽입
INSERT INTO invoice_statuses (name, code, description) VALUES
('요청됨', 'requested', '세금계산서가 요청되었지만 아직 발행되지 않음'),
('처리중', 'processing', '세금계산서 발행이 진행 중'),
('발행됨', 'issued', '세금계산서가 발행됨'),
('전송됨', 'sent', '세금계산서가 고객에게 전송됨'),
('취소됨', 'cancelled', '세금계산서가 취소됨'),
('오류', 'error', '세금계산서 발행 중 오류 발생');

-- 결제 테이블에 세금계산서 관련 필드 추가
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

-- 기업 계정 테이블에 세금계산서 관련 필드 추가
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(255);
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS tax_office VARCHAR(255);
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS default_invoice_email VARCHAR(255);

-- RLS 정책 설정
ALTER TABLE invoice_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_notifications ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 테이블에 대한 모든 권한을 가짐
CREATE POLICY admin_all_invoice_statuses ON invoice_statuses FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_invoices ON invoices FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_invoice_items ON invoice_items FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_invoice_histories ON invoice_histories FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_invoice_requests ON invoice_requests FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_invoice_notifications ON invoice_notifications FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- 기업 사용자는 자신의 세금계산서만 조회 가능
CREATE POLICY company_select_invoices ON invoices FOR SELECT TO authenticated USING (
  company_id = (SELECT id FROM corporate_accounts WHERE user_id = auth.uid())
);

-- 기업 사용자는 자신의 세금계산서 항목만 조회 가능
CREATE POLICY company_select_invoice_items ON invoice_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN corporate_accounts ca ON i.company_id = ca.id
    WHERE i.id = invoice_id AND ca.user_id = auth.uid()
  )
);

-- 기업 사용자는 자신의 세금계산서 요청만 생성 및 조회 가능
CREATE POLICY company_select_invoice_requests ON invoice_requests FOR SELECT TO authenticated USING (
  company_id = (SELECT id FROM corporate_accounts WHERE user_id = auth.uid())
);

CREATE POLICY company_insert_invoice_requests ON invoice_requests FOR INSERT TO authenticated WITH CHECK (
  company_id = (SELECT id FROM corporate_accounts WHERE user_id = auth.uid())
);

-- 기업 사용자는 자신의 세금계산서 알림만 조회 가능
CREATE POLICY company_select_invoice_notifications ON invoice_notifications FOR SELECT TO authenticated USING (
  recipient_id = auth.uid()
);

-- 세금계산서 상태는 모든 인증된 사용자가 조회 가능
CREATE POLICY all_select_invoice_statuses ON invoice_statuses FOR SELECT TO authenticated USING (true);

-- 트리거 함수: 세금계산서 상태 변경 시 히스토리 추가
CREATE OR REPLACE FUNCTION add_invoice_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO invoice_histories (invoice_id, status_id, created_by)
    VALUES (NEW.id, NEW.status_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS invoice_status_change ON invoices;
CREATE TRIGGER invoice_status_change
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION add_invoice_history();

-- 트리거 함수: 세금계산서 발행 시 결제 정보 업데이트
CREATE OR REPLACE FUNCTION update_payment_on_invoice_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_id = (SELECT id FROM invoice_statuses WHERE code = 'issued') AND
     OLD.status_id != (SELECT id FROM invoice_statuses WHERE code = 'issued') THEN
    
    UPDATE payments
    SET invoice_id = NEW.id,
        invoice_issued = TRUE,
        updated_at = NOW()
    WHERE id = NEW.payment_id;
    
    -- 알림 생성
    INSERT INTO invoice_notifications (invoice_id, recipient_id, title, message)
    SELECT 
      NEW.id,
      ca.user_id,
      '세금계산서가 발행되었습니다',
      '결제에 대한 세금계산서가 발행되었습니다. 마이페이지에서 확인하실 수 있습니다.'
    FROM corporate_accounts ca
    WHERE ca.id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS invoice_issue_update_payment ON invoices;
CREATE TRIGGER invoice_issue_update_payment
AFTER UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_payment_on_invoice_issue();

-- 함수: 세금계산서 요청 처리
CREATE OR REPLACE FUNCTION process_invoice_request(request_id UUID, approve BOOLEAN, notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_company_id UUID;
  v_invoice_id UUID;
  v_status_id INTEGER;
BEGIN
  -- 요청 정보 가져오기
  SELECT payment_id, company_id INTO v_payment_id, v_company_id
  FROM invoice_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice request not found';
  END IF;
  
  -- 요청 상태 업데이트
  UPDATE invoice_requests
  SET status = CASE WHEN approve THEN 'approved' ELSE 'rejected' END,
      notes = COALESCE(notes, invoice_requests.notes),
      updated_at = NOW()
  WHERE id = request_id;
  
  -- 승인된 경우 세금계산서 생성
  IF approve THEN
    -- 상태 ID 가져오기
    SELECT id INTO v_status_id FROM invoice_statuses WHERE code = 'requested';
    
    -- 결제 정보 가져오기
    WITH payment_data AS (
      SELECT 
        p.amount,
        p.tax_amount,
        p.total_amount,
        p.country_code,
        c.name AS campaign_name
      FROM payments p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE p.id = v_payment_id
    )
    
    -- 세금계산서 생성
    INSERT INTO invoices (
      payment_id,
      company_id,
      invoice_number,
      invoice_date,
      due_date,
      amount,
      tax_amount,
      total_amount,
      status_id,
      country_code
    )
    SELECT
      v_payment_id,
      v_company_id,
      'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
      NOW(),
      NOW() + INTERVAL '30 days',
      pd.amount,
      pd.tax_amount,
      pd.total_amount,
      v_status_id,
      pd.country_code
    FROM payment_data pd
    RETURNING id INTO v_invoice_id;
    
    -- 세금계산서 항목 생성
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      amount,
      tax_rate,
      tax_amount,
      total_amount
    )
    SELECT
      v_invoice_id,
      '캠페인: ' || pd.campaign_name,
      1,
      pd.amount,
      pd.amount,
      CASE WHEN pd.country_code = 'jp' THEN 10.00 ELSE 10.00 END, -- 국가별 세율 설정
      pd.tax_amount,
      pd.total_amount
    FROM payment_data pd;
    
    RETURN v_invoice_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;
