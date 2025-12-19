// Supabase 설정
const SUPABASE_URL = 'https://psfwmzlnaboattocyupu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZndtemxuYWJvYXR0b2N5dXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTU2NzgsImV4cCI6MjA3NDE5MTY3OH0.59A4QPRwv8YjfasHu_NTTv0fH6YhG8L_mBkOZypfgwg';

// 전역 변수
let supabaseClient = null;
let isInitialized = false;

// Supabase 클라이언트 초기화 (즉시 실행)
async function initializeSupabase() {
    if (isInitialized && supabaseClient) {
        return supabaseClient;
    }

    try {
        console.log('🔄 Supabase 클라이언트 초기화 시작...');

        // Supabase 라이브러리 로드 대기
        let attempts = 0;
        const maxAttempts = 50;
        
        while (typeof window.supabase === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase 라이브러리를 로드할 수 없습니다.');
        }

        console.log('✅ Supabase 라이브러리 로드 완료');

        // 클라이언트 생성
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                redirectTo: window.location.origin,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            }
        });

        isInitialized = true;
        console.log('✅ Supabase 클라이언트 초기화 완료');
        
        return supabaseClient;

    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        throw error;
    }
}

// Supabase 클라이언트 가져오기
async function getSupabaseClient() {
    if (!supabaseClient) {
        await initializeSupabase();
    }
    return supabaseClient;
}

