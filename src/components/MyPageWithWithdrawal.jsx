import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { database, supabase } from '../lib/supabase'
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  CreditCard, Download, Settings, LogOut, 
  AlertTriangle, Trash2, Shield, Eye, EyeOff, X
} from 'lucide-react'

// PayPal 정보 추출 헬퍼 함수
const extractPayPalFromDescription = (description) => {
  if (!description) return ''
  
  // "출금 신청: 50000포인트 (PayPal: MKT@HOWLAB.CO.KR)" 형식에서 이메일 추출
  const paypalMatch1 = description.match(/\(PayPal:\s*([^)]+)\)/)
  if (paypalMatch1) {
    return paypalMatch1[1].trim()
  }
  
  // "PayPal: email@example.com" 형식에서 이메일 추출
  const paypalMatch2 = description.match(/PayPal:\s*([^)]+)/)
  if (paypalMatch2) {
    return paypalMatch2[1].trim()
  }
  
  // "출금 신청: 20000 (PayPal: 123)" 형식에서 정보 추출
  const paypalMatch3 = description.match(/\(PayPal:\s*([^)]+)\)/)
  if (paypalMatch3) {
    return paypalMatch3[1].trim()
  }
  
  // 이메일 패턴 직접 추출
  const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) {
    return emailMatch[1]
  }
  
  return ''
}

