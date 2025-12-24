# CNEC US - Translation Reference

Complete list of Korean text that needs to be translated to English.

---

## CreatorMyPage.jsx (Main Dashboard)

### Grade Configuration (Line ~14-20)

| Korean | English |
|--------|---------|
| 새싹 크리에이터 | New Creator |
| 빛나기 시작하는 단계 | Rising Star |
| 본격적으로 피어나는 중 | Established Creator |
| 브랜드가 먼저 찾는 | Brand Favorite |
| 크넥 대표 뮤즈 | Top Creator |

### Banks List (Line ~49-68)

Replace Korean banks with US banks:

```jsx
// US Banks
const usBanks = [
  'Bank of America',
  'Chase',
  'Wells Fargo',
  'Citibank',
  'US Bank',
  'Capital One',
  'PNC Bank',
  'TD Bank',
  'Truist',
  'Fifth Third Bank',
  'Regions Bank',
  'KeyBank',
  'Huntington Bank',
  'Ally Bank',
  'Discover Bank',
  'Charles Schwab',
  'USAA',
  'Navy Federal'
]
```

### UI Text Translations

| Location | Korean | English |
|----------|--------|---------|
| Dashboard | 프로필을 완성해주세요! | Complete your profile! |
| Dashboard | SNS 연결하고 캠페인에 지원하세요 | Connect your social media and apply for campaigns |
| Dashboard | 완성하기 | Complete |
| Grade Card | 크리에이터 | Creator |
| Grade Card | 종합 점수 | Total Score |
| Grade Card | 완료 캠페인 | Completed Campaigns |
| Grade Card | 건 | campaigns |
| Campaigns | 나의 캠페인 | My Campaigns |
| Campaigns | 전체보기 | View All |
| Campaigns | 신청 | Applied |
| Campaigns | 선정 | Selected |
| Campaigns | 진행중 | In Progress |
| Campaigns | 완료 | Completed |
| Points | 보유 포인트 | Point Balance |
| Points | 출금 신청하기 | Request Withdrawal |
| Menu | 캠페인 관리 | Campaign Management |
| Menu | 지원 내역 | Application History |
| Menu | 찜한 캠페인 | Saved Campaigns |
| Menu | 계정 및 설정 | Account & Settings |
| Menu | 프로필 설정 | Profile Settings |
| Menu | 계좌 정보 관리 | Bank Account |
| Menu | 알림 설정 | Notification Settings |
| Menu | 기타 | Other |
| Menu | 고객센터 | Support |
| Menu | 로그아웃 | Log Out |

### Profile Edit Section

| Korean | English |
|--------|---------|
| 프로필 설정 | Profile Settings |
| 기본 정보 | Basic Information |
| 이름 * | Name * |
| 연락처 * | Phone * |
| 피부타입 * | Skin Type * |
| 선택하세요 | Select |
| 건성 | Dry |
| 지성 | Oily |
| 복합성 | Combination |
| 민감성 | Sensitive |
| 중성 | Normal |
| 주소 * | Address * |
| 배송받을 주소 | Shipping address |
| SNS 계정 (최소 1개) | Social Media (at least 1) |
| 인스타그램 URL | Instagram URL |
| 유튜브 URL | YouTube URL |
| 틱톡 URL | TikTok URL |
| 정산 정보 | Payment Information |
| 은행 | Bank |
| 은행 선택 | Select Bank |
| 계좌번호 ('-' 없이) | Account Number |
| 예금주명 | Account Holder Name |
| 프로필 저장 | Save Profile |
| 저장 중... | Saving... |

### Applications Section

| Korean | English |
|--------|---------|
| 지원 내역 | Application History |
| 아직 지원한 캠페인이 없습니다 | No campaign applications yet |
| 검토중 | Under Review |
| 승인 | Approved |
| 선정 | Selected |
| 가선정 | Tentatively Selected |
| 미선정 | Not Selected |
| 촬영중 | Filming |
| 영상제출 | Video Submitted |
| 완료 | Completed |
| 정산완료 | Payment Complete |

### Points Section

