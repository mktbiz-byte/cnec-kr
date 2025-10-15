# CNEC-KR 관리자 로그인 문제 디버깅 및 해결 방안

## 발견된 문제점

1. **관리자 계정 설정 문제**:
   - `corporate_accounts` 테이블에 관리자 계정 정보가 올바르게 설정되지 않았습니다.
   - 관리자 계정(`mkt@howlab.co.kr`)이 `auth.users` 테이블에는 존재하지만, `corporate_accounts` 테이블에 연결된 레코드가 없거나 `is_admin` 값이 `false`로 설정되어 있습니다.

2. **로그인 후 권한 확인 문제**:
   - `fetchUserRole` 함수에서 사용자 ID로 `corporate_accounts` 테이블을 조회할 때 결과가 없거나 오류가 발생하고 있습니다.
   - 이로 인해 로그인은 성공하지만 권한 확인 과정에서 실패하여 관리자 페이지로 접근할 수 없습니다.

3. **리다이렉션 문제**:
   - 로그인 후 `userRole`이 `null`이거나 `admin`이 아닌 경우 홈페이지로 리다이렉션되고 있습니다.
   - 이는 `ProtectedRoute` 컴포넌트에서 역할 불일치 시 `/` 경로로 리다이렉션하기 때문입니다.

## 해결 방안

1. **관리자 계정 설정 수정**:
   ```sql
   -- 관리자 계정 정보를 corporate_accounts 테이블에 추가하거나 업데이트합니다.
   INSERT INTO public.corporate_accounts (
     auth_user_id, 
     email, 
     phone_number, 
     address, 
     business_registration_number, 
     company_name, 
     representative_name, 
     is_approved, 
     is_admin
   )
   VALUES (
     '34c1704b-5a18-4f4d-88b7-d1edc04bf08d', 
     'mkt@howlab.co.kr', 
     '000-0000-0000', 
     'Default Address', 
     '000-00-00000', 
     'CNEC Admin', 
     'Admin', 
     TRUE, 
     TRUE
   )
   ON CONFLICT (auth_user_id) DO UPDATE SET
     is_admin = TRUE,
     is_approved = TRUE,
     email = EXCLUDED.email,
     phone_number = EXCLUDED.phone_number,
     address = EXCLUDED.address;
   ```

2. **로그인 로직 수정**:
   - `AuthContext.jsx` 파일에서 `signInWithEmail` 함수를 수정하여 이메일 주소를 그대로 사용하도록 변경했습니다.
   - 이전 코드: `const email = ${username}@admin.cnecbiz.com;`
   - 수정된 코드: `const email = username;`

3. **디버깅 코드 추가**:
   - `AuthContext.jsx`, `LoginPage.jsx`, `App.jsx` 파일에 디버깅 코드를 추가하여 로그인 과정과 권한 확인 과정을 추적할 수 있도록 했습니다.
   - 이를 통해 문제의 원인을 정확히 파악하고 해결할 수 있습니다.

4. **추가 확인 사항**:
   - 브라우저 콘솔에서 오류 메시지를 확인하여 추가적인 문제가 있는지 확인해야 합니다.
   - 로그인 후 세션이 올바르게 유지되는지 확인해야 합니다.
   - CSS 스타일이 올바르게 적용되어 있는지 확인해야 합니다.

## 테스트 방법

1. 수정된 코드를 배포합니다.
2. 관리자 계정(`mkt@howlab.co.kr`)으로 로그인합니다.
3. 브라우저 콘솔에서 로그 메시지를 확인하여 로그인 과정과 권한 확인 과정이 올바르게 진행되는지 확인합니다.
4. 관리자 페이지(`/admin`)로 접근하여 페이지가 올바르게 렌더링되는지 확인합니다.

## 추가 개선 사항

1. **오류 처리 개선**:
   - 사용자에게 더 명확한 오류 메시지를 제공하도록 개선합니다.
   - 로그인 실패 시 원인을 더 자세히 표시합니다.

2. **로깅 강화**:
   - 중요한 작업(로그인, 권한 확인 등)에 대한 로깅을 강화하여 문제 발생 시 원인을 쉽게 파악할 수 있도록 합니다.

3. **사용자 경험 개선**:
   - 로딩 상태를 더 명확하게 표시합니다.
   - 오류 발생 시 사용자에게 적절한 안내를 제공합니다.
