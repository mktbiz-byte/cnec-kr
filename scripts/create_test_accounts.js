/**
 * 테스트 계정 생성 스크립트
 * 
 * 이 스크립트는 Supabase에 테스트용 관리자 계정과 기업 계정을 생성합니다.
 * 
 * 사용 방법:
 * 1. .env 파일에 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정합니다.
 * 2. 터미널에서 `node scripts/create_test_accounts.js` 명령을 실행합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성 (서비스 롤 키 사용)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 테스트 계정 정보
const testAccounts = {
  admin: {
    email: 'admin@admin.cnecbiz.com',
    password: 'admin1234',
    userData: {
      business_registration_number: '000-00-00000',
      company_name: 'CNEC 관리자',
      representative_name: '관리자',
      is_approved: true,
      is_admin: true,
    }
  },
  company: {
    email: '1234567890@cnecbiz.com',
    password: 'company1234',
    userData: {
      business_registration_number: '123-45-67890',
      company_name: '하우파파',
      representative_name: '박현용',
      start_date: '2021-09-01',
      phone_number: '02-1234-5678',
      address: '서울특별시 강남구',
      is_approved: true,
      is_admin: false,
    }
  }
};

// 테스트 계정 생성 함수
async function createTestAccount(type, accountData) {
  try {
    console.log(`${type} 계정 생성 중...`);
    
    // 1. 기존 계정 확인
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      throw checkError;
    }
    
    const userExists = existingUser.users.some(user => user.email === accountData.email);
    
    if (userExists) {
      console.log(`${type} 계정이 이미 존재합니다. 건너뜁니다.`);
      return;
    }
    
    // 2. 사용자 생성
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      email_confirm: true,
    });
    
    if (createError) {
      throw createError;
    }
    
    console.log(`${type} 사용자 생성 완료:`, userData.user.id);
    
    // 3. 계정 정보 저장
    const { error: profileError } = await supabase
      .from('corporate_accounts')
      .insert([{
        auth_user_id: userData.user.id,
        ...accountData.userData,
      }]);
    
    if (profileError) {
      throw profileError;
    }
    
    console.log(`${type} 계정 정보 저장 완료`);
    
  } catch (error) {
    console.error(`${type} 계정 생성 중 오류 발생:`, error);
  }
}

// 메인 함수
async function main() {
  try {
    // 관리자 계정 생성
    await createTestAccount('관리자', testAccounts.admin);
    
    // 기업 계정 생성
    await createTestAccount('기업', testAccounts.company);
    
    console.log('테스트 계정 생성이 완료되었습니다.');
    
  } catch (error) {
    console.error('테스트 계정 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
main();
