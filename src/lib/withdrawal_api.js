// PayPal 출금 시스템 API
import { database, supabase } from './supabase'

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

  // 출금 요청 생성 (잔액 검증 포함)
  async create(withdrawalData) {
    return database.safeQuery(async () => {
      const requestAmount = parseInt(withdrawalData.amount)
      if (isNaN(requestAmount) || requestAmount <= 0) {
        throw new Error('유효하지 않은 출금 금액입니다')
      }

      // 서버사이드 잔액 검증
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('id', withdrawalData.user_id)
        .single()

      if (profileError) {
        throw new Error('포인트 조회에 실패했습니다')
      }

      const currentPoints = profileData?.points || 0
      if (currentPoints < requestAmount) {
        throw new Error(`보유 포인트가 부족합니다. 보유: ${currentPoints.toLocaleString()}, 요청: ${requestAmount.toLocaleString()}`)
      }

      // 포인트 차감 (atomic guard: gte로 DB 레벨에서 재검증)
      const newPoints = currentPoints - requestAmount
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq('id', withdrawalData.user_id)
        .gte('points', requestAmount)
        .select()

      if (updateError) throw updateError

      if (!updateData || updateData.length === 0) {
        throw new Error('보유 포인트가 부족합니다. 다시 확인해주세요.')
      }

      // 출금 요청 저장
      const { data, error } = await database.supabase
        .from('withdrawal_requests')
        .insert([{
          user_id: withdrawalData.user_id,
          amount: requestAmount,
          bank_name: withdrawalData.bank_name,
          account_number: withdrawalData.account_number,
          account_holder: withdrawalData.account_holder,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) {
        // 출금 저장 실패 시 포인트 복구
        await supabase
          .from('user_profiles')
          .update({ points: currentPoints })
          .eq('id', withdrawalData.user_id)
        throw error
      }

      // point_transactions에 출금 기록 추가
      await supabase
        .from('point_transactions')
        .insert([{
          user_id: withdrawalData.user_id,
          amount: -requestAmount,
          transaction_type: 'withdraw',
          description: `[출금신청] ${requestAmount.toLocaleString()} | ${withdrawalData.bank_name} ${withdrawalData.account_number}`,
          related_withdrawal_id: data?.id || null
        }])

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
