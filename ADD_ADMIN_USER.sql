-- ============================================
-- CNEC Korea - 관리자 사용자 등록
-- ============================================
-- 실행 완료: 2025-10-24
-- ============================================

-- 관리자 추가
INSERT INTO admin_users (user_id, email, role, created_at) 
VALUES (
  'c6310aa9-69dc-4b3b-b096-dcfef2180838',
  'mkt-biz@gmail.com',
  'admin',
  NOW()
) 
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email, role = EXCLUDED.role;

-- 확인
SELECT * FROM admin_users WHERE user_id = 'c6310aa9-69dc-4b3b-b096-dcfef2180838';

-- 결과:
-- ✅ 관리자 등록 완료
-- User ID: c6310aa9-69dc-4b3b-b096-dcfef2180838
-- Email: mkt-biz@gmail.com
-- Role: admin
-- Created At: 2025-10-24 03:35:47.195851+00

-- 이제 mkt-biz@gmail.com 계정으로 로그인하면 /dashboard에 접근할 수 있습니다.

