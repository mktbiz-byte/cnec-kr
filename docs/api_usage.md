# 국세청 사업자등록정보 진위확인 API 사용법

## 1. 개요

국세청에서 제공하는 Open API를 통해 사업자등록정보의 진위 여부를 확인할 수 있습니다. 이 문서는 해당 API의 사용법을 정리합니다.

## 2. API 정보

- **API Endpoint**: `https://api.odcloud.kr/api/nts-businessman/v1/validate`
- **HTTP Method**: `POST`
- **Content-Type**: `application/json`

## 3. 요청

### 3.1. 헤더

| Key           | Value                               |
|---------------|-------------------------------------|
| `Authorization` | `Infuser [인증키]` (디코딩된 키 사용) |

### 3.2. 본문 (Body)

요청 본문은 JSON 형식이며, 다음과 같은 필드를 포함해야 합니다.

```json
{
  "businesses": [
    {
      "b_no": "사업자등록번호",
      "start_dt": "개업일자",
      "p_nm": "대표자명"
    }
  ]
}
```

- `b_no`: 사업자등록번호 (하이픈 `-` 제외)
- `start_dt`: 개업일자 (YYYYMMDD 형식)
- `p_nm`: 대표자명

## 4. 응답

### 4.1. 성공

응답 본문은 JSON 형식이며, 다음과 같은 구조를 가집니다.

```json
{
  "request_cnt": 1,
  "valid_cnt": 1,
  "status_code": "OK",
  "data": [
    {
      "b_no": "사업자등록번호",
      "valid": "01",
      "valid_msg": "국세청에 등록된 사업자등록번호입니다."
    }
  ]
}
```

- `valid`: `01` (유효), `02` (유효하지 않음)

### 4.2. 실패

인증키 오류 등 API 호출에 실패하면 다음과 같은 응답을 받게 됩니다.

```json
{
  "status_code": "401",
  "message": "등록되지 않은 인증키입니다."
}
```

## 5. 인증키 발급

공공데이터포털(`data.go.kr`)에서 '국세청_사업자등록정보 진위확인 및 상태조회 서비스'를 검색하여 활용신청을 통해 인증키를 발급받을 수 있습니다.

