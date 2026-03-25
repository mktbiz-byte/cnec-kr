import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import AdminNavigation from './AdminNavigation'
import {
  Search, RefreshCw, Plus, FileText, Receipt, Link2, AlertTriangle,
  Check, X, Eye, Edit, Download, ChevronDown, ChevronUp, Filter
} from 'lucide-react'

const API_URL = '/.netlify/functions/admin-deposit-tax'

const callApi = async (action, params = {}) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || '요청 실패')
  return data.data
}

const formatAmount = (amount) => {
  if (!amount) return '₩0'
  return `₩${Number(amount).toLocaleString()}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}

const TAX_INVOICE_STATUS_MAP = {
  pending: { label: '미발행', color: 'bg-red-100 text-red-800' },
  issued: { label: '발행됨', color: 'bg-blue-100 text-blue-800' },
  matched: { label: '매칭완료', color: 'bg-green-100 text-green-800' },
  not_required: { label: '불필요', color: 'bg-gray-100 text-gray-600' }
}

const INVOICE_STATUS_MAP = {
  issued: { label: '발행', color: 'bg-blue-100 text-blue-800' },
  sent: { label: '발송완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-800' }
}

const AdminDepositTaxInvoice = () => {
  const { language } = useLanguage()

  // 탭
  const [selectedTab, setSelectedTab] = useState('deposits')

  // 데이터
  const [deposits, setDeposits] = useState([])
  const [taxInvoices, setTaxInvoices] = useState([])
  const [chargeRequests, setChargeRequests] = useState([])
  const [summary, setSummary] = useState(null)

  // UI 상태
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // 모달
  const [depositModal, setDepositModal] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [matchModal, setMatchModal] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  // 폼
  const [depositForm, setDepositForm] = useState({
    company_name: '', depositor_name: '', amount: '', deposit_date: new Date().toISOString().split('T')[0],
    bank_name: '', memo: '', charge_request_id: ''
  })

  const [invoiceForm, setInvoiceForm] = useState({
    deposit_record_id: '', company_name: '', invoice_number: '',
    supply_amount: '', tax_amount: '', issue_date: new Date().toISOString().split('T')[0],
    recipient_info: { business_number: '', representative: '', address: '' }, notes: ''
  })

  const [matchForm, setMatchForm] = useState({ deposit_record_id: '', tax_invoice_id: '' })

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [depositsData, invoicesData, requestsData, summaryData] = await Promise.all([
        callApi('list_deposits'),
        callApi('list_tax_invoices'),
        callApi('list_charge_requests'),
        callApi('get_summary')
      ])
      setDeposits(depositsData || [])
      setTaxInvoices(invoicesData || [])
      setChargeRequests(requestsData || [])
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 성공 메시지 자동 제거
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // ── 입금 등록 ──────────────────────────────
  const handleCreateDeposit = async () => {
    if (!depositForm.amount || Number(depositForm.amount) <= 0) {
      setError('입금 금액을 입력하세요')
      return
    }
    try {
      await callApi('create_deposit', {
        ...depositForm,
        amount: Number(depositForm.amount),
        company_id: depositForm.charge_request_id
          ? chargeRequests.find(r => r.id === depositForm.charge_request_id)?.company_id
          : null,
        confirmed_by: 'admin'
      })
      setSuccess('입금 내역이 등록되었습니다')
      setDepositModal(false)
      setDepositForm({ company_name: '', depositor_name: '', amount: '', deposit_date: new Date().toISOString().split('T')[0], bank_name: '', memo: '', charge_request_id: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── 세금계산서 발행 ──────────────────────────────
  const handleCreateInvoice = async () => {
    if (!invoiceForm.supply_amount || Number(invoiceForm.supply_amount) <= 0) {
      setError('공급가액을 입력하세요')
      return
    }
    try {
      const supplyAmount = Number(invoiceForm.supply_amount)
      const taxAmount = invoiceForm.tax_amount ? Number(invoiceForm.tax_amount) : Math.round(supplyAmount * 0.1)

      await callApi('create_tax_invoice', {
        ...invoiceForm,
        supply_amount: supplyAmount,
        tax_amount: taxAmount,
        total_amount: supplyAmount + taxAmount,
        created_by: 'admin'
      })
      setSuccess('세금계산서가 발행되었습니다')
      setInvoiceModal(false)
      setInvoiceForm({
        deposit_record_id: '', company_name: '', invoice_number: '',
        supply_amount: '', tax_amount: '', issue_date: new Date().toISOString().split('T')[0],
        recipient_info: { business_number: '', representative: '', address: '' }, notes: ''
      })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── 매칭 ──────────────────────────────
  const handleMatch = async () => {
    if (!matchForm.deposit_record_id || !matchForm.tax_invoice_id) {
      setError('입금 내역과 세금계산서를 모두 선택하세요')
      return
    }
    try {
      await callApi('match_deposit_invoice', matchForm)
      setSuccess('매칭이 완료되었습니다')
      setMatchModal(false)
      setMatchForm({ deposit_record_id: '', tax_invoice_id: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── 세금계산서 불필요 처리 ──────────────────────────────
  const handleMarkNotRequired = async (depositId) => {
    try {
      await callApi('update_deposit', { id: depositId, tax_invoice_status: 'not_required' })
      setSuccess('세금계산서 불필요 처리되었습니다')
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── 입금에서 바로 세금계산서 발행 ──────────────────────────────
  const handleIssueFromDeposit = (deposit) => {
    setInvoiceForm({
      deposit_record_id: deposit.id,
      company_name: deposit.company_name || '',
      invoice_number: '',
      supply_amount: String(Math.round(deposit.amount / 1.1)),
      tax_amount: String(deposit.amount - Math.round(deposit.amount / 1.1)),
      issue_date: new Date().toISOString().split('T')[0],
      recipient_info: { business_number: '', representative: '', address: '' },
      notes: `입금 ${formatAmount(deposit.amount)} 대응`
    })
    setInvoiceModal(true)
  }

  // ── 필터링 ──────────────────────────────
  const filteredDeposits = deposits.filter(d => {
    const matchSearch = !searchTerm ||
      (d.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.depositor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.memo || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = !statusFilter || d.tax_invoice_status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredInvoices = taxInvoices.filter(i => {
    const matchSearch = !searchTerm ||
      (i.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = !statusFilter || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const unmatchedDeposits = deposits.filter(d => d.tax_invoice_status === 'pending')
  const unmatchedInvoices = taxInvoices.filter(i => !i.deposit_record_id && i.status !== 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">입금 & 세금계산서 관리</h1>
          <p className="text-gray-500 mt-1">입금 확인, 세금계산서 발행 및 매칭을 관리합니다</p>
        </div>

        {/* 알림: 미발행 세금계산서 */}
        {summary && summary.pending_invoice_count > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">
                세금계산서 미발행 입금이 {summary.pending_invoice_count}건 있습니다
              </p>
              <p className="text-amber-600 text-sm">세금계산서를 발행하거나 매칭해주세요</p>
            </div>
          </div>
        )}

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4 text-red-500" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <Check className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {/* 통계 카드 */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">총 입금</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(summary.total_deposits)}</p>
              <p className="text-xs text-gray-400">{summary.total_deposit_count}건</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">총 세금계산서</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(summary.total_invoiced)}</p>
              <p className="text-xs text-gray-400">{summary.total_invoice_count}건</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">미발행</p>
              <p className="text-lg font-bold text-red-600">{summary.pending_invoice_count}건</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">충전 요청</p>
              <p className="text-lg font-bold text-gray-900">{chargeRequests.length}건</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">매칭 가능</p>
              <p className="text-lg font-bold text-purple-600">{Math.min(unmatchedDeposits.length, unmatchedInvoices.length)}건</p>
            </div>
          </div>
        )}

        {/* 탭 + 액션 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedTab('deposits'); setStatusFilter(''); setSearchTerm('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'deposits' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <Receipt className="w-4 h-4 inline mr-1" /> 입금 내역
            </button>
            <button
              onClick={() => { setSelectedTab('invoices'); setStatusFilter(''); setSearchTerm('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'invoices' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" /> 세금계산서
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={loadData} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 inline ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setDepositModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4 inline mr-1" /> 입금 등록
            </button>
            <button onClick={() => setInvoiceModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <Plus className="w-4 h-4 inline mr-1" /> 세금계산서 발행
            </button>
            <button onClick={() => setMatchModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
              <Link2 className="w-4 h-4 inline mr-1" /> 매칭
            </button>
          </div>
        </div>

        {/* 검색/필터 */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="회사명, 입금자명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">전체 상태</option>
            {selectedTab === 'deposits' ? (
              <>
                <option value="pending">미발행</option>
                <option value="issued">발행됨</option>
                <option value="matched">매칭완료</option>
                <option value="not_required">불필요</option>
              </>
            ) : (
              <>
                <option value="issued">발행</option>
                <option value="sent">발송완료</option>
                <option value="cancelled">취소</option>
              </>
            )}
          </select>
        </div>

        {/* 입금 내역 탭 */}
        {selectedTab === 'deposits' && (
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩 중...</div>
            ) : filteredDeposits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">입금 내역이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">입금일</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">회사명</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">입금자</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">금액</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">은행</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">세금계산서</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">메모</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredDeposits.map((deposit) => {
                      const statusInfo = TAX_INVOICE_STATUS_MAP[deposit.tax_invoice_status] || TAX_INVOICE_STATUS_MAP.pending
                      return (
                        <tr key={deposit.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(deposit.deposit_date)}</td>
                          <td className="px-4 py-3">{deposit.company_name || '-'}</td>
                          <td className="px-4 py-3">{deposit.depositor_name || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatAmount(deposit.amount)}</td>
                          <td className="px-4 py-3">{deposit.bank_name || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{deposit.memo || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {deposit.tax_invoice_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleIssueFromDeposit(deposit)}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"
                                    title="세금계산서 발행"
                                  >
                                    <FileText className="w-3 h-3 inline" /> 발행
                                  </button>
                                  <button
                                    onClick={() => handleMarkNotRequired(deposit.id)}
                                    className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100"
                                    title="불필요 처리"
                                  >
                                    불필요
                                  </button>
                                </>
                              )}
                              {deposit.tax_invoice_status === 'matched' && deposit.tax_invoices && (
                                <button
                                  onClick={() => setDetailModal({ type: 'invoice', data: deposit.tax_invoices })}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                                >
                                  <Eye className="w-3 h-3 inline" /> 계산서
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 세금계산서 탭 */}
        {selectedTab === 'invoices' && (
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩 중...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">세금계산서가 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">발행일</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">계산서번호</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">회사명</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">공급가액</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">세액</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">합계</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">입금 매칭</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvoices.map((invoice) => {
                      const statusInfo = INVOICE_STATUS_MAP[invoice.status] || INVOICE_STATUS_MAP.issued
                      const hasMatch = !!invoice.deposit_record_id
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(invoice.issue_date)}</td>
                          <td className="px-4 py-3 font-mono text-xs">{invoice.invoice_number || '-'}</td>
                          <td className="px-4 py-3">{invoice.company_name || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatAmount(invoice.supply_amount)}</td>
                          <td className="px-4 py-3 text-right">{formatAmount(invoice.tax_amount)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatAmount(invoice.total_amount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasMatch ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" /> 매칭됨
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">미매칭</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {invoice.status === 'issued' && (
                                <button
                                  onClick={async () => {
                                    await callApi('update_tax_invoice', { id: invoice.id, status: 'sent' })
                                    setSuccess('발송 완료 처리되었습니다')
                                    loadData()
                                  }}
                                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100"
                                >
                                  발송완료
                                </button>
                              )}
                              {invoice.notes && (
                                <button
                                  onClick={() => setDetailModal({ type: 'invoice_detail', data: invoice })}
                                  className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 입금 등록 모달 ── */}
        {depositModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">입금 내역 등록</h2>
                  <button onClick={() => setDepositModal(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  {/* 충전 요청 연결 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">충전 요청 연결 (선택)</label>
                    <select
                      value={depositForm.charge_request_id}
                      onChange={(e) => {
                        const reqId = e.target.value
                        setDepositForm(prev => ({ ...prev, charge_request_id: reqId }))
                        if (reqId) {
                          const req = chargeRequests.find(r => r.id === reqId)
                          if (req) {
                            setDepositForm(prev => ({
                              ...prev,
                              amount: String(req.amount),
                              company_name: req.bank_transfer_info?.campaign_title ? `캠페인: ${req.bank_transfer_info.campaign_title}` : prev.company_name
                            }))
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">직접 입력</option>
                      {chargeRequests.filter(r => r.status === 'pending').map(req => (
                        <option key={req.id} value={req.id}>
                          {formatAmount(req.amount)} - {req.bank_transfer_info?.campaign_title || '포인트 충전'} ({formatDate(req.created_at)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                      <input
                        type="text" value={depositForm.company_name}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="회사명"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">입금자명</label>
                      <input
                        type="text" value={depositForm.depositor_name}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, depositor_name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="입금자명"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">입금 금액 *</label>
                      <input
                        type="number" value={depositForm.amount}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">입금일</label>
                      <input
                        type="date" value={depositForm.deposit_date}
                        onChange={(e) => setDepositForm(prev => ({ ...prev, deposit_date: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                    <input
                      type="text" value={depositForm.bank_name}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="입금 은행"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                    <textarea
                      value={depositForm.memo}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, memo: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="메모"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setDepositModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    취소
                  </button>
                  <button onClick={handleCreateDeposit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    등록
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 세금계산서 발행 모달 ── */}
        {invoiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">세금계산서 발행</h2>
                  <button onClick={() => setInvoiceModal(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  {/* 입금 연결 */}
                  {!invoiceForm.deposit_record_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">입금 내역 연결 (선택)</label>
                      <select
                        value={invoiceForm.deposit_record_id}
                        onChange={(e) => {
                          const depId = e.target.value
                          setInvoiceForm(prev => ({ ...prev, deposit_record_id: depId }))
                          if (depId) {
                            const dep = deposits.find(d => d.id === depId)
                            if (dep) {
                              setInvoiceForm(prev => ({
                                ...prev,
                                company_name: dep.company_name || '',
                                supply_amount: String(Math.round(dep.amount / 1.1)),
                                tax_amount: String(dep.amount - Math.round(dep.amount / 1.1))
                              }))
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">직접 입력</option>
                        {unmatchedDeposits.map(dep => (
                          <option key={dep.id} value={dep.id}>
                            {formatAmount(dep.amount)} - {dep.company_name || dep.depositor_name || '미상'} ({formatDate(dep.deposit_date)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                      <input
                        type="text" value={invoiceForm.company_name}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="회사명"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">계산서 번호</label>
                      <input
                        type="text" value={invoiceForm.invoice_number}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="20260325-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">공급가액 *</label>
                      <input
                        type="number" value={invoiceForm.supply_amount}
                        onChange={(e) => {
                          const supply = Number(e.target.value)
                          setInvoiceForm(prev => ({
                            ...prev,
                            supply_amount: e.target.value,
                            tax_amount: String(Math.round(supply * 0.1))
                          }))
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">세액 (자동 10%)</label>
                      <input
                        type="number" value={invoiceForm.tax_amount}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, tax_amount: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="자동 계산"
                      />
                    </div>
                  </div>

                  {invoiceForm.supply_amount && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <span className="text-gray-500">합계: </span>
                      <span className="font-bold">
                        {formatAmount(Number(invoiceForm.supply_amount) + Number(invoiceForm.tax_amount || Math.round(Number(invoiceForm.supply_amount) * 0.1)))}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발행일 *</label>
                    <input
                      type="date" value={invoiceForm.issue_date}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
                    <input
                      type="text" value={invoiceForm.recipient_info.business_number}
                      onChange={(e) => setInvoiceForm(prev => ({
                        ...prev,
                        recipient_info: { ...prev.recipient_info, business_number: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="000-00-00000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="비고"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setInvoiceModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    취소
                  </button>
                  <button onClick={handleCreateInvoice} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    발행
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 매칭 모달 ── */}
        {matchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">입금 ↔ 세금계산서 매칭</h2>
                  <button onClick={() => setMatchModal(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입금 내역 선택</label>
                    <select
                      value={matchForm.deposit_record_id}
                      onChange={(e) => setMatchForm(prev => ({ ...prev, deposit_record_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">선택하세요</option>
                      {unmatchedDeposits.map(dep => (
                        <option key={dep.id} value={dep.id}>
                          {formatDate(dep.deposit_date)} | {formatAmount(dep.amount)} | {dep.company_name || dep.depositor_name || '미상'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <Link2 className="w-5 h-5 text-purple-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">세금계산서 선택</label>
                    <select
                      value={matchForm.tax_invoice_id}
                      onChange={(e) => setMatchForm(prev => ({ ...prev, tax_invoice_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">선택하세요</option>
                      {unmatchedInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {formatDate(inv.issue_date)} | {formatAmount(inv.total_amount)} | {inv.company_name || inv.invoice_number || '미상'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setMatchModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    취소
                  </button>
                  <button onClick={handleMatch} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                    매칭하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 상세보기 모달 ── */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">상세 정보</h2>
                  <button onClick={() => setDetailModal(null)}><X className="w-5 h-5" /></button>
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-80">
                  {JSON.stringify(detailModal.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDepositTaxInvoice
