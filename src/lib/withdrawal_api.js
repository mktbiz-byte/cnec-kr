// PayPal 출금 시스템 API
import { database } from './supabase'

// withdrawal_requests 테이블 API (Master DB 표준)
const withdrawalAPI = {
  // 모든 출금 요청 조회
  async getAll() {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user_profiles!withdrawal_requests_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    })
  },

  // 사용자별 출금 내역 조회
  async getByUser(userId) {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    })
  },

  // 출금 요청 생성
  async create(withdrawalData) {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('withdrawal_requests')
        .insert([{
          user_id: withdrawalData.user_id,
          amount: withdrawalData.amount,
          bank_name: withdrawalData.bank_name,
          account_number: withdrawalData.account_number,
          account_holder: withdrawalData.account_holder,
          status: 'pending'
        }])
        .select()
        .single()
      if (error) throw error
      return data
    })
  },

  // 출금 상태 업데이트
  async updateStatus(id, status, processedBy = null, notes = null) {
    return database.safeQuery(async () => {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed' || status === 'rejected') {
        updateData.processed_at = new Date().toISOString()
        if (processedBy) updateData.processed_by = processedBy
      }

      if (notes) updateData.notes = notes

      const { data, error } = await database.supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    })
  },

  // 출금 요청 삭제
  async delete(id) {
    return database.safeQuery(async () => {
      const { error } = await database.supabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', id)
      if (error) throw error
    })
  }
}

// point_transactions 테이블 API (Master DB 표준)
const userPointsAPI = {
  // 사용자 총 포인트 조회
  async getUserTotalPoints(userId) {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('point_transactions')
        .select('amount')
        .eq('user_id', userId)

      if (error) throw error

      const totalPoints = data.reduce((sum, record) => sum + record.amount, 0)
      return totalPoints
    })
  },

  // 사용자 포인트 내역 조회
  async getUserPoints(userId) {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    })
  },

  // 포인트 차감 (출금 시)
  async deductPoints(userId, amount, reason = '출금 신청') {
    return database.safeQuery(async () => {
      const { data, error } = await database.supabase
        .from('point_transactions')
        .insert([{
          user_id: userId,
          amount: -amount,
          type: 'withdraw',
          description: reason
        }])
        .select()
        .single()
      if (error) throw error
      return data
    })
  }
}

export { withdrawalAPI, userPointsAPI }
