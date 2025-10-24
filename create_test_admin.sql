-- 테스트 관리자 계정 생성
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@cnec-kr.test',
  -- 비밀번호: test1234 (실제로는 bcrypt 해시 필요)
  '$2a$10$YourHashHere',  
  'CNEC Korea 관리자',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- 또는 간단하게 이메일만 등록 (비밀번호는 Supabase Auth 사용)
-- 실제로는 Supabase Auth를 통해 사용자를 생성하고
-- admin_users 테이블에 연결해야 합니다
