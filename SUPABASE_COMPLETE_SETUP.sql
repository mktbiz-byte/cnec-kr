-- ============================================
-- CNEC Korea - Supabase 완전 설정 SQL
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요
-- URL: https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/sql/new
-- ============================================

-- 1. 캠페인 카테고리 컬럼 추가
-- ============================================
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'youtube', 'instagram', '4week_challenge'));

COMMENT ON COLUMN campaigns.category IS '캠페인 카테고리: general(일반), youtube(유튜브), instagram(인스타), 4week_challenge(4주챌린지)';

-- 2. 크리에이터 영상 레퍼런스 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS creator_video_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'other')),
  title VARCHAR(200),
  description TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_video_refs_user_id ON creator_video_references(user_id);
CREATE INDEX IF NOT EXISTS idx_video_refs_platform ON creator_video_references(platform);

-- RLS 활성화
ALTER TABLE creator_video_references ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "사용자는 자신의 영상만 조회 가능"
  ON creator_video_references FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 영상만 삽입 가능"
  ON creator_video_references FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 영상만 업데이트 가능"
  ON creator_video_references FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 영상만 삭제 가능"
  ON creator_video_references FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE creator_video_references IS '크리에이터 포트폴리오 영상 레퍼런스';

-- 3. FAQ 관리 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(display_order);

-- RLS 활성화
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 사용자가 조회 가능, 관리자만 수정 가능)
CREATE POLICY "모든 사용자가 활성화된 FAQ 조회 가능"
  ON faqs FOR SELECT
  USING (is_active = true);

COMMENT ON TABLE faqs IS '자주 묻는 질문 관리';

-- 기본 FAQ 데이터 삽입
INSERT INTO faqs (question, answer, category, display_order) VALUES
('CNEC Korea는 어떤 플랫폼인가요?', 'CNEC Korea는 K-뷰티 브랜드와 크리에이터를 연결하는 전문 플랫폼입니다. 뷰티 크리에이터를 육성하고 양성하며, 브랜드와 함께 성장하는 파트너십을 구축합니다.', 'general', 1),
('회원가입은 어떻게 하나요?', '홈페이지 상단의 "회원가입" 버튼을 클릭하거나, Google 계정으로 간편하게 가입할 수 있습니다. 가입 후 프로필을 작성하면 바로 캠페인에 지원할 수 있습니다.', 'general', 2),
('캠페인에 참여하려면 어떻게 해야 하나요?', '로그인 후 "캠페인" 메뉴에서 원하는 캠페인을 선택하고 지원서를 작성하면 됩니다. 브랜드가 검토 후 선정되면 제품과 가이드라인이 제공됩니다.', 'campaign', 3),
('포인트는 어떻게 적립되나요?', '캠페인 완료 후 브랜드 승인이 완료되면 자동으로 포인트가 적립됩니다. 적립된 포인트는 마이페이지에서 확인할 수 있습니다.', 'point', 4),
('포인트는 어떻게 출금하나요?', '마이페이지에서 은행 계좌 정보를 등록한 후 출금 신청을 하면 됩니다. 최소 출금 금액은 10,000 포인트(10,000원)이며, 신청 후 3-7일 내에 입금됩니다.', 'point', 5),
('캠페인 선정 기준은 무엇인가요?', '팔로워 수, 콘텐츠 퀄리티, 참여율, 이전 캠페인 성과 등을 종합적으로 평가합니다. 초보 크리에이터도 성실하게 활동하면 선정될 수 있습니다.', 'campaign', 6),
('유튜브 육성 프로그램은 무엇인가요?', '뷰티 전문 유튜브 채널을 함께 성장시키는 프로그램입니다. 100만 포인트 지원, 제품비 100% 지원, 1:1 멘토링 등의 혜택이 제공됩니다.', 'program', 7),
('개인정보는 안전하게 보호되나요?', '네, 주민등록번호는 암호화되어 저장되며, 관리자도 원본을 볼 수 없습니다. 모든 개인정보는 관련 법규에 따라 안전하게 관리됩니다.', 'general', 8)
ON CONFLICT DO NOTHING;

-- 4. CNEC Plus 지원 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS cnecplus_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  sns_links JSONB,
  portfolio_url TEXT,
  monthly_content_count INTEGER,
  motivation TEXT NOT NULL,
  experience TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'interview_scheduled', 'approved', 'rejected')),
  interview_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cnecplus_user_id ON cnecplus_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_cnecplus_status ON cnecplus_applications(status);
CREATE INDEX IF NOT EXISTS idx_cnecplus_created ON cnecplus_applications(created_at DESC);

-- RLS 활성화
ALTER TABLE cnecplus_applications ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "사용자는 자신의 지원서만 조회 가능"
  ON cnecplus_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 지원서만 삽입 가능"
  ON cnecplus_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 지원서만 업데이트 가능"
  ON cnecplus_applications FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE cnecplus_applications IS 'CNEC Plus 프리미엄 프로그램 지원';

-- ============================================
-- 완료!
-- ============================================
-- 모든 테이블과 정책이 생성되었습니다.
-- 이제 관리자 계정을 생성하려면:
-- 1. 웹사이트에서 회원가입
-- 2. auth.users 테이블에서 user_id 확인
-- 3. admin_users 테이블에 추가
-- ============================================

