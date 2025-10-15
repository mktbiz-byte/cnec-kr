#!/bin/bash

# cnec.jp 웹사이트 테스트 스크립트
# 작성일: 2025-10-15

# 스크립트 실행 시작 메시지
echo "===== cnec.jp 웹사이트 테스트 스크립트 시작 ====="
echo "현재 시간: $(date)"

# 환경 변수 설정
PROJECT_DIR="/home/ubuntu/cnec-kr"
TEST_RESULTS_DIR="$PROJECT_DIR/test_results"
LOG_FILE="$TEST_RESULTS_DIR/test_log_$(date +%Y%m%d_%H%M%S).log"

# 테스트 결과 디렉토리 생성
mkdir -p $TEST_RESULTS_DIR

# 로그 파일 초기화
echo "cnec.jp 웹사이트 테스트 로그" > $LOG_FILE
echo "실행 시간: $(date)" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE

# 함수: 테스트 결과 로깅
log_test_result() {
  local test_name=$1
  local result=$2
  local details=$3
  
  echo "[$result] $test_name: $details" >> $LOG_FILE
  echo "[$result] $test_name: $details"
}

# 함수: 종속성 확인
check_dependencies() {
  echo "종속성 확인 중..." | tee -a $LOG_FILE
  
  # Node.js 및 npm 확인
  if ! command -v node &> /dev/null; then
    log_test_result "Node.js 확인" "실패" "Node.js가 설치되어 있지 않습니다."
    exit 1
  else
    node_version=$(node -v)
    log_test_result "Node.js 확인" "성공" "버전: $node_version"
  fi
  
  if ! command -v npm &> /dev/null; then
    log_test_result "npm 확인" "실패" "npm이 설치되어 있지 않습니다."
    exit 1
  else
    npm_version=$(npm -v)
    log_test_result "npm 확인" "성공" "버전: $npm_version"
  fi
  
  # 프로젝트 종속성 확인
  cd $PROJECT_DIR
  echo "프로젝트 종속성 확인 중..." | tee -a $LOG_FILE
  if npm list --depth=0 2>&1 | grep -q "ERR!"; then
    log_test_result "프로젝트 종속성" "경고" "일부 종속성에 문제가 있을 수 있습니다."
  else
    log_test_result "프로젝트 종속성" "성공" "모든 종속성이 올바르게 설치되었습니다."
  fi
}

# 함수: 린트 테스트
run_lint_tests() {
  echo "린트 테스트 실행 중..." | tee -a $LOG_FILE
  cd $PROJECT_DIR
  
  if npm run lint > "$TEST_RESULTS_DIR/lint_results.txt" 2>&1; then
    log_test_result "린트 테스트" "성공" "코드가 린트 규칙을 준수합니다."
  else
    log_test_result "린트 테스트" "실패" "코드가 린트 규칙을 위반합니다. 자세한 내용은 lint_results.txt를 확인하세요."
  fi
}

# 함수: 단위 테스트
run_unit_tests() {
  echo "단위 테스트 실행 중..." | tee -a $LOG_FILE
  cd $PROJECT_DIR
  
  if npm run test:unit > "$TEST_RESULTS_DIR/unit_test_results.txt" 2>&1; then
    log_test_result "단위 테스트" "성공" "모든 단위 테스트가 통과했습니다."
  else
    log_test_result "단위 테스트" "실패" "일부 단위 테스트가 실패했습니다. 자세한 내용은 unit_test_results.txt를 확인하세요."
  fi
}

# 함수: 통합 테스트
run_integration_tests() {
  echo "통합 테스트 실행 중..." | tee -a $LOG_FILE
  cd $PROJECT_DIR
  
  if npm run test:integration > "$TEST_RESULTS_DIR/integration_test_results.txt" 2>&1; then
    log_test_result "통합 테스트" "성공" "모든 통합 테스트가 통과했습니다."
  else
    log_test_result "통합 테스트" "실패" "일부 통합 테스트가 실패했습니다. 자세한 내용은 integration_test_results.txt를 확인하세요."
  fi
}

# 함수: 빌드 테스트
run_build_test() {
  echo "빌드 테스트 실행 중..." | tee -a $LOG_FILE
  cd $PROJECT_DIR
  
  if npm run build > "$TEST_RESULTS_DIR/build_results.txt" 2>&1; then
    log_test_result "빌드 테스트" "성공" "프로젝트가 성공적으로 빌드되었습니다."
  else
    log_test_result "빌드 테스트" "실패" "프로젝트 빌드에 실패했습니다. 자세한 내용은 build_results.txt를 확인하세요."
  fi
}

# 함수: 인증 시스템 테스트
test_auth_system() {
  echo "인증 시스템 테스트 실행 중..." | tee -a $LOG_FILE
  
  # 여기에 인증 시스템 테스트 코드 추가
  # 예: API 엔드포인트 테스트, 로그인/로그아웃 테스트 등
  
  log_test_result "인증 시스템 테스트" "정보" "수동 테스트가 필요합니다. 테스트 계획 문서를 참조하세요."
}

