/**
 * 사업자등록번호 형식 변환 (000-00-00000)
 * @param {string} value - 형식 변환할 사업자등록번호
 * @returns {string} - 형식이 변환된 사업자등록번호
 */
export const formatBusinessNumber = (value) => {
  if (!value) return '';
  
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
};

/**
 * 개업일자 형식 변환 (YYYY-MM-DD)
 * @param {string} value - 형식 변환할 개업일자
 * @returns {string} - 형식이 변환된 개업일자
 */
export const formatStartDate = (value) => {
  if (!value) return '';
  
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
};

/**
 * 전화번호 형식 변환 (000-0000-0000 또는 00-000-0000)
 * @param {string} value - 형식 변환할 전화번호
 * @returns {string} - 형식이 변환된 전화번호
 */
export const formatPhoneNumber = (value) => {
  if (!value) return '';
  
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  // 휴대폰 번호 (010-0000-0000)
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 일반 전화번호 (02-000-0000 또는 031-000-0000)
  if (numbers.length === 9) { // 서울 지역번호 (02)
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
  }
  
  if (numbers.length === 10) { // 그 외 지역번호
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
  
  // 그 외 경우는 그대로 반환
  return numbers;
};

/**
 * 날짜 형식 변환 (YYYY-MM-DD)
 * @param {string|Date} date - 변환할 날짜
 * @returns {string} - 형식이 변환된 날짜
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 사업자등록번호 유효성 검사
 * @param {string} businessNumber - 검사할 사업자등록번호
 * @returns {boolean} - 유효성 여부
 */
export const isValidBusinessNumber = (businessNumber) => {
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 사업자등록번호는 10자리여야 함
  if (numbers.length !== 10) {
    return false;
  }
  
  // 가중치 계산
  const weightList = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * weightList[i];
  }
  
  sum += parseInt(numbers[8]) * 5 / 10;
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(numbers[9]);
};

/**
 * 금액 형식 변환 (1,000,000)
 * @param {number|string} amount - 변환할 금액
 * @returns {string} - 형식이 적용된 금액
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('ko-KR').format(amount);
};
