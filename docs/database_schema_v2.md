## 데이터베이스 스키마 V2

### 1. `countries` 테이블

- 국가 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `code` | `TEXT` | 국가 코드 (예: KR, JP, US) |
| `name` | `TEXT` | 국가명 (예: 대한민국, 일본, 미국) |
| `currency` | `TEXT` | 통화 (예: KRW, JPY, USD) |

### 2. `corporate_accounts` 테이블

- 기업 계정 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `auth_user_id` | `UUID` | Supabase auth.users FK |
| `email` | `TEXT` | 이메일 (UNIQUE) |
| `business_registration_number` | `TEXT` | 사업자등록번호 |
| `company_name` | `TEXT` | 회사명 |
| `representative_name` | `TEXT` | 대표자명 |
| `country_id` | `BIGINT` | `countries` 테이블 FK |
| `is_approved` | `BOOLEAN` | 관리자 승인 여부 |
| `is_admin` | `BOOLEAN` | 관리자 여부 |
| `tax_email` | `TEXT` | 세금계산서 수신 이메일 |
| `bank_name` | `TEXT` | 은행명 |
| `bank_account` | `TEXT` | 계좌번호 |
| `account_holder` | `TEXT` | 예금주 |

### 3. `brands` 테이블

- 브랜드 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `corporate_account_id` | `BIGINT` | `corporate_accounts` 테이블 FK |
| `name` | `TEXT` | 브랜드명 |
| `logo_url` | `TEXT` | 로고 이미지 URL |

### 4. `campaigns` 테이블

- 캠페인 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `brand_id` | `BIGINT` | `brands` 테이블 FK |
| `country_id` | `BIGINT` | `countries` 테이블 FK |
| `title` | `TEXT` | 캠페인 제목 |
| `description` | `TEXT` | 캠페인 설명 |
| `reward_amount` | `INTEGER` | 보상 금액 |
| `status` | `TEXT` | 상태 (draft, active, completed, cancelled) |

### 5. `payments` 테이블

- 결제 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `campaign_id` | `BIGINT` | `campaigns` 테이블 FK |
| `amount` | `INTEGER` | 결제 금액 |
| `currency` | `TEXT` | 통화 |
| `payment_method` | `TEXT` | 결제 방식 (bank_transfer) |
| `status` | `TEXT` | 상태 (pending, completed, failed) |

### 6. `tax_invoices` 테이블

- 세금계산서 요청 정보를 저장합니다.

| 컬럼명 | 데이터 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | PK, 자동 증가 |
| `corporate_account_id` | `BIGINT` | `corporate_accounts` 테이블 FK |
| `payment_id` | `BIGINT` | `payments` 테이블 FK |
| `status` | `TEXT` | 상태 (requested, issued, failed) |
| `external_api_ref` | `TEXT` | 외부 API 참조 ID |

