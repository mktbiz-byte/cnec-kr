import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config()

// Supabase 설정 - 환경 변수에서 가져옴
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// 필수 환경 변수 검증
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('오류: 필수 환경 변수가 설정되지 않았습니다.')
  console.error('다음 환경 변수를 .env 파일에 설정하세요:')
  console.error('  - SUPABASE_URL 또는 VITE_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_KEY')
  process.exit(1)
}

// Service Role 클라이언트 생성 (관리자 권한)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 관리자 계정 설정 - 환경 변수에서 가져오거나 기본값 사용
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cnec.test'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.error('오류: ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.')
  console.error('보안을 위해 관리자 비밀번호를 .env 파일에 설정하세요.')
  process.exit(1)
}

async function createAdminAccount() {
  try {
    console.log('관리자 계정 생성 시작...')

    // 1. Auth에 사용자 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'CNEC 관리자',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Auth 사용자 생성 오류:', authError)
      return
    }

    console.log('Auth 사용자 생성 성공:', authData.user.id)

    // 2. user_profiles 테이블에 프로필 생성
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          user_id: authData.user.id,
          email: ADMIN_EMAIL,
          name: 'CNEC 관리자',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])

    if (profileError) {
      console.error('프로필 생성 오류:', profileError)
      return
    }

    console.log('프로필 생성 성공')

    // 3. 테스트 사용자 계정 생성 (선택적 - 환경 변수가 설정된 경우에만)
    if (process.env.CREATE_TEST_USERS === 'true' && process.env.TEST_USER_PASSWORD) {
      const testUsers = [
        {
          email: process.env.TEST_USER_EMAIL || 'test@cnec.test',
          password: process.env.TEST_USER_PASSWORD,
          name: '테스트 사용자',
          role: 'user'
        },
        {
          email: process.env.TEST_CREATOR_EMAIL || 'creator@cnec.test',
          password: process.env.TEST_USER_PASSWORD,
          name: '테스트 크리에이터',
          role: 'user'
        }
      ]

      for (const testUser of testUsers) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            name: testUser.name,
            role: testUser.role
          }
        })

        if (userError) {
          console.error(`${testUser.email} 생성 오류:`, userError)
          continue
        }

        // 프로필 생성
        const { error: userProfileError } = await supabaseAdmin
          .from('user_profiles')
          .insert([
            {
              user_id: userData.user.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (userProfileError) {
          console.error(`${testUser.email} 프로필 생성 오류:`, userProfileError)
        } else {
          console.log(`${testUser.email} 계정 생성 성공`)
        }
      }
    }

    console.log('계정 생성 완료!')
    console.log('\n생성된 관리자 계정:', ADMIN_EMAIL)
    console.log('(비밀번호는 보안상 출력하지 않습니다)')

  } catch (error) {
    console.error('계정 생성 중 오류:', error)
  }
}

// 스크립트 실행
createAdminAccount()
