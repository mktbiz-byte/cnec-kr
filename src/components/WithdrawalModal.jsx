import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { database, supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

const WithdrawalModal = ({ isOpen, onClose, userId, availablePoints, onSuccess }) => {
  const { language } = useLanguage()
  const [amount, setAmount] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [paypalName, setPaypalName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 입력값 검증
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      setError(language === 'ko' ? '유효한 금액을 입력하세요.' : '有効な金額を入力してください。')
      return
    }
    
    if (parseInt(amount) > availablePoints) {
      setError(language === 'ko' ? '보유 포인트보다 많은 금액을 출금할 수 없습니다.' : '保有ポイント以上の金額を出金することはできません。')
      return
    }
    
    if (!paypalEmail) {
      setError(language === 'ko' ? 'PayPal 이메일을 입력하세요.' : 'PayPalメールアドレスを入力してください。')
      return
    }
    
    if (!paypalName) {
      setError(language === 'ko' ? 'PayPal 계정 이름을 입력하세요.' : 'PayPalアカウント名を入力してください。')
      return
    }
    
    try {
      setLoading(true)
      setError('')

      // 제출 직전 최신 포인트 잔액 재확인
      const { data: latestProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('id', userId)
        .single()

      if (profileError) {
        setError(language === 'ko' ? '포인트 조회에 실패했습니다.' : 'ポイントの照会に失敗しました。')
        return
      }

      const latestPoints = latestProfile?.points || 0
      if (parseInt(amount) > latestPoints) {
        setError(language === 'ko'
          ? `보유 포인트가 부족합니다. 현재 보유: ${latestPoints.toLocaleString()}포인트`
          : `保有ポイントが不足しています。現在の保有: ${latestPoints.toLocaleString()}ポイント`
        )
        return
      }

      // 출금 신청 데이터 생성 (서버에서도 잔액 재검증)
      await database.withdrawals.create({
        user_id: userId,
        amount: parseInt(amount),
        paypal_email: paypalEmail,
        paypal_name: paypalName
      })
      
      // 성공 처리
      onSuccess()
      onClose()
    } catch (error) {
      console.error('출금 신청 오류:', error)
      setError(language === 'ko' 
        ? '출금 신청 중 오류가 발생했습니다. 다시 시도해주세요.'
        : '出金申請中にエラーが発生しました。もう一度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'ko' ? '출금 신청' : '出金申請'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ko' 
              ? 'PayPal을 통해 포인트를 출금합니다. 정확한 정보를 입력해주세요.'
              : 'PayPalを通じてポイントを出金します。正確な情報を入力してください。'
            }
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="available-points">
              {language === 'ko' ? '보유 포인트' : '保有ポイント'}
            </Label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-700 font-medium">
              {availablePoints.toLocaleString()} {language === 'ko' ? '포인트' : 'ポイント'}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">
              {language === 'ko' ? '출금 금액' : '出金金額'} *
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={availablePoints}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={language === 'ko' ? '출금할 금액을 입력하세요' : '出金する金額を入力してください'}
              required
            />
            <p className="text-xs text-gray-500">
              {language === 'ko' 
                ? '1포인트 = 1엔으로 환산됩니다.'
                : '1ポイント = 1円で換算されます。'
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paypal-email">
              {language === 'ko' ? 'PayPal 이메일' : 'PayPalメールアドレス'} *
            </Label>
            <Input
              id="paypal-email"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paypal-name">
              {language === 'ko' ? 'PayPal 계정 이름' : 'PayPalアカウント名'} *
            </Label>
            <Input
              id="paypal-name"
              value={paypalName}
              onChange={(e) => setPaypalName(e.target.value)}
              placeholder={language === 'ko' ? '계정 이름을 입력하세요' : 'アカウント名を入力してください'}
              required
            />
            <p className="text-xs text-gray-500">
              {language === 'ko' 
                ? 'PayPal에 등록된 이름을 정확히 입력해주세요.'
                : 'PayPalに登録されている名前を正確に入力してください。'
              }
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              {language === 'ko' ? '취소' : 'キャンセル'}
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ko' ? '처리 중...' : '処理中...'}
                </>
              ) : (
                language === 'ko' ? '출금 신청' : '出金申請'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WithdrawalModal
