const popbill = require('popbill');

// 팝빌 전역 설정
popbill.config({
  LinkID: process.env.POPBILL_LINK_ID || 'HOWLAB',
  SecretKey: process.env.POPBILL_SECRET_KEY || '7UZg/CZJ4i7VDx49H27E+bczug5//kThjrjfEeu9JOk=',
  IsTest: process.env.POPBILL_TEST_MODE === 'true',
  IPRestrictOnOff: true,
  UseStaticIP: false,
  UseLocalTimeYN: true,
  defaultErrorHandler: function (Error) {
    console.log('Popbill Error: [' + Error.code + '] ' + Error.message);
  }
});

// 팝빌 예금주조회 서비스 객체 생성
const accountCheckService = popbill.AccountCheckService();
const POPBILL_CORP_NUM = process.env.POPBILL_CORP_NUM || '5758102253';
const POPBILL_USER_ID = process.env.POPBILL_USER_ID || '';

console.log('Popbill AccountCheck service initialized successfully');

// 한국 은행 이름 -> 팝빌 은행 코드 매핑
const BANK_CODE_MAP = {
  'KB국민은행': '0004',
  '신한은행': '0088',
  '우리은행': '0020',
  'NH농협은행': '0011',
  '하나은행': '0081',
  'IBK기업은행': '0003',
  'SC제일은행': '0023',
  '한국씨티은행': '0027',
  'KDB산업은행': '0002',
  '경남은행': '0039',
  '광주은행': '0034',
  '대구은행': '0031',
  '부산은행': '0032',
  '전북은행': '0037',
  '제주은행': '0035',
  '카카오뱅크': '0090',
  '케이뱅크': '0089',
  '토스뱅크': '0092',
  '새마을금고': '0045',
  '신협': '0048',
  '우체국': '0071',
  '수협은행': '0007',
  'SBI저축은행': '0103'
};

exports.handler = async (event) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { bankName, accountNumber } = JSON.parse(event.body);

    console.log('[INFO] Account verification request:', {
      bankName,
      accountNumber: accountNumber ? accountNumber.substring(0, 4) + '****' : 'N/A'
    });

    // 필수 파라미터 검증
    if (!bankName || !accountNumber) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '은행명과 계좌번호는 필수입니다.'
        })
      };
    }

    // 은행 코드 조회
    const bankCode = BANK_CODE_MAP[bankName];
    if (!bankCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `지원하지 않는 은행입니다: ${bankName}`
        })
      };
    }

    // 계좌번호에서 하이픈 제거
    const cleanAccountNumber = accountNumber.replace(/-/g, '');

    console.log('[INFO] Calling Popbill AccountCheck API:', {
      bankCode,
      accountNumber: cleanAccountNumber.substring(0, 4) + '****'
    });

    // 팝빌 예금주조회 API 호출
    const result = await new Promise((resolve, reject) => {
      accountCheckService.checkAccountInfo(
        POPBILL_CORP_NUM,       // 팝빌 회원 사업자번호
        bankCode,               // 은행코드
        cleanAccountNumber,     // 계좌번호
        POPBILL_USER_ID,        // 팝빌 회원 아이디
        (response) => {
          console.log('[SUCCESS] Popbill AccountCheck result:', response);
          resolve(response);
        },
        (error) => {
          console.error('[ERROR] Popbill AccountCheck error:', error);
          reject(error);
        }
      );
    });

    // 팝빌 result 코드 확인 (1: 성공, 그 외: 실패)
    if (result.result !== 1) {
      // result 코드별 에러 메시지
      let errorMessage = '계좌 조회에 실패했습니다.';

      switch (result.result) {
        case 2:
          errorMessage = '예금주 정보를 확인할 수 없습니다.';
          break;
        case 3:
          errorMessage = '계좌번호 오류입니다. 계좌번호를 확인해주세요.';
          break;
        case 4:
          errorMessage = '해당 은행에서 거래가 정지된 계좌입니다.';
          break;
        case 5:
          errorMessage = '해당 계좌는 해지된 계좌입니다.';
          break;
        case 6:
          errorMessage = '은행 시스템 점검 중입니다. 잠시 후 다시 시도해주세요.';
          break;
        case 899:
          errorMessage = '예금주 조회 서비스 오류입니다. 잠시 후 다시 시도해주세요.';
          break;
        default:
          errorMessage = result.resultMessage || '계좌 조회 중 오류가 발생했습니다.';
      }

      console.log('[WARN] Account check failed:', {
        resultCode: result.result,
        resultMessage: result.resultMessage
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          resultCode: result.result,
          resultMessage: result.resultMessage
        })
      };
    }

    // 성공 응답 (result === 1)
    console.log('[SUCCESS] Account verified:', {
      accountName: result.accountName,
      bankCode: result.bankCode
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accountName: result.accountName,        // 예금주명
        bankCode: result.bankCode,              // 은행코드
        accountNumber: result.accountNumber,    // 계좌번호
        checkDate: result.checkDate,            // 조회일시
        result: result.result,                  // 조회결과 코드
        resultMessage: result.resultMessage     // 조회결과 메시지
      })
    };

  } catch (error) {
    console.error('[ERROR] Account verification error:', error);

    // 팝빌 에러 코드별 메시지
    let errorMessage = '계좌 인증에 실패했습니다.';

    if (error.code) {
      switch (error.code) {
        case -11000001:
          errorMessage = '예금주 조회 서비스에 접근할 수 없습니다. 팝빌 관리자에게 문의하세요.';
          break;
        case -11000002:
          errorMessage = '잘못된 계좌번호입니다.';
          break;
        case -11000003:
          errorMessage = '해당 계좌가 존재하지 않습니다.';
          break;
        case -11000004:
          errorMessage = '은행 점검 시간입니다. 잠시 후 다시 시도해주세요.';
          break;
        case -11000005:
          errorMessage = '예금주 조회가 불가능한 계좌입니다.';
          break;
        case -99999999:
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          break;
        default:
          errorMessage = error.message || '계좌 인증 중 오류가 발생했습니다.';
      }
    }

    return {
      statusCode: error.code ? 400 : 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        errorCode: error.code
      })
    };
  }
};
