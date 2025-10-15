# 디버깅 가이드

## 개요

이 문서는 cnec.jp 웹사이트의 인증 시스템, 캠페인 관리 및 결제 시스템에서 발생할 수 있는 일반적인 문제를 디버깅하는 방법을 제공합니다. 개발자와 관리자가 문제를 신속하게 진단하고 해결할 수 있도록 구성되어 있습니다.

## 1. 인증 시스템 디버깅

### 1.1 로그인 실패 문제

#### 증상
- 유효한 자격 증명으로 로그인할 수 없음
- "잘못된 이메일 또는 비밀번호" 오류 메시지 표시

#### 디버깅 단계
1. 브라우저 콘솔에서 네트워크 요청 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   localStorage.getItem('supabase.auth.token');
   ```

2. 서버 로그 확인
   ```bash
   # Supabase 로그 확인 (관리자 액세스 필요)
   supabase logs auth
   ```

3. 사용자 계정 상태 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

#### 해결 방법
- 비밀번호 재설정 링크 발송
- 계정이 비활성화된 경우 활성화
- 이메일 확인이 필요한 경우 확인 이메일 재발송

### 1.2 세션 만료 문제

#### 증상
- 로그인 상태가 갑자기 해제됨
- 자동 로그아웃 발생

#### 디버깅 단계
1. 토큰 만료 시간 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   const token = JSON.parse(localStorage.getItem('supabase.auth.token'));
   console.log(new Date(token.expires_at * 1000));
   ```

2. 세션 설정 확인
   ```javascript
   // AuthContext.jsx 파일에서 세션 설정 확인
   const { data: session } = await supabase.auth.getSession();
   ```

#### 해결 방법
- 세션 지속 시간 증가
- 토큰 갱신 로직 구현
- 자동 로그인 기능 추가

## 2. 다중 브랜드 지원 기능 디버깅

### 2.1 브랜드 정보 로드 실패

#### 증상
- 브랜드 목록이 표시되지 않음
- "브랜드 정보를 불러오는 데 실패했습니다" 오류 메시지

#### 디버깅 단계
1. 네트워크 요청 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   fetch('/api/brands').then(res => res.json()).then(console.log);
   ```

2. 데이터베이스 쿼리 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM brands WHERE corporate_account_id = '123';
   ```

3. 권한 설정 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM auth.policies WHERE table_name = 'brands';
   ```

#### 해결 방법
- RLS(Row Level Security) 정책 수정
- 데이터베이스 인덱스 추가
- API 엔드포인트 수정

### 2.2 브랜드 로고 업로드 문제

#### 증상
- 로고 이미지 업로드 실패
- 업로드된 로고가 표시되지 않음

#### 디버깅 단계
1. 스토리지 권한 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM storage.policies WHERE bucket_id = 'brand_logos';
   ```

2. 파일 형식 및 크기 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log(document.getElementById('logo-input').files[0]);
   ```

3. 스토리지 버킷 확인
   ```bash
   # Supabase 스토리지 확인 (관리자 액세스 필요)
   supabase storage ls brand_logos
   ```

#### 해결 방법
- 스토리지 버킷 권한 수정
- 파일 크기 제한 증가
- 지원되는 이미지 형식 확인

## 3. 캠페인 관리 시스템 디버깅

### 3.1 캠페인 생성 실패

#### 증상
- 캠페인 생성 폼 제출 후 오류 발생
- "캠페인 생성에 실패했습니다" 오류 메시지

#### 디버깅 단계
1. 폼 데이터 유효성 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log(formData);
   ```

2. API 요청 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   fetch('/api/campaigns', {
     method: 'POST',
     body: JSON.stringify(formData)
   }).then(res => res.json()).then(console.log);
   ```

3. 서버 로그 확인
   ```bash
   # 서버 로그 확인
   tail -f /var/log/nginx/error.log
   ```

#### 해결 방법
- 필수 필드 검증 로직 수정
- 데이터베이스 스키마 확인
- API 엔드포인트 오류 처리 개선

### 3.2 캠페인 상태 변경 문제

#### 증상
- 캠페인 상태 변경 후 상태가 업데이트되지 않음
- 상태 변경 버튼이 작동하지 않음

#### 디버깅 단계
1. 상태 업데이트 요청 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   fetch(`/api/campaigns/${campaignId}/status`, {
     method: 'PATCH',
     body: JSON.stringify({ status: 'active' })
   }).then(res => res.json()).then(console.log);
   ```

2. 데이터베이스 업데이트 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT id, status FROM campaigns WHERE id = '123';
   ```

3. 권한 설정 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM auth.policies WHERE table_name = 'campaigns';
   ```

#### 해결 방법
- 상태 업데이트 로직 수정
- 권한 설정 확인
- 상태 변경 조건 검증

## 4. 결제 및 매출 확인 시스템 디버깅

### 4.1 결제 처리 실패

#### 증상
- 결제 폼 제출 후 오류 발생
- "결제 처리 중 오류가 발생했습니다" 오류 메시지

#### 디버깅 단계
1. 결제 정보 유효성 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log(paymentInfo);
   ```

2. 결제 API 요청 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   fetch('/api/payments', {
     method: 'POST',
     body: JSON.stringify(paymentInfo)
   }).then(res => res.json()).then(console.log);
   ```

