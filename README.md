# CNEC Korea (cnec-kr)

한국 크리에이터 모집 및 관리 플랫폼

## 프로젝트 개요

CNEC Korea는 한국 인플루언서 마케팅 플랫폼으로, 크리에이터들이 캠페인에 지원하고 포인트를 적립하여 출금할 수 있는 시스템입니다.

## 주요 기능

### 크리에이터 기능
- ✅ 회원가입 및 로그인 (Google OAuth)
- ✅ 캠페인 검색 및 지원
- ✅ SNS 업로드 및 포인트 적립
- ✅ 한국 은행 계좌를 통한 출금 신청
- ✅ 주민등록번호 암호화 저장
- ✅ 마이페이지 (프로필, 지원내역, 출금내역, 포인트내역)

### 관리자 기능
- ✅ 캠페인 생성 및 관리
- ✅ 지원자 관리 및 선정
- ✅ SNS 업로드 확인 및 포인트 지급
- ✅ 출금 신청 승인 및 처리
- ✅ 통계 대시보드

## 기술 스택

- **Frontend**: React (Vite)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **Hosting**: Netlify
- **Language**: 100% 한국어

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정하세요:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Platform Configuration
VITE_PLATFORM_REGION=kr
VITE_PLATFORM_COUNTRY=KR

# Stats Multipliers
VITE_STATS_CAMPAIGN_MULTIPLIER=50
VITE_STATS_CREATOR_MULTIPLIER=500
VITE_STATS_APPLICATION_MULTIPLIER=1000
VITE_STATS_REWARD_MULTIPLIER=100

# Encryption Key (주민번호 암호화)
VITE_ENCRYPTION_KEY=your_secure_encryption_key
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
# 또는
pnpm install
```

### 2. 개발 서버 실행
```bash
npm run dev
# 또는
pnpm dev
```

### 3. 빌드
```bash
npm run build
# 또는
pnpm build
```

## 데이터베이스 스키마

### 주요 테이블

1. **user_profiles** - 크리에이터 프로필
   - 기본 정보 (이름, 이메일, 전화번호)
   - SNS 정보 (Instagram, TikTok, YouTube)
   - 은행 계좌 정보
   - 암호화된 주민등록번호
   - 포인트

2. **campaigns** - 캠페인
   - 캠페인 정보
   - 리워드 포인트
   - 모집 인원
   - 상태 (active, closed)

3. **applications** - 캠페인 지원
   - 지원 상태 (pending, selected, completed)
   - SNS 업로드 URL
   - 포인트 지급 정보

4. **withdrawals** - 출금 신청
   - 출금 금액
   - 은행 정보 (은행명, 계좌번호, 예금주)
   - 암호화된 주민등록번호
   - 상태 (pending, approved, completed, rejected)

5. **point_transactions** - 포인트 거래 내역
   - 거래 유형 (earn, withdrawal)
   - 금액
   - 설명

## 보안 기능

### 주민등록번호 암호화

주민등록번호는 PostgreSQL의 `pgcrypto` 확장을 사용하여 암호화됩니다:

```sql
-- 암호화 함수
CREATE OR REPLACE FUNCTION encrypt_resident_number(
    resident_number TEXT, 
    encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(resident_number, encryption_key),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 복호화 함수 (관리자 전용)
CREATE OR REPLACE FUNCTION decrypt_resident_number(
    encrypted_text TEXT, 
    encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_text, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS (Row Level Security)

모든 테이블에 RLS 정책이 적용되어 사용자는 자신의 데이터만 접근할 수 있습니다.

## 출금 시스템

### 최소 출금 금액
- 10,000 포인트 (10,000원)

### 출금 프로세스
1. 크리에이터가 마이페이지에서 출금 신청
2. 은행 정보 및 주민등록번호 입력 (암호화 저장)
3. 관리자가 출금 신청 확인 및 승인
4. 영업일 기준 3-5일 내 처리

### 지원 은행
- KB국민은행, 신한은행, 우리은행, NH농협은행, 하나은행
- IBK기업은행, SC제일은행, 한국씨티은행
- 경남은행, 광주은행, 대구은행, 부산은행, 전북은행, 제주은행
- 카카오뱅크, 케이뱅크, 토스뱅크

## 다지역 통합

CNEC Korea는 다음 지역과 통합됩니다:
- **cnecjp** - 일본 버전
- **cnecus** - 미국 버전
- **cnectw** - 대만 버전
- **cnectotal** - 통합 관리 시스템

## 배포

### Netlify 배포

1. Netlify에 프로젝트 연결
2. 환경 변수 설정
3. 빌드 명령어: `npm run build`
4. 배포 디렉토리: `dist`

## 라이센스

© 2024 CNEC. All rights reserved.

## 문의

기술 지원: support@cnec.co.kr


