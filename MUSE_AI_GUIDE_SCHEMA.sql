-- ============================================
-- CNEC Korea - MUSE AI Guide 기능 스키마
-- Muse 등급 크리에이터 전용 AI 가이드 플랫폼
-- ============================================

-- 1. AI 가이드 분석 저장 테이블 (유튜브 분석, 아이디어 생성)
CREATE TABLE IF NOT EXISTS public.ai_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 분석 유형: 'youtube_analysis', 'idea_generation'
    guide_type TEXT NOT NULL,

    -- 입력 데이터 (유튜브 URL, 키워드 등)
    input_data JSONB NOT NULL,

    -- AI 분석 결과
    result JSONB,

    -- 상태
    status TEXT DEFAULT 'completed',

    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI 대본 생성 저장 테이블
CREATE TABLE IF NOT EXISTS public.ai_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 입력 정보
    brand_name TEXT,
    brand_info TEXT,
    story_concept TEXT,  -- 유머, 감동, 정보 등
    target_audience TEXT,
    additional_notes TEXT,

    -- 생성된 대본 (장면별)
    generated_script JSONB,
    -- 예시 구조:
    -- {
    --   "title": "대본 제목",
    --   "scenes": [
    --     {
    --       "scene_number": 1,
    --       "scene_title": "오프닝",
    --       "description": "장면 설명",
    --       "dialogue": "대사 내용",
    --       "camera_note": "카메라 노트"
    --     }
    --   ],
    --   "summary": "전체 요약"
    -- }

    -- 검증 결과
    verification_result JSONB,
    -- 예시 구조:
    -- {
    --   "overall_score": 85,
    --   "brand_alignment": 90,
    --   "audience_appeal": 80,
    --   "risk_assessment": [],
    --   "improvement_suggestions": [],
    --   "verified_at": "2024-01-01T00:00:00Z"
    -- }

    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'needs_revision'

    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- ai_guides RLS
ALTER TABLE public.ai_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_guides"
    ON public.ai_guides FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_guides"
    ON public.ai_guides FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_guides"
    ON public.ai_guides FOR DELETE
    USING (auth.uid() = user_id);

-- ai_scripts RLS
ALTER TABLE public.ai_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_scripts"
    ON public.ai_scripts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_scripts"
    ON public.ai_scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_scripts"
    ON public.ai_scripts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_scripts"
    ON public.ai_scripts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ai_guides_user_id ON public.ai_guides(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_guides_type ON public.ai_guides(guide_type);
CREATE INDEX IF NOT EXISTS idx_ai_guides_created_at ON public.ai_guides(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_scripts_user_id ON public.ai_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scripts_status ON public.ai_scripts(verification_status);
CREATE INDEX IF NOT EXISTS idx_ai_scripts_created_at ON public.ai_scripts(created_at DESC);

-- ============================================
-- 트리거 (updated_at 자동 갱신)
-- ============================================

CREATE TRIGGER update_ai_scripts_updated_at
    BEFORE UPDATE ON public.ai_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료
-- ============================================

SELECT 'MUSE AI Guide Schema Created Successfully!' AS status;
