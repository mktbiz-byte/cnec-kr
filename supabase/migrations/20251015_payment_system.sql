-- 결제 시스템 관련 테이블 생성 및 수정
-- 작성일: 2025-10-15

-- 결제 방법 테이블
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 상태 테이블
CREATE TABLE IF NOT EXISTS payment_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method_id INTEGER REFERENCES payment_methods(id),
  payment_status_id INTEGER REFERENCES payment_statuses(id),
  transaction_id VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE,
  bank_name VARCHAR(255),
  account_number VARCHAR(255),
  depositor_name VARCHAR(255),
  receipt_url TEXT,
  invoice_requested BOOLEAN DEFAULT FALSE,
  invoice_issued BOOLEAN DEFAULT FALSE,
  invoice_number VARCHAR(255),
  invoice_date TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  notes TEXT,
  country_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payment_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  payment_status_id INTEGER REFERENCES payment_statuses(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 결제 방법 데이터 삽입
INSERT INTO payment_methods (name, code, description) VALUES
('계좌이체', 'bank_transfer', '은행 계좌로 직접 입금'),
('신용카드', 'credit_card', '신용카드 결제 (추후 구현)');

-- 기본 결제 상태 데이터 삽입
INSERT INTO payment_statuses (name, code, description) VALUES
('대기중', 'pending', '결제가 요청되었지만 아직 완료되지 않음'),
('입금확인중', 'verifying', '입금이 확인 중'),
('완료', 'completed', '결제가 완료됨'),
('실패', 'failed', '결제 처리 중 오류 발생'),
('취소', 'cancelled', '결제가 취소됨'),
('환불', 'refunded', '결제가 환불됨');

-- 캠페인 테이블에 결제 관련 필드 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT TRUE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMP WITH TIME ZONE;

-- 결제 알림 테이블
CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 테이블에 대한 모든 권한을 가짐
CREATE POLICY admin_all_payment_methods ON payment_methods FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_payment_statuses ON payment_statuses FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_payments ON payments FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_payment_histories ON payment_histories FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

CREATE POLICY admin_all_payment_notifications ON payment_notifications FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
);

-- 기업 사용자는 자신의 결제 정보만 조회 가능
CREATE POLICY company_select_payments ON payments FOR SELECT TO authenticated USING (
  company_id = (SELECT id FROM corporate_accounts WHERE user_id = auth.uid())
);

CREATE POLICY company_insert_payments ON payments FOR INSERT TO authenticated WITH CHECK (
  company_id = (SELECT id FROM corporate_accounts WHERE user_id = auth.uid())
);

-- 기업 사용자는 자신의 결제 알림만 조회 가능
CREATE POLICY company_select_payment_notifications ON payment_notifications FOR SELECT TO authenticated USING (
  recipient_id = auth.uid()
);

-- 결제 방법과 상태는 모든 인증된 사용자가 조회 가능
CREATE POLICY all_select_payment_methods ON payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY all_select_payment_statuses ON payment_statuses FOR SELECT TO authenticated USING (true);

-- 결제 내역은 관련 기업과 관리자만 조회 가능
CREATE POLICY company_select_payment_histories ON payment_histories FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM payments p
    JOIN corporate_accounts ca ON p.company_id = ca.id
    WHERE p.id = payment_id AND ca.user_id = auth.uid()
  )
);

-- 트리거 함수: 결제 상태 변경 시 히스토리 추가
CREATE OR REPLACE FUNCTION add_payment_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status_id IS DISTINCT FROM NEW.payment_status_id THEN
    INSERT INTO payment_histories (payment_id, payment_status_id, created_by)
    VALUES (NEW.id, NEW.payment_status_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS payment_status_change ON payments;
CREATE TRIGGER payment_status_change
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION add_payment_history();

-- 트리거 함수: 결제 완료 시 캠페인 상태 업데이트
CREATE OR REPLACE FUNCTION update_campaign_on_payment_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status_id = (SELECT id FROM payment_statuses WHERE code = 'completed') AND
     OLD.payment_status_id != (SELECT id FROM payment_statuses WHERE code = 'completed') THEN
    
    UPDATE campaigns
    SET status = 'active'
    WHERE id = NEW.campaign_id AND status = 'pending_payment';
    
    -- 알림 생성
    INSERT INTO payment_notifications (payment_id, recipient_id, title, message)
    SELECT 
      NEW.id,
      ca.user_id,
      '결제가 완료되었습니다',
      '캠페인 "' || c.name || '"의 결제가 완료되었습니다. 캠페인이 활성화되었습니다.'
    FROM campaigns c
    JOIN corporate_accounts ca ON c.company_id = ca.id
    WHERE c.id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS payment_complete_update_campaign ON payments;
CREATE TRIGGER payment_complete_update_campaign
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_campaign_on_payment_complete();
