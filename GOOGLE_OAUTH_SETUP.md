# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택
1. https://console.cloud.google.com/ 접속
2. 프로젝트 선택 또는 새 프로젝트 생성

### 1.2 OAuth 동의 화면 구성
1. 좌측 메뉴에서 "API 및 서비스" → "OAuth 동의 화면" 선택
2. 사용자 유형: **외부** 선택
3. 앱 정보 입력:
   - 앱 이름: `CNEC Korea`
   - 사용자 지원 이메일: 본인 이메일
   - 앱 로고: (선택사항)
   - 승인된 도메인: `cnec-kr.netlify.app`
   - 개발자 연락처 정보: 본인 이메일
4. 범위 추가:
   - `userinfo.email`
   - `userinfo.profile`
5. 저장

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴에서 "API 및 서비스" → "사용자 인증 정보" 선택
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `CNEC Korea Web Client`
5. 승인된 자바스크립트 원본:
   ```
   https://cnec-kr.netlify.app
   http://localhost:5173
   ```
6. 승인된 리디렉션 URI:
   ```
   https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   ```
7. "만들기" 클릭
8. **클라이언트 ID**와 **클라이언트 보안 비밀** 복사 (나중에 사용)

---

## 2. Supabase 설정

### 2.1 Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. CNEC Korea 프로젝트 선택 (vluqhvuhykncicgvkosd)

### 2.2 Google Provider 활성화
1. 좌측 메뉴에서 "Authentication" → "Providers" 선택
2. "Google" 찾기
3. "Enable" 토글 활성화
4. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: `[Google에서 복사한 클라이언트 ID]`
   - **Client Secret**: `[Google에서 복사한 클라이언트 보안 비밀]`
5. "Save" 클릭

### 2.3 리디렉션 URL 확인
Supabase가 자동으로 생성한 리디렉션 URL:
```
https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
```

이 URL이 Google Cloud Console의 "승인된 리디렉션 URI"에 포함되어 있는지 확인하세요.

---

## 3. 프론트엔드 코드 확인

현재 코드에서 Google 로그인은 이미 구현되어 있습니다:

### SignupPageExactReplica.jsx
```jsx
const handleGoogleSignup = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/mypage`
      }
    });
    if (error) throw error;
  } catch (error) {
    alert('Google 가입에 실패했습니다: ' + error.message);
  }
};
```

### LoginPageExactReplica.jsx
```jsx
const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/mypage`
      }
    });
    if (error) throw error;
  } catch (error) {
    alert('Google 로그인에 실패했습니다: ' + error.message);
  }
};
```

---

## 4. 테스트

### 4.1 로컬 테스트
1. `npm run dev` 실행
2. http://localhost:5173/signup 접속
3. "Google로 회원가입" 버튼 클릭
4. Google 계정 선택
5. 권한 승인
6. 마이페이지로 리디렉션 확인

### 4.2 프로덕션 테스트
1. https://cnec-kr.netlify.app/signup 접속
2. "Google로 회원가입" 버튼 클릭
3. Google 계정 선택
4. 권한 승인
5. 마이페이지로 리디렉션 확인

---

## 5. 문제 해결

### 오류: "redirect_uri_mismatch"
- Google Cloud Console의 "승인된 리디렉션 URI"에 Supabase 콜백 URL이 정확히 입력되어 있는지 확인
- URL 끝에 슬래시(/)가 없는지 확인

### 오류: "access_denied"
- OAuth 동의 화면이 올바르게 구성되어 있는지 확인
- 테스트 사용자가 추가되어 있는지 확인 (앱이 테스트 모드인 경우)

### 오류: "invalid_client"
- Supabase에 입력한 Client ID와 Client Secret이 정확한지 확인
- Google Cloud Console에서 클라이언트가 활성화되어 있는지 확인

---

## 6. 빠른 설정 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 구성
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 리디렉션 URI 추가: `https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback`
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID 및 Client Secret 입력
- [ ] 회원가입 페이지에서 Google 로그인 테스트
- [ ] 로그인 페이지에서 Google 로그인 테스트

---

## 7. Supabase 대시보드 링크

**Authentication 설정 페이지:**
https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/auth/providers

위 링크로 직접 접속하여 Google Provider를 활성화하세요.

