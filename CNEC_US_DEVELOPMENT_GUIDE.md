# CNEC US Creator Platform - Development Guide

## Overview

This guide helps developers implement the US version (cnec-us.com) based on the Korean platform (cnec.co.kr).

**Key Principles:**
- All UI text must be in English
- Supabase backend integration remains unchanged
- Remove Korea-specific features (Popbill, KakaoTalk)
- Adapt for US payment/banking systems

---

## 1. Project Setup

### Clone and Install

```bash
# Clone the repository
git clone <repository-url> cnec-us
cd cnec-us

# Install dependencies
pnpm install
# or
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables (.env)

```env
# Supabase (Use your US project credentials)
VITE_SUPABASE_URL=https://your-us-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Platform Settings
VITE_PLATFORM_REGION=us
VITE_PLATFORM_COUNTRY=US

# Encryption (generate new secure key)
VITE_ENCRYPTION_KEY=your_secure_32_char_encryption_key

NODE_ENV=production
```

---

## 2. Tech Stack (No Changes)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| Vite | 6.3.5 | Build Tool |
| React Router | 7.6.1 | Routing |
| Supabase | 2.58.0 | Backend/Auth/DB |
| TailwindCSS | 4.1.7 | Styling |
| Radix UI | Various | UI Components |
| Lucide React | 0.510.0 | Icons |

---

## 3. Directory Structure

```
src/
├── components/
│   ├── ui/              # Keep as-is (no translation needed)
│   ├── creator/         # Translate all Korean text
│   ├── admin/           # Translate all Korean text
│   └── [pages]          # Translate all Korean text
├── contexts/
│   ├── AuthContext.jsx  # Keep as-is
│   └── LanguageContext.jsx  # Update for English default
├── lib/
│   ├── supabase.js      # Keep as-is
│   ├── i18n.js          # Update English translations
│   └── emailService.js  # Translate email templates
└── App.jsx              # Keep routing structure
```

---

## 4. Files Requiring Translation

### Priority 1: Creator-Facing Components

| File | Path | Description |
|------|------|-------------|
| CreatorMyPage.jsx | `/src/components/creator/` | Main creator dashboard |
| CampaignsPage.jsx | `/src/components/creator/` | Campaign listing |
| CampaignDetailPage.jsx | `/src/components/creator/` | Campaign details |
| CampaignApplyPage.jsx | `/src/components/creator/` | Application form |
| LandingPage.jsx | `/src/components/creator/` | Public landing page |
| WelcomeScreen.jsx | `/src/components/creator/` | First-time user welcome |
| ApplicationsPage.jsx | `/src/components/creator/` | Application history |
| PointsPage.jsx | `/src/components/creator/` | Points/earnings |
| GradeDetailPage.jsx | `/src/components/creator/` | Creator tier info |

### Priority 2: Auth Pages

| File | Path |
|------|------|
| LoginPageExactReplica.jsx | `/src/components/` |
| SignupPageExactReplica.jsx | `/src/components/` |
| ForgotPasswordPage.jsx | `/src/components/` |
| ResetPasswordPage.jsx | `/src/components/` |
| ProfileSettings.jsx | `/src/components/` |

### Priority 3: Admin Components

| File | Path |
|------|------|
| AdminDashboardSimple.jsx | `/src/components/admin/` |
| AdminCampaignsWithQuestions.jsx | `/src/components/admin/` |
| ApplicationsReportSimple_final.jsx | `/src/components/admin/` |
| AdminWithdrawals.jsx | `/src/components/admin/` |
| EmailTemplateManager.jsx | `/src/components/admin/` |

---

## 5. Translation Examples

### Before (Korean)

```jsx
// CreatorMyPage.jsx
const GRADE_CONFIG = {
  1: { name: 'FRESH', label: '새싹 크리에이터', color: '#10B981' },
  2: { name: 'GLOW', label: '빛나기 시작하는 단계', color: '#3B82F6' },
  3: { name: 'BLOOM', label: '본격적으로 피어나는 중', color: '#8B5CF6' },
  4: { name: 'ICONIC', label: '브랜드가 먼저 찾는', color: '#EC4899' },
  5: { name: 'MUSE', label: '크넥 대표 뮤즈', color: '#F59E0B' }
}