3. 결제 로그 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM payments WHERE campaign_id = '123' ORDER BY created_at DESC LIMIT 1;
   ```

#### 해결 방법
- 결제 정보 검증 로직 수정
- 결제 처리 오류 처리 개선
- 결제 상태 업데이트 확인

### 4.2 매출 보고서 데이터 불일치

#### 증상
- 매출 보고서의 데이터가 실제 결제 내역과 일치하지 않음
- 필터링된 결과가 정확하지 않음

#### 디버깅 단계
1. 거래 내역 쿼리 확인
   ```sql
   -- Supabase SQL 편집기에서 실행
   SELECT * FROM transactions 
   WHERE transaction_date BETWEEN '2025-01-01' AND '2025-12-31'
   ORDER BY transaction_date DESC;
   ```

2. 필터링 로직 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log(filterParams);
   ```

3. 계산 로직 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log(calculateSummary(transactions));
   ```

#### 해결 방법
- 쿼리 필터링 로직 수정
- 날짜 형식 및 시간대 처리 확인
- 계산 로직 오류 수정

## 5. SSL 인증서 문제 디버깅

### 5.1 인증서 오류

#### 증상
- 브라우저에서 "안전하지 않은 연결" 경고 표시
- 인증서 만료 또는 유효하지 않은 인증서 오류

#### 디버깅 단계
1. 인증서 정보 확인
   ```bash
   echo | openssl s_client -servername cnec.jp -connect cnec.jp:443 2>/dev/null | openssl x509 -noout -text
   ```

2. 인증서 만료일 확인
   ```bash
   echo | openssl s_client -servername cnec.jp -connect cnec.jp:443 2>/dev/null | openssl x509 -noout -dates
   ```

3. DNS 설정 확인
   ```bash
   dig cnec.jp
   dig www.cnec.jp
   ```

#### 해결 방법
- SSL 인증서 갱신
- Netlify SSL 설정 업데이트
- DNS 설정 확인 및 수정

### 5.2 혼합 콘텐츠 경고

#### 증상
- 브라우저 콘솔에 "Mixed Content" 경고 표시
- 일부 리소스가 HTTP로 로드됨

#### 디버깅 단계
1. 혼합 콘텐츠 식별
   ```javascript
   // 브라우저 콘솔에서 실행
   // 모든 HTTP 리소스 찾기
   Array.from(document.querySelectorAll('[src^="http:"], [href^="http:"]')).forEach(el => console.log(el));
   ```

2. Content-Security-Policy 헤더 확인
   ```bash
   curl -s -I https://cnec.jp | grep -i "Content-Security-Policy"
   ```

3. 외부 리소스 확인
   ```javascript
   // 브라우저 콘솔에서 실행
   // 모든 외부 리소스 찾기
   Array.from(document.querySelectorAll('[src], [href]')).filter(el => {
     const url = el.src || el.href;
     return url && !url.startsWith('data:') && !url.includes('cnec.jp');
   }).forEach(el => console.log(el));
   ```

#### 해결 방법
- HTTP URL을 HTTPS로 변경
- Content-Security-Policy 헤더 설정
- 외부 리소스를 HTTPS 버전으로 업데이트

## 6. 일반적인 디버깅 도구 및 기법

### 6.1 브라우저 개발자 도구

- **네트워크 탭**: API 요청 및 응답 모니터링
- **콘솔 탭**: JavaScript 오류 및 로그 확인
- **애플리케이션 탭**: 로컬 스토리지, 세션 스토리지, 쿠키 확인
- **요소 탭**: DOM 구조 및 스타일 검사

### 6.2 로깅 기법

```javascript
// 개발 환경에서만 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('디버그 정보:', data);
}

// 오류 로깅
try {
  // 코드 실행
} catch (error) {
  console.error('오류 발생:', error);
  // 오류 처리
}
```

### 6.3 Supabase 디버깅

```javascript
// Supabase 클라이언트 디버깅 활성화
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  { debug: true }
);

// 쿼리 디버깅
const { data, error } = await supabase
  .from('campaigns')
  .select('*')
  .eq('id', campaignId)
  .single();

if (error) {
  console.error('Supabase 쿼리 오류:', error);
}
```

### 6.4 성능 디버깅

```javascript
// 성능 측정
console.time('작업 시간');
// 작업 수행
console.timeEnd('작업 시간');

// 메모리 사용량 확인
console.log('메모리 사용량:', performance.memory);
```

## 7. 문제 해결 워크플로

1. **문제 식별**: 정확한 증상과 발생 조건 파악
2. **환경 확인**: 개발, 스테이징, 프로덕션 환경 중 어디서 발생하는지 확인
3. **로그 확인**: 브라우저 콘솔, 서버 로그, 데이터베이스 로그 확인
4. **재현**: 문제를 일관되게 재현할 수 있는 단계 확인
5. **격리**: 문제의 원인이 되는 코드 또는 구성 요소 식별
6. **해결**: 문제 원인에 따른 적절한 해결책 적용
7. **검증**: 해결책이 문제를 해결했는지 확인
8. **문서화**: 문제와 해결 방법을 문서화하여 향후 참조

## 8. 지원 및 문의

디버깅 중 추가 지원이 필요한 경우 다음 연락처로 문의하세요:
- 기술 지원: tech@cnec.jp
- 개발팀: dev@cnec.jp
