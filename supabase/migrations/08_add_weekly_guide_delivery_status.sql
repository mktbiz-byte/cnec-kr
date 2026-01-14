-- 4주 챌린지 주차별 가이드 발송 상태 컬럼 추가
-- 각 주차별로 가이드가 발송되었는지 추적하여 크리에이터에게 발송된 주차만 표시

ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_guide_delivered BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week1_guide_delivered_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_guide_delivered BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week2_guide_delivered_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_guide_delivered BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week3_guide_delivered_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_guide_delivered BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS week4_guide_delivered_at TIMESTAMPTZ;

-- 인덱스 추가 (4주 챌린지 캠페인 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_applications_week_guide_status
ON applications (week1_guide_delivered, week2_guide_delivered, week3_guide_delivered, week4_guide_delivered)
WHERE week1_guide_delivered IS NOT NULL;

COMMENT ON COLUMN applications.week1_guide_delivered IS '1주차 가이드 발송 여부';
COMMENT ON COLUMN applications.week1_guide_delivered_at IS '1주차 가이드 발송 시각';
COMMENT ON COLUMN applications.week2_guide_delivered IS '2주차 가이드 발송 여부';
COMMENT ON COLUMN applications.week2_guide_delivered_at IS '2주차 가이드 발송 시각';
COMMENT ON COLUMN applications.week3_guide_delivered IS '3주차 가이드 발송 여부';
COMMENT ON COLUMN applications.week3_guide_delivered_at IS '3주차 가이드 발송 시각';
COMMENT ON COLUMN applications.week4_guide_delivered IS '4주차 가이드 발송 여부';
COMMENT ON COLUMN applications.week4_guide_delivered_at IS '4주차 가이드 발송 시각';
