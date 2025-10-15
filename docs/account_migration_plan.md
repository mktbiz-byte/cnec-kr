# 기존 계정 마이그레이션 계획

## 개요

이 문서는 cnec.jp 웹사이트의 인증 시스템 개선에 따른 기존 계정 마이그레이션 계획을 제공합니다. 새로운 인증 시스템으로 전환하면서 기존 사용자 계정과 데이터를 안전하게 마이그레이션하는 방법을 설명합니다.

## 마이그레이션 목표

1. **데이터 무결성 보장**: 모든 사용자 데이터가 손실 없이 마이그레이션되도록 보장
2. **서비스 중단 최소화**: 마이그레이션 과정에서 서비스 중단 시간 최소화
3. **보안 강화**: 새로운 인증 시스템의 보안 기능 활용
4. **사용자 경험 개선**: 마이그레이션 후 사용자 경험 향상
5. **다중 브랜드 지원**: 기존 계정을 다중 브랜드 구조에 맞게 조정

## 마이그레이션 대상

1. **사용자 계정**:
   - 관리자 계정
   - 기업 사용자 계정
   - 일반 사용자 계정

2. **관련 데이터**:
   - 사용자 프로필 정보
   - 기업 정보
   - 권한 설정
   - 활동 기록

## 마이그레이션 전략

### 1. 단계적 마이그레이션 접근법

마이그레이션은 다음과 같은 단계로 진행됩니다:

1. **준비 단계**: 데이터 백업, 마이그레이션 도구 준비
2. **테스트 마이그레이션**: 테스트 환경에서 마이그레이션 검증
3. **사용자 공지**: 마이그레이션 일정 및 영향 공지
4. **실제 마이그레이션**: 프로덕션 환경에서 마이그레이션 실행
5. **검증 및 모니터링**: 마이그레이션 결과 검증 및 문제 해결
6. **롤백 계획**: 문제 발생 시 롤백 절차

### 2. 데이터 매핑 전략

기존 데이터 구조와 새로운 데이터 구조 간의 매핑:

| 기존 테이블/필드 | 새 테이블/필드 | 변환 로직 |
|-----------------|---------------|----------|
| users.id | auth.users.id | UUID 형식 유지 |
| users.email | auth.users.email | 직접 복사 |
| users.password | auth.users.encrypted_password | 비밀번호 재해싱 필요 |
| users.role | auth.users.user_metadata.role | JSON 메타데이터로 변환 |
| companies.id | corporate_accounts.id | 새 ID 생성 및 매핑 테이블 유지 |
| companies.name | corporate_accounts.company_name | 직접 복사 |
| companies.business_number | corporate_accounts.business_number | 직접 복사 |

### 3. 비밀번호 처리 전략

비밀번호 마이그레이션은 다음 두 가지 방법 중 하나를 선택합니다:

1. **비밀번호 재설정 요구**:
   - 모든 사용자에게 비밀번호 재설정 이메일 발송
   - 보안성 높음, 사용자 불편함 있음

2. **비밀번호 해시 마이그레이션**:
   - 기존 비밀번호 해시를 새 시스템에 맞게 변환
   - 사용자 편의성 높음, 기술적 복잡성 있음

**선택된 전략**: 비밀번호 재설정 요구 (보안 강화를 위해)

## 마이그레이션 일정

| 단계 | 시작일 | 종료일 | 담당자 | 상태 |
|------|-------|-------|--------|------|
| 마이그레이션 계획 수립 | 2025-10-15 | 2025-10-20 | 개발팀 | 진행 중 |
| 마이그레이션 스크립트 개발 | 2025-10-21 | 2025-10-31 | 개발팀 | 예정 |
| 테스트 환경 마이그레이션 | 2025-11-01 | 2025-11-07 | 개발팀/QA팀 | 예정 |
| 사용자 공지 | 2025-11-08 | 2025-11-14 | 마케팅팀 | 예정 |
| 프로덕션 마이그레이션 | 2025-11-15 | 2025-11-16 | 개발팀/운영팀 | 예정 |
| 검증 및 모니터링 | 2025-11-16 | 2025-11-23 | QA팀/운영팀 | 예정 |

## 마이그레이션 스크립트

### 1. 데이터 추출 스크립트