| Korean | English |
|--------|---------|
| 포인트 / 정산 | Points / Earnings |
| 보유 포인트 | Available Points |
| 정산 신청 | Request Payout |
| 등록된 계좌 | Registered Account |
| 출금 신청하기 | Request Withdrawal |
| 정산받을 계좌를 먼저 등록해주세요 | Please register a bank account first |
| 계좌 등록하기 | Register Account |

### Account Management Section

| Korean | English |
|--------|---------|
| 계좌 관리 | Bank Account |
| 팝빌 계좌 인증을 통해 예금주를 확인합니다 | Verify your account to confirm ownership |
| 인증된 계좌만 등록할 수 있습니다 | Only verified accounts can be registered |
| 은행 * | Bank * |
| 은행 선택 | Select Bank |
| 계좌번호 * | Account Number * |
| '-' 없이 숫자만 입력 | Numbers only |
| 인증하기 | Verify |
| 인증중 | Verifying... |
| 계좌 인증 완료 | Account Verified |
| 예금주 | Account Holder |
| 계좌 인증 시 자동 입력됩니다 | Auto-filled after verification |
| 예금주는 계좌 인증을 통해 자동으로 확인됩니다 | Account holder is verified automatically |
| 인증된 계좌 저장 | Save Verified Account |
| 계좌 인증 후 저장 가능 | Verify account to save |
| 현재 등록된 계좌 | Current Account |
| 인증됨 | Verified |

### Wishlist Section

| Korean | English |
|--------|---------|
| 찜한 캠페인 | Saved Campaigns |
| 찜한 캠페인이 없습니다 | No saved campaigns |
| 캠페인 목록에서 하트를 눌러 찜해보세요 | Save campaigns by clicking the heart icon |
| 캠페인 둘러보기 | Browse Campaigns |

### Withdrawal Modal

| Korean | English |
|--------|---------|
| 출금 신청 | Withdrawal Request |
| 출금 가능 포인트 | Available Balance |
| 입금 계좌 | Deposit Account |
| 출금 금액 | Withdrawal Amount |
| 최소 10,000P | Minimum $100 |
| 주민등록번호 * | Tax ID (SSN) * |
| 세금 신고를 위해 필요하며, 암호화되어 안전하게 저장됩니다 | Required for tax purposes. Securely encrypted. |
| 출금 신청 후 영업일 기준 3~5일 내 입금됩니다 | Deposits are processed within 3-5 business days |
| 세금(3.3%)이 공제된 금액이 입금됩니다 | Amount will be deposited after tax deduction |
| 정보가 일치하지 않을 경우 입금이 지연될 수 있습니다 | Deposits may be delayed if information doesn't match |
| 출금 신청하기 | Submit Request |
| 처리 중... | Processing... |

### Error/Success Messages

| Korean | English |
|--------|---------|
| 프로필이 저장되었습니다 | Profile saved successfully |
| 프로필 저장에 실패했습니다 | Failed to save profile |
| 계좌 정보가 저장되었습니다 | Bank account saved successfully |
| 계좌 정보 저장에 실패했습니다 | Failed to save bank account |
| 은행과 계좌번호를 입력해주세요 | Please enter bank and account number |
| 계좌 인증이 완료되었습니다 | Account verified successfully |
| 계좌 인증에 실패했습니다 | Account verification failed |
| 계좌 인증 중 오류가 발생했습니다 | Error during account verification |
| 계좌 인증을 먼저 진행해주세요 | Please verify your account first |
| 최소 출금 금액은 10,000P입니다 | Minimum withdrawal is $100 |
| 보유 포인트보다 많은 금액은 출금할 수 없습니다 | Cannot withdraw more than your balance |
| 주민등록번호 형식이 올바르지 않습니다 (13자리) | Invalid SSN format |
| 계좌 정보를 먼저 등록해주세요 | Please register bank account first |
| 출금 신청이 완료되었습니다 | Withdrawal request submitted |
| 영업일 기준 3-5일 내 입금됩니다 | Deposit within 3-5 business days |
| 출금 신청에 실패했습니다. 다시 시도해주세요 | Withdrawal request failed. Please try again |
| 데이터 로드 오류 | Error loading data |

---

## LoginPageExactReplica.jsx

