# Google OAuth 설정 가이드

## OAuth 클라이언트 ID 설정 정보

### 승인된 JavaScript 원본 (Authorized JavaScript origins)

**현재 (Netlify):**
```
https://cnec-kr.netlify.app
```

**나중에 커스텀 도메인으로 변경 시:**
```
https://cnec.co.kr
https://www.cnec.co.kr
```

### 승인된 리디렉션 URI (Authorized redirect URIs)

```
https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
```

**중요:** 이 리디렉션 URI는 도메인이 변경되어도 동일하게 유지됩니다.

## 설정 방법

1. Google Cloud Console (https://console.cloud.google.com/) 접속
2. OAuth 클라이언트 ID 생성
3. 위의 JavaScript 원본과 리디렉션 URI 입력
4. Supabase Dashboard (https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/auth/providers)에서 Google Provider 활성화
5. Client ID와 Client Secret 입력

