import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';

/**
 * 세금계산서 서비스
 * 세금계산서 요청, 발행, 관리를 위한 서비스 함수들
 */
export const invoiceService = {
  /**
   * 세금계산서 상태 목록 조회
   * @returns {Promise<Array>} 세금계산서 상태 목록
   */
  async getInvoiceStatuses() {
    const { data, error } = await supabase
      .from('invoice_statuses')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 요청
   * @param {Object} requestData 요청 정보
   * @returns {Promise<Object>} 생성된 요청 정보
   */
  async requestInvoice(requestData) {
    const { data, error } = await supabase
      .from('invoice_requests')
      .insert([requestData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 요청 조회
   * @param {string} requestId 요청 ID
   * @returns {Promise<Object>} 요청 정보
   */
  async getInvoiceRequest(requestId) {
    const { data, error } = await supabase
      .from('invoice_requests')
      .select(`
        *,
        payment:payment_id(*),
        company:company_id(*)
      `)
      .eq('id', requestId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 기업의 세금계산서 요청 목록 조회
   * @param {string} companyId 기업 ID
   * @returns {Promise<Array>} 요청 목록
   */
  async getCompanyInvoiceRequests(companyId) {
    const { data, error } = await supabase
      .from('invoice_requests')
      .select(`
        *,
        payment:payment_id(id, amount, total_amount, created_at)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * 모든 세금계산서 요청 목록 조회 (관리자용)
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Array>} 요청 목록
   */
  async getAllInvoiceRequests(filters = {}) {
    let query = supabase
      .from('invoice_requests')
      .select(`
        *,
        payment:payment_id(id, amount, total_amount, created_at, campaign_id),
        company:company_id(id, name, business_number, tax_registration_number)
      `)
      .order('created_at', { ascending: false });
    
    // 필터 적용
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
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
   * 세금계산서 요청 처리 (승인/거부)
   * @param {string} requestId 요청 ID
   * @param {boolean} approve 승인 여부
   * @param {string} notes 메모
   * @returns {Promise<Object>} 처리 결과
   */
  async processInvoiceRequest(requestId, approve, notes = '') {
    const { data, error } = await supabase
      .rpc('process_invoice_request', {
        request_id: requestId,
        approve,
        notes
      });
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 정보 조회
   * @param {string} invoiceId 세금계산서 ID
   * @returns {Promise<Object>} 세금계산서 정보
   */
  async getInvoice(invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        status:status_id(name, code),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 결제에 대한 세금계산서 조회
   * @param {string} paymentId 결제 ID
   * @returns {Promise<Object>} 세금계산서 정보
   */
  async getInvoiceByPayment(paymentId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        status:status_id(name, code),
        items:invoice_items(*)
      `)
      .eq('payment_id', paymentId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: 결과가 없음
    return data;
  },

  /**
   * 기업의 세금계산서 목록 조회
   * @param {string} companyId 기업 ID
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Array>} 세금계산서 목록
   */
  async getCompanyInvoices(companyId, filters = {}) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        status:status_id(name, code),
        payment:payment_id(id, campaign_id)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    // 필터 적용
    if (filters.statusId) {
      query = query.eq('status_id', filters.statusId);
    }
    
    if (filters.startDate && filters.endDate) {
      query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  /**
   * 모든 세금계산서 목록 조회 (관리자용)
   * @param {Object} filters 필터 옵션
   * @returns {Promise<Object>} 세금계산서 목록 및 총 개수
   */
  async getAllInvoices(filters = {}) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        status:status_id(name, code),
        company:company_id(id, name, business_number),
        payment:payment_id(id, campaign_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 필터 적용
    if (filters.statusId) {
      query = query.eq('status_id', filters.statusId);
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
   * 세금계산서 상태 업데이트
   * @param {string} invoiceId 세금계산서 ID
   * @param {number} statusId 상태 ID
   * @param {string} notes 메모
   * @returns {Promise<Object>} 업데이트된 세금계산서 정보
   */
  async updateInvoiceStatus(invoiceId, statusId, notes = '') {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status_id: statusId,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 URL 업데이트 (PDF, XML 등)
   * @param {string} invoiceId 세금계산서 ID
   * @param {Object} urls URL 정보
   * @returns {Promise<Object>} 업데이트된 세금계산서 정보
   */
  async updateInvoiceUrls(invoiceId, urls) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...urls,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 발행 (외부 API 호출)
   * @param {string} invoiceId 세금계산서 ID
   * @returns {Promise<Object>} 발행 결과
   */
  async issueInvoice(invoiceId) {
    // 세금계산서 정보 조회
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('세금계산서를 찾을 수 없습니다.');
    
    // 기업 정보 조회
    const { data: company, error: companyError } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', invoice.company_id)
      .single();
    
    if (companyError) throw companyError;
    
    // 여기서는 실제 외부 API 호출 대신 시뮬레이션
    // 실제 구현 시 외부 API 호출 코드로 대체
    
    // 발행 성공 시뮬레이션
    const issuedStatusId = (await this.getInvoiceStatuses()).find(s => s.code === 'issued').id;
    
    // 세금계산서 상태 업데이트
    const updatedInvoice = await this.updateInvoiceStatus(
      invoiceId,
      issuedStatusId,
      '세금계산서가 성공적으로 발행되었습니다.'
    );
    
    // PDF URL 시뮬레이션
    const pdfUrl = `https://example.com/invoices/${invoiceId}.pdf`;
    const xmlUrl = `https://example.com/invoices/${invoiceId}.xml`;
    
    // URL 업데이트
    await this.updateInvoiceUrls(invoiceId, {
      invoice_url: pdfUrl,
      pdf_url: pdfUrl,
      xml_url: xmlUrl
    });
    
    return {
      success: true,
      invoiceId,
      pdfUrl,
      xmlUrl
    };
  },

  /**
   * 세금계산서 알림 조회
   * @param {string} userId 사용자 ID
   * @returns {Promise<Array>} 알림 목록
   */
  async getInvoiceNotifications(userId) {
    const { data, error } = await supabase
      .from('invoice_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 알림 읽음 처리
   * @param {string} notificationId 알림 ID
   * @returns {Promise<Object>} 업데이트된 알림 정보
   */
  async markNotificationAsRead(notificationId) {
    const { data, error } = await supabase
      .from('invoice_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 세금계산서 CSV 내보내기
   * @param {Array} invoices 세금계산서 목록
   * @returns {string} CSV 문자열
   */
  exportInvoicesToCSV(invoices) {
    if (!invoices || invoices.length === 0) {
      return '';
    }
    
    const headers = [
      '세금계산서 번호',
      '발행일',
      '기업명',
      '금액',
      '세금',
      '총액',
      '상태',
      '국가',
      '메모'
    ];
    
    const rows = invoices.map(invoice => [
      invoice.invoice_number,
      new Date(invoice.invoice_date).toLocaleString(),
      invoice.company?.name || '',
      formatCurrency(invoice.amount),
      formatCurrency(invoice.tax_amount),
      formatCurrency(invoice.total_amount),
      invoice.status?.name || '',
      invoice.country_code,
      invoice.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
};

export default invoiceService;