| Korean | English |
|--------|---------|
| 로그인 | Log In |
| 이메일 | Email |
| 비밀번호 | Password |
| 로그인하기 | Sign In |
| 비밀번호 찾기 | Forgot Password? |
| 계정이 없으신가요? | Don't have an account? |
| 회원가입 | Sign Up |
| 또는 | or |
| Google로 계속하기 | Continue with Google |
| 이메일을 입력해주세요 | Please enter your email |
| 비밀번호를 입력해주세요 | Please enter your password |
| 이메일 또는 비밀번호가 올바르지 않습니다 | Invalid email or password |

---

## SignupPageExactReplica.jsx

| Korean | English |
|--------|---------|
| 회원가입 | Sign Up |
| 이름 | Name |
| 이메일 | Email |
| 비밀번호 | Password |
| 비밀번호 확인 | Confirm Password |
| 가입하기 | Create Account |
| 이미 계정이 있으신가요? | Already have an account? |
| 로그인 | Log In |
| Google로 가입하기 | Sign up with Google |
| 이름을 입력해주세요 | Please enter your name |
| 유효한 이메일을 입력해주세요 | Please enter a valid email |
| 비밀번호는 8자 이상이어야 합니다 | Password must be at least 8 characters |
| 비밀번호가 일치하지 않습니다 | Passwords do not match |
| 이미 사용중인 이메일입니다 | Email already in use |

---

## CampaignsPage.jsx

| Korean | English |
|--------|---------|
| 캠페인 | Campaigns |
| 전체 | All |
| 진행중 | Active |
| 마감임박 | Ending Soon |
| 최신순 | Newest |
| 마감임박순 | Deadline |
| 보상순 | Reward |
| 검색 | Search |
| 브랜드, 캠페인명 검색 | Search brands or campaigns |
| 마감 | Deadline |
| 보상 | Reward |
| 지원하기 | Apply |
| 지원완료 | Applied |
| 마감됨 | Closed |
| 캠페인이 없습니다 | No campaigns found |

---

## CampaignDetailPage.jsx

| Korean | English |
|--------|---------|
| 캠페인 상세 | Campaign Details |
| 브랜드 | Brand |
| 모집 기간 | Application Period |
| 모집 인원 | Spots Available |
| 명 | people |
| 보상 | Reward |
| 캠페인 소개 | About This Campaign |
| 참여 조건 | Requirements |
| 제공 내역 | What You'll Receive |
| 가이드라인 | Guidelines |
| 주의사항 | Important Notes |
| 지원하기 | Apply Now |
| 지원 완료 | Already Applied |
| 모집 마감 | Applications Closed |
| 뒤로 | Back |

---

## CampaignApplyPage.jsx

| Korean | English |
|--------|---------|
| 캠페인 지원 | Apply for Campaign |
| 지원 정보 | Application Info |
| 배송 주소 | Shipping Address |
| 우편번호 | ZIP Code |
| 기본 주소 | Address |
| 상세 주소 | Address Line 2 |
| 연락처 | Phone Number |
| 자기소개 | About You |
| 이 캠페인에 지원하는 이유를 알려주세요 | Tell us why you're interested in this campaign |
| 지원하기 | Submit Application |
| 지원 중... | Submitting... |
| 지원이 완료되었습니다 | Application submitted successfully |
| 지원에 실패했습니다 | Failed to submit application |

---

## Admin Dashboard Translations

### AdminDashboardSimple.jsx

| Korean | English |
|--------|---------|
| 관리자 대시보드 | Admin Dashboard |
| 총 캠페인 | Total Campaigns |
| 진행중 캠페인 | Active Campaigns |
| 총 지원자 | Total Applications |
| 대기중 지원 | Pending Applications |
| 등록 크리에이터 | Registered Creators |
| 이번 달 지급 포인트 | Points Paid This Month |
| 최근 지원 내역 | Recent Applications |
| 최근 캠페인 | Recent Campaigns |
| 더보기 | View More |

### AdminCampaignsWithQuestions.jsx

