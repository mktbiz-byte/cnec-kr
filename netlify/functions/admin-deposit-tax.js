const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { action, ...params } = JSON.parse(event.body)

    switch (action) {
      // ── 입금 내역 ──────────────────────────────────
      case 'list_deposits': {
        const { data, error } = await supabaseAdmin
          .from('deposit_records')
          .select('*, tax_invoices(*)')
          .order('deposit_date', { ascending: false })

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      case 'create_deposit': {
        const { company_id, company_name, depositor_name, amount, deposit_date, bank_name, memo, charge_request_id, confirmed_by } = params
        if (!amount) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: '입금 금액이 필요합니다' }) }
        }

        const insertData = {
          company_id: company_id || null,
          company_name: company_name || null,
          depositor_name: depositor_name || null,
          amount,
          deposit_date: deposit_date || new Date().toISOString(),
          bank_name: bank_name || null,
          memo: memo || null,
          charge_request_id: charge_request_id || null,
          confirmed_by: confirmed_by || null,
          status: 'confirmed',
          tax_invoice_status: 'pending'
        }

        const { data, error } = await supabaseAdmin
          .from('deposit_records')
          .insert(insertData)
          .select()
          .single()

        if (error) throw error

        // charge_request_id가 있으면 해당 요청 상태도 confirmed로 업데이트
        if (charge_request_id) {
          await supabaseAdmin
            .from('points_charge_requests')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by })
            .eq('id', charge_request_id)
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      case 'update_deposit': {
        const { id, ...updateFields } = params
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'id가 필요합니다' }) }
        }

        updateFields.updated_at = new Date().toISOString()
        const { data, error } = await supabaseAdmin
          .from('deposit_records')
          .update(updateFields)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      // ── 세금계산서 ──────────────────────────────────
      case 'list_tax_invoices': {
        const { data, error } = await supabaseAdmin
          .from('tax_invoices')
          .select('*, deposit_records(*)')
          .order('issue_date', { ascending: false })

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      case 'create_tax_invoice': {
        const { deposit_record_id, company_id, company_name, invoice_number, supply_amount, tax_amount, total_amount, issue_date, recipient_info, notes, created_by } = params

        if (!supply_amount || !issue_date) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: '공급가액과 발행일이 필요합니다' }) }
        }

        const calcTax = tax_amount ?? Math.round(supply_amount * 0.1)
        const calcTotal = total_amount ?? (supply_amount + calcTax)

        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('tax_invoices')
          .insert({
            deposit_record_id: deposit_record_id || null,
            company_id: company_id || null,
            company_name: company_name || null,
            invoice_number: invoice_number || null,
            supply_amount,
            tax_amount: calcTax,
            total_amount: calcTotal,
            issue_date,
            recipient_info: recipient_info || {},
            notes: notes || null,
            created_by: created_by || null
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        // deposit_record_id가 있으면 매칭 상태 업데이트
        if (deposit_record_id) {
          await supabaseAdmin
            .from('deposit_records')
            .update({
              tax_invoice_status: 'issued',
              tax_invoice_id: invoice.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', deposit_record_id)
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: invoice }) }
      }

      case 'match_deposit_invoice': {
        const { deposit_record_id, tax_invoice_id } = params
        if (!deposit_record_id || !tax_invoice_id) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: '입금 내역 ID와 세금계산서 ID가 모두 필요합니다' }) }
        }

        // 양방향 매칭
        const [depositRes, invoiceRes] = await Promise.all([
          supabaseAdmin
            .from('deposit_records')
            .update({ tax_invoice_id, tax_invoice_status: 'matched', updated_at: new Date().toISOString() })
            .eq('id', deposit_record_id)
            .select()
            .single(),
          supabaseAdmin
            .from('tax_invoices')
            .update({ deposit_record_id, updated_at: new Date().toISOString() })
            .eq('id', tax_invoice_id)
            .select()
            .single()
        ])

        if (depositRes.error) throw depositRes.error
        if (invoiceRes.error) throw invoiceRes.error

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: { deposit: depositRes.data, invoice: invoiceRes.data } }) }
      }

      case 'update_tax_invoice': {
        const { id, ...updateFields } = params
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'id가 필요합니다' }) }
        }

        updateFields.updated_at = new Date().toISOString()
        const { data, error } = await supabaseAdmin
          .from('tax_invoices')
          .update(updateFields)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      // ── 충전 요청 목록 (매칭용) ──────────────────────
      case 'list_charge_requests': {
        const { data, error } = await supabaseAdmin
          .from('points_charge_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) }
      }

      // ── 대시보드 통계 ──────────────────────────────────
      case 'get_summary': {
        const [depositsRes, invoicesRes, pendingRes] = await Promise.all([
          supabaseAdmin.from('deposit_records').select('amount, tax_invoice_status'),
          supabaseAdmin.from('tax_invoices').select('total_amount, status'),
          supabaseAdmin.from('deposit_records').select('id').eq('tax_invoice_status', 'pending')
        ])

        const totalDeposits = (depositsRes.data || []).reduce((sum, d) => sum + d.amount, 0)
        const totalInvoiced = (invoicesRes.data || []).filter(i => i.status !== 'cancelled').reduce((sum, i) => sum + i.total_amount, 0)
        const pendingInvoiceCount = (pendingRes.data || []).length

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              total_deposits: totalDeposits,
              total_deposit_count: (depositsRes.data || []).length,
              total_invoiced: totalInvoiced,
              total_invoice_count: (invoicesRes.data || []).length,
              pending_invoice_count: pendingInvoiceCount
            }
          })
        }
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: `알 수 없는 action: ${action}` }) }
    }
  } catch (error) {
    console.error('admin-deposit-tax 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
