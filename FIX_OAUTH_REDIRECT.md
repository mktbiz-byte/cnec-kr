# Google OAuth 리디렉션 문제 해결 가이드

## 문제 상황
Google 로그인 후 `http://localhost:3000/?code=...`로 리디렉션되는 문제

## 해결 방법

### 1. Supabase 설정 (필수)

**URL: https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/auth/url-configuration**

다음 설정을 변경하세요:

- **Site URL**: `https://cnec-kr.netlify.app`
- **Redirect URLs** (아래 URL들을 모두 추가):
  ```
  https://cnec-kr.netlify.app
  https://cnec-kr.netlify.app/**
  https://cnec-kr.netlify.app/auth/callback
  ```

### 2. Google Cloud Console 설정 (필수)

**URL: https://console.cloud.google.com/apis/credentials**

OAuth 2.0 클라이언트 ID 설정에서:

**승인된 자바스크립트 원본:**
```
https://cnec-kr.netlify.app
https://vluqhvuhykncicgvkosd.supabase.co
```

**승인된 리디렉션 URI:**
```
https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
```

**제거할 URL:**
- `http://localhost:3000` (개발용이므로 제거)
- `http://localhost:3000/auth/callback` (개발용이므로 제거)

### 3. 프론트엔드 코드 확인

Supabase 클라이언트 초기화 시 redirectTo 옵션 확인:

```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://cnec-kr.netlify.app'
  }
})
```

### 4. 테스트

1. 모든 설정 변경 후 5-10분 대기 (Google OAuth 캐시 갱신)
2. 브라우저 캐시 및 쿠키 삭제
3. https://cnec-kr.netlify.app 접속
4. Google 로그인 테스트

## 참고

- Supabase Auth Callback URL: `https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback`
- 프로덕션 URL: `https://cnec-kr.netlify.app`
- 프로젝트 ID: `vluqhvuhykncicgvkosd`

