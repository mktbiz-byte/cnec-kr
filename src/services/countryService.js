import { supabase } from '../lib/supabase';

/**
 * 국가별 캠페인 관리 서비스
 */
const countryService = {
  /**
   * 모든 국가 목록 조회
   */
  async getAllCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('국가 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 활성화된 국가 목록 조회
   */
  async getActiveCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('활성화된 국가 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 캠페인 설정 조회
   * @param {string} countryCode - 국가 코드
   */
  async getCountryCampaignSettings(countryCode) {
    try {
      const { data, error } = await supabase
        .from('country_campaign_settings')
        .select(`
          *,
          country:countries(*)
        `)
        .eq('country.code', countryCode)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('국가별 캠페인 설정 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 결제 방법 조회
   * @param {string} countryCode - 국가 코드
   */
  async getCountryPaymentMethods(countryCode) {
    try {
      const { data, error } = await supabase
        .from('country_payment_methods')
        .select(`
          *,
          country:countries(*),
          payment_method:payment_methods(*)
        `)
        .eq('country.code', countryCode)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('국가별 결제 방법 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 캠페인 통계 조회
   */
  async getCountryCampaignStats() {
    try {
      const { data, error } = await supabase
        .from('country_campaign_stats')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('국가별 캠페인 통계 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 캠페인 목록 조회
   * @param {string} countryCode - 국가 코드
   * @param {Object} filters - 필터 옵션
   */
  async getCampaignsByCountry(countryCode, filters = {}) {
    try {
      let query = supabase.rpc('get_campaigns_by_country', { country_code_param: countryCode });
      
      // 필터 적용
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      
      // 정렬
      if (filters.orderBy) {
        query = query.order(filters.orderBy, { ascending: filters.ascending !== false });
      } else {
        query = query.order('start_date', { ascending: false });
      }
      
      // 페이지네이션
      if (filters.page && filters.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('국가별 캠페인 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 통합 캠페인 목록 조회
   * @param {Object} filters - 필터 옵션
   */
  async getIntegratedCampaigns(filters = {}) {
    try {
      let query = supabase.from('integrated_campaigns').select('*');
      
      // 필터 적용
      if (filters.countryCode) {
        query = query.eq('country_code', filters.countryCode);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      
      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      
      // 검색
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      
      // 정렬
      if (filters.orderBy) {
        query = query.order(filters.orderBy, { ascending: filters.ascending !== false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // 페이지네이션
      if (filters.page && filters.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data: data || [], count };
    } catch (error) {
      console.error('통합 캠페인 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 캠페인 생성 (국가별 설정 적용)
   * @param {Object} campaignData - 캠페인 데이터
   * @param {string} countryCode - 국가 코드
   */
  async createCampaign(campaignData, countryCode) {
    try {
      // 국가 ID 조회
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('code', countryCode)
        .single();
      
      if (countryError) throw countryError;
      
      // 국가별 설정 조회
      const settings = await this.getCountryCampaignSettings(countryCode);
      
      // 캠페인 데이터에 국가 ID 및 설정 적용
      const newCampaignData = {
        ...campaignData,
        country_id: countryData.id,
        country_specific_data: {
          currency_code: settings.country.currency_code,
          tax_rate: settings.country.tax_rate,
          fee_percentage: settings.default_fee_percentage
        }
      };
      
      // 캠페인 생성
      const { data, error } = await supabase
        .from('campaigns')
        .insert(newCampaignData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('캠페인 생성 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 API 설정 조회
   * @param {string} countryCode - 국가 코드
   * @param {string} apiType - API 유형
   */
  async getCountryApiSettings(countryCode, apiType) {
    try {
      const { data, error } = await supabase
        .from('country_api_settings')
        .select(`
          *,
          country:countries(*)
        `)
        .eq('country.code', countryCode)
        .eq('api_type', apiType)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('국가별 API 설정 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 국가별 통화 포맷
   * @param {number} amount - 금액
   * @param {string} countryCode - 국가 코드
   */
  async formatCurrency(amount, countryCode) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('currency_code, currency_symbol')
        .eq('code', countryCode)
        .single();
      
      if (error) throw error;
      
      const formatter = new Intl.NumberFormat(countryCode === 'kr' ? 'ko-KR' : 
                                             countryCode === 'jp' ? 'ja-JP' : 
                                             countryCode === 'us' ? 'en-US' : 
                                             countryCode === 'tw' ? 'zh-TW' : 'en-US', {
        style: 'currency',
        currency: data.currency_code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      return formatter.format(amount);
    } catch (error) {
      console.error('통화 포맷 오류:', error);
      // 기본 포맷 반환
      return `${amount.toLocaleString()}`;
    }
  },

  /**
   * 국가별 세금 계산
   * @param {number} amount - 금액
   * @param {string} countryCode - 국가 코드
   */
  async calculateTax(amount, countryCode) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('tax_rate')
        .eq('code', countryCode)
        .single();
      
      if (error) throw error;
      
      const taxRate = data.tax_rate;
      const taxAmount = amount * (taxRate / 100);
      
      return {
        taxRate,
        taxAmount,
        totalAmount: amount + taxAmount
      };
    } catch (error) {
      console.error('세금 계산 오류:', error);
      // 기본값 반환
      return {
        taxRate: 0,
        taxAmount: 0,
        totalAmount: amount
      };
    }
  }
};

export default countryService;
