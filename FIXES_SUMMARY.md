# CNEC Korea 수정 완료 사항

## 해결된 문제

### 1. 색상 테마 (보라색 → 파란색) ✅
- 모든 purple 클래스를 blue로 변경
- Hero 배경: from-blue-500 via-blue-600 to-cyan-500
- 커밋: a98ca4a7

### 2. User Profiles 동기화 ✅
- auth.users의 2명을 user_profiles에 삽입
- 자동 트리거 생성 (회원가입 시 자동 생성)
- SQL: FIX_KOREA_USER_PROFILES.sql

### 3. Storage Buckets 생성 ✅
- campaign-images, profile-photos 버킷 생성
- Public access 정책 설정
- SQL: CREATE_STORAGE_BUCKETS_KR.sql

## 아직 해결 필요

### 1. 로고 이미지
- public 디렉토리가 .gitignore에 포함되어 커밋 안됨
- 수동으로 Netlify에 업로드 필요

### 2. 캠페인 생성 오류
- "Mx.from is not a function" 오류
- 브라우저 콘솔 확인 필요

### 3. 마이페이지 오류
- RLS 정책 확인 필요
- 브라우저 콘솔 확인 필요

## 현재 사용자 (Korea DB)
1. howlabmkt@gmail.com
2. mkt_biz@cnec.co.kr (admin)