// UI Text
<h3 className="font-bold text-gray-900">나의 캠페인</h3>
<p className="text-gray-500">아직 지원한 캠페인이 없습니다</p>
<button>출금 신청하기</button>
```

### After (English)

```jsx
// CreatorMyPage.jsx
const GRADE_CONFIG = {
  1: { name: 'FRESH', label: 'New Creator', color: '#10B981' },
  2: { name: 'GLOW', label: 'Rising Star', color: '#3B82F6' },
  3: { name: 'BLOOM', label: 'Established Creator', color: '#8B5CF6' },
  4: { name: 'ICONIC', label: 'Brand Favorite', color: '#EC4899' },
  5: { name: 'MUSE', label: 'Top Creator', color: '#F59E0B' }
}

// UI Text
<h3 className="font-bold text-gray-900">My Campaigns</h3>
<p className="text-gray-500">You haven't applied to any campaigns yet</p>
<button>Request Withdrawal</button>
```

---

## 6. Common Korean → English Translations

### Navigation & Common

| Korean | English |
|--------|---------|
| 홈 | Home |
| 캠페인 | Campaigns |
| 마이페이지 | My Page |
| 프로필 | Profile |
| 설정 | Settings |
| 알림 | Notifications |
| 로그아웃 | Log Out |
| 저장 | Save |
| 취소 | Cancel |
| 확인 | Confirm |
| 삭제 | Delete |
| 수정 | Edit |
| 검색 | Search |
| 필터 | Filter |

### Campaign Related

| Korean | English |
|--------|---------|
| 캠페인 목록 | Campaign List |
| 캠페인 상세 | Campaign Details |
| 지원하기 | Apply |
| 지원 내역 | Application History |
| 선정됨 | Selected |
| 대기중 | Pending |
| 미선정 | Not Selected |
| 완료 | Completed |
| 마감일 | Deadline |
| 보상 | Reward |
| 포인트 | Points |
| 브랜드 | Brand |

### Account & Banking

| Korean | English |
|--------|---------|
| 계좌 관리 | Bank Account |
| 은행 | Bank |
| 계좌번호 | Account Number |
| 예금주 | Account Holder |
| 출금 신청 | Withdrawal Request |
| 출금 가능 금액 | Available Balance |
| 정산 | Settlement |

### Profile

| Korean | English |
|--------|---------|
| 이름 | Name |
| 이메일 | Email |
| 연락처 | Phone |
| 주소 | Address |
| 피부타입 | Skin Type |
| SNS 계정 | Social Media |

### Status Messages

| Korean | English |
|--------|---------|
| 로딩중... | Loading... |
| 저장되었습니다 | Saved successfully |
| 오류가 발생했습니다 | An error occurred |
| 필수 항목입니다 | This field is required |
| 형식이 올바르지 않습니다 | Invalid format |

---

## 7. Features to Remove/Modify for US

### Remove: Korea-Specific Features

1. **Popbill Bank Verification** (`/netlify/functions/verify-account.cjs`)
   - Remove or replace with US banking verification (Plaid, Stripe)

2. **KakaoTalk Notifications** (`/netlify/functions/send-alimtalk.cjs`)
   - Remove entirely (use email/SMS instead)

3. **Korean Resident Number (주민등록번호)**
   - Replace with SSN or Tax ID input
   - Update encryption if needed

4. **Korean Banks List**
   ```jsx
   // REMOVE
   const koreanBanks = ['KB국민은행', '신한은행', ...]

   // REPLACE WITH
   const usBanks = [
     'Bank of America',
     'Chase',
     'Wells Fargo',
     'Citibank',
     'US Bank',
     'Capital One',
     'PNC Bank',
     'TD Bank',
     // Add more as needed
   ]
   ```

### Modify: Payment System

```jsx
// Korean version uses 포인트 (Points) with 원 (Won)
formatCurrency(10000) // → "10,000원"