```sql
-- 기존 사용자 데이터 추출
COPY (
  SELECT 
    id, 
    email, 
    role, 
    created_at, 
    updated_at
  FROM users
) TO '/tmp/users_export.csv' WITH CSV HEADER;

-- 기존 기업 데이터 추출
COPY (
  SELECT 
    id, 
    user_id, 
    name AS company_name, 
    business_number, 
    address, 
    phone, 
    created_at, 
    updated_at
  FROM companies
) TO '/tmp/companies_export.csv' WITH CSV HEADER;
```

### 2. 데이터 변환 스크립트

```python
#!/usr/bin/env python3

import csv
import json
import uuid
from datetime import datetime

# 사용자 데이터 변환
users = []
with open('/tmp/users_export.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        users.append({
            'id': row['id'],
            'email': row['email'],
            'role': row['role'],
            'user_metadata': json.dumps({
                'role': row['role'],
                'migrated_at': datetime.now().isoformat()
            }),
            'created_at': row['created_at'],
            'updated_at': datetime.now().isoformat()
        })

# 기업 데이터 변환
companies = []
with open('/tmp/companies_export.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        companies.append({
            'id': str(uuid.uuid4()),
            'old_id': row['id'],
            'auth_user_id': row['user_id'],
            'company_name': row['company_name'],
            'business_number': row['business_number'],
            'address': row['address'],
            'phone': row['phone'],
            'is_verified': True,
            'created_at': row['created_at'],
            'updated_at': datetime.now().isoformat()
        })

# 변환된 데이터 저장
with open('/tmp/users_transformed.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=users[0].keys())
    writer.writeheader()
    writer.writerows(users)

with open('/tmp/companies_transformed.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=companies[0].keys())
    writer.writeheader()
    writer.writerows(companies)
```

### 3. 데이터 가져오기 스크립트

```sql
-- 사용자 데이터 가져오기
BEGIN;

-- 기존 사용자를 auth.users 테이블로 가져오기
INSERT INTO auth.users (
  id, 
  email,
  email_confirmed_at,
  created_at, 
  updated_at,
  user_metadata
)
SELECT 
  id::uuid, 
  email,
  NOW(), -- 이메일 확인됨으로 설정
  created_at::timestamp, 
  updated_at::timestamp,
  user_metadata::jsonb
FROM users_import;

-- 기업 계정 데이터 가져오기
INSERT INTO corporate_accounts (
  id,
  auth_user_id,
  company_name,
  business_number,
  address,
  phone,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  id::uuid,
  auth_user_id::uuid,
  company_name,
  business_number,
  address,
  phone,
  is_verified,
  created_at::timestamp,
  updated_at::timestamp
FROM companies_import;

-- 매핑 테이블 생성 (기존 ID와 새 ID 매핑)
CREATE TABLE IF NOT EXISTS migration_mappings (
  old_id VARCHAR(255),
  new_id UUID,
  entity_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기업 ID 매핑 저장
INSERT INTO migration_mappings (old_id, new_id, entity_type)
SELECT old_id, id, 'company' FROM companies_import;

COMMIT;
```

## 사용자 공지 계획

### 1. 공지 일정

- **1차 공지**: 마이그레이션 2주 전
- **2차 공지**: 마이그레이션 1주 전
- **3차 공지**: 마이그레이션 1일 전
- **마이그레이션 완료 공지**: 마이그레이션 완료 직후

### 2. 공지 내용

**1차 공지 이메일 템플릿**:

```
제목: [중요] cnec.jp 계정 시스템 업그레이드 안내

안녕하세요, cnec.jp 회원님.

더 나은 서비스 제공을 위해 2025년 11월 15일에 계정 시스템을 업그레이드할 예정입니다.

■ 변경 사항
- 향상된 보안 기능
- 이메일 기반 로그인 시스템
- 다중 브랜드 지원 기능
- 캠페인 관리 및 결제 시스템 개선

■ 회원님께 미치는 영향
- 업그레이드 당일(11월 15일) 오전 2시부터 오전 6시까지 로그인 서비스가 일시 중단됩니다.
- 업그레이드 후 첫 로그인 시 비밀번호 재설정이 필요합니다.
- 기존 계정 정보와 데이터는 모두 안전하게 유지됩니다.

■ 준비 사항
- 업그레이드 전에 중요한 작업을 완료해 주세요.
- 등록된 이메일 주소가 최신 상태인지 확인해 주세요.

추가 문의사항이 있으시면 support@cnec.jp로 연락 주시기 바랍니다.

감사합니다.
cnec.jp 팀 드림
```

