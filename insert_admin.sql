-- 관리자 계정 정보를 corporate_accounts 테이블에 추가하거나 업데이트합니다.
-- 이미 해당 auth_user_id가 존재하는 경우, is_admin과 is_approved를 TRUE로 업데이트합니다.
INSERT INTO public.corporate_accounts (auth_user_id, business_registration_number, company_name, representative_name, is_approved, is_admin)
VALUES ('34c1704b-5a18-4f4d-88b7-d1edc04bf08d', '000-00-00000', 'CNEC Admin', 'Admin', TRUE, TRUE)
ON CONFLICT (auth_user_id) DO UPDATE SET
  is_admin = TRUE,
  is_approved = TRUE;
