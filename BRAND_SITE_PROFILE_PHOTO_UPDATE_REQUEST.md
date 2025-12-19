# 브랜드 사이트 프로필 사진 필드 수정 요청

## 요청일: 2024-12-19

## 변경 사항 요약

크리에이터 사이트(cnec.co.kr)에서 프로필 사진 업로드 기능이 `/profile` 페이지로 이동되었습니다. 브랜드 사이트에서 크리에이터 프로필 사진을 조회할 때 아래 사항을 확인해 주세요.

---

## 1. 데이터베이스 필드명

### 변경 전 (구)
```
user_profiles.profile_photo_url
```

### 변경 후 (현재)
```
user_profiles.profile_image
```

> **중요**: Korea Regional DB의 `user_profiles` 테이블에서 프로필 사진 URL은 `profile_image` 컬럼에 저장됩니다.

---

## 2. Supabase Storage 구조

### 버킷명
```
profile-photos
```

### 파일 경로 형식
```
{user_id}/{user_id}-{timestamp}.{extension}
```

### 예시
```
123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174000-1703001234567.jpg
```

---

## 3. 브랜드 사이트 수정 필요 코드

### 크리에이터 프로필 조회 시

```javascript
// 수정 전
const profilePhotoUrl = creator.profile_photo_url;

// 수정 후
const profilePhotoUrl = creator.profile_image;
```

### SQL 쿼리 예시

```sql
-- 수정 전
SELECT profile_photo_url FROM user_profiles WHERE id = :userId;

-- 수정 후
SELECT profile_image FROM user_profiles WHERE id = :userId;
```

### Supabase 쿼리 예시

```javascript
// 수정 전
const { data } = await supabase
  .from('user_profiles')
  .select('id, name, email, profile_photo_url')
  .eq('id', userId);

// 수정 후
const { data } = await supabase
  .from('user_profiles')
  .select('id, name, email, profile_image')
  .eq('id', userId);
```

---

## 4. 체크리스트

- [ ] `profile_photo_url` → `profile_image` 필드명 변경
- [ ] 크리에이터 목록 조회 쿼리 수정
- [ ] 크리에이터 상세 조회 쿼리 수정
- [ ] 캠페인 지원자 목록 조회 시 프로필 사진 필드 수정
- [ ] 선정 크리에이터 보고서에서 프로필 사진 필드 수정
- [ ] UI 컴포넌트에서 프로필 사진 표시 로직 수정

---

## 5. 이미지 URL 형식

프로필 사진 URL은 Supabase Storage의 Public URL 형식입니다:

```
https://{project-id}.supabase.co/storage/v1/object/public/profile-photos/{user_id}/{filename}
```

---

## 6. 참고 사항

- 프로필 사진이 없는 크리에이터의 경우 `profile_image` 값이 `null`입니다
- 이미지는 최대 10MB, 자동 압축되어 최대 2MB로 저장됩니다
- 지원 형식: JPG, PNG, GIF, WEBP

---

## 문의

수정 작업 중 문제가 있으면 크리에이터 사이트 개발팀에 문의해 주세요.