### 3. 지원 계획

- **지원 채널**: 이메일, 라이브 채팅, 전화 지원
- **지원 시간**: 마이그레이션 당일 및 이후 3일간 확장 운영 (오전 9시 ~ 오후 9시)
- **FAQ 페이지**: 마이그레이션 관련 자주 묻는 질문 및 답변 제공
- **문제 해결 가이드**: 일반적인 문제 해결 방법 제공

## 롤백 계획

마이그레이션 중 심각한 문제가 발생할 경우를 대비한 롤백 계획:

### 1. 롤백 결정 기준

다음 상황에서 롤백을 고려합니다:
- 30% 이상의 사용자가 로그인 문제 보고
- 데이터 손실 또는 불일치 발견
- 핵심 기능 작동 불가

### 2. 롤백 절차

1. **롤백 결정**: 운영팀과 개발팀의 공동 결정
2. **사용자 공지**: 롤백 결정 및 예상 시간 공지
3. **데이터베이스 복원**: 마이그레이션 전 백업에서 복원
4. **애플리케이션 롤백**: 이전 버전 배포
5. **검증**: 시스템 기능 검증
6. **완료 공지**: 롤백 완료 및 서비스 재개 공지

### 3. 롤백 스크립트

```sql
-- 롤백 스크립트
BEGIN;

-- 새 테이블 비우기
TRUNCATE TABLE corporate_accounts CASCADE;
TRUNCATE TABLE brands CASCADE;
TRUNCATE TABLE campaigns CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- 기존 사용자 복원 (백업에서)
INSERT INTO auth.users
SELECT * FROM auth_users_backup;

COMMIT;
```

## 마이그레이션 후 검증 계획

### 1. 데이터 검증

- **사용자 수 확인**: 마이그레이션 전후 사용자 수 일치 확인
- **기업 계정 확인**: 마이그레이션 전후 기업 계정 수 일치 확인
- **무작위 샘플 검증**: 무작위로 선택된 계정의 데이터 일치 확인

### 2. 기능 검증

- **로그인 테스트**: 다양한 유형의 계정으로 로그인 테스트
- **권한 테스트**: 각 역할별 권한 설정 확인
- **기능 테스트**: 핵심 기능 작동 확인

### 3. 성능 모니터링

- **로그인 응답 시간**: 마이그레이션 전후 로그인 응답 시간 비교
- **오류율 모니터링**: 인증 관련 오류 발생률 모니터링
- **서버 부하 모니터링**: 인증 서버 부하 모니터링

## 마이그레이션 리스크 및 완화 전략

| 리스크 | 영향 | 가능성 | 완화 전략 |
|-------|------|-------|----------|
| 데이터 손실 | 높음 | 낮음 | 전체 데이터베이스 백업, 단계적 마이그레이션 |
| 비밀번호 문제 | 중간 | 중간 | 비밀번호 재설정 메커니즘 강화, 지원팀 대기 |
| 서비스 중단 연장 | 높음 | 낮음 | 상세한 롤백 계획, 사전 테스트 마이그레이션 |
| 사용자 혼란 | 중간 | 높음 | 명확한 커뮤니케이션, 단계별 가이드 제공 |
| 성능 저하 | 중간 | 낮음 | 성능 테스트, 인프라 스케일 업 준비 |

## 결론 및 권장 사항

1. **철저한 테스트**: 마이그레이션 전 테스트 환경에서 여러 번 테스트
2. **단계적 접근**: 한 번에 모든 것을 마이그레이션하지 않고 단계적으로 진행
3. **명확한 커뮤니케이션**: 사용자에게 변경 사항과 영향을 명확히 안내
4. **지원 강화**: 마이그레이션 기간 동안 추가 지원 인력 배치
5. **모니터링 강화**: 마이그레이션 중 및 이후 시스템 모니터링 강화

이 마이그레이션 계획을 통해 cnec.jp의 인증 시스템을 안전하게 개선하고, 사용자 경험을 향상시키며, 새로운 기능을 원활하게 도입할 수 있을 것으로 기대합니다.