const MyPageWithWithdrawal = () => {
  const { user, signOut } = useAuth()
  const { language } = useLanguage()
  
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [pointTransactions, setPointTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  
  // 회원 탈퇴 관련 상태
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')
  const [withdrawalDetails, setWithdrawalDetails] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 출금 신청 관련 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paypalEmail: '',
    paypalName: '',
    reason: ''
  })

  // SNS 업로드 및 포인트 신청 관련 상태
  const [showSnsUploadModal, setShowSnsUploadModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [snsUploadForm, setSnsUploadForm] = useState({
    sns_upload_url: '',
    notes: ''
  })

  // 프로필 편집 관련 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    age: '',
    region: '',
    skin_type: '',

    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    other_sns_url: '',
    instagram_followers: '',
    tiktok_followers: '',
    youtube_subscribers: ''
  })

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '마이페이지',
      profile: '프로필',
      applications: '신청 내역',
      withdrawals: '출금 내역',
      points: '포인트 내역',
      accountSettings: '계정 설정',
      personalInfo: '개인정보',
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      address: '주소',
      joinDate: '가입일',
      userRole: '사용자 등급',
      currentPoints: '보유 포인트',
      totalEarned: '총 획득 포인트',
      campaignApplications: '캠페인 신청',
      totalApplications: '총 신청 수',
      approvedApplications: '승인된 신청',
      completedCampaigns: '완료된 캠페인',
      withdrawalHistory: '출금 내역',
      totalWithdrawn: '총 출금액',
      pendingWithdrawals: '출금 대기',
      pointHistory: '포인트 내역',
      transactionType: '거래 유형',
      amount: '금액',
      date: '날짜',
      description: '설명',
      earned: '획득',
      spent: '사용',
      bonus: '보너스',
      withdrawal: '출금',
      withdrawRequest: '출금 신청',
      withdrawRequestTitle: '포인트 출금 신청',
      withdrawAmount: '출금 금액',
      paypalEmail: 'PayPal 이메일',
      paypalName: 'PayPal 계정명',
      withdrawReason: '출금 사유',
      submitWithdrawRequest: '출금 신청하기',
      accountDeletion: '회원 탈퇴',
      deleteAccount: '계정 삭제',
      deleteAccountWarning: '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.',
      deleteAccountDescription: '회원 탈퇴를 신청하시면 관리자 검토 후 처리됩니다. 탈퇴 후에는 모든 데이터가 복구 불가능하게 삭제됩니다.',
      withdrawalReason: '탈퇴 사유',
      withdrawalDetails: '상세 내용',
      confirmDeletion: '탈퇴 확인',
      confirmText: '정말로 탈퇴하시겠습니까? 확인하려면 "탈퇴합니다"를 입력하세요.',
      confirmPlaceholder: '탈퇴합니다',
      submitWithdrawal: '탈퇴 신청',
      cancel: '취소',
      processing: '처리 중...',
      logout: '로그아웃',
      goHome: '홈으로 가기',
      noData: '데이터가 없습니다',
      edit: '수정',
      save: '저장',
      skinType: '피부타입',
      postalCode: '우편번호',
      roles: {
        user: '일반 사용자',
        vip: 'VIP 사용자',
        manager: '매니저',
        admin: '관리자'
      },
      reasons: {
        service: '서비스 불만족',
        privacy: '개인정보 우려',
        unused: '서비스 미사용',
        other: '기타'
      },
      snsUpload: 'SNS 업로드',
      snsUploadUrl: 'SNS 업로드 URL',
      pointRequest: '포인트 신청',
      pointRequestTitle: 'SNS 업로드 및 포인트 신청',
      snsUploadDescription: 'SNS에 업로드한 콘텐츠의 URL을 입력하고 포인트를 신청하세요.',
      additionalNotes: '추가 메모',
      submitPointRequest: '포인트 신청하기',
      pointRequestPending: '포인트 신청 대기중',
      pointRequestApproved: '포인트 지급 완료',
      messages: {
        withdrawalSubmitted: '탈퇴 신청이 완료되었습니다. 관리자 검토 후 처리됩니다.',
        error: '오류가 발생했습니다. 다시 시도해주세요.',
        confirmRequired: '탈퇴 확인 문구를 정확히 입력해주세요.',
        reasonRequired: '탈퇴 사유를 선택해주세요.',
        snsUploadSubmitted: 'SNS 업로드 및 포인트 신청이 완료되었습니다.',
        snsUrlRequired: 'SNS 업로드 URL을 입력해주세요.'
      }
    },
    ja: {
      title: 'マイページ',
      profile: 'プロフィール',
      applications: '応募履歴',
      withdrawals: '出金履歴',
      points: 'ポイント履歴',
      accountSettings: 'アカウント設定',
      personalInfo: '個人情報',
      name: '名前',
      email: 'メール',
      phone: '電話番号',
      address: '住所',
      joinDate: '登録日',
      userRole: 'ユーザーランク',
      currentPoints: '保有ポイント',
      totalEarned: '総獲得ポイント',
      campaignApplications: 'キャンペーン応募',
      totalApplications: '総応募数',
      approvedApplications: '承認済み応募',
      completedCampaigns: '完了キャンペーン',
      withdrawalHistory: '出金履歴',
      totalWithdrawn: '総出金額',
      pendingWithdrawals: '出金待ち',
      pointHistory: 'ポイント履歴',
      transactionType: '取引種別',
      amount: '金額',
      date: '日付',
      description: '説明',
      earned: '獲得',
      spent: '使用',
      bonus: 'ボーナス',
      withdrawal: '出金',
      withdrawRequest: '出金申請',
      withdrawRequestTitle: 'ポイント出金申請',
      withdrawAmount: '出金金額',
      paypalEmail: 'PayPal メール',
      paypalName: 'PayPal アカウント名',
      withdrawReason: '出金理由',
      submitWithdrawRequest: '出金申請する',
      accountDeletion: '退会',
      deleteAccount: 'アカウント削除',
      deleteAccountWarning: 'アカウントを削除すると、すべてのデータが永久に削除されます。',
      deleteAccountDescription: '退会申請をすると、管理者の審査後に処理されます。退会後はすべてのデータが復旧不可能に削除されます。',
      withdrawalReason: '退会理由',
      withdrawalDetails: '詳細内容',
      confirmDeletion: '退会確認',
      confirmText: '本当に退会しますか？確認するには「退会します」と入力してください。',
      confirmPlaceholder: '退会します',
      submitWithdrawal: '退会申請',
      cancel: 'キャンセル',
      processing: '処理中...',
      logout: 'ログアウト',
      goHome: 'ホームに戻る',
      noData: 'データがありません',
      edit: '編集',
      save: '保存',
      skinType: '肌タイプ',
      postalCode: '郵便番号',
      age: '年齢',
      region: '地域',
      bio: '自己紹介',
 
      instagramFollowers: 'Instagramフォロワー数',
      tiktokFollowers: 'TikTokフォロワー数',
      youtubeSubscribers: 'YouTube登録者数',
      roles: {
        user: '一般ユーザー',
        vip: 'VIPユーザー',
        manager: 'マネージャー',
        admin: '管理者'
      },
      reasons: {
        service: 'サービス不満',
        privacy: 'プライバシー懸念',
        unused: 'サービス未使用',
        other: 'その他'
      },
      snsUpload: 'SNS投稿',
      snsUploadUrl: 'SNS投稿URL',
      pointRequest: 'ポイント申請',
      pointRequestTitle: 'SNS投稿およびポイント申請',
      snsUploadDescription: 'SNSに投稿したコンテンツのURLを入力してポイントを申請してください。',
      additionalNotes: '追加メモ',
      submitPointRequest: 'ポイント申請する',
      pointRequestPending: 'ポイント申請待ち',
      pointRequestApproved: 'ポイント支給完了',
      messages: {
        withdrawalSubmitted: '退会申請が完了しました。管理者の審査後に処理されます。',
        error: 'エラーが発生しました。再度お試しください。',
        confirmRequired: '退会確認文を正確に入力してください。',
        reasonRequired: '退会理由を選択してください。',
        snsUploadSubmitted: 'SNS投稿およびポイント申請が完了しました。',
        snsUrlRequired: 'SNS投稿URLを入力してください。'
      }
    }
  }

  const t = texts[language] || texts.ko

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // 프로필 정보 로드
      const profileData = await database.userProfiles.get(user.id)
      setProfile(profileData)
      
      // 편집 폼 초기화 (실제 테이블 구조에 맞게)
      if (profileData) {
        setEditForm({
          name: profileData.name || '',
          phone: profileData.phone || '',
          // address: profileData.address || '', // 데이터베이스 스키마 적용 후 활성화
          bio: profileData.bio || '',
          age: profileData.age || '',
          region: profileData.region || '',
          skin_type: profileData.skin_type || '',

          instagram_url: profileData.instagram_url || '',
          tiktok_url: profileData.tiktok_url || '',
          youtube_url: profileData.youtube_url || '',
          other_sns_url: profileData.other_sns_url || '',
          instagram_followers: profileData.instagram_followers || '',
          tiktok_followers: profileData.tiktok_followers || '',
          youtube_subscribers: profileData.youtube_subscribers || ''
        })
      }
      
      // 신청 내역 로드
      const applicationsData = await database.applications.getByUser(user.id)
      
      // campaign_participants 데이터 로드 (선정된 캠페인 정보)
      const { data: participantsData, error: participantsError } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('user_id', user.id)
      
      // applications에 participants 데이터 조인
      const enrichedApplications = (applicationsData || []).map(app => {
        const participant = (participantsData || []).find(p => p.campaign_id === app.campaign_id)
        return {
          ...app,
          tracking_number: participant?.tracking_number,
          guide_confirmed: participant?.guide_confirmed,
          personalized_guide: participant?.personalized_guide,
          video_status: participant?.video_status,
          content_url: participant?.content_url
        }
      })
      
      setApplications(enrichedApplications)
      
      // 출금 내역 로딩 (point_transactions 테이블에서 직접 가져오기)
      try {
        console.log('출금 내역 로딩 시작 - 사용자 ID:', user.id)
        
        const { data: pointWithdrawals, error: pointError } = await supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', user.id)
          .lt('amount', 0) // 음수 금액 (출금)
          .order('created_at', { ascending: false })
        
        if (pointError) {
          console.warn('point_transactions에서 출금 데이터 로드 실패:', pointError)
          setWithdrawals([])
        } else {
          // point_transactions 데이터를 withdrawal_requests 형식으로 변환
          const formattedWithdrawals = (pointWithdrawals || []).map(item => {
            // description에서 상태 추출
            let status = 'pending'
            if (item.description?.includes('[상태:승인됨]') || item.description?.includes('[状態:承認済み]')) {
              status = 'approved'
            } else if (item.description?.includes('[상태:완료됨]') || item.description?.includes('[状態:完了]')) {
              status = 'completed'
            } else if (item.description?.includes('[상태:거부됨]') || item.description?.includes('[状態:拒否済み]')) {
              status = 'rejected'
            }
            
            return {
              id: item.id,
              user_id: item.user_id,
              amount: Math.abs(item.amount),
              status: status,
              withdrawal_method: 'paypal',
              paypal_email: extractPayPalFromDescription(item.description),
              paypal_name: extractPayPalFromDescription(item.description),
              reason: item.description,
              created_at: item.created_at,
              updated_at: item.updated_at
            }
          })
          
          // 중복 제거: 같은 사용자, 같은 금액, 같은 날짜의 출금 신청을 하나로 합침
          const uniqueWithdrawals = []
          const seen = new Set()
          
          for (const withdrawal of formattedWithdrawals) {
            const key = `${withdrawal.user_id}-${withdrawal.amount}-${withdrawal.created_at.split('T')[0]}`
            if (!seen.has(key)) {
              seen.add(key)
              uniqueWithdrawals.push(withdrawal)
            }
          }
          
          setWithdrawals(uniqueWithdrawals)
          console.log('출금 내역 로딩 성공:', uniqueWithdrawals.length, '(중복 제거 후)')
        }
      } catch (withdrawErr) {
        console.warn('출금 내역 로딩 실패:', withdrawErr)
        setWithdrawals([])
      }
      
      // 포인트 거래 내역 로딩 (모든 포인트 거래 표시)
      try {
        const { data: pointData, error: pointError } = await supabase
          .from('point_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (pointError) {
          console.warn('포인트 거래 내역 로딩 오류:', pointError)
          setPointTransactions([])
        } else {
          // 포인트 내역에서도 중복 제거: 같은 사용자, 같은 금액, 같은 날짜의 거래를 하나로 합침
          const uniquePointTransactions = []
          const seen = new Set()
          
          for (const transaction of (pointData || [])) {
            const key = `${transaction.user_id}-${transaction.amount}-${transaction.created_at.split('T')[0]}-${transaction.description || ''}`
            if (!seen.has(key)) {
              seen.add(key)
              uniquePointTransactions.push(transaction)
            }
          }
          
          setPointTransactions(uniquePointTransactions)
          console.log('포인트 거래 내역 로딩 성공:', uniquePointTransactions.length, '(중복 제거 후)')
        }
      } catch (pointErr) {
        console.warn('포인트 거래 내역 로딩 실패:', pointErr)
        setPointTransactions([])
      }
      
      // 프로필의 points 컬럼을 그대로 사용 (이미 profileData에 포함됨)
      // 별도의 포인트 계산 없이 데이터베이스의 points 값을 신뢰
      
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error)
      // 프로필 데이터가 없어도 페이지는 표시되도록 함
      if (!profile) {
        setProfile({
          name: user?.user_metadata?.full_name || user?.email || '',
          email: user?.email || '',
          phone_number: '',
          address: '',
          created_at: new Date().toISOString(),
          user_role: 'user',
          points: 0
        })
      }
      // 오류 메시지는 콘솔에만 표시하고 UI에는 표시하지 않음
      console.warn('일부 데이터 로드에 실패했지만 페이지는 계속 표시됩니다.')
      setError('') // 오류 상태 초기화
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setProcessing(true)
      setError('')
      
      // 숫자 필드 유효성 검사
  const validateNumber = (value, fieldName) => {
    // 빈 값이나 undefined는 null로 처리 (허용)
    if (!value || value === '' || value === undefined) {
      return null
    }
    
    // 숫자로 변환 시도
    const numValue = Number(value)
    if (isNaN(numValue)) {
      throw new Error(language === 'ja' ? `${fieldName}は数値で入力してください。` : `${fieldName}은(는) 숫자로 입력해주세요.`)
    }
    
    // 음수는 허용하지 않음 (나이, 팔로워 수 등)
    if (numValue < 0) {
      throw new Error(language === 'ja' ? `${fieldName}は0以上の数値で入力してください。` : `${fieldName}은(는) 0 이상의 숫자로 입력해주세요.`)
    }
    
    return numValue
  }

      // 업데이트할 데이터 준비 (실제 테이블 구조에 맞게, 빈 값도 허용)
      // 안전한 프로필 업데이트 데이터 생성 (존재하는 컬럼만 포함)
      const updateData = {}
      
      // 기본 정보 필드들 (안전하게 추가)
      if (editForm.name !== undefined) updateData.name = editForm.name?.trim() || null
      if (editForm.phone !== undefined) updateData.phone = editForm.phone?.trim() || null
      // address 필드는 데이터베이스 스키마 적용 후 활성화
      // if (editForm.address !== undefined) updateData.address = editForm.address?.trim() || null
      if (editForm.bio !== undefined) updateData.bio = editForm.bio?.trim() || null
      if (editForm.region !== undefined) updateData.region = editForm.region?.trim() || null
      if (editForm.skin_type !== undefined) updateData.skin_type = editForm.skin_type?.trim() || null
      
      // 나이 필드 (숫자 검증)
      if (editForm.age !== undefined) {
        try {
          updateData.age = validateNumber(editForm.age, language === 'ja' ? '年齢' : '나이')
        } catch (err) {
          console.warn('나이 필드 검증 실패:', err.message)
          updateData.age = null
        }
      }
      
      // SNS URL 필드들 (빈 값 허용)
      if (editForm.instagram_url !== undefined) updateData.instagram_url = editForm.instagram_url?.trim() || null
      if (editForm.tiktok_url !== undefined) updateData.tiktok_url = editForm.tiktok_url?.trim() || null
      if (editForm.youtube_url !== undefined) updateData.youtube_url = editForm.youtube_url?.trim() || null
      if (editForm.other_sns_url !== undefined) updateData.other_sns_url = editForm.other_sns_url?.trim() || null
      
      // SNS 팔로워 수 필드들 (숫자 검증, 빈 값 허용)
      if (editForm.instagram_followers !== undefined) {
        try {
          updateData.instagram_followers = validateNumber(editForm.instagram_followers, 'Instagram ' + (language === 'ja' ? 'フォロワー数' : '팔로워 수'))
        } catch (err) {
          console.warn('Instagram 팔로워 수 검증 실패:', err.message)
          updateData.instagram_followers = null
        }
      }
      
      if (editForm.tiktok_followers !== undefined) {
        try {
          updateData.tiktok_followers = validateNumber(editForm.tiktok_followers, 'TikTok ' + (language === 'ja' ? 'フォロワー数' : '팔로워 수'))
        } catch (err) {
          console.warn('TikTok 팔로워 수 검증 실패:', err.message)
          updateData.tiktok_followers = null
        }
      }
      
      if (editForm.youtube_subscribers !== undefined) {
        try {
          updateData.youtube_subscribers = validateNumber(editForm.youtube_subscribers, 'YouTube ' + (language === 'ja' ? '登録者数' : '구독자 수'))
        } catch (err) {
          console.warn('YouTube 구독자 수 검증 실패:', err.message)
          updateData.youtube_subscribers = null
        }
      }
      
      // 업데이트 시간 추가
      updateData.updated_at = new Date().toISOString()

      console.log('프로필 업데이트 데이터:', updateData)
      
      // Supabase 직접 업데이트 사용
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
      
      if (updateError) {
        console.error('프로필 업데이트 오류:', updateError)
        throw new Error(updateError.message)
      }

      console.log('프로필 업데이트 성공:', data)
      
      // 로컬 상태 업데이트
      setProfile(prev => ({ ...prev, ...updateData }))
      
      setSuccess(language === 'ja' ? 'プロフィールが正常に更新されました。' : '프로필이 성공적으로 업데이트되었습니다.')
      setIsEditing(false)
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      setError(error.message || (language === 'ja' ? 'プロフィールの更新に失敗しました。' : '프로필 업데이트에 실패했습니다.'))
    } finally {
      setProcessing(false)
    }
  }

  // 출금 신청 처리 함수
  const handleWithdrawSubmit = async () => {
    if (!withdrawForm.amount || !withdrawForm.paypalEmail || !withdrawForm.paypalName) {
      setError(language === 'ja' ? 'すべての必須項目を入力してください。' : '모든 필수 항목을 입력해주세요.')
      return
    }

    const requestAmount = parseInt(withdrawForm.amount)
    const currentPoints = profile?.points || 0

    if (requestAmount > currentPoints) {
      setError(language === 'ja' ? '保有ポイントより多い金額は出金できません。' : '보유 포인트보다 많은 금액을 출금할 수 없습니다.')
      return
    }

    if (requestAmount < 1000) {
      setError(language === 'ja' ? '最小出金額は1,000ポイントです。' : '최소 출금 금액은 1,000포인트입니다.')
      return
    }

    try {
      setProcessing(true)
      setError('')

      // withdrawal_requests 테이블에 출금 신청 기록
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert([{
          user_id: user.id,
          amount: requestAmount,
          withdrawal_method: 'paypal',
          paypal_email: withdrawForm.paypalEmail,
          paypal_name: withdrawForm.paypalName,
          reason: withdrawForm.reason || (language === 'ja' ? 'ポイント出金申請' : '포인트 출금 신청'),
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()

      if (withdrawalError) {
        console.error('출금 신청 오류:', withdrawalError)
        throw new Error(withdrawalError.message)
      }

      console.log('출금 신청 성공:', withdrawalData)

      // 실제 사용자 프로필의 포인트 차감
      const newPoints = currentPoints - requestAmount
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({ points: newPoints })
        .eq('user_id', user.id)

      if (profileUpdateError) {
        console.error('프로필 포인트 업데이트 오류:', profileUpdateError)
        throw new Error('포인트 차감에 실패했습니다.')
      }

      // 포인트 차감 기록을 point_transactions에 추가 (출금 신청이 아닌 포인트 사용으로 기록)
      const { error: pointError } = await supabase
        .from('point_transactions')
        .insert([{
          user_id: user.id,
          amount: -requestAmount,
          transaction_type: 'spent',
          description: language === 'ja' ? `ポイント使用: 出金申請` : `포인트 사용: 출금 신청`,
          created_at: new Date().toISOString()
        }])

      if (pointError) {
        console.warn('포인트 차감 기록 실패:', pointError)
        // 포인트 기록 실패는 치명적이지 않으므로 계속 진행
      }
      
      setSuccess(language === 'ja' ? '出金申請が完了しました。管理者の審査後に処理されます。' : '출금 신청이 완료되었습니다. 관리자 검토 후 처리됩니다.')
      setShowWithdrawModal(false)
      setWithdrawForm({
        amount: '',
        paypalEmail: '',
        paypalName: '',
        reason: ''
      })
      
      // 데이터를 다시 로드하여 최신 상태 반영
      await loadUserData()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('출금 신청 오류:', error)
      setError(error.message || (language === 'ja' ? '出金申請中にエラーが発生しました。再度お試しください。' : '출금 신청 중 오류가 발생했습니다. 다시 시도해주세요.'))
    } finally {
      setProcessing(false)
    }
  }



  // SNS 업로드 모달에서 제출 처리
  const handleSnsUploadSubmit = async () => {
    try {
      if (!snsUploadForm.sns_upload_url || typeof snsUploadForm.sns_upload_url !== 'string' || !snsUploadForm.sns_upload_url.trim()) {
        setError(t.messages?.snsUrlRequired || (language === 'ja' ? 'SNS投稿URLを入力してください。' : 'SNS 업로드 URL을 입력해주세요.'))
        return
      }

      if (!selectedApplication) {
        setError(language === 'ja' ? '選択されたアプリケーションが見つかりません。' : '선택된 신청을 찾을 수 없습니다.')
        return
      }
      
      setProcessing(true)
      setError('')
      
      // URL 유효성 검사
      try {
        new URL(snsUploadForm.sns_upload_url)
      } catch (urlError) {
        setError(language === 'ja' ? '有効なURLを入力してください。' : '유효한 URL을 입력해주세요.')
        setProcessing(false)
        return
      }
      
      // applications 테이블의 기존 컬럼 활용
      const updateData = {
        video_links: snsUploadForm.sns_upload_url, // SNS URL을 video_links에 저장
        additional_info: snsUploadForm.notes, // 추가 메모를 additional_info에 저장
        updated_at: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', selectedApplication.id)
        .eq('user_id', user.id) // 보안을 위해 user_id도 확인
      
      if (updateError) {
        console.error('Application update error:', updateError)
        throw new Error(language === 'ja' ? 'SNS投稿の更新に失敗しました。' : 'SNS 업로드 업데이트에 실패했습니다.')
      }
      
      // point_transactions 테이블에 포인트 신청 기록 추가
      try {
        const { error: pointError } = await supabase
          .from('point_transactions')
          .insert({
            user_id: user.id,
            campaign_id: selectedApplication.campaign_id,
            application_id: selectedApplication.id,
            transaction_type: 'pending',
            amount: 0, // 승인 전이므로 0
            description: `SNS 업로드 포인트 신청: ${snsUploadForm.sns_upload_url}`,
            created_at: new Date().toISOString()
          })
        
        if (pointError) {
          console.warn('포인트 신청 기록 추가 실패:', pointError)
          // 포인트 기록 실패는 치명적이지 않으므로 계속 진행
        }
      } catch (pointInsertError) {
        console.warn('Point transaction insert failed:', pointInsertError)
        // 포인트 기록 실패는 치명적이지 않으므로 계속 진행
      }
      
      setSuccess(t.messages?.snsUploadSubmitted || (language === 'ja' ? 'SNS投稿およびポイント申請が完了しました。' : 'SNS 업로드 및 포인트 신청이 완료되었습니다.'))
      setShowSnsUploadModal(false)
      setSnsUploadForm({ sns_upload_url: '', notes: '' })
      setSelectedApplication(null)
      
      // 데이터 새로고침
      await loadUserData()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('SNS 업로드 오류:', error)
      setError(error.message || (language === 'ja' ? 'エラーが発生しました。再試行してください。' : '오류가 발생했습니다. 다시 시도해주세요.'))
    } finally {
      setProcessing(false)
    }
  }

  const openSnsUploadModal = (application) => {
    try {
      // 에러 상태 초기화
      setError('')
      setSuccess('')
      
      if (!application) {
        setError(language === 'ja' ? 'アプリケーション情報が見つかりません。' : '신청 정보를 찾을 수 없습니다.')
        return
      }

      setSelectedApplication(application)
      setSnsUploadForm({
        sns_upload_url: application.video_links || '',
        notes: application.additional_info || ''
      })
      setShowSnsUploadModal(true)
      
      console.log('SNS 업로드 모달 열림:', application.id, application.campaign_title)
    } catch (error) {
      console.error('SNS 업로드 모달 열기 오류:', error)
      setError(language === 'ja' ? 'モーダルを開けませんでした。' : '모달을 열 수 없습니다.')
    }
  }

  const handleWithdrawalSubmit = async () => {
    if (!withdrawalReason) {
      setError(t.messages.reasonRequired)
      return
    }
    
    if (confirmText !== (language === 'ja' ? '退会します' : '탈퇴합니다')) {
      setError(t.messages.confirmRequired)
      return
    }
    
    try {
      setProcessing(true)
      setError('')
      
      const { error } = await database.supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          reason: withdrawalReason,
          additional_info: withdrawalDetails,
          status: 'pending'
        })
      
      if (error) throw error
      
      setSuccess(t.messages.withdrawalSubmitted)
      setShowWithdrawalModal(false)
      setWithdrawalReason('')
      setWithdrawalDetails('')
      setConfirmText('')
      
      setTimeout(() => setSuccess(''), 5000)
      
    } catch (error) {
      console.error('탈퇴 신청 오류:', error)
      setError(t.messages.error)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      user: 'bg-gray-100 text-gray-800',
      vip: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      admin: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[role] || badges.user}`}>
        {t.roles[role] || t.roles.user}
      </span>
    )
  }

  const getTransactionTypeColor = (type) => {
    const colors = {
      earn: 'text-green-600',
      bonus: 'text-blue-600',
      admin_add: 'text-purple-600',
      spend: 'text-red-600',
      admin_subtract: 'text-red-600'
    }
    return colors[type] || 'text-gray-600'
  }

  const getTransactionTypeText = (type) => {
    const types = {
      earn: t.earned,
      earned: t.earned,
      bonus: t.bonus,
      admin_add: t.bonus,
      spend: t.spent,
      spent: t.spent,
      admin_subtract: t.spent,
      pending: language === 'ja' ? '申請中' : '신청중',
      approved: language === 'ja' ? '承認済み' : '승인됨',
      rejected: language === 'ja' ? '拒否済み' : '거부됨',
      completed: language === 'ja' ? '完了' : '완료',
      reward: language === 'ja' ? '報酬' : '보상'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="mt-2 text-gray-600">
{language === 'ja' ? `${profile?.name || user?.email}さんのアカウント情報` : `${profile?.name || user?.email}님의 계정 정보`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.goHome}
              </button>
              <button
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.logout}
              </button>
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
        {error && error !== t.messages?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: t.profile, icon: User },
                { id: 'applications', label: t.applications, icon: Award },
                { id: 'withdrawals', label: t.withdrawals, icon: CreditCard },
                { id: 'points', label: t.points, icon: Download },
                { id: 'settings', label: t.accountSettings, icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{t.personalInfo}</h2>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleProfileSave()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? t.processing : (isEditing ? t.save : t.edit)}
                </button>
              </div>
              
              {/* 성공/오류 메시지 */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.name}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.name || (language === 'ja' ? '名前未設定' : '이름 없음')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.email}</label>
                    <p className="mt-1 text-sm text-gray-900">{profile?.email || user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.phone}
                      <span className="text-xs text-gray-500 ml-1">({language === 'ja' ? '任意' : '선택사항'})</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="080-1234-5678"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.phone || (language === 'ja' ? '未登録' : '등록되지 않음')}</p>
                    )}
                  </div>
                  
                  {/* 주소 필드는 데이터베이스 스키마 적용 후 활성화 */}
                  {/* 
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.address}
                      <span className="text-xs text-gray-500 ml-1">({language === 'ja' ? '任意' : '선택사항'})</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={language === 'ja' ? '東京都渋谷区...' : '서울특별시 강남구...'}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.address || (language === 'ja' ? '未登録' : '등록되지 않음')}</p>
                    )}
                  </div>
                  */}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.skinType}</label>
                    {isEditing ? (
                      <select
                        value={editForm.skin_type}
                        onChange={(e) => setEditForm({...editForm, skin_type: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        <option value="乾燥肌">乾燥肌</option>
                        <option value="脂性肌">脂性肌</option>
                        <option value="混合肌">混合肌</option>
                        <option value="敏感肌">敏感肌</option>
                        <option value="普通肌">普通肌</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.skin_type || '未設定'}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.age}
                      <span className="text-xs text-gray-500 ml-1">({language === 'ja' ? '任意' : '선택사항'})</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25"
                        min="1"
                        max="100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.age || (language === 'ja' ? '未設定' : '미설정')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.region}
                      <span className="text-xs text-gray-500 ml-1">({language === 'ja' ? '任意' : '선택사항'})</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.region || ''}
                        onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={language === 'ja' ? '東京都' : '서울특별시'}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.region || (language === 'ja' ? '未設定' : '미설정')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.bio}
                      <span className="text-xs text-gray-500 ml-1">({language === 'ja' ? '任意' : '선택사항'})</span>
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder={language === 'ja' ? '自己紹介を入力してください...' : '자기소개를 입력하세요...'}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile?.bio || (language === 'ja' ? '未設定' : '미설정')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.joinDate}</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR') : '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.userRole}</label>
                    <div className="mt-1">{getRoleBadge(profile?.user_role)}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.currentPoints}</label>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-semibold text-purple-600">
                        {profile?.points?.toLocaleString() || 0}P
                      </p>
                      <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        {t.withdrawRequest}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SNS 주소 섹션 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {language === 'ko' ? 'SNS 주소' : 'SNSアドレス'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.instagram_url}
                        onChange={(e) => setEditForm({...editForm, instagram_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.instagram_url ? (
                          <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.instagram_url}
                          </a>
                        ) : (language === 'ja' ? '未登録' : '등록되지 않음')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TikTok</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.tiktok_url}
                        onChange={(e) => setEditForm({...editForm, tiktok_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://tiktok.com/@username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.tiktok_url ? (
                          <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.tiktok_url}
                          </a>
                        ) : (language === 'ja' ? '未登録' : '등록되지 않음')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.youtube_url}
                        onChange={(e) => setEditForm({...editForm, youtube_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/@username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.youtube_url ? (
                          <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.youtube_url}
                          </a>
                        ) : (language === 'ja' ? '未登録' : '등록되지 않음')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{language === 'ja' ? 'その他のSNS' : '기타 SNS'}</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.other_sns_url}
                        onChange={(e) => setEditForm({...editForm, other_sns_url: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://other-sns.com/username"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.other_sns_url ? (
                          <a href={profile.other_sns_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.other_sns_url}
                          </a>
                        ) : (language === 'ja' ? '未登録' : '등록되지 않음')}
                      </p>
                    )}
                  </div>
                </div>
              </div>



              {/* SNS 팔로워 수 섹션 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {language === 'ja' ? 'SNSフォロワー数' : 'SNS 팔로워 수'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.instagramFollowers}</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.instagram_followers}
                        onChange={(e) => setEditForm({...editForm, instagram_followers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.instagram_followers ? profile.instagram_followers.toLocaleString() : (language === 'ja' ? '未設定' : '설정되지 않음')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.tiktokFollowers}</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.tiktok_followers}
                        onChange={(e) => setEditForm({...editForm, tiktok_followers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.tiktok_followers ? profile.tiktok_followers.toLocaleString() : (language === 'ja' ? '未設定' : '설정되지 않음')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.youtubeSubscribers}</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.youtube_subscribers}
                        onChange={(e) => setEditForm({...editForm, youtube_subscribers: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                        min="0"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {profile?.youtube_subscribers ? profile.youtube_subscribers.toLocaleString() : (language === 'ja' ? '未設定' : '설정되지 않음')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.campaignApplications}</h2>
              
              {/* 신청 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{t.totalApplications}</p>
                      <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{t.approvedApplications}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(a => a.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Download className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{t.completedCampaigns}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(a => a.submission_status === 'submitted').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 신청 목록 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ko' ? '캠페인' : 'キャンペーン'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ko' ? '상태' : 'ステータス'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ko' ? '신청일' : '応募日'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ko' ? '자료' : '資料'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          {t.noData}
                        </td>
                      </tr>
                    ) : (
                      applications.map((application) => (
                        <tr key={application.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {application.campaign_title || (language === 'ko' ? '캠페인 정보 없음' : 'キャンペーン情報なし')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === 'approved' ? 'bg-green-100 text-green-800' :
                              application.status === 'selected' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status === 'approved' ? (language === 'ko' ? '승인됨' : '承認済み') :
                               application.status === 'selected' ? (language === 'ko' ? '선정됨' : '選定済み') :
                               application.status === 'rejected' ? (language === 'ko' ? '거절됨' : '拒否済み') : 
                               (language === 'ko' ? '검토중' : '検討中')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(application.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {application.status === 'selected' ? (
                              <div className="space-y-2">
                                {/* 송장번호 확인 */}
                                {application.tracking_number && (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">📦 송장번호: </span>
                                    <span className="text-blue-600">{application.tracking_number}</span>
                                  </div>
                                )}
                                
                                {/* 가이드 확인 */}
                                {application.guide_confirmed ? (
                                  application.personalized_guide ? (
                                    <button
                                      onClick={() => {
                                        alert(application.personalized_guide)
                                      }}
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                    >
                                      📝 가이드 보기
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                      ✅ 가이드 확인완료
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⏳ 가이드 준비중
                                  </span>
                                )}
                                
                                {/* 영상 업로드 버튼 */}
                                {application.guide_confirmed && (
                                  application.content_url ? (
                                    <a
                                      href={application.content_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                    >
                                      🎥 영상 보기
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const url = prompt('영상 URL을 입력하세요:')
                                        if (url) {
                                          // TODO: 영상 URL 업로드 로직
                                          alert('영상 업로드 기능은 공사중입니다.')
                                        }
                                      }}
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                                    >
                                      📹 영상 업로드
                                    </button>
                                  )
                                )}
                                
                                {/* 영상 수정요청 */}
                                {application.video_status === 'revision_requested' && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                    ⚠️ 수정요청
                                  </span>
                                )}
                                
                                {/* 마감일 연장 신청 */}
                                <button
                                  onClick={() => {
                                    alert('마감일 연장 신청 기능은 공사중입니다.')
                                  }}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                                >
                                  📅 마감일 연장 신청
                                </button>
                              </div>
                            ) : application.status === 'approved' ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {application.google_drive_url && (
                                    <a
                                      href={application.google_drive_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                    >
                                      📁 {language === 'ko' ? '구글 드라이브' : 'Google Drive'}
                                    </a>
                                  )}
                                  {application.google_slides_url && (
                                    <a
                                      href={application.google_slides_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                    >
                                      📊 {language === 'ko' ? '구글 슬라이드' : 'Google Slides'}
                                    </a>
                                  )}
                                </div>
                                
                                {/* SNS 업로드 및 포인트 신청 버튼 */}
                                <div className="mt-2">
                                  {/* video_links가 있고 point_transactions에 승인된 기록이 있으면 완료 상태 */}
                                  {application.video_links && pointTransactions.some(pt => 
                                    pt.application_id === application.id && pt.transaction_type === 'reward'
                                  ) ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                      ✅ {t.pointRequestApproved}
                                    </span>
                                  ) : application.video_links && pointTransactions.some(pt => 
                                    pt.application_id === application.id && pt.transaction_type === 'pending'
                                  ) ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                      ⏳ {t.pointRequestPending}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        openSnsUploadModal(application)
                                      }}
                                      type="button"
                                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                    >
                                      📱 {t.snsUpload}
                                    </button>
                                  )}
                                </div>
                                
                                {(!application.google_drive_url && !application.google_slides_url) && (
                                  <span className="text-xs text-gray-400">
                                    {language === 'ko' ? '자료 준비 중' : '資料準備中'}
                                  </span>
                                )}
                              </div>
                            ) : application.status === 'pending' ? (
                              <div className="space-y-2">
                                {/* 지원취소 버튼 */}
                                <button
                                  onClick={async () => {
                                    if (confirm('정말로 지원을 취소하시겠습니까?')) {
                                      try {
                                        const { error } = await supabase
                                          .from('campaign_applications')
                                          .delete()
                                          .eq('id', application.id)
                                        
                                        if (error) throw error
                                        
                                        alert('지원이 취소되었습니다.')
                                        loadUserData() // 데이터 새로고침
                                      } catch (error) {
                                        console.error('Error cancelling application:', error)
                                        alert('지원 취소에 실패했습니다.')
                                      }
                                    }
                                  }}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                >
                                  ❌ 지원취소
                                </button>
                                
                                {/* 지원내역 수정 버튼 */}
                                <button
                                  onClick={() => {
                                    alert('지원내역 수정 기능은 공사중입니다.')
                                  }}
                                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                                >
                                  ✏️ 지원내역 수정
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* SNS 업로드 경고 메시지 */}
              {applications.some(app => app.status === 'approved') && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">
                        {language === 'ko' ? '⚠️ SNS 업로드 주의사항' : '⚠️ SNS投稿注意事項'}
                      </p>
                      <p>
                        {language === 'ko' 
                          ? 'SNS 업로드는 영상이 1회 수정된 후 업로드 해주세요. 절대 바로 올리지 마세요.' 
                          : 'SNS投稿は動画を1回修正してからアップロードしてください。絶対にそのまま投稿しないでください。'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.withdrawalHistory}</h2>
              
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4">{t.noData}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ko' ? '출금 방법' : '出金方法'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ko' ? '금액' : '金額'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ko' ? '상태' : 'ステータス'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ko' ? '신청일' : '申請日'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ko' ? '처리일' : '処理日'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {withdrawal.withdrawal_method === 'paypal' ? 'PayPal' : 
                             withdrawal.withdrawal_method === 'bank' ? (language === 'ko' ? '은행 송금' : '銀行振込') : 
                             withdrawal.withdrawal_method || 'PayPal'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₩{withdrawal.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                              withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {withdrawal.status === 'completed' ? (language === 'ko' ? '완료' : '完了') :
                               withdrawal.status === 'approved' ? (language === 'ko' ? '승인됨' : '承認済み') :
                               withdrawal.status === 'rejected' ? (language === 'ko' ? '거절됨' : '拒否済み') : 
                               (language === 'ko' ? '대기중' : '待機中')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(withdrawal.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {withdrawal.processed_at ? 
                              new Date(withdrawal.processed_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'ko-KR') : 
                              '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.pointHistory}</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.transactionType}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.amount}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.description}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.date}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pointTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                          {t.noData}
                        </td>
                      </tr>
                    ) : (
                      pointTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                              {getTransactionTypeText(transaction.transaction_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {transaction.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('ko-KR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* SNS 업로드 경고 메시지 */}
              {applications.some(app => app.status === 'approved') && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">
                        {language === 'ko' ? '⚠️ SNS 업로드 주의사항' : '⚠️ SNS投稿注意事項'}
                      </p>
                      <p>
                        {language === 'ko' 
                          ? 'SNS 업로드는 영상이 1회 수정된 후 업로드 해주세요. 절대 바로 올리지 마세요.' 
                          : 'SNS投稿は動画を1回修正してからアップロードしてください。絶対にそのまま投稿しないでください。'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.accountSettings}</h2>
              
              <div className="space-y-6">
                {/* 계정 삭제 섹션 */}
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-red-900">{t.accountDeletion}</h3>
                      <p className="mt-2 text-sm text-red-700">
                        {t.deleteAccountWarning}
                      </p>
                      <p className="mt-2 text-sm text-red-700">
                        {t.deleteAccountDescription}
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => setShowWithdrawalModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t.deleteAccount}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 출금 신청 모달 */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999]">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.withdrawRequestTitle}</h3>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                  </div>
                )}
                
                {/* 포인트 가치 안내 */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    💰 {language === 'ja' ? '1ポイント = 1円です' : '1포인트 = 1엔입니다'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {language === 'ja' ? 'PayPalで日本円として出金されます' : 'PayPal로 일본 엔화로 출금됩니다'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.withdrawAmount} *
                    </label>
                    <input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                      placeholder={language === 'ja' ? '出金するポイント数' : '출금할 포인트 수'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      max={profile?.points || 0}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {language === 'ja' ? '保有ポイント' : '보유 포인트'}: {profile?.points?.toLocaleString() || 0}P
                      {withdrawForm.amount && (
                        <span className="ml-2 text-green-600 font-medium">
                          (≈ ₩{parseInt(withdrawForm.amount || 0).toLocaleString()})
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.paypalEmail} *
                    </label>
                    <input
                      type="email"
                      value={withdrawForm.paypalEmail}
                      onChange={(e) => setWithdrawForm({...withdrawForm, paypalEmail: e.target.value})}
                      placeholder={language === 'ja' ? 'PayPal アカウントメール' : 'PayPal 계정 이메일'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.paypalName} *
                    </label>
                    <input
                      type="text"
                      value={withdrawForm.paypalName}
                      onChange={(e) => setWithdrawForm({...withdrawForm, paypalName: e.target.value})}
                      placeholder={language === 'ja' ? 'PayPal アカウント名（実名）' : 'PayPal 계정명 (실명)'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.withdrawReason}
                    </label>
                    <textarea
                      value={withdrawForm.reason}
                      onChange={(e) => setWithdrawForm({...withdrawForm, reason: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={language === 'ja' ? '出金理由（任意）' : '출금 사유 (선택사항)'}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleWithdrawSubmit}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? t.processing : t.submitWithdrawRequest}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 모달 */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.accountDeletion}</h3>
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.withdrawalReason} *
                    </label>
                    <select
                      value={withdrawalReason}
                      onChange={(e) => setWithdrawalReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">사유를 선택하세요</option>
                      <option value="service">{t.reasons.service}</option>
                      <option value="privacy">{t.reasons.privacy}</option>
                      <option value="unused">{t.reasons.unused}</option>
                      <option value="other">{t.reasons.other}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.withdrawalDetails}
                    </label>
                    <textarea
                      value={withdrawalDetails}
                      onChange={(e) => setWithdrawalDetails(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="추가 설명이 있으시면 입력해주세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.confirmDeletion} *
                    </label>
                    <p className="text-sm text-gray-600 mb-2">{t.confirmText}</p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={t.confirmPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleWithdrawalSubmit}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? t.processing : t.submitWithdrawal}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SNS 업로드 및 포인트 신청 모달 */}
        {showSnsUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t.pointRequestTitle}</h3>
                  <button
                    onClick={() => setShowSnsUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {t.snsUploadDescription}
                  </p>
                  {selectedApplication && (
                    <p className="text-sm text-blue-600 mt-2 font-medium">
                      캠페인: {selectedApplication.campaign_title}
                    </p>
                  )}
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.snsUploadUrl} *
                    </label>
                    <input
                      type="url"
                      value={snsUploadForm.sns_upload_url}
                      onChange={(e) => setSnsUploadForm({...snsUploadForm, sns_upload_url: e.target.value})}
                      placeholder={language === 'ja' ? 'https://instagram.com/p/... または https://tiktok.com/@.../video/...' : 'https://instagram.com/p/... 또는 https://tiktok.com/@.../video/...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {language === 'ja' ? 'Instagram、TikTok、YouTubeなどのSNS投稿URLを入力してください' : 'Instagram, TikTok, YouTube 등의 SNS 게시물 URL을 입력해주세요'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.additionalNotes}
                    </label>
                    <textarea
                      value={snsUploadForm.notes}
                      onChange={(e) => setSnsUploadForm({...snsUploadForm, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={language === 'ja' ? '追加情報があれば入力してください' : '추가 정보가 있으면 입력해주세요'}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSnsUploadModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSnsUploadSubmit}
                    disabled={processing || !snsUploadForm.sns_upload_url || typeof snsUploadForm.sns_upload_url !== 'string' || !snsUploadForm.sns_upload_url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? t.processing : t.submitPointRequest}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPageWithWithdrawal
