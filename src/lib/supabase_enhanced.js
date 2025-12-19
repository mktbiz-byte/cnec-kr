import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// 데이터베이스 관련 함수들
export const database = {
  // 사용자 관련 함수
  users: {
    // 사용자 정보 가져오기
    async getById(userId) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data
    },
    
    // 사용자 정보 업데이트
    async update(userId, userData) {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('user_id', userId)
      
      if (error) throw error
      return data
    },
    
    // 모든 사용자 가져오기
    async getAll() {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  },
  
  // 캠페인 관련 함수
  campaigns: {
    // 모든 캠페인 가져오기
    async getAll() {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    // 캠페인 상세 정보 가져오기
    async getById(campaignId) {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      
      if (error) throw error
      return data
    },
    
    // 캠페인 생성
    async create(campaignData) {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
      
      if (error) throw error
      return data[0]
    },
    
    // 캠페인 업데이트
    async update(campaignId, campaignData) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', campaignId)
        .select()
      
      if (error) throw error
      return data[0]
    },
    
    // 캠페인 삭제
    async delete(campaignId) {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
      
      if (error) throw error
      return true
    }
  },
  
  // 신청서 관련 함수
  applications: {
    // 모든 신청서 가져오기
    async getAll() {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user_profiles:user_id (*),
          campaigns:campaign_id (*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 데이터 가공
      return data.map(app => ({
        ...app,
        user_name: app.user_profiles?.name,
        user_email: app.user_profiles?.email,
        campaign_title: app.campaigns?.title,
        campaign_brand: app.campaigns?.brand
      }))
    },
    
    // 특정 캠페인의 신청서 가져오기
    async getByCampaign(campaignId) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user_profiles:user_id (*),
          campaigns:campaign_id (*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 데이터 가공
      return data.map(app => ({
        ...app,
        user_name: app.user_profiles?.name,
        user_email: app.user_profiles?.email
      }))
    },
    
    // 특정 사용자의 신청서 가져오기
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          campaigns:campaign_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    // 신청서 상세 정보 가져오기
    async getById(applicationId) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user_profiles:user_id (*),
          campaigns:campaign_id (*)
        `)
        .eq('id', applicationId)
        .single()
      
      if (error) throw error
      return data
    },
    
    // 신청서 생성
    async create(applicationData) {
      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
      
      if (error) throw error
      return data[0]
    },
    
    // 신청서 업데이트
    async update(applicationId, applicationData) {
      const { data, error } = await supabase
        .from('applications')
        .update(applicationData)
        .eq('id', applicationId)
        .select()
      
      if (error) throw error
      return data[0]
    },
    
    // 신청서 삭제
    async delete(applicationId) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
      
      if (error) throw error
      return true
    }
  },
  
  // SNS 업로드 관련 함수
  snsUploads: {
    // 모든 SNS 업로드 가져오기
    async getAll() {
      const { data, error } = await supabase
        .from('sns_uploads')
        .select(`
          *,
          user_profiles:user_id (*),
          applications:application_id (*),
          campaigns:campaign_id (*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    // 특정 캠페인의 SNS 업로드 가져오기
    async getByCampaign(campaignId) {
      const { data, error } = await supabase
        .from('sns_uploads')
        .select(`
          *,
          user_profiles:user_id (*),
          applications:application_id (*),
          campaigns:campaign_id (*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    // 특정 사용자의 SNS 업로드 가져오기
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('sns_uploads')
        .select(`
          *,
          campaigns:campaign_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    // SNS 업로드 생성
    async create(uploadData) {
      const { data, error } = await supabase
        .from('sns_uploads')
        .insert([uploadData])
        .select()
      
      if (error) throw error
      return data[0]
    },
    
    // SNS 업로드 업데이트
    async update(uploadId, uploadData) {
      const { data, error } = await supabase
        .from('sns_uploads')
        .update(uploadData)
        .eq('id', uploadId)
        .select()
      
      if (error) throw error
      return data[0]
    }
  },
  
  // 출금 요청 관련 함수 (Master DB 표준: withdrawal_requests)
  withdrawals: {
    // 모든 출금 요청 가져오기
    async getAll() {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user_profiles:user_id (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    // 특정 사용자의 출금 요청 가져오기
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    // 출금 요청 생성
    async create(withdrawalData) {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert([withdrawalData])
        .select()

      if (error) throw error
      return data[0]
    },

    // 출금 요청 상태 업데이트
    async updateStatus(withdrawalId, status) {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', withdrawalId)
        .select()

      if (error) throw error
      return data[0]
    }
  },
  
  // 회사 보고서 관련 함수
  companies: {
    // 회사 정보 가져오기
    async getById(companyId) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()
      
      if (error) throw error
      return data
    },
    
    // 회사 전체 보고서 데이터 가져오기 (캠페인, 신청서, SNS 업로드 포함)
    async getCompanyFullReport(companyId) {
      try {
        // 회사 정보 가져오기
        const company = await this.getById(companyId)
        
        // 회사의 캠페인 가져오기
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
        
        if (campaignsError) throw campaignsError
        
        // 캠페인 ID 목록
        const campaignIds = campaigns.map(c => c.id)
        
        // 캠페인별 신청서 가져오기
        const { data: applications, error: applicationsError } = await supabase
          .from('applications')
          .select(`
            *,
            user_profiles:user_id (*),
            campaigns:campaign_id (*)
          `)
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false })
        
        if (applicationsError) throw applicationsError
        
        // 캠페인별 SNS 업로드 가져오기
        const snsUploads = {}
        
        for (const campaignId of campaignIds) {
          const { data: uploads, error: uploadsError } = await supabase
            .from('sns_uploads')
            .select(`
              *,
              user_profiles:user_id (*),
              applications:application_id (*)
            `)
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
          
          if (uploadsError) throw uploadsError
          snsUploads[campaignId] = uploads
        }
        
        return {
          company,
          campaigns,
          applications,
          snsUploads
        }
      } catch (error) {
        console.error('회사 보고서 데이터 로드 오류:', error)
        throw error
      }
    }
  },
  
  // 시스템 설정 관련 함수
  system: {
    // 시스템 설정 가져오기
    async getSettings() {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()
      
      if (error) {
        // 설정이 없는 경우 빈 객체 반환
        if (error.code === 'PGRST116') {
          return {}
        }
        throw error
      }
      
      return data
    },
    
    // 시스템 설정 업데이트
    async updateSettings(settings) {
      // 먼저 설정이 있는지 확인
      const { data: existingSettings } = await supabase
        .from('system_settings')
        .select('id')
        .single()
      
      if (existingSettings) {
        // 기존 설정 업데이트
        const { data, error } = await supabase
          .from('system_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
        
        if (error) throw error
        return data[0]
      } else {
        // 새 설정 생성
        const { data, error } = await supabase
          .from('system_settings')
          .insert([{
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
        
        if (error) throw error
        return data[0]
      }
    }
  }
}

export default database
