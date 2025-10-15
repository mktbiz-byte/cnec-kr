# SSL 인증서 문제 해결 가이드

## 개요

이 문서는 cnec.jp 웹사이트의 SSL 인증서 관련 문제를 해결하기 위한 가이드입니다. SSL 인증서는 웹사이트의 보안을 위해 필수적이며, 사용자의 데이터를 안전하게 보호하는 역할을 합니다.

## 문제 상황

현재 cnec.jp 웹사이트에서 발생하는 SSL 인증서 관련 문제는 다음과 같습니다:

1. 브라우저에서 "안전하지 않은 연결" 경고 표시
2. 인증서 만료 또는 유효하지 않은 인증서 사용
3. 혼합 콘텐츠(Mixed Content) 경고
4. SSL 인증서와 도메인 불일치

## 해결 방법

### 1. Netlify 설정 확인 및 수정

Netlify에서 호스팅하는 경우, 다음 설정을 확인하고 수정합니다:

1. **사용자 정의 도메인 설정 확인**
   - Netlify 관리자 페이지 > 사이트 설정 > 도메인 관리 메뉴로 이동
   - `cnec.jp` 도메인이 올바르게 등록되어 있는지 확인
   - HTTPS 설정이 활성화되어 있는지 확인

2. **SSL 인증서 갱신**
   - Netlify 관리자 페이지 > 사이트 설정 > HTTPS 메뉴로 이동
   - "Renew certificate" 버튼 클릭하여 인증서 갱신
   - 인증서 상태가 "Active"인지 확인

3. **HTTPS 강제 설정**
   - `netlify.toml` 파일에 HTTPS 리디렉션 설정 추가 (이미 적용됨)
   ```toml
   [[redirects]]
     from = "http://*"
     to = "https://:splat"
     status = 301
     force = true
   ```

4. **보안 헤더 설정**
   - `netlify.toml` 파일에 보안 헤더 설정 추가 (이미 적용됨)
   ```toml
   [[headers]]
     for = "/*"
     [headers.values]
       Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
       X-Content-Type-Options = "nosniff"
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

### 2. DNS 설정 확인

1. **A 레코드 확인**
   - DNS 관리 페이지에서 `cnec.jp`의 A 레코드가 Netlify의 로드 밸런서 IP를 가리키는지 확인
   - Netlify의 로드 밸런서 IP: `75.2.60.5`

2. **CNAME 레코드 확인**
   - `www.cnec.jp`의 CNAME 레코드가 Netlify의 사이트 URL을 가리키는지 확인
   - 예: `www.cnec.jp` -> `cnec-jp.netlify.app`

3. **DNS 전파 대기**
   - DNS 설정 변경 후 최대 48시간까지 전파 시간이 소요될 수 있음
   - `dig cnec.jp` 명령어로 DNS 설정이 올바르게 적용되었는지 확인

### 3. 혼합 콘텐츠(Mixed Content) 문제 해결

1. **코드 검사**
   - 모든 리소스(이미지, 스크립트, 스타일시트)가 HTTPS URL을 사용하는지 확인
   - HTTP URL을 HTTPS로 변경

2. **Content-Security-Policy 설정**
   - `netlify.toml` 파일에 Content-Security-Policy 헤더 추가 (이미 적용됨)
   ```toml
   Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;"
   ```

3. **외부 리소스 확인**
   - 외부에서 로드하는 모든 리소스가 HTTPS를 지원하는지 확인
   - HTTPS를 지원하지 않는 리소스는 대체하거나 직접 호스팅

### 4. 브라우저 캐시 및 쿠키 문제

1. **브라우저 캐시 삭제**
   - 사용자에게 브라우저 캐시를 삭제하도록 안내
   - Chrome: 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제

2. **쿠키 설정 확인**
   - 모든 쿠키에 `Secure` 및 `SameSite` 속성 설정
   - 쿠키 도메인이 올바르게 설정되어 있는지 확인

## 자동화된 문제 해결 스크립트

SSL 인증서 문제를 자동으로 진단하고 해결하기 위한 스크립트를 제공합니다:

```bash
# 스크립트 실행 방법
cd /home/ubuntu/cnec-kr/scripts
./ssl_fix.sh
```

이 스크립트는 다음 작업을 수행합니다:
- 현재 SSL 상태 확인
- Netlify SSL 설정 확인 및 업데이트
- DNS 설정 확인
- HTTPS 리디렉션 설정 확인
- 인증서 만료일 확인
- 보안 헤더 설정 확인

## 문제 해결 후 확인 사항

SSL 문제 해결 후 다음 사항을 확인하세요:

1. **브라우저에서 사이트 접속**
   - 여러 브라우저(Chrome, Firefox, Safari, Edge)에서 사이트 접속 테스트
   - 주소 표시줄에 자물쇠 아이콘이 표시되는지 확인

2. **SSL Labs 테스트**
   - [SSL Labs](https://www.ssllabs.com/ssltest/) 사이트에서 SSL 설정 점검
   - A 등급 이상 받는 것이 목표

3. **모바일 기기 테스트**
   - 모바일 기기에서도 사이트가 안전하게 로드되는지 확인

## 추가 참고 자료

- [Netlify HTTPS 설정 가이드](https://docs.netlify.com/domains-https/https-ssl/)
- [Let's Encrypt 문제 해결 가이드](https://letsencrypt.org/docs/faq/)
- [SSL 인증서 모범 사례](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## 지원 및 문의

SSL 인증서 관련 추가 문제가 발생하면 다음 연락처로 문의하세요:
- 이메일: support@cnec.jp
- 기술 지원: tech@cnec.jp
