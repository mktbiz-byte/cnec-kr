import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';

/**
 * 결제 서비스
 * 캠페인 결제 및 관리를 위한 서비스 함수들
 */
export const paymentService = {
  /**
   * 결제 방법 목록 조회
   * @returns {Promise<Array>} 결제 방법 목록
   */
  async getPaymentMethods() {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('id');
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 상태 목록 조회
   * @returns {Promise<Array>} 결제 상태 목록
   */
  async getPaymentStatuses() {
    const { data, error } = await supabase
      .from('payment_statuses')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 정보 생성
   * @param {Object} paymentData 결제 정보
   * @returns {Promise<Object>} 생성된 결제 정보
   */
  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 정보 조회
   * @param {string} paymentId 결제 ID
   * @returns {Promise<Object>} 결제 정보
   */
  async getPayment(paymentId) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_method:payment_method_id(name, code),
        payment_status:payment_status_id(name, code),
        campaign:campaign_id(id, name),
        company:company_id(id, name)
      `)
      .eq('id', paymentId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 상태 업데이트
   * @param {string} paymentId 결제 ID
   * @param {number} statusId 결제 상태 ID
   * @param {string} notes 메모
   * @returns {Promise<Object>} 업데이트된 결제 정보
   */
  async updatePaymentStatus(paymentId, statusId, notes = '') {
    const { data, error } = await supabase
      .from('payments')
      .update({
        payment_status_id: statusId,
        updated_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 캠페인 결제 정보 조회
   * @param {string} campaignId 캠페인 ID
   * @returns {Promise<Object>} 결제 정보
   */
  async getCampaignPayment(campaignId) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_method:payment_method_id(name, code),
        payment_status:payment_status_id(name, code)
      `)
      .eq('campaign_id', campaignId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: 결과가 없음
    return data;
  },

  /**
   * 기업의 결제 내역 조회
   * @param {string} companyId 기업 ID
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Array>} 결제 내역 목록
   */
  async getCompanyPayments(companyId, filters = {}) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        payment_method:payment_method_id(name, code),
        payment_status:payment_status_id(name, code),
        campaign:campaign_id(id, name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    // 필터 적용
    if (filters.status) {
      query = query.eq('payment_status_id', filters.status);
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 내역 조회 (관리자용)
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Array>} 결제 내역 목록
   */
  async getAllPayments(filters = {}) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        payment_method:payment_method_id(name, code),
        payment_status:payment_status_id(name, code),
        campaign:campaign_id(id, name),
        company:company_id(id, name)
      `)
      .order('created_at', { ascending: false });
    
    // 필터 적용
    if (filters.status) {
      query = query.eq('payment_status_id', filters.status);
    }
    
    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    
    if (filters.countryCode) {
      query = query.eq('country_code', filters.countryCode);
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    // 페이지네이션
    if (filters.page && filters.pageSize) {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    return { data, count };
  },

  /**
   * 결제 내역 통계 조회 (관리자용)
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Object>} 통계 정보
   */
  async getPaymentStats(filters = {}) {
    // 총 결제 금액
    let totalAmountQuery = supabase.rpc('sum_payments', {});
    
    // 결제 상태별 건수
    let statusCountQuery = supabase
      .from('payments')
      .select('payment_status_id, payment_status:payment_status_id(name, code), count', { count: 'exact' })
      .groupBy('payment_status_id, payment_status.name, payment_status.code');
    
    // 국가별 결제 금액
    let countryStatsQuery = supabase
      .from('payments')
      .select('country_code, sum(total_amount)')
      .groupBy('country_code');
    
    // 필터 적용
    if (filters.startDate && filters.endDate) {
      totalAmountQuery = totalAmountQuery.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
      statusCountQuery = statusCountQuery.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
      countryStatsQuery = countryStatsQuery.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    if (filters.countryCode) {
      totalAmountQuery = totalAmountQuery.eq('country_code', filters.countryCode);
      statusCountQuery = statusCountQuery.eq('country_code', filters.countryCode);
    }
    
    const [totalAmountResult, statusCountResult, countryStatsResult] = await Promise.all([
      totalAmountQuery,
      statusCountQuery,
      countryStatsQuery
    ]);
    
    if (totalAmountResult.error) throw totalAmountResult.error;
    if (statusCountResult.error) throw statusCountResult.error;
    if (countryStatsResult.error) throw countryStatsResult.error;
    
    return {
      totalAmount: totalAmountResult.data || 0,
      statusCounts: statusCountResult.data || [],
      countryStats: countryStatsResult.data || []
    };
  },

  /**
   * 결제 내역 CSV 내보내기
   * @param {Array} payments 결제 내역 목록
   * @returns {string} CSV 문자열
   */
  exportPaymentsToCSV(payments) {
    if (!payments || payments.length === 0) {
      return '';
    }
    
    const headers = [
      '결제 ID',
      '날짜',
      '기업명',
      '캠페인명',
      '국가',
      '금액',
      '세금',
      '총액',
      '결제 방법',
      '상태',
      '메모'
    ];
    
    const rows = payments.map(payment => [
      payment.id,
      new Date(payment.created_at).toLocaleString(),
      payment.company?.name || '',
      payment.campaign?.name || '',
      payment.country_code,
      formatCurrency(payment.amount),
      formatCurrency(payment.tax_amount),
      formatCurrency(payment.total_amount),
      payment.payment_method?.name || '',
      payment.payment_status?.name || '',
      payment.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  },

  /**
   * 결제 알림 조회
   * @param {string} userId 사용자 ID
   * @returns {Promise<Array>} 알림 목록
   */
  async getPaymentNotifications(userId) {
    const { data, error } = await supabase
      .from('payment_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제 알림 읽음 처리
   * @param {string} notificationId 알림 ID
   * @returns {Promise<Object>} 업데이트된 알림 정보
   */
  async markNotificationAsRead(notificationId) {
    const { data, error } = await supabase
      .from('payment_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export default paymentService;