// Supabase API 래퍼 객체
const supabaseAPI = {
    // 클라이언트 참조
    client: null,

    // 초기화
    async init() {
        try {
            this.client = await getSupabaseClient();
            console.log('✅ Supabase API 래퍼 초기화 완료');
            return this.client;
        } catch (error) {
            console.error('❌ Supabase API 래퍼 초기화 실패:', error);
            throw error;
        }
    },

    // 인증 상태 확인
    async checkAuthStatus() {
        try {
            const client = await getSupabaseClient();
            const { data: { session }, error } = await client.auth.getSession();
            
            if (error) {
                console.error('❌ 인증 상태 확인 오류:', error);
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('❌ 인증 상태 확인 실패:', error);
            return null;
        }
    },

    // 로그아웃
    async signOut() {
        try {
            const client = await getSupabaseClient();
            const { error } = await client.auth.signOut();
            
            if (error) {
                console.error('❌ 로그아웃 오류:', error);
                return { error };
            }
            
            console.log('✅ 로그아웃 성공');
            return { error: null };
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            return { error };
        }
    },

    // 캠페인 목록 조회
    async getCampaigns() {
        try {
            console.log('📋 캠페인 목록 조회 시작');
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });
            
            console.log('📋 캠페인 목록 조회 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ getCampaigns 오류:', error);
            return { data: null, error };
        }
    },

    // 특정 캠페인 조회
    async getCampaignById(id) {
        try {
            console.log('📋 캠페인 조회 시작, ID:', id);
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();
            
            console.log('📋 캠페인 조회 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ getCampaignById 오류:', error);
            return { data: null, error };
        }
    },

    // 캠페인 생성 (누락된 함수 추가)
    async createCampaign(campaignData) {
        try {
            console.log('📝 캠페인 생성 시작:', campaignData);
            
            const client = await getSupabaseClient();
            
            // 캠페인 데이터 검증
            if (!campaignData.title || !campaignData.brand || !campaignData.reward_amount) {
                throw new Error('필수 필드가 누락되었습니다: title, brand, reward_amount');
            }
            
            // 데이터 정리
            const cleanData = {
                title: campaignData.title,
                brand_name: campaignData.brand,
                description: campaignData.description || '',
                reward_amount: parseInt(campaignData.reward_amount),
                platforms: campaignData.platforms || [],
                min_followers: parseInt(campaignData.min_followers) || 1000,
                min_posts_per_week: parseInt(campaignData.min_posts_per_week) || 3,
                questions: campaignData.questions || null,
                status: campaignData.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await client
                .from('campaigns')
                .insert([cleanData])
                .select()
                .single();
            
            console.log('📋 캠페인 생성 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ createCampaign 오류:', error);
            return { data: null, error };
        }
    },

    // 캠페인 업데이트
    async updateCampaign(id, updateData) {
        try {
            console.log('🔄 캠페인 업데이트 시작:', { id, updateData });
            
            const client = await getSupabaseClient();
            
            // 업데이트 시간 추가
            const cleanData = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await client
                .from('campaigns')
                .update(cleanData)
                .eq('id', id)
                .select()
                .single();
            
            console.log('📋 캠페인 업데이트 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ updateCampaign 오류:', error);
            return { data: null, error };
        }
    },

    // 캠페인 삭제
    async deleteCampaign(id) {
        try {
            console.log('🗑️ 캠페인 삭제 시작, ID:', id);
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('campaigns')
                .delete()
                .eq('id', id)
                .select()
                .single();
            
            console.log('📋 캠페인 삭제 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ deleteCampaign 오류:', error);
            return { data: null, error };
        }
    },

    // 응모 생성 (실제 applications 테이블 스키마에 맞춤)
    async createApplication(applicationData) {
        try {
            console.log('📝 응모 생성 시작:', applicationData);
            
            const client = await getSupabaseClient();
            
            // 데이터 검증 및 정리
            const cleanData = {
                campaign_id: parseInt(applicationData.campaign_id),
                user_email: applicationData.user_email?.trim(),
                user_name: applicationData.user_name?.trim() || null,
                skin_type: applicationData.skin_type?.trim() || null,
                age: applicationData.age ? parseInt(applicationData.age) : null,
                instagram_url: applicationData.instagram_url?.trim() || null,
                tiktok_url: applicationData.tiktok_url?.trim() || null,
                youtube_url: applicationData.youtube_url?.trim() || null,
                follower_count: applicationData.follower_count ? parseInt(applicationData.follower_count) : null,
                answers: applicationData.answers || null,
                status: applicationData.status || 'pending'
            };
            
            // 필수 필드 검증
            if (!cleanData.campaign_id || !cleanData.user_email) {
                throw new Error('캠페인 ID와 이메일은 필수입니다.');
            }
            
            console.log('📋 정리된 응모 데이터:', cleanData);
            
            const { data, error } = await client
                .from('applications')
                .insert(cleanData)
                .select()
                .single();
            
            console.log('📋 응모 생성 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ createApplication 오류:', error);
            return { data: null, error };
        }
    },

    // 응모 목록 조회
    async getApplications() {
        try {
            console.log('📋 응모 목록 조회 시작');
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('applications')
                .select(`
                    *,
                    campaigns (
                        id,
                        title,
                        brand_name,
                        reward_amount
                    ),
                    creators (
                        id,
                        name,
                        email,
                        instagram_username,
                        tiktok_username,
                        youtube_username
                    )
                `)
                .order('created_at', { ascending: false });
            
            console.log('📋 응모 목록 조회 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ getApplications 오류:', error);
            return { data: null, error };
        }
    },

    // 특정 캠페인의 응모 목록 조회
    async getApplicationsByCampaign(campaignId) {
        try {
            console.log('📋 캠페인별 응모 목록 조회 시작, 캠페인 ID:', campaignId);
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('applications')
                .select(`
                    *,
                    creators (
                        id,
                        name,
                        email,
                        instagram_username,
                        tiktok_username,
                        youtube_username,
                        instagram_followers,
                        tiktok_followers,
                        youtube_subscribers
                    )
                `)
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });
            
            console.log('📋 캠페인별 응모 목록 조회 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ getApplicationsByCampaign 오류:', error);
            return { data: null, error };
        }
    },

    // 응모 상태 업데이트
    async updateApplicationStatus(applicationId, status, adminNotes = '') {
        try {
            console.log('🔄 응모 상태 업데이트 시작:', { applicationId, status, adminNotes });
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('applications')
                .update({
                    status,
                    admin_notes: adminNotes,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationId)
                .select()
                .single();
            
            console.log('📋 응모 상태 업데이트 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ updateApplicationStatus 오류:', error);
            return { data: null, error };
        }
    },

    // 크리에이터 목록 조회
    async getCreators() {
        try {
            console.log('📋 크리에이터 목록 조회 시작');

            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            console.log('📋 크리에이터 목록 조회 결과:', { data, error });
            return { data, error };

        } catch (error) {
            console.error('❌ getCreators 오류:', error);
            return { data: null, error };
        }
    },

    // 크리에이터 상세 정보 조회
    async getCreatorById(id) {
        try {
            console.log('📋 크리에이터 조회 시작, ID:', id);

            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single();

            console.log('📋 크리에이터 조회 결과:', { data, error });
            return { data, error };

        } catch (error) {
            console.error('❌ getCreatorById 오류:', error);
            return { data: null, error };
        }
    },

    // 출금 요청 목록 조회
    async getWithdrawals() {
        try {
            console.log('📋 출금 요청 목록 조회 시작');
            
            const client = await getSupabaseClient();
            const { data, error } = await client
                .from('withdrawal_requests')
                .select(`
                    *,
                    user_profiles (
                        id,
                        name,
                        email
                    )
                `)
                .order('created_at', { ascending: false });
            
            console.log('📋 출금 요청 목록 조회 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ getWithdrawals 오류:', error);
            return { data: null, error };
        }
    },

    // 출금 요청 상태 업데이트
    async updateWithdrawalStatus(withdrawalId, status, adminNotes = '') {
        try {
            console.log('🔄 출금 요청 상태 업데이트 시작:', { withdrawalId, status, adminNotes });
            
            const client = await getSupabaseClient();
            const updateData = {
                status,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            };
            
            if (status === 'completed') {
                updateData.processed_at = new Date().toISOString();
            }
            
            const { data, error } = await client
                .from('withdrawal_requests')
                .update(updateData)
                .eq('id', withdrawalId)
                .select()
                .single();
            
            console.log('📋 출금 요청 상태 업데이트 결과:', { data, error });
            return { data, error };
            
        } catch (error) {
            console.error('❌ updateWithdrawalStatus 오류:', error);
            return { data: null, error };
        }
    },

    // 통계 데이터 조회
    async getStats() {
        try {
            console.log('📊 통계 데이터 조회 시작');
            
            const client = await getSupabaseClient();
            
            // 병렬로 여러 쿼리 실행
            const [campaignsResult, applicationsResult, creatorsResult, withdrawalsResult] = await Promise.all([
                client.from('campaigns').select('id, status, reward_amount'),
                client.from('applications').select('id, status'),
                client.from('user_profiles').select('id'),
                client.from('withdrawal_requests').select('id, status, amount')
            ]);
            
            const stats = {
                campaigns: {
                    total: campaignsResult.data?.length || 0,
                    active: campaignsResult.data?.filter(c => c.status === 'active').length || 0,
                    totalReward: campaignsResult.data?.reduce((sum, c) => sum + (c.reward_amount || 0), 0) || 0
                },
                applications: {
                    total: applicationsResult.data?.length || 0,
                    pending: applicationsResult.data?.filter(a => a.status === 'pending').length || 0,
                    approved: applicationsResult.data?.filter(a => a.status === 'approved').length || 0
                },
                creators: {
                    total: creatorsResult.data?.length || 0
                },
                withdrawals: {
                    total: withdrawalsResult.data?.length || 0,
                    pending: withdrawalsResult.data?.filter(w => w.status === 'pending').length || 0,
                    totalAmount: withdrawalsResult.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0
                }
            };
            
            console.log('📊 통계 데이터 조회 결과:', stats);
            return { data: stats, error: null };
            
        } catch (error) {
            console.error('❌ getStats 오류:', error);
            return { data: null, error };
        }
    }
};

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Supabase API 자동 초기화 시작');
        await supabaseAPI.init();
        console.log('✅ Supabase API 자동 초기화 완료');
    } catch (error) {
        console.error('❌ Supabase API 자동 초기화 실패:', error);
    }
});

// 전역 객체로 노출
window.supabaseAPI = supabaseAPI;
window.getSupabaseClient = getSupabaseClient;

console.log('📦 Supabase API 래퍼 로드 완료');
