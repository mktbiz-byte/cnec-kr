-- ============================================
-- CNEC Korea (KR) - Complete Database Schema
-- 한국 크리에이터 플랫폼 데이터베이스 스키마
-- ============================================

-- 1. pgcrypto 확장 활성화 (주민번호 암호화용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. user_profiles 테이블 (크리에이터 프로필)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    bio TEXT,
    age INTEGER,
    region TEXT,
    skin_type TEXT,
    
    -- SNS 정보
    instagram_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    other_sns_url TEXT,
    instagram_followers INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    youtube_subscribers INTEGER DEFAULT 0,
    
    -- 출금을 위한 한국 은행 정보
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_holder TEXT,
    
    -- 주민등록번호 (암호화 저장)
    resident_number_encrypted TEXT,
    
    -- 포인트 시스템
    points INTEGER DEFAULT 0,
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. campaigns 테이블 (캠페인)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    
    -- 캠페인 상세 정보
    product_name TEXT,
    product_description TEXT,
    product_link TEXT,
    
    -- 리워드 정보
    reward_type TEXT,
    reward_points INTEGER DEFAULT 0,
    reward_description TEXT,
    
    -- 캠페인 기간
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    
    -- 모집 정보
    total_slots INTEGER DEFAULT 0,
    remaining_slots INTEGER DEFAULT 0,
    
    -- 상태
    status TEXT DEFAULT 'active',
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 캠페인 질문 (JSON)
    questions JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. applications 테이블 (캠페인 지원)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 지원 정보
    status TEXT DEFAULT 'pending',
    answers JSONB,
    
    -- SNS 업로드 정보
    sns_upload_url TEXT,
    sns_upload_date TIMESTAMPTZ,
    notes TEXT,
    
    -- 포인트 지급 정보
    points_awarded INTEGER DEFAULT 0,
    points_awarded_at TIMESTAMPTZ,
    
    -- 선정 정보
    is_selected BOOLEAN DEFAULT FALSE,
    selected_at TIMESTAMPTZ,
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, user_id)
);

-- 5. withdrawals 테이블 (출금 신청 - 한국 은행 계좌 기반)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 출금 금액
    amount INTEGER NOT NULL,
    
    -- 한국 은행 정보
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_account_holder TEXT NOT NULL,
    
    -- 주민등록번호 (암호화 저장)
    resident_number_encrypted TEXT NOT NULL,
    
    -- 출금 사유
    reason TEXT,
    
    -- 상태
    status TEXT DEFAULT 'pending',
    
    -- 관리자 메모
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. point_transactions 테이블 (포인트 거래 내역)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 거래 정보
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    
    -- 관련 참조
    related_application_id UUID,
    related_withdrawal_id UUID,
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. creator_materials 테이블 (크리에이터 자료)
CREATE TABLE IF NOT EXISTS public.creator_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 자료 정보
    material_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    
    -- 지역 정보
    platform_region TEXT DEFAULT 'kr',
    country_code TEXT DEFAULT 'KR',
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. admin_users 테이블 (관리자)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- user_profiles RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- campaigns RLS (모든 사용자가 조회 가능)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns"
    ON public.campaigns FOR SELECT
    TO public
    USING (true);

-- applications RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
    ON public.applications FOR UPDATE
    USING (auth.uid() = user_id);

-- withdrawals RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
    ON public.withdrawals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- point_transactions RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.point_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- creator_materials RLS
ALTER TABLE public.creator_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materials"
    ON public.creator_materials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials"
    ON public.creator_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 헬퍼 함수
-- ============================================

-- 주민등록번호 암호화 함수
CREATE OR REPLACE FUNCTION encrypt_resident_number(resident_number TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(resident_number, encryption_key),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 주민등록번호 복호화 함수 (관리자 전용)
CREATE OR REPLACE FUNCTION decrypt_resident_number(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_text, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 스토리지 버킷 설정
-- ============================================

-- campaign-images 버킷 (공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- creator-materials 버킷 (비공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-materials', 'creator-materials', false)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 정책
CREATE POLICY "Public can view campaign images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'campaign-images');

CREATE POLICY "Authenticated users can upload creator materials"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'creator-materials' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view own materials"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'creator-materials' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_platform_region ON public.user_profiles(platform_region);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform_region ON public.campaigns(platform_region);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON public.applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_platform_region ON public.applications(platform_region);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_platform_region ON public.withdrawals(platform_region);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON public.point_transactions(transaction_type);

-- ============================================
-- 완료
-- ============================================

-- 스키마 생성 완료
SELECT 'CNEC Korea Database Schema Created Successfully!' AS status;