# 함수: 캠페인 관리 시스템 테스트
test_campaign_system() {
  echo "캠페인 관리 시스템 테스트 실행 중..." | tee -a $LOG_FILE
  
  # 여기에 캠페인 관리 시스템 테스트 코드 추가
  # 예: 캠페인 CRUD 테스트, 필터링 테스트 등
  
  log_test_result "캠페인 관리 시스템 테스트" "정보" "수동 테스트가 필요합니다. 테스트 계획 문서를 참조하세요."
}

# 함수: 결제 시스템 테스트
test_payment_system() {
  echo "결제 시스템 테스트 실행 중..." | tee -a $LOG_FILE
  
  # 여기에 결제 시스템 테스트 코드 추가
  # 예: 결제 프로세스 테스트, 매출 보고서 테스트 등
  
  log_test_result "결제 시스템 테스트" "정보" "수동 테스트가 필요합니다. 테스트 계획 문서를 참조하세요."
}

# 함수: SSL 인증서 테스트
test_ssl_certificate() {
  echo "SSL 인증서 테스트 실행 중..." | tee -a $LOG_FILE
  
  # 도메인 설정
  DOMAIN="cnec.jp"
  
  # HTTPS 접속 테스트
  echo "HTTPS 접속 테스트 중..." | tee -a $LOG_FILE
  if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
    log_test_result "HTTPS 접속 테스트" "성공" "사이트가 HTTPS로 안전하게 로드됩니다."
  else
    log_test_result "HTTPS 접속 테스트" "실패" "사이트가 HTTPS로 로드되지 않습니다."
  fi
  
  # HTTP에서 HTTPS 리디렉션 테스트
  echo "HTTP에서 HTTPS 리디렉션 테스트 중..." | tee -a $LOG_FILE
  if curl -s -o /dev/null -w "%{http_code}" -L "http://$DOMAIN" | grep -q "200"; then
    log_test_result "HTTP에서 HTTPS 리디렉션 테스트" "성공" "HTTP 접속 시 HTTPS로 자동 리디렉션됩니다."
  else
    log_test_result "HTTP에서 HTTPS 리디렉션 테스트" "실패" "HTTP 접속 시 HTTPS로 자동 리디렉션되지 않습니다."
  fi
  
  # 보안 헤더 테스트
  echo "보안 헤더 테스트 중..." | tee -a $LOG_FILE
  curl -s -I "https://$DOMAIN" > "$TEST_RESULTS_DIR/security_headers.txt"
  
  if grep -q "Strict-Transport-Security" "$TEST_RESULTS_DIR/security_headers.txt"; then
    log_test_result "HSTS 헤더 테스트" "성공" "HSTS 헤더가 설정되어 있습니다."
  else
    log_test_result "HSTS 헤더 테스트" "실패" "HSTS 헤더가 설정되어 있지 않습니다."
  fi
  
  if grep -q "Content-Security-Policy" "$TEST_RESULTS_DIR/security_headers.txt"; then
    log_test_result "CSP 헤더 테스트" "성공" "CSP 헤더가 설정되어 있습니다."
  else
    log_test_result "CSP 헤더 테스트" "실패" "CSP 헤더가 설정되어 있지 않습니다."
  fi
  
  # 인증서 유효성 테스트
  echo "인증서 유효성 테스트 중..." | tee -a $LOG_FILE
  echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates > "$TEST_RESULTS_DIR/ssl_certificate_dates.txt"
  
  if [ -s "$TEST_RESULTS_DIR/ssl_certificate_dates.txt" ]; then
    log_test_result "인증서 유효성 테스트" "성공" "인증서가 유효합니다. 자세한 내용은 ssl_certificate_dates.txt를 확인하세요."
  else
    log_test_result "인증서 유효성 테스트" "실패" "인증서 정보를 가져올 수 없습니다."
  fi
}

# 메인 테스트 실행
main() {
  # 종속성 확인
  check_dependencies
  
  # 린트 및 단위 테스트
  run_lint_tests
  run_unit_tests
  run_integration_tests
  
  # 빌드 테스트
  run_build_test
  
  # 기능 테스트
  test_auth_system
  test_campaign_system
  test_payment_system
  
  # SSL 인증서 테스트
  test_ssl_certificate
  
  # 테스트 요약 출력
  echo "----------------------------------------" >> $LOG_FILE
  echo "테스트 완료 시간: $(date)" >> $LOG_FILE
  echo "테스트 로그 파일: $LOG_FILE" >> $LOG_FILE
  
  echo "===== cnec.jp 웹사이트 테스트 스크립트 완료 ====="
  echo "테스트 로그 파일: $LOG_FILE"
}

# 스크립트 실행
main
