-- 한국형 캠페인 (올리브영, 4주 챌린지)을 위한 컬럼 추가
-- applications 테이블에 SNS URL 및 광고코드 개별 컬럼 추가

-- =====================================================
-- 올리브영 캠페인 컬럼들
-- =====================================================

-- SNS URL (3개: 릴스 2개 + 스토리 1개)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step1_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step2_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step3_url TEXT;

-- 영상 폴더 경로
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step1_2_video_folder TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step3_video_folder TEXT;

-- 광고코드 (개별 컬럼)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step1_2_partnership_code TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step3_partnership_code TEXT;

-- =====================================================
-- 4주 챌린지 캠페인 컬럼들
-- =====================================================

-- SNS URL (4개: 주차별)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_url TEXT;

-- 영상 폴더 경로 (4개: 주차별)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_video TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_video TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_video TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_video TEXT;

-- 광고코드 (개별 컬럼)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_partnership_code TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_partnership_code TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_partnership_code TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_partnership_code TEXT;

-- =====================================================
-- SNS 업로드 관련 공통 컬럼
-- =====================================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sns_upload_date TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 컬럼 설명 추가
-- =====================================================
COMMENT ON COLUMN applications.step1_url IS '올리브영 STEP 1 SNS URL (릴스)';
COMMENT ON COLUMN applications.step2_url IS '올리브영 STEP 2 SNS URL (릴스)';
COMMENT ON COLUMN applications.step3_url IS '올리브영 STEP 3 SNS URL (스토리)';
COMMENT ON COLUMN applications.step1_2_video_folder IS '올리브영 STEP 1&2 영상 폴더 경로';
COMMENT ON COLUMN applications.step3_video_folder IS '올리브영 STEP 3 영상 폴더 경로';
COMMENT ON COLUMN applications.step1_2_partnership_code IS '올리브영 STEP 1&2 광고코드';
COMMENT ON COLUMN applications.step3_partnership_code IS '올리브영 STEP 3 광고코드';

COMMENT ON COLUMN applications.week1_url IS '4주 챌린지 Week 1 SNS URL';
COMMENT ON COLUMN applications.week2_url IS '4주 챌린지 Week 2 SNS URL';
COMMENT ON COLUMN applications.week3_url IS '4주 챌린지 Week 3 SNS URL';
COMMENT ON COLUMN applications.week4_url IS '4주 챌린지 Week 4 SNS URL';
COMMENT ON COLUMN applications.week1_video IS '4주 챌린지 Week 1 영상 폴더 경로';
COMMENT ON COLUMN applications.week2_video IS '4주 챌린지 Week 2 영상 폴더 경로';
COMMENT ON COLUMN applications.week3_video IS '4주 챌린지 Week 3 영상 폴더 경로';
COMMENT ON COLUMN applications.week4_video IS '4주 챌린지 Week 4 영상 폴더 경로';
COMMENT ON COLUMN applications.week1_partnership_code IS '4주 챌린지 Week 1 광고코드';
COMMENT ON COLUMN applications.week2_partnership_code IS '4주 챌린지 Week 2 광고코드';
COMMENT ON COLUMN applications.week3_partnership_code IS '4주 챌린지 Week 3 광고코드';
COMMENT ON COLUMN applications.week4_partnership_code IS '4주 챌린지 Week 4 광고코드';

COMMENT ON COLUMN applications.sns_upload_date IS 'SNS 업로드 완료 일시';
