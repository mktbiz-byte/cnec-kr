-- CNEC Korea Supabase - User Profiles 수정
-- 문제: auth.users에는 사용자가 있지만 user_profiles에 없음
-- 해결: 기존 사용자 데이터 삽입 + 자동 트리거 생성

-- 1. 기존 auth.users 데이터를 user_profiles에 삽입
INSERT INTO user_profiles (id, email, platform_region, country_code, created_at, updated_at)
SELECT 
  id,
  email,
  'kr' as platform_region,
  'KR' as country_code,
  created_at,
  now() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);

-- 2. 회원가입 시 자동으로 user_profiles 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, platform_region, country_code, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'kr',
    'KR',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 생성 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. admin_users 테이블에 관리자 추가 (mkt-biz@gmail.com)
INSERT INTO admin_users (user_id, email, role)
SELECT 
  id,
  email,
  'admin'
FROM auth.users
WHERE email = 'mkt-biz@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- 5. 확인 쿼리
SELECT 
  u.id,
  u.email,
  u.created_at as auth_created,
  p.created_at as profile_created,
  CASE WHEN a.email IS NOT NULL THEN 'admin' ELSE 'user' END as role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
LEFT JOIN admin_users a ON u.email = a.email
ORDER BY u.created_at DESC;

