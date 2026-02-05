import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database, supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Building, User, MapPin, Phone, Mail } from 'lucide-react'

// 일본 주요 은행 코드
const JAPANESE_BANKS = [
  { code: '0001', name: 'みずほ銀行', nameEn: 'Mizuho Bank' },
  { code: '0005', name: '三菱UFJ銀行', nameEn: 'MUFG Bank' },
  { code: '0009', name: '三井住友銀行', nameEn: 'Sumitomo Mitsui Banking Corporation' },
  { code: '0010', name: 'りそな銀行', nameEn: 'Resona Bank' },
  { code: '0017', name: 'ゆうちょ銀行', nameEn: 'Japan Post Bank' },
  { code: '0033', name: '楽天銀行', nameEn: 'Rakuten Bank' },
  { code: '0035', name: 'ジャパンネット銀行', nameEn: 'PayPay Bank' },
  { code: '0038', name: '住信SBIネット銀行', nameEn: 'SBI Sumishin Net Bank' },
  { code: '0040', name: 'イオン銀行', nameEn: 'Aeon Bank' },
  { code: '0042', name: 'ソニー銀行', nameEn: 'Sony Bank' }
]

const WithdrawalRequest = ({ availablePoints, onClose, onSuccess }) => {
  const { user } = useAuth()
  const { language } = useLanguage()
  
  const [formData, setFormData] = useState({
    // 출금 정보
    amount: '',
    
    // 일본 은행 정보
    bankCode: '',
    bankName: '',
    branchCode: '',
    branchName: '',
    accountType: 'savings', // savings(普通) or checking(当座)
    accountNumber: '',
    accountHolderName: '',
    accountHolderNameKana: '',
    
    // 수취인 정보 (한국 → 일본 송금용)
    recipientName: '',
    recipientNameKana: '',
    recipientAddress: '',
    recipientPhone: '',
    recipientEmail: '',
    
    // 송금 목적
    purpose: 'service_fee', // service_fee, salary, etc.
    
    // 추가 정보
    notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: 금액, 2: 은행정보, 3: 수취인정보, 4: 확인

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 은행 선택 시 은행명 자동 입력
    if (field === 'bankCode') {
      const selectedBank = JAPANESE_BANKS.find(bank => bank.code === value)
      if (selectedBank) {
        setFormData(prev => ({
          ...prev,
          bankName: selectedBank.name
        }))
      }
    }
  }

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        const amount = parseInt(formData.amount)
        return amount > 0 && amount <= availablePoints
      
      case 2:
        return formData.bankCode && 
               formData.branchCode && 
               formData.branchName && 
               formData.accountNumber && 
               formData.accountHolderName && 
               formData.accountHolderNameKana
      
      case 3:
        return formData.recipientName && 
               formData.recipientNameKana && 
               formData.recipientAddress && 
               formData.recipientPhone && 
               formData.recipientEmail
      
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      setError('')
    } else {
      setError(language === 'ko' 
        ? '모든 필수 항목을 입력해주세요.'
        : '必須項目をすべて入力してください。'
      )
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      // 제출 직전 최신 포인트 잔액 재확인
      const { data: latestProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(language === 'ko' ? '포인트 조회에 실패했습니다.' : 'ポイントの照会に失敗しました。')
        setLoading(false)
        return
      }

      const latestPoints = latestProfile?.points || 0
      const requestAmount = parseInt(formData.amount)

      if (requestAmount > latestPoints) {
        setError(language === 'ko'
          ? `보유 포인트가 부족합니다. 현재 보유: ${latestPoints.toLocaleString()}포인트`
          : `保有ポイントが不足しています。現在の保有: ${latestPoints.toLocaleString()}ポイント`
        )
        setLoading(false)
        return
      }

      const withdrawalData = {
        user_id: user.id,
        amount: parseInt(formData.amount),
        
        // 일본 은행 정보
        bank_info: {
          bankCode: formData.bankCode,
          bankName: formData.bankName,
          branchCode: formData.branchCode,
          branchName: formData.branchName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          accountHolderNameKana: formData.accountHolderNameKana
        },
        
        // 수취인 정보
        recipient_info: {
          name: formData.recipientName,
          nameKana: formData.recipientNameKana,
          address: formData.recipientAddress,
          phone: formData.recipientPhone,
          email: formData.recipientEmail
        },
        
        purpose: formData.purpose,
        notes: formData.notes,
        status: 'pending'
      }
      
      await database.withdrawals.create(withdrawalData)
      
      onSuccess?.()
      onClose?.()
      
    } catch (error) {
      console.error('Withdrawal request error:', error)
      setError(language === 'ko' 
        ? '출금 신청 중 오류가 발생했습니다.'
        : '出金申請中にエラーが発生しました。'
      )
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="amount">
          {language === 'ko' ? '출금 금액' : '出金金額'}
        </Label>
        <div className="mt-1">
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder={language === 'ko' ? '출금할 포인트 입력' : '出金するポイントを入力'}
            max={availablePoints}
          />
          <p className="text-sm text-gray-500 mt-1">
            {language === 'ko' 
              ? `사용 가능한 포인트: ${formatCurrency(availablePoints)}`
              : `利用可能ポイント: ${formatCurrency(availablePoints)}`
            }
          </p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bankCode">
            {language === 'ko' ? '은행 선택' : '銀行選択'}
          </Label>
          <Select value={formData.bankCode} onValueChange={(value) => handleInputChange('bankCode', value)}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'ko' ? '은행을 선택하세요' : '銀行を選択してください'} />
            </SelectTrigger>
            <SelectContent>
              {JAPANESE_BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name} ({bank.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="branchCode">
            {language === 'ko' ? '지점 코드' : '支店コード'}
          </Label>
          <Input
            id="branchCode"
            value={formData.branchCode}
            onChange={(e) => handleInputChange('branchCode', e.target.value)}
            placeholder="001"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="branchName">
          {language === 'ko' ? '지점명' : '支店名'}
        </Label>
        <Input
          id="branchName"
          value={formData.branchName}
          onChange={(e) => handleInputChange('branchName', e.target.value)}
          placeholder={language === 'ko' ? '본점' : '本店'}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accountType">
            {language === 'ko' ? '계좌 종류' : '口座種別'}
          </Label>
          <Select value={formData.accountType} onValueChange={(value) => handleInputChange('accountType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">
                {language === 'ko' ? '보통예금 (普通)' : '普通預金'}
              </SelectItem>
              <SelectItem value="checking">
                {language === 'ko' ? '당좌예금 (当座)' : '当座預金'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="accountNumber">
            {language === 'ko' ? '계좌번호' : '口座番号'}
          </Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            placeholder="1234567"
          />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accountHolderName">
            {language === 'ko' ? '예금주명 (한자/히라가나)' : '口座名義人 (漢字・ひらがな)'}
          </Label>
          <Input
            id="accountHolderName"
            value={formData.accountHolderName}
            onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
            placeholder={language === 'ko' ? '야마다 타로' : '山田太郎'}
          />
        </div>
        
        <div>
          <Label htmlFor="accountHolderNameKana">
            {language === 'ko' ? '예금주명 (카타카나)' : '口座名義人 (カタカナ)'}
          </Label>
          <Input
            id="accountHolderNameKana"
            value={formData.accountHolderNameKana}
            onChange={(e) => handleInputChange('accountHolderNameKana', e.target.value)}
            placeholder="ヤマダタロウ"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipientName">
            {language === 'ko' ? '수취인 이름 (한자/히라가나)' : '受取人氏名 (漢字・ひらがな)'}
          </Label>
          <Input
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => handleInputChange('recipientName', e.target.value)}
            placeholder={language === 'ko' ? '야마다 타로' : '山田太郎'}
          />
        </div>
        
        <div>
          <Label htmlFor="recipientNameKana">
            {language === 'ko' ? '수취인 이름 (카타카나)' : '受取人氏名 (カタカナ)'}
          </Label>
          <Input
            id="recipientNameKana"
            value={formData.recipientNameKana}
            onChange={(e) => handleInputChange('recipientNameKana', e.target.value)}
            placeholder="ヤマダタロウ"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="recipientAddress">
          {language === 'ko' ? '수취인 주소' : '受取人住所'}
        </Label>
        <Input
          id="recipientAddress"
          value={formData.recipientAddress}
          onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
          placeholder={language === 'ko' ? '도쿄도 시부야구...' : '東京都渋谷区...'}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipientPhone">
            {language === 'ko' ? '수취인 전화번호' : '受取人電話番号'}
          </Label>
          <Input
            id="recipientPhone"
            value={formData.recipientPhone}
            onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
            placeholder="090-1234-5678"
          />
        </div>
        
        <div>
          <Label htmlFor="recipientEmail">
            {language === 'ko' ? '수취인 이메일' : '受取人メールアドレス'}
          </Label>
          <Input
            id="recipientEmail"
            type="email"
            value={formData.recipientEmail}
            onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
            placeholder="example@email.com"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="purpose">
          {language === 'ko' ? '송금 목적' : '送金目的'}
        </Label>
        <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service_fee">
              {language === 'ko' ? '서비스 수수료' : 'サービス手数料'}
            </SelectItem>
            <SelectItem value="salary">
              {language === 'ko' ? '급여' : '給与'}
            </SelectItem>
            <SelectItem value="commission">
              {language === 'ko' ? '커미션' : 'コミッション'}
            </SelectItem>
            <SelectItem value="other">
              {language === 'ko' ? '기타' : 'その他'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="notes">
          {language === 'ko' ? '추가 메모 (선택사항)' : '追加メモ (任意)'}
        </Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder={language === 'ko' ? '추가 정보가 있으면 입력하세요' : '追加情報があれば入力してください'}
        />
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          {language === 'ko' 
            ? '출금 신청 정보를 확인해주세요. 제출 후에는 수정할 수 없습니다.'
            : '出金申請情報をご確認ください。提出後は修正できません。'
          }
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            {language === 'ko' ? '출금 정보' : '出金情報'}
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(parseInt(formData.amount))}
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            {language === 'ko' ? '은행 정보' : '銀行情報'}
          </h3>
          <div className="space-y-1 text-sm">
            <p><strong>{language === 'ko' ? '은행:' : '銀行:'}</strong> {formData.bankName} ({formData.bankCode})</p>
            <p><strong>{language === 'ko' ? '지점:' : '支店:'}</strong> {formData.branchName} ({formData.branchCode})</p>
            <p><strong>{language === 'ko' ? '계좌:' : '口座:'}</strong> {formData.accountType === 'savings' ? (language === 'ko' ? '보통예금' : '普通預金') : (language === 'ko' ? '당좌예금' : '当座預金')} {formData.accountNumber}</p>
            <p><strong>{language === 'ko' ? '예금주:' : '名義人:'}</strong> {formData.accountHolderName} ({formData.accountHolderNameKana})</p>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            {language === 'ko' ? '수취인 정보' : '受取人情報'}
          </h3>
          <div className="space-y-1 text-sm">
            <p><strong>{language === 'ko' ? '이름:' : '氏名:'}</strong> {formData.recipientName} ({formData.recipientNameKana})</p>
            <p><strong>{language === 'ko' ? '주소:' : '住所:'}</strong> {formData.recipientAddress}</p>
            <p><strong>{language === 'ko' ? '전화:' : '電話:'}</strong> {formData.recipientPhone}</p>
            <p><strong>{language === 'ko' ? '이메일:' : 'メール:'}</strong> {formData.recipientEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const getStepTitle = () => {
    const titles = {
      1: language === 'ko' ? '출금 금액' : '出金金額',
      2: language === 'ko' ? '은행 정보' : '銀行情報',
      3: language === 'ko' ? '수취인 정보' : '受取人情報',
      4: language === 'ko' ? '확인' : '確認'
    }
    return titles[step]
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>
            {language === 'ko' ? '출금 신청' : '出金申請'}
          </span>
        </CardTitle>
        <CardDescription>
          {language === 'ko' 
            ? '한국에서 일본으로 송금하기 위한 정보를 입력해주세요.'
            : '韓国から日本への送金のための情報を入力してください。'
          }
        </CardDescription>
        
        {/* 진행 단계 표시 */}
        <div className="flex items-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber <= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-8 h-1 ${
                  stepNumber < step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <h3 className="text-lg font-medium mt-4">
          {getStepTitle()}
        </h3>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            disabled={loading}
          >
            {step === 1 
              ? (language === 'ko' ? '취소' : 'キャンセル')
              : (language === 'ko' ? '이전' : '前へ')
            }
          </Button>
          
          <Button
            onClick={step === 4 ? handleSubmit : handleNext}
            disabled={loading || !validateStep(step)}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {step === 4 
              ? (language === 'ko' ? '출금 신청' : '出金申請')
              : (language === 'ko' ? '다음' : '次へ')
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default WithdrawalRequest
