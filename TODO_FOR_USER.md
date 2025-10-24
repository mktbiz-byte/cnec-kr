# 사용자가 직접 해야 할 작업

## 1. Supabase 데이터베이스 스키마 적용

다음 SQL 파일들을 Supabase SQL Editor에서 실행해주세요:

### 실행 방법
1. https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/sql/new 접속
2. 아래 SQL 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼 클릭

### 실행할 SQL 파일 목록

#### 1) 캠페인 카테고리 컬럼 추가
파일: `add_campaign_category.sql`
```sql
-- campaigns 테이블에 category 컬럼 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'youtube';

-- category 값 체크
ALTER TABLE campaigns ADD CONSTRAINT campaigns_category_check 
  CHECK (category IN ('youtube', 'instagram', '4week_challenge'));
```

#### 2) 크리에이터 영상 레퍼런스 테이블 생성
파일: `add_video_references_table.sql`
- 크리에이터가 포트폴리오 영상을 등록할 수 있는 테이블
- YouTube, TikTok, Instagram 링크 저장

#### 3) CNEC Plus 지원 테이블 생성
파일: `add_cnecplus_table.sql`
- CNEC Plus 프리미엄 프로그램 지원서 저장
- 미팅 일정 관리 기능 포함

#### 4) FAQ 테이블 생성 (선택사항)
파일: `add_faq_table.sql`
- 관리자가 FAQ를 관리할 수 있는 테이블
- 15개 기본 FAQ 포함

## 2. Google OAuth 설정

### Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **OAuth 클라이언트 ID 생성**
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application

3. **승인된 JavaScript 원본 입력**
   ```
   https://cnec-kr.netlify.app
   ```

4. **승인된 리디렉션 URI 입력**
   ```
   https://vluqhvuhykncicgvkosd.supabase.co/auth/v1/callback
   ```

### Supabase Google Provider 활성화

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/vluqhvuhykncicgvkosd/auth/providers

2. **Google Provider 설정**
   - Google 토글 활성화
   - Client ID 입력 (Google Cloud Console에서 생성)
   - Client Secret 입력 (Google Cloud Console에서 생성)

## 3. 관리자 계정 생성 (테스트용)

### 방법 1: 사이트에서 회원가입 후 수동으로 권한 부여

1. https://cnec-kr.netlify.app/signup 에서 회원가입
2. Supabase SQL Editor에서 다음 실행:
   ```sql
   -- 회원가입한 사용자의 이메일로 user_id 찾기
   SELECT id, email FROM auth.users WHERE email = '본인이메일@example.com';
   
   -- admin_users 테이블에 추가
   INSERT INTO admin_users (user_id, email, role, is_active)
   VALUES ('위에서찾은user_id', '본인이메일@example.com', 'super_admin', true);
   ```

3. https://cnec-kr.netlify.app/secret-admin-login 에서 관리자 로그인

### 방법 2: Google OAuth로 로그인 후 권한 부여

1. Google OAuth 설정 완료 후
2. Google로 회원가입/로그인
3. 위의 SQL로 admin_users 테이블에 추가

## 4. 커스텀 도메인 연결 (cnec.co.kr)

### Netlify 도메인 설정

1. Netlify Dashboard → cnec-kr 프로젝트 → Domain settings
2. Custom domains → Add custom domain
3. `cnec.co.kr` 입력

### DNS 설정 (도메인 제공업체)

Netlify에서 제공하는 DNS 설정 정보를 도메인 제공업체에 입력:
- A 레코드 또는 CNAME 레코드

### Google OAuth 업데이트

커스텀 도메인 설정 후 Google Cloud Console에서:
- 승인된 JavaScript 원본에 `https://cnec.co.kr` 추가
- 리디렉션 URI는 변경 불필요 (Supabase URL 동일)

## 요약

**필수 작업:**
1. ✅ Supabase SQL 실행 (4개 파일)
2. ✅ Google OAuth 설정
3. ✅ 관리자 계정 생성

**선택 작업:**
4. ⭕ 커스텀 도메인 연결 (cnec.co.kr)

모든 작업 완료 후 사이트가 정상적으로 작동합니다!

