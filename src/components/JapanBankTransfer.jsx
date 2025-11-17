import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Loader2, CreditCard, Building, User, MapPin, Phone, Mail, 
  AlertCircle, CheckCircle, Clock, DollarSign, FileText, 
  ArrowRight, Copy, ExternalLink
} from 'lucide-react'

// 일본 주요 은행 및 지점 정보
const JAPANESE_BANKS = [
  { 
    code: '0001', 
    name: 'みずほ銀行', 
    nameEn: 'Mizuho Bank',
    swiftCode: 'MHCBJPJT',
    branches: [
      { code: '001', name: '本店', nameEn: 'Head Office' },
      { code: '002', name: '東京営業部', nameEn: 'Tokyo Business Department' },
      { code: '003', name: '銀座支店', nameEn: 'Ginza Branch' },
      { code: '004', name: '新宿支店', nameEn: 'Shinjuku Branch' },
      { code: '005', name: '渋谷支店', nameEn: 'Shibuya Branch' }
    ]
  },
  { 
    code: '0005', 
    name: '三菱UFJ銀行', 
    nameEn: 'MUFG Bank',
    swiftCode: 'BOTKJPJT',
    branches: [
      { code: '001', name: '本店', nameEn: 'Head Office' },
      { code: '002', name: '東京営業部', nameEn: 'Tokyo Business Department' },
      { code: '003', name: '丸の内支店', nameEn: 'Marunouchi Branch' },
      { code: '004', name: '新宿支店', nameEn: 'Shinjuku Branch' },
      { code: '005', name: '池袋支店', nameEn: 'Ikebukuro Branch' }
    ]
  },
  { 
    code: '0009', 
    name: '三井住友銀行', 
    nameEn: 'Sumitomo Mitsui Banking Corporation',
    swiftCode: 'SMBCJPJT',
    branches: [
      { code: '001', name: '本店営業部', nameEn: 'Head Office Business Department' },
      { code: '002', name: '東京営業部', nameEn: 'Tokyo Business Department' },
      { code: '003', name: '銀座支店', nameEn: 'Ginza Branch' },
      { code: '004', name: '新宿支店', nameEn: 'Shinjuku Branch' },
      { code: '005', name: '渋谷支店', nameEn: 'Shibuya Branch' }
    ]
  },
  { 
    code: '0010', 
    name: 'りそな銀行', 
    nameEn: 'Resona Bank',
    swiftCode: 'DIWAJPJT',
    branches: [
      { code: '001', name: '本店営業部', nameEn: 'Head Office Business Department' },
      { code: '002', name: '東京営業部', nameEn: 'Tokyo Business Department' },
      { code: '003', name: '新宿支店', nameEn: 'Shinjuku Branch' }
    ]
  },
  { 
    code: '0017', 
    name: 'ゆうちょ銀行', 
    nameEn: 'Japan Post Bank',
    swiftCode: 'JPPSJPJ1',
    branches: [
      { code: '001', name: '本店', nameEn: 'Head Office' },
      { code: '002', name: '東京支店', nameEn: 'Tokyo Branch' }
    ]
  },
  { 
    code: '0033', 
    name: '楽天銀行', 
    nameEn: 'Rakuten Bank',
    swiftCode: 'RAKTJPJT',
    branches: [
      { code: '001', name: '本店', nameEn: 'Head Office' }
    ]
  },
  { 
    code: '0038', 
    name: '住信SBIネット銀行', 
    nameEn: 'SBI Sumishin Net Bank',
    swiftCode: 'NTSSJPJT',
    branches: [
      { code: '001', name: '本店', nameEn: 'Head Office' }
    ]
  }
]

// 송금 목적 코드
const TRANSFER_PURPOSES = [
  { code: 'SERVICE_FEE', nameJa: 'サービス料', nameKo: '서비스 수수료', nameEn: 'Service Fee' },
  { code: 'COMMISSION', nameJa: '手数料', nameKo: '수수료', nameEn: 'Commission' },
  { code: 'SALARY', nameJa: '給与', nameKo: '급여', nameEn: 'Salary' },
  { code: 'CONSULTING_FEE', nameJa: 'コンサルティング料', nameKo: '컨설팅 수수료', nameEn: 'Consulting Fee' },
  { code: 'MARKETING_FEE', nameJa: 'マーケティング料', nameKo: '마케팅 수수료', nameEn: 'Marketing Fee' },
  { code: 'OTHER', nameJa: 'その他', nameKo: '기타', nameEn: 'Other' }
]

