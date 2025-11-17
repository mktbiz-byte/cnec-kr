import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, Save, Edit, ArrowLeft, Banknote, 
  AlertCircle, CheckCircle, Building, CreditCard,
  MapPin, User, Phone, Mail, Coins, Calculator
} from 'lucide-react'

const JapanWithdrawalRequest = () => {
  const { user } = useAuth()
  
  const [pointBalance, setPointBalance] = useState(0)
  const [bankInfo, setBankInfo] = useState({
    bank_name: '',
    bank_code: '',
    branch_name: '',
    branch_code: '',
    account_type: 'futsu', // 普通預金
    account_number: '',
    account_holder_katakana: '',
    account_holder_kanji: '',
    swift_code: ''
  })
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [existingBankInfo, setExistingBankInfo] = useState(null)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // 포인트 잔액 계산
      const applications = await database.applications.getByUserId(user.id)
      const completedApps = applications?.filter(app => app.status === 'completed') || []
      const totalEarned = completedApps.reduce((sum, app) => {
        return sum + (app.campaign?.reward_amount || 0)
      }, 0)
      
      // 기존 출금 내역 차감
      const withdrawals = await database.withdrawals.getByUserId(user.id)
      const totalWithdrawn = withdrawals?.reduce((sum, withdrawal) => {
        return sum + (withdrawal.status === 'completed' ? withdrawal.amount : 0)
      }, 0) || 0
      
      setPointBalance(totalEarned - totalWithdrawn)
      
      // 기존 은행 정보 로드
      const existingBank = await database.bankInfo.getByUserId(user.id)
      if (existingBank) {
        setExistingBankInfo(existingBank)
        setBankInfo(existingBank)
      } else {
        setEditMode(true) // 은행 정보가 없으면 편집 모드로 시작
      }
      
    } catch (error) {
      console.error('Load user data error:', error)
      setError('データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBankInfo = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 필수 필드 검증
      const requiredFields = [
        'bank_name', 'branch_name', 'account_number', 
        'account_holder_katakana', 'account_holder_kanji'
      ]
      
      for (const field of requiredFields) {
        if (!bankInfo[field]?.trim()) {
          setError('すべての必須項目を入力してください。')
          return
        }
      }
      
      // 계좌번호 형식 검증 (7자리 숫자)
      if (!/^\d{7}$/.test(bankInfo.account_number)) {
        setError('口座番号は7桁の数字で入力してください。')
        return
      }
      
      // 카타카나 검증
      const katakanaRegex = /^[ァ-ヶー\s]+$/
      if (!katakanaRegex.test(bankInfo.account_holder_katakana)) {
        setError('口座名義（カタカナ）は全角カタカナで入力してください。')
        return
      }
      
      if (existingBankInfo) {
        await database.bankInfo.update(existingBankInfo.id, bankInfo)
      } else {
        await database.bankInfo.create({
          ...bankInfo,
          user_id: user.id
        })
      }
      
      setSuccess('銀行情報を保存しました。')
      setEditMode(false)
      loadUserData()
      
    } catch (error) {
      console.error('Save bank info error:', error)
      setError('銀行情報の保存に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdrawalRequest = async () => {
    try {
      setProcessing(true)
      setError('')
      
      const amount = parseInt(withdrawalAmount)
      
      if (!amount || amount <= 0) {
        setError('有効な出金額を入力してください。')
        return
      }
      
      if (amount > pointBalance) {
        setError('出金額が残高を超えています。')
        return
      }
      
      if (amount < 1000) {
        setError('最低出金額は1,000円です。')
        return
      }
      
      if (!existingBankInfo) {
        setError('先に銀行情報を登録してください。')
        return
      }
      
      await database.withdrawals.create({
        user_id: user.id,
        amount: amount,
        bank_info_id: existingBankInfo.id,
        status: 'pending',
        requested_at: new Date().toISOString(),
        currency: 'KRW',
        transfer_type: 'japan_bank'
      })
      
      setSuccess('出金申請を送信しました。処理には3-5営業日かかります。')
      setWithdrawalAmount('')
      loadUserData()
      
    } catch (error) {
      console.error('Withdrawal request error:', error)
      setError('出金申請に失敗しました。')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount || 0)
  }

  const calculateFee = (amount) => {
    // 송금 수수료 계산 (예: 500엔 고정)
    return 500
  }

  const calculateNetAmount = (amount) => {
    return amount - calculateFee(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-2">出金申請</h1>
          <p className="text-gray-600">日本の銀行口座への送金申請</p>
        </div>

        {/* Point Balance */}
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-6 w-6 text-green-600" />
              <span>現在の残高</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(pointBalance)}
            </div>
            <p className="text-sm text-gray-600">出金可能金額</p>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bank Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span>銀行情報</span>
                  </CardTitle>
                  <CardDescription>
                    日本の銀行口座情報を登録してください
                  </CardDescription>
                </div>
                {existingBankInfo && !editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editMode ? (
                  <>
                    {/* 은행명 */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span>銀行名 *</span>
                        </div>
                      </Label>
                      <Input
                        id="bank_name"
                        value={bankInfo.bank_name}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="例: 三菱UFJ銀行"
                      />
                    </div>

                    {/* 은행 코드 */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_code">銀行コード</Label>
                      <Input
                        id="bank_code"
                        value={bankInfo.bank_code}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, bank_code: e.target.value }))}
                        placeholder="例: 0005"
                        maxLength={4}
                      />
                    </div>

                    {/* 지점명 */}
                    <div className="space-y-2">
                      <Label htmlFor="branch_name">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span>支店名 *</span>
                        </div>
                      </Label>
                      <Input
                        id="branch_name"
                        value={bankInfo.branch_name}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, branch_name: e.target.value }))}
                        placeholder="例: 新宿支店"
                      />
                    </div>

                    {/* 지점 코드 */}
                    <div className="space-y-2">
                      <Label htmlFor="branch_code">支店コード</Label>
                      <Input
                        id="branch_code"
                        value={bankInfo.branch_code}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, branch_code: e.target.value }))}
                        placeholder="例: 001"
                        maxLength={3}
                      />
                    </div>

                    {/* 계좌 종류 */}
                    <div className="space-y-2">
                      <Label htmlFor="account_type">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>預金種別 *</span>
                        </div>
                      </Label>
                      <Select 
                        value={bankInfo.account_type} 
                        onValueChange={(value) => setBankInfo(prev => ({ ...prev, account_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="futsu">普通預金</SelectItem>
                          <SelectItem value="touza">当座預金</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 계좌번호 */}
                    <div className="space-y-2">
                      <Label htmlFor="account_number">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>口座番号 * (7桁)</span>
                        </div>
                      </Label>
                      <Input
                        id="account_number"
                        value={bankInfo.account_number}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                        placeholder="1234567"
                        maxLength={7}
                      />
                    </div>

                    {/* 계좌명의 (카타카나) */}
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_katakana">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span>口座名義（カタカナ） *</span>
                        </div>
                      </Label>
                      <Input
                        id="account_holder_katakana"
                        value={bankInfo.account_holder_katakana}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, account_holder_katakana: e.target.value }))}
                        placeholder="ヤマダ タロウ"
                      />
                    </div>

                    {/* 계좌명의 (한자) */}
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_kanji">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span>口座名義（漢字） *</span>
                        </div>
                      </Label>
                      <Input
                        id="account_holder_kanji"
                        value={bankInfo.account_holder_kanji}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, account_holder_kanji: e.target.value }))}
                        placeholder="山田 太郎"
                      />
                    </div>

                    {/* SWIFT 코드 */}
                    <div className="space-y-2">
                      <Label htmlFor="swift_code">SWIFTコード</Label>
                      <Input
                        id="swift_code"
                        value={bankInfo.swift_code}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, swift_code: e.target.value.toUpperCase() }))}
                        placeholder="BOTKJPJT"
                        maxLength={11}
                      />
                      <p className="text-xs text-gray-500">
                        国際送金の場合に必要です
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleSaveBankInfo}
                        disabled={processing}
                        className="flex-1"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        保存
                      </Button>
                      {existingBankInfo && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false)
                            setBankInfo(existingBankInfo)
                          }}
                        >
                          キャンセル
                        </Button>
                      )}
                    </div>
                  </>
                ) : existingBankInfo ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">銀行名:</span>
                        <p className="text-gray-900">{bankInfo.bank_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">支店名:</span>
                        <p className="text-gray-900">{bankInfo.branch_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">預金種別:</span>
                        <p className="text-gray-900">{bankInfo.account_type === 'futsu' ? '普通預金' : '当座預金'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">口座番号:</span>
                        <p className="text-gray-900">{bankInfo.account_number}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">口座名義:</span>
                        <p className="text-gray-900">{bankInfo.account_holder_kanji} ({bankInfo.account_holder_katakana})</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">銀行情報が登録されていません</p>
                    <Button onClick={() => setEditMode(true)}>
                      銀行情報を登録
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span>出金申請</span>
              </CardTitle>
              <CardDescription>
                出金したい金額を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_amount">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span>出金額 (円)</span>
                    </div>
                  </Label>
                  <Input
                    id="withdrawal_amount"
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="10000"
                    min="1000"
                    max={pointBalance}
                  />
                  <p className="text-xs text-gray-500">
                    最低出金額: 1,000円 | 最大出金額: {formatCurrency(pointBalance)}
                  </p>
                </div>

                {withdrawalAmount && parseInt(withdrawalAmount) > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-800">出金詳細</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>出金額:</span>
                        <span>{formatCurrency(parseInt(withdrawalAmount))}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>送金手数料:</span>
                        <span>-{formatCurrency(calculateFee(parseInt(withdrawalAmount)))}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>受取金額:</span>
                        <span className="text-green-600">
                          {formatCurrency(calculateNetAmount(parseInt(withdrawalAmount)))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📋 出金について</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 処理には3-5営業日かかります</li>
                    <li>• 送金手数料として500円が差し引かれます</li>
                    <li>• 最低出金額は1,000円です</li>
                    <li>• 韓国から日本への国際送金となります</li>
                  </ul>
                </div>

                <Button
                  onClick={handleWithdrawalRequest}
                  disabled={processing || !existingBankInfo || !withdrawalAmount || parseInt(withdrawalAmount) < 1000}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Banknote className="h-4 w-4 mr-2" />
                  )}
                  出金申請
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default JapanWithdrawalRequest
