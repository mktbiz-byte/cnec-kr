# CNEC Korean Business Registration System

한국 사업자등록정보 인증 시스템을 포함한 CNEC 통합 관리 시스템입니다. 이 시스템은 국세청 API를 활용하여 사업자등록번호의 유효성을 검증하고, 인증된 사업자만 회원가입을 할 수 있도록 합니다.

## 주요 기능

- **사업자등록정보 진위확인**: 국세청 API를 통해 사업자등록번호, 개업일자, 대표자명의 유효성을 실시간으로 검증
- **회원가입 프로세스**: 인증된 사업자만 회원가입이 가능하도록 설계된 UI 및 로직
- **임시 모의(Mock) 인증**: API 서비스 중단 시에도 개발 및 테스트를 계속할 수 있는 대체 기능

## 시스템 구조

- **프론트엔드**: React 기반의 사용자 인터페이스
- **백엔드**: Supabase Edge Functions를 활용한 서버리스 API
- **데이터베이스**: Supabase PostgreSQL 데이터베이스

## 설치 및 설정

### 필수 요구사항

- Node.js 16.x 이상
- Supabase 계정 및 프로젝트
- 공공데이터포털 API 인증키 (국세청_사업자등록정보 진위확인 및 상태조회 서비스)

### 설치 방법

1. 저장소 클론
   ```bash
   git clone https://github.com/mktbiz-byte/cnec-kr.git
   cd cnec-kr
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   - `.env.example` 파일을 `.env`로 복사하고 필요한 값을 입력

4. Supabase Edge Function 배포
   ```bash
   supabase functions deploy verify-business-number
   ```

5. Supabase Edge Function Secrets 설정
   ```bash
   supabase secrets set NTS_API_KEY=<공공데이터포털에서_발급받은_인증키>
   ```

## 사용 방법

### 사업자등록정보 인증

1. 회원가입 페이지에서 사업자등록번호, 개업일자, 대표자명을 입력
2. '사업자 정보 확인' 버튼을 클릭하여 정보의 유효성 검증
3. 인증 성공 시에만 회원가입 진행 가능

### 임시 모의 인증 모드

공공데이터포털 API 서비스 중단 시, 임시 모의 인증 모드를 활성화할 수 있습니다. 이 모드에서는 특정 테스트 데이터에 대해서만 인증 성공을 반환합니다.

- 테스트 데이터: 사업자번호 `5758102253`, 개업일자 `20210901`, 대표자명 `박현용`

## API 정상화 후 조치 사항

공공데이터포털 서비스가 정상화되면, 다음 단계에 따라 모의 인증 기능을 실제 API 연동으로 전환하세요:

1. 공공데이터포털에서 API 인증키 발급
2. Supabase Edge Function Secrets에 `NTS_API_KEY` 설정
3. `supabase/functions/verify-business-number/index.ts` 파일을 `real_api_function.ts` 파일의 내용으로 교체
4. Edge Function 재배포

자세한 내용은 [API 사용법 문서](./docs/api_usage.md)를 참조하세요.

## 라이센스

이 프로젝트는 CNEC의 내부 사용을 위해 개발되었으며, 모든 권리는 CNEC에 있습니다.