const JapanBankTransfer = ({ withdrawalId, onClose, onSuccess }) => {
  const { user } = useAuth()
  
  const [withdrawal, setWithdrawal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1) // 1: 정보확인, 2: 송금정보입력, 3: 확인, 4: 완료
  
  const [transferData, setTransferData] = useState({
    // 수취인 은행 정보
    bankCode: '',
    bankName: '',
    bankNameEn: '',
    swiftCode: '',
    branchCode: '',
    branchName: '',
    branchNameEn: '',
    
    // 수취인 계좌 정보
    accountType: 'savings', // savings(普通), checking(当座)
    accountNumber: '',
    accountHolderName: '',
    accountHolderNameKana: '',
    accountHolderNameEn: '',
    
    // 수취인 개인 정보
    recipientName: '',
    recipientNameEn: '',
    recipientAddress: '',
    recipientAddressEn: '',
    recipientPhone: '',
    recipientEmail: '',
    
    // 송금 정보
    amount: 0,
    currency: 'KRW',
    purpose: '',
    purposeDescription: '',
    
    // 송금인 정보 (한국)
    senderName: '',
    senderNameEn: '',
    senderAddress: '',
    senderAddressEn: '',
    senderPhone: '',
    senderEmail: '',
    
    // 추가 정보
    notes: '',
    urgency: 'normal' // normal, urgent
  })

  useEffect(() => {
    if (withdrawalId) {
      loadWithdrawalData()
    }
  }, [withdrawalId])

  const loadWithdrawalData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          user_profiles (
            name,
            phone,
            email
          )
        `)
        .eq('id', withdrawalId)
        .single()
      
      if (error) throw error
      
      setWithdrawal(data)
      
      // 기존 출금 정보로 폼 초기화
      if (data.bank_info) {
        setTransferData(prev => ({
          ...prev,
          bankCode: data.bank_info.bank_code || '',
          bankName: data.bank_info.bank_name || '',
          branchCode: data.bank_info.branch_code || '',
          branchName: data.bank_info.branch_name || '',
          accountType: data.bank_info.account_type || 'savings',
          accountNumber: data.bank_info.account_number || '',
          accountHolderName: data.bank_info.account_holder_name || '',
          accountHolderNameKana: data.bank_info.account_holder_name_kana || '',
          amount: data.amount || 0,
          recipientName: data.recipient_info?.name || '',
          recipientAddress: data.recipient_info?.address || '',
          recipientPhone: data.recipient_info?.phone || '',
          purpose: data.purpose || '',
          notes: data.notes || ''
        }))
      }
      
    } catch (error) {
      console.error('Load withdrawal data error:', error)
      setError('出金データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setTransferData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 은행 선택 시 관련 정보 자동 입력
    if (field === 'bankCode') {
      const selectedBank = JAPANESE_BANKS.find(bank => bank.code === value)
      if (selectedBank) {
        setTransferData(prev => ({
          ...prev,
          bankName: selectedBank.name,
          bankNameEn: selectedBank.nameEn,
          swiftCode: selectedBank.swiftCode,
          branchCode: '', // 지점은 다시 선택하도록
          branchName: '',
          branchNameEn: ''
        }))
      }
    }
    
    // 지점 선택 시 관련 정보 자동 입력
    if (field === 'branchCode') {
      const selectedBank = JAPANESE_BANKS.find(bank => bank.code === transferData.bankCode)
      if (selectedBank) {
        const selectedBranch = selectedBank.branches.find(branch => branch.code === value)
        if (selectedBranch) {
          setTransferData(prev => ({
            ...prev,
            branchName: selectedBranch.name,
            branchNameEn: selectedBranch.nameEn
          }))
        }
      }
    }
  }

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return true // 정보 확인 단계
      
      case 2:
        return transferData.bankCode && 
               transferData.branchCode && 
               transferData.accountNumber && 
               transferData.accountHolderName && 
               transferData.accountHolderNameKana &&
               transferData.recipientName &&
               transferData.recipientAddress &&
               transferData.recipientPhone
      
      case 3:
        return transferData.purpose &&
               transferData.senderName &&
               transferData.senderAddress &&
               transferData.senderPhone
      
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    } else {
      setError('必要な情報を全て入力してください。')
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    setError('')
  }

  const processTransfer = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 송금 정보를 데이터베이스에 저장
      const transferRecord = {
        withdrawal_id: withdrawalId,
        transfer_data: transferData,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('bank_transfers')
        .insert([transferRecord])
        .select()
        .single()
      
      if (error) throw error
      
      // 출금 상태를 '송금 처리 중'으로 업데이트
      await database.withdrawals.updateStatus(
        withdrawalId, 
        'transfer_processing', 
        '일본 은행 송금 처리 중'
      )
      
      setSuccess('송금 요청이 성공적으로 처리되었습니다.')
      setStep(4)
      
      if (onSuccess) {
        onSuccess(data)
      }
      
    } catch (error) {
      console.error('Process transfer error:', error)
      setError('송금 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('클립보드에 복사되었습니다.')
    setTimeout(() => setSuccess(''), 2000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const getSelectedBank = () => {
    return JAPANESE_BANKS.find(bank => bank.code === transferData.bankCode)
  }

  const getSelectedBranch = () => {
    const bank = getSelectedBank()
    return bank?.branches.find(branch => branch.code === transferData.branchCode)
  }

  const getSelectedPurpose = () => {
    return TRANSFER_PURPOSES.find(purpose => purpose.code === transferData.purpose)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 진행 상황 표시 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step > stepNumber ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 4 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          ステップ {step} / 4
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>出金情報確認</span>
            </CardTitle>
            <CardDescription>
              出金要求の詳細を確認してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">出金詳細</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">出金金額:</span>
                    <span className="font-semibold">{formatCurrency(withdrawal?.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">要求日:</span>
                    <span>{new Date(withdrawal?.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状態:</span>
                    <Badge variant="outline">{withdrawal?.status}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">受取人情報</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">名前:</span> {withdrawal?.recipient_info?.name}</p>
                  <p><span className="text-gray-600">住所:</span> {withdrawal?.recipient_info?.address}</p>
                  <p><span className="text-gray-600">電話:</span> {withdrawal?.recipient_info?.phone}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700">
                送金手続きを開始
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>銀行情報入力</span>
            </CardTitle>
            <CardDescription>
              日本の受取銀行と口座情報を入力してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 은행 선택 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">銀行選択</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">銀行</Label>
                  <Select 
                    value={transferData.bankCode} 
                    onValueChange={(value) => handleInputChange('bankCode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="銀行を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {JAPANESE_BANKS.map(bank => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name} ({bank.nameEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branch">支店</Label>
                  <Select 
                    value={transferData.branchCode} 
                    onValueChange={(value) => handleInputChange('branchCode', value)}
                    disabled={!transferData.bankCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="支店を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedBank()?.branches.map(branch => (
                        <SelectItem key={branch.code} value={branch.code}>
                          {branch.name} ({branch.nameEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {transferData.bankCode && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">選択された銀行情報</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-600">銀行コード:</span> {transferData.bankCode}</p>
                    <p><span className="text-gray-600">SWIFT コード:</span> {transferData.swiftCode}</p>
                    <p><span className="text-gray-600">銀行名（英語）:</span> {transferData.bankNameEn}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 계좌 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">口座情報</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">口座種別</Label>
                  <Select 
                    value={transferData.accountType} 
                    onValueChange={(value) => handleInputChange('accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">普通預金</SelectItem>
                      <SelectItem value="checking">当座預金</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">口座番号</Label>
                  <Input
                    id="accountNumber"
                    value={transferData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="1234567"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">口座名義人</Label>
                  <Input
                    id="accountHolderName"
                    value={transferData.accountHolderName}
                    onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                    placeholder="山田太郎"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountHolderNameKana">口座名義人（カナ）</Label>
                  <Input
                    id="accountHolderNameKana"
                    value={transferData.accountHolderNameKana}
                    onChange={(e) => handleInputChange('accountHolderNameKana', e.target.value)}
                    placeholder="ヤマダタロウ"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountHolderNameEn">口座名義人（英語）</Label>
                <Input
                  id="accountHolderNameEn"
                  value={transferData.accountHolderNameEn}
                  onChange={(e) => handleInputChange('accountHolderNameEn', e.target.value)}
                  placeholder="YAMADA TARO"
                />
              </div>
            </div>

            <Separator />

            {/* 수취인 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">受取人詳細情報</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">受取人名</Label>
                  <Input
                    id="recipientName"
                    value={transferData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="受取人の名前"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientNameEn">受取人名（英語）</Label>
                  <Input
                    id="recipientNameEn"
                    value={transferData.recipientNameEn}
                    onChange={(e) => handleInputChange('recipientNameEn', e.target.value)}
                    placeholder="RECIPIENT NAME"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipientAddress">受取人住所</Label>
                <Textarea
                  id="recipientAddress"
                  value={transferData.recipientAddress}
                  onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                  placeholder="〒000-0000 東京都..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipientAddressEn">受取人住所（英語）</Label>
                <Textarea
                  id="recipientAddressEn"
                  value={transferData.recipientAddressEn}
                  onChange={(e) => handleInputChange('recipientAddressEn', e.target.value)}
                  placeholder="1-1-1 Chiyoda, Chiyoda-ku, Tokyo 100-0001, Japan"
                  rows={2}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">受取人電話番号</Label>
                  <Input
                    id="recipientPhone"
                    value={transferData.recipientPhone}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    placeholder="090-0000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">受取人メールアドレス</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={transferData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                戻る
              </Button>
              <Button onClick={nextStep} disabled={!validateStep(2)}>
                次へ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>送金詳細情報</span>
            </CardTitle>
            <CardDescription>
              送金目的と送金人情報を入力してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 송금 목적 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">送金目的</h3>
              <div className="space-y-2">
                <Label htmlFor="purpose">送金目的</Label>
                <Select 
                  value={transferData.purpose} 
                  onValueChange={(value) => handleInputChange('purpose', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="送金目的を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_PURPOSES.map(purpose => (
                      <SelectItem key={purpose.code} value={purpose.code}>
                        {purpose.nameJa} ({purpose.nameEn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purposeDescription">送金目的詳細</Label>
                <Textarea
                  id="purposeDescription"
                  value={transferData.purposeDescription}
                  onChange={(e) => handleInputChange('purposeDescription', e.target.value)}
                  placeholder="送金目的の詳細説明"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* 송금인 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">送金人情報（韓国）</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">送金人名</Label>
                  <Input
                    id="senderName"
                    value={transferData.senderName}
                    onChange={(e) => handleInputChange('senderName', e.target.value)}
                    placeholder="김철수"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senderNameEn">送金人名（英語）</Label>
                  <Input
                    id="senderNameEn"
                    value={transferData.senderNameEn}
                    onChange={(e) => handleInputChange('senderNameEn', e.target.value)}
                    placeholder="KIM CHUL SOO"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senderAddress">送金人住所</Label>
                <Textarea
                  id="senderAddress"
                  value={transferData.senderAddress}
                  onChange={(e) => handleInputChange('senderAddress', e.target.value)}
                  placeholder="서울특별시 강남구..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senderAddressEn">送金人住所（英語）</Label>
                <Textarea
                  id="senderAddressEn"
                  value={transferData.senderAddressEn}
                  onChange={(e) => handleInputChange('senderAddressEn', e.target.value)}
                  placeholder="123-45 Gangnam-gu, Seoul, South Korea"
                  rows={2}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderPhone">送金人電話番号</Label>
                  <Input
                    id="senderPhone"
                    value={transferData.senderPhone}
                    onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">送金人メールアドレス</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={transferData.senderEmail}
                    onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                    placeholder="sender@example.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 추가 옵션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">追加オプション</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgency">送金緊急度</Label>
                  <Select 
                    value={transferData.urgency} 
                    onValueChange={(value) => handleInputChange('urgency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">通常（2-3営業日）</SelectItem>
                      <SelectItem value="urgent">緊急（当日処理）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={transferData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="追加情報があれば入力してください"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                戻る
              </Button>
              <Button onClick={nextStep} disabled={!validateStep(3)}>
                確認画面へ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>送金要求完了</span>
            </CardTitle>
            <CardDescription>
              送金要求が正常に処理されました。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <h3 className="text-lg font-semibold text-green-800">
                  送金要求が完了しました
                </h3>
                <p className="text-green-700">
                  送金処理は通常2-3営業日以内に完了します。<br />
                  進行状況はメールでお知らせいたします。
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">送金詳細</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="text-gray-600">送金金額:</span> {formatCurrency(transferData.amount)}</p>
                  <p><span className="text-gray-600">受取銀行:</span> {transferData.bankName}</p>
                  <p><span className="text-gray-600">受取人:</span> {transferData.accountHolderName}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="text-gray-600">送金目的:</span> {getSelectedPurpose()?.nameJa}</p>
                  <p><span className="text-gray-600">緊急度:</span> {transferData.urgency === 'urgent' ? '緊急' : '通常'}</p>
                  <p><span className="text-gray-600">処理予定:</span> {transferData.urgency === 'urgent' ? '当日' : '2-3営業日'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
                完了
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default JapanBankTransfer
