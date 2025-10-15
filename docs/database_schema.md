# CNEC 데이터베이스 스키마 다이어그램

```mermaid
erDiagram
    auth_users {
        uuid id PK
        string email
        string encrypted_password
        timestamp created_at
        timestamp updated_at
    }
    
    corporate_accounts {
        bigint id PK
        uuid auth_user_id FK
        string business_registration_number
        string email
        string company_name
        string representative_name
        string start_date
        string phone_number
        string address
        boolean is_approved
        boolean is_admin
        string brand_name
        timestamp created_at
        timestamp updated_at
    }
    
    campaigns {
        bigint id PK
        bigint corporate_account_id FK
        string title
        string description
        integer reward_amount
        jsonb target_platforms
        string requirements
        timestamp start_date
        timestamp end_date
        string status
        integer max_creators
        timestamp created_at
        timestamp updated_at
    }
    
    campaign_applications {
        bigint id PK
        bigint campaign_id FK
        uuid user_id FK
        string status
        timestamp application_date
        timestamp approval_date
        timestamp completion_date
        string sns_post_url
        jsonb sns_post_engagement
        string creator_feedback
        string admin_notes
        timestamp created_at
        timestamp updated_at
    }
    
    payments {
        bigint id PK
        bigint corporate_account_id FK
        bigint campaign_id FK
        integer amount
        string currency
        string payment_method
        string payment_status
        timestamp payment_date
        string payment_reference
        string invoice_number
        string receipt_url
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    transactions {
        bigint id PK
        string transaction_type
        integer amount
        string currency
        uuid user_id FK
        bigint corporate_account_id FK
        bigint campaign_id FK
        bigint payment_id FK
        bigint application_id FK
        timestamp transaction_date
        string description
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    auth_users ||--o{ corporate_accounts : "has"
    corporate_accounts ||--o{ campaigns : "creates"
    campaigns ||--o{ campaign_applications : "receives"
    auth_users ||--o{ campaign_applications : "submits"
    corporate_accounts ||--o{ payments : "makes"
    campaigns ||--o{ payments : "funded by"
    auth_users ||--o{ transactions : "involved in"
    corporate_accounts ||--o{ transactions : "involved in"
    campaigns ||--o{ transactions : "related to"
    payments ||--o{ transactions : "generates"
    campaign_applications ||--o{ transactions : "generates"
```

## 테이블 설명

### auth.users
Supabase 인증 시스템에서 관리하는 사용자 계정 정보입니다. 모든 사용자(관리자, 기업, 크리에이터)의 기본 인증 정보를 저장합니다.

### corporate_accounts
기업 계정 정보를 저장합니다. 관리자 계정도 이 테이블에 `is_admin=true`로 저장됩니다.
- `auth_user_id`: auth.users 테이블과의 연결 키
- `business_registration_number`: 사업자등록번호 (더 이상 unique 제약 없음)
- `email`: 로그인에 사용되는 이메일 (unique)
- `brand_name`: 다중 브랜드 지원을 위한 브랜드명

### campaigns
기업이 생성한 캠페인 정보를 저장합니다.
- `corporate_account_id`: 캠페인을 생성한 기업 계정 ID
- `status`: 캠페인 상태 (draft, active, completed, cancelled)
- `target_platforms`: 대상 SNS 플랫폼 정보 (JSON 형식)

### campaign_applications
크리에이터의 캠페인 신청 정보를 저장합니다.
- `campaign_id`: 신청한 캠페인 ID
- `user_id`: 신청한 크리에이터의 사용자 ID
- `status`: 신청 상태 (pending, approved, rejected, completed)
- `sns_post_engagement`: SNS 게시물의 참여 지표 (좋아요, 댓글, 공유 등)

### payments
기업의 캠페인 비용 결제 정보를 저장합니다.
- `corporate_account_id`: 결제한 기업 계정 ID
- `campaign_id`: 결제와 관련된 캠페인 ID
- `payment_status`: 결제 상태 (pending, completed, failed, refunded)

### transactions
시스템 내 모든 금전적 거래 내역을 기록합니다.
- `transaction_type`: 거래 유형 (payment_in, creator_payment_out, refund 등)
- `user_id`: 거래와 관련된 사용자 ID (크리에이터)
- `corporate_account_id`: 거래와 관련된 기업 계정 ID
- `campaign_id`: 거래와 관련된 캠페인 ID
- `payment_id`: 거래와 관련된 결제 ID
- `application_id`: 거래와 관련된 캠페인 신청 ID