| Korean | English |
|--------|---------|
| 캠페인 관리 | Campaign Management |
| 새 캠페인 | New Campaign |
| 캠페인 수정 | Edit Campaign |
| 캠페인 삭제 | Delete Campaign |
| 캠페인명 | Campaign Name |
| 브랜드명 | Brand Name |
| 상태 | Status |
| 활성 | Active |
| 비활성 | Inactive |
| 마감 | Closed |
| 모집 시작일 | Start Date |
| 모집 마감일 | End Date |
| 모집 인원 | Spots |
| 보상 포인트 | Reward Points |
| 캠페인 설명 | Description |
| 이미지 업로드 | Upload Image |
| 저장 | Save |
| 취소 | Cancel |

### ApplicationsReportSimple_final.jsx

| Korean | English |
|--------|---------|
| 지원 관리 | Application Management |
| 전체 | All |
| 대기중 | Pending |
| 선정 | Selected |
| 미선정 | Rejected |
| 완료 | Completed |
| 크리에이터 | Creator |
| 캠페인 | Campaign |
| 지원일 | Applied Date |
| 상태 변경 | Change Status |
| 선정하기 | Select |
| 미선정 처리 | Reject |
| 완료 처리 | Mark Complete |
| 포인트 지급 | Award Points |

### AdminWithdrawals.jsx

| Korean | English |
|--------|---------|
| 출금 관리 | Withdrawal Management |
| 대기중 | Pending |
| 처리완료 | Completed |
| 거절됨 | Rejected |
| 신청자 | Requester |
| 금액 | Amount |
| 은행 | Bank |
| 계좌번호 | Account |
| 신청일 | Request Date |
| 처리일 | Process Date |
| 승인 | Approve |
| 거절 | Reject |
| 처리 메모 | Notes |

---

## Email Templates (emailService.js)

### Application Approved

```
Subject: [CNEC] Congratulations! You've been selected!

Hi {creatorName},

Great news! You've been selected for the following campaign:

Campaign: {campaignTitle}
Brand: {brandName}
Reward: ${reward}
Submission Deadline: {deadline}

Please log in to your dashboard to view the campaign guidelines.

Best regards,
The CNEC Team
```

### Application Rejected

```
Subject: [CNEC] Campaign Application Update

Hi {creatorName},

Thank you for applying to {campaignTitle}.

Unfortunately, you were not selected for this campaign. We encourage you to apply for other campaigns that match your profile.

Keep creating great content!

Best regards,
The CNEC Team
```

### Points Credited

```
Subject: [CNEC] Points Added to Your Account

Hi {creatorName},

{points} points have been added to your account!

Campaign: {campaignTitle}
Points Earned: {points}
New Balance: {newBalance}

You can withdraw your points anytime from your dashboard.

Best regards,
The CNEC Team
```

### Withdrawal Completed

```
Subject: [CNEC] Withdrawal Processed

Hi {creatorName},

Your withdrawal request has been processed.

Amount: ${amount}
Bank: {bankName}
Account: ****{lastFour}
Processing Date: {date}

The funds should appear in your account within 1-2 business days.

Best regards,
The CNEC Team
```

---

## Currency & Date Formatting

### Currency (Replace Korean Won with USD)

```jsx
// Korean
const formatCurrency = (amount) => {
  if (!amount) return '0원'
  return `${amount.toLocaleString()}원`
}

// US
const formatCurrency = (amount) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
```

### Points Display

```jsx
// Korean
<p>{points.toLocaleString()}P</p>

// US (if keeping points system)
<p>{points.toLocaleString()} pts</p>

// US (if converting to dollars)
<p>${(points / 100).toFixed(2)}</p>
```

### Dates

```jsx
// Korean
new Date().toLocaleDateString('ko-KR')  // 2025. 12. 24.

// US
new Date().toLocaleDateString('en-US')  // 12/24/2025

// US with format
new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})  // December 24, 2025
```

---

## Phone Number Formatting

```jsx
// Korean (010-1234-5678)
const formatPhone = (phone) => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}

// US (123) 456-7890
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}
```

---

## Notes for Developers

1. **Search for Korean text**: Use regex `[\uAC00-\uD7AF]` to find Korean characters
2. **Check all string literals**: Look for text in quotes, template literals
3. **Test all user flows**: Make sure no Korean text appears in UI
4. **Update placeholder text**: Form inputs have Korean placeholders
5. **Check console logs**: Some debug messages are in Korean
6. **Review email templates**: All automated emails need translation
7. **Test error messages**: Validation and API errors should be in English
