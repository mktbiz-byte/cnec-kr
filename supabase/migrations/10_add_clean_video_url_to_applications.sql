-- Add clean_video_url columns to applications table for SNS upload clean version requirement
-- 클린본 URL 저장 컬럼 추가 (모든 캠페인 타입별)

-- 일반/기획형 캠페인용 클린본
ALTER TABLE applications ADD COLUMN IF NOT EXISTS clean_video_url TEXT;

-- 올리브영 캠페인용 클린본 (STEP 1, STEP 2)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step1_clean_video_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS step2_clean_video_url TEXT;

-- 4주 챌린지용 클린본 (Week 1, 2, 3, 4)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_clean_video_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_clean_video_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_clean_video_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_clean_video_url TEXT;

-- 코멘트 추가
COMMENT ON COLUMN applications.clean_video_url IS '일반/기획형 캠페인 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.step1_clean_video_url IS '올리브영 STEP 1 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.step2_clean_video_url IS '올리브영 STEP 2 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.week1_clean_video_url IS '4주 챌린지 Week 1 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.week2_clean_video_url IS '4주 챌린지 Week 2 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.week3_clean_video_url IS '4주 챌린지 Week 3 클린본 URL - 포인트 지급 필수';
COMMENT ON COLUMN applications.week4_clean_video_url IS '4주 챌린지 Week 4 클린본 URL - 포인트 지급 필수';
