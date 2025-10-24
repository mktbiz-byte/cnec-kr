-- FAQ 테이블 생성
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'campaign', 'payment', 'withdrawal', 'account')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);

-- RLS 활성화
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 활성화된 FAQ 조회 가능
CREATE POLICY IF NOT EXISTS "Anyone can view active FAQs"
  ON faqs FOR SELECT
  USING (is_active = true);

-- RLS 정책: 관리자만 FAQ 생성/수정/삭제 가능
CREATE POLICY IF NOT EXISTS "Admins can manage FAQs"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

-- 기본 FAQ 데이터 삽입
INSERT INTO faqs (question, answer, category, display_order) VALUES
('크넥(CNEC)은 어떤 플랫폼인가요?', '크넥은 한국 화장품 브랜드와 크리에이터를 연결하는 인플루언서 마케팅 플랫폼입니다. 집에서 부업으로 숏폼 영상을 제작하고 포인트를 받을 수 있습니다.', 'general', 1),
('회원가입은 어떻게 하나요?', 'Google 계정으로 간단하게 회원가입할 수 있습니다. 회원가입 후 프로필을 완성하면 캠페인에 지원할 수 있습니다.', 'account', 2),
('캠페인에 어떻게 참여하나요?', '1) 회원가입 및 프로필 완성 → 2) 관심 있는 캠페인 선택 → 3) 지원서 작성 → 4) 브랜드 심사 → 5) 선정 시 제품 수령 → 6) 콘텐츠 제작 및 업로드 → 7) 포인트 지급', 'campaign', 3),
('어떤 종류의 캠페인이 있나요?', '유튜브 숏츠, 인스타그램 릴스, 틱톡 등 숏폼 영상 캠페인과 4주 챌린지 캠페인이 있습니다. 뷰티, 생활용품, 건강식품 등 다양한 제품을 체험할 수 있습니다.', 'campaign', 4),
('포인트는 언제 지급되나요?', '캠페인 완료 후 브랜드 승인이 완료되면 즉시 포인트가 지급됩니다. 일반적으로 콘텐츠 업로드 후 3-7일 이내에 지급됩니다.', 'payment', 5),
('포인트는 어떻게 출금하나요?', '마이페이지에서 출금 신청을 할 수 있습니다. 10만 포인트(10만원) 이상부터 출금 가능하며, 은행 계좌 정보와 주민등록번호를 입력하면 됩니다.', 'withdrawal', 6),
('출금은 얼마나 걸리나요?', '출금 신청 후 영업일 기준 3-5일 이내에 등록하신 은행 계좌로 입금됩니다.', 'withdrawal', 7),
('캠페인 선정 기준은 무엇인가요?', 'SNS 팔로워 수, 콘텐츠 품질, 과거 캠페인 참여 이력, 브랜드와의 적합성 등을 종합적으로 고려합니다. 팔로워가 적어도 양질의 콘텐츠를 제작하면 선정될 수 있습니다.', 'campaign', 8),
('제품은 어떻게 받나요?', '캠페인 선정 후 등록하신 주소로 제품이 배송됩니다. 배송 기간은 일반적으로 3-5일 정도 소요됩니다.', 'campaign', 9),
('콘텐츠 가이드라인이 있나요?', '각 캠페인마다 브랜드에서 제공하는 가이드라인이 있습니다. 필수 해시태그, 언급 사항, 촬영 방법 등을 확인하고 제작해주세요.', 'campaign', 10),
('여러 캠페인에 동시에 참여할 수 있나요?', '네, 가능합니다. 단, 각 캠페인의 마감일을 준수하고 양질의 콘텐츠를 제작할 수 있는 범위 내에서 참여해주세요.', 'campaign', 11),
('캠페인 참여를 취소할 수 있나요?', '선정 전에는 자유롭게 취소 가능합니다. 선정 후에는 브랜드와 협의가 필요하며, 무단 취소 시 향후 캠페인 참여에 제한이 있을 수 있습니다.', 'campaign', 12),
('포인트 유효기간이 있나요?', '포인트는 적립일로부터 1년간 유효합니다. 유효기간 내에 출금하지 않으면 소멸될 수 있으니 주의해주세요.', 'payment', 13),
('개인정보는 안전하게 보관되나요?', '네, 주민등록번호 등 민감한 정보는 암호화되어 저장되며, 관리자도 원본을 볼 수 없습니다. 개인정보보호법에 따라 안전하게 관리됩니다.', 'account', 14),
('문의는 어디로 하나요?', '웹사이트 하단의 고객센터 또는 1:1 문의를 통해 문의하실 수 있습니다. 영업일 기준 24시간 이내에 답변드립니다.', 'general', 15)
ON CONFLICT DO NOTHING;

