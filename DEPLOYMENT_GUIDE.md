# CNEC Korea 배포 가이드

## 1. Supabase 설정

### 프로젝트 정보
- **프로젝트 ID**: `vluqhvuhykncicgvkosd`
- **프로젝트 URL**: `https://vluqhvuhykncicgvkosd.supabase.co`
- **리전**: ap-northeast-2 (서울)

### 데이터베이스 스키마
스키마는 이미 적용되었습니다. 다음 테이블이 생성되어 있습니다:
- user_profiles
- campaigns
- applications
- withdrawals
- point_transactions
- creator_materials
- admin_users

### Google OAuth 설정

1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console에서 OAuth 클라이언트 생성
3. Authorized redirect URIs에 추가:
   ```
   https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
   ```
4. Client ID와 Client Secret을 Supabase에 입력

## 2. 환경 변수 설정

### Netlify 환경 변수

Netlify Dashboard → Site settings → Environment variables에 다음을 추가:

```
VITE_SUPABASE_URL=https://vluqhvuhykncicgvkosd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXFodnVoeWtuY2ljZ3Zrb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg2MzAsImV4cCI6MjA3Njg0NDYzMH0.ikEqdx6Le54YJUP-NROKg6EmeHJ4TbKkQ76pw29OQG8

VITE_PLATFORM_REGION=kr
VITE_PLATFORM_COUNTRY=KR

VITE_STATS_CAMPAIGN_MULTIPLIER=50
VITE_STATS_CREATOR_MULTIPLIER=500
VITE_STATS_APPLICATION_MULTIPLIER=1000
VITE_STATS_REWARD_MULTIPLIER=100

VITE_ENCRYPTION_KEY=cnec_korea_secure_encryption_key_2024_minimum_32_chars

NODE_ENV=production
```

**⚠️ 중요**: `VITE_ENCRYPTION_KEY`는 절대 노출되어서는 안 됩니다!

## 3. Netlify 배포 설정

### Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18.x 이상

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

## 4. 관리자 계정 생성

### SQL 실행 (Supabase SQL Editor)

```sql
-- 1. Supabase Auth에서 관리자 이메일로 가입
-- 2. 해당 사용자의 UUID 확인
SELECT id, email FROM auth.users WHERE email = 'admin@cnec.co.kr';

-- 3. admin_users 테이블에 추가
INSERT INTO public.admin_users (user_id, email, role)
VALUES ('user-uuid-here', 'admin@cnec.co.kr', 'admin');
```

## 5. 스토리지 버킷 설정

### campaign-images (공개)
```sql
-- 버킷은 이미 생성되어 있음
-- 공개 접근 정책 확인
SELECT * FROM storage.buckets WHERE id = 'campaign-images';
```

### creator-materials (비공개)
```sql
-- 버킷은 이미 생성되어 있음
-- 사용자별 접근 정책 확인
SELECT * FROM storage.buckets WHERE id = 'creator-materials';
```

## 6. 도메인 설정 (선택사항)

### Netlify 커스텀 도메인

1. Netlify Dashboard → Domain settings
2. Add custom domain
3. DNS 설정:
   ```
   CNAME @ your-site-name.netlify.app
   ```

### Supabase Redirect URLs 업데이트

커스텀 도메인 설정 후:
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL 업데이트: `https://your-domain.com`
3. Redirect URLs에 추가:
   ```
   https://your-domain.com/auth/callback
   ```

## 7. 테스트 체크리스트

### 기본 기능
- [ ] 회원가입 (Google OAuth)
- [ ] 로그인
- [ ] 캠페인 목록 조회
- [ ] 캠페인 지원
- [ ] 마이페이지 접근

### 출금 기능
- [ ] 은행 정보 등록
- [ ] 주민등록번호 암호화 저장
- [ ] 출금 신청
- [ ] 포인트 차감 확인

### 관리자 기능
- [ ] 관리자 로그인
- [ ] 캠페인 생성
- [ ] 지원자 선정
- [ ] 포인트 지급
- [ ] 출금 승인

## 8. 모니터링

### Supabase Logs
```
Supabase Dashboard → Logs
```

### Netlify Deploy Logs
```
Netlify Dashboard → Deploys → Deploy log
```

### 보안 권고사항 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM get_advisors();
```

## 9. 백업

### 데이터베이스 백업
Supabase는 자동 백업을 제공하지만, 중요한 데이터는 정기적으로 수동 백업 권장:

```bash
# Supabase CLI 사용
supabase db dump -f backup.sql
```

## 10. 문제 해결

### RLS 정책 문제
일본 버전에서 RLS 정책으로 인한 문제가 발생했습니다. 한국 버전도 유사한 문제 발생 시:

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 필요시 특정 테이블의 RLS 비활성화 (주의!)
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
```

### 출금 승인 오류
주민번호 복호화 오류 발생 시 암호화 키 확인:
```javascript
const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY
console.log('Encryption key length:', encryptionKey?.length)
// 최소 32자 이상이어야 함
```

## 11. 성능 최적화

### 인덱스 확인
```sql
-- 인덱스가 제대로 생성되었는지 확인
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### 쿼리 성능 모니터링
```sql
-- 느린 쿼리 확인
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;
```

## 12. 보안 체크리스트

- [ ] VITE_ENCRYPTION_KEY가 환경 변수에만 있고 코드에 하드코딩되지 않음
- [ ] Supabase Anon Key가 환경 변수에 설정됨
- [ ] RLS 정책이 모든 테이블에 적용됨
- [ ] Google OAuth Redirect URL이 올바르게 설정됨
- [ ] 관리자 계정이 안전하게 관리됨

## 완료!

배포가 완료되면 다음 URL에서 확인:
- Netlify 자동 도메인: `https://your-site-name.netlify.app`
- 커스텀 도메인 (설정한 경우): `https://your-domain.com`

