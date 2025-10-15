import { supabase } from './src/lib/supabase.js';

async function testRegistration() {
  const businessInfo = {
    b_no: '5758102253',
    start_dt: '20210901',
    p_nm: '박현용',
  };

  console.log('--- 사업자 정보 확인 테스트 시작 ---');
  try {
    const { data, error } = await supabase.functions.invoke('verify-business-number', {
      body: businessInfo,
    });

    if (error) {
      throw error;
    }

    console.log('API 응답:', data);
    if (data.data[0].valid === '01') {
      console.log('✅ 사업자 정보 확인 성공');
    } else {
      console.error('❌ 사업자 정보 확인 실패:', data.data[0].valid_msg);
      return;
    }
  } catch (error) {
    console.error('❌ 사업자 정보 확인 중 오류 발생:', error.message);
    return;
  }

  console.log('\n--- 회원가입 테스트 시작 ---');
  const email = `testuser_${Date.now()}@gmail.com`;
  const password = 'password123';

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: '주식회사 하우파파',
          business_registration_number: businessInfo.b_no,
          representative_name: businessInfo.p_nm,
          phone_number: '010-1234-5678', // 임시
          address: '서울특별시 마포구 백범로31길 21, 3층 312호(공덕동, 서울복지타운)',
        },
      },
    });

    if (error) {
      throw error;
    }

    console.log('✅ 회원가입 성공:', data.user.email);
  } catch (error) {
    console.error('❌ 회원가입 실패:', error.message);
  }
}

testRegistration();