// US version should use dollars
const formatCurrency = (amount) => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
// formatCurrency(100) → "$100.00"
```

### Modify: Date Formats

```jsx
// Korean: YYYY-MM-DD or YYYY년 MM월 DD일
new Date().toLocaleDateString('ko-KR')

// US: MM/DD/YYYY
new Date().toLocaleDateString('en-US')
// or with options
new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}) // → "December 24, 2025"
```

---

## 8. i18n Configuration Update

### Update `/src/lib/i18n.js`

Set English as default:

```javascript
const DEFAULT_LANGUAGE = 'en'

const translations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      close: 'Close'
    },
    nav: {
      home: 'Home',
      campaigns: 'Campaigns',
      mypage: 'My Page',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Log Out'
    },
    auth: {
      login: 'Log In',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      googleLogin: 'Continue with Google'
    },
    campaigns: {
      list: 'Campaign List',
      details: 'Campaign Details',
      apply: 'Apply Now',
      applied: 'Applied',
      deadline: 'Deadline',
      reward: 'Reward',
      brand: 'Brand',
      status: 'Status'
    },
    applications: {
      history: 'Application History',
      pending: 'Pending',
      selected: 'Selected',
      notSelected: 'Not Selected',
      completed: 'Completed',
      inProgress: 'In Progress'
    },
    points: {
      balance: 'Point Balance',
      withdraw: 'Withdraw',
      history: 'Point History',
      earned: 'Earned',
      withdrawn: 'Withdrawn'
    },
    profile: {
      settings: 'Profile Settings',
      name: 'Name',
      phone: 'Phone Number',
      address: 'Address',
      skinType: 'Skin Type',
      socialMedia: 'Social Media Accounts'
    },
    bank: {
      account: 'Bank Account',
      bankName: 'Bank Name',
      accountNumber: 'Account Number',
      accountHolder: 'Account Holder Name',
      routingNumber: 'Routing Number',
      verify: 'Verify Account',
      save: 'Save Account'
    }
  }
}

export default {
  t(key, params = {}) {
    const keys = key.split('.')
    let value = translations[DEFAULT_LANGUAGE]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || '')
    }

    return value || key
  },

  getCurrentLanguage() {
    return DEFAULT_LANGUAGE
  }
}
```

### Update `/src/contexts/LanguageContext.jsx`

```jsx
import React, { createContext, useContext, useState } from 'react'
import i18n from '../lib/i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language] = useState('en')

  const t = (key, params) => i18n.t(key, params)

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
```

---

## 9. Email Templates Translation

### Update `/src/lib/emailService.js`

```javascript
// Campaign Approved Email
const APPLICATION_APPROVED = {
  subject: '[CNEC] Congratulations! You\'ve been selected for a campaign!',
  template: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #7c3aed; color: white; padding: 20px; }
        .content { padding: 20px; }
        .button { background: #7c3aed; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>You've Been Selected!</h1>
      </div>
      <div class="content">
        <h2>Hi ${data.creatorName},</h2>
        <p>Great news! You've been selected for the following campaign:</p>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3>${data.campaignTitle}</h3>
          <p><strong>Brand:</strong> ${data.brandName}</p>
          <p><strong>Reward:</strong> $${data.reward}</p>
          <p><strong>Submission Deadline:</strong> ${data.deadline}</p>
        </div>

        <p>Please log in to your dashboard to view the campaign details and guidelines.</p>

        <a href="https://cnec-us.com/my/applications" class="button">
          View My Applications
        </a>

        <p style="margin-top: 30px;">
          If you have any questions, please contact us at support@cnec-us.com
        </p>

        <p>Best regards,<br>The CNEC Team</p>
      </div>
    </body>
    </html>
  `
}
```

---

## 10. US Bank Account Setup (Replace Popbill)

### Option A: Stripe Connect

```javascript
// netlify/functions/verify-bank-stripe.js
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handler = async (event) => {
  const { accountNumber, routingNumber, accountHolderName } = JSON.parse(event.body)

  try {
    // Create bank account token
    const bankAccountToken = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: routingNumber,
        account_number: accountNumber
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        bankName: bankAccountToken.bank_account.bank_name,
        last4: bankAccountToken.bank_account.last4
      })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}
```

### Option B: Plaid Integration

```javascript
// For more robust bank verification
// See: https://plaid.com/docs/
```

---

## 11. Supabase Database Schema

**No changes required** - The database schema works for both regions.

### Key Tables

| Table | Purpose |
|-------|---------|
| user_profiles | Creator profiles |
| campaigns | Campaign listings |
| applications | Campaign applications |
| point_transactions | Points ledger |
| withdrawal_requests | Withdrawal history |
| email_templates | Email templates |
| admin_users | Admin access |

### Database Functions (Keep As-Is)

```javascript
// src/lib/supabase.js - All functions work the same
database.campaigns.getAll()
database.applications.create(data)
database.userProfiles.update(userId, data)
database.withdrawals.create(data)
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] Create new Supabase project for US
- [ ] Copy database schema from Korean project
- [ ] Update all environment variables
- [ ] Translate all component text
- [ ] Update email templates
- [ ] Replace Popbill with Stripe/Plaid
- [ ] Remove KakaoTalk functions
- [ ] Update currency formatting
- [ ] Update date formatting
- [ ] Test all user flows

### Netlify Setup

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables (Netlify Dashboard)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PLATFORM_REGION=us
VITE_PLATFORM_COUNTRY=US
VITE_ENCRYPTION_KEY
STRIPE_SECRET_KEY (if using Stripe)
```

---

## 13. Testing Checklist

### Auth Flow
- [ ] Sign up with email
- [ ] Sign up with Google
- [ ] Log in
- [ ] Forgot password
- [ ] Reset password
- [ ] Log out

### Creator Flow
- [ ] View campaigns
- [ ] Apply to campaign
- [ ] View application status
- [ ] Submit content
- [ ] View points
- [ ] Request withdrawal

### Admin Flow
- [ ] Access admin dashboard
- [ ] Create campaign
- [ ] Review applications
- [ ] Approve/reject applications
- [ ] Process withdrawals

---

## 14. File Summary

### Files to Translate (30+ files)

```
src/components/creator/
├── CreatorMyPage.jsx
├── CampaignsPage.jsx
├── CampaignDetailPage.jsx
├── CampaignApplyPage.jsx
├── LandingPage.jsx
├── WelcomeScreen.jsx
├── ApplicationsPage.jsx
├── PointsPage.jsx
└── GradeDetailPage.jsx

src/components/
├── LoginPageExactReplica.jsx
├── SignupPageExactReplica.jsx
├── ForgotPasswordPage.jsx
├── ProfileSettings.jsx
└── NotificationSettings.jsx

src/components/admin/
├── AdminDashboardSimple.jsx
├── AdminCampaignsWithQuestions.jsx
├── ApplicationsReportSimple_final.jsx
└── AdminWithdrawals.jsx

src/lib/
├── i18n.js
└── emailService.js
```

### Files to Remove

```
netlify/functions/
├── verify-account.cjs    # Popbill (replace with Stripe)
└── send-alimtalk.cjs     # KakaoTalk (not needed)
```

### Files to Keep As-Is

```
src/components/ui/        # All 46 UI components
src/lib/supabase.js       # Database client
src/contexts/AuthContext.jsx
vite.config.js
netlify.toml (mostly)
```

---

## 15. Quick Start Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Deploy (via Netlify CLI)
netlify deploy --prod
```

---

## Contact

For questions about this guide, contact the development team.

**Repository:** cnec-kr (Korean version reference)
**Target Domain:** cnec-us.com
