#!/bin/bash

# cnecbiz.com 테스트 스크립트
# 작성일: 2025-10-15

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 테스트 결과 요약
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# 테스트 함수
run_test() {
  local test_name="$1"
  local test_command="$2"
  local expected_exit_code="${3:-0}"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  log_info "Running test: ${test_name}"
  
  # 테스트 실행
  eval "${test_command}" > /tmp/test_output.log 2>&1
  local exit_code=$?
  
  # 결과 확인
  if [ ${exit_code} -eq ${expected_exit_code} ]; then
    log_success "Test passed: ${test_name}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    log_error "Test failed: ${test_name} (Exit code: ${exit_code}, Expected: ${expected_exit_code})"
    log_error "Output: $(cat /tmp/test_output.log)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# 의존성 확인
check_dependencies() {
  log_info "Checking dependencies..."
  
  # Node.js 확인
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  
  # npm 확인
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  
  # 필요한 패키지 확인
  if [ ! -d "node_modules" ]; then
    log_warning "node_modules not found, installing dependencies..."
    npm install
  fi
  
  log_success "All dependencies are installed"
}

# 린트 테스트
run_lint_tests() {
  log_info "Running lint tests..."
  
  # ESLint 확인
  if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    run_test "ESLint" "npm run lint" 0
  else
    log_warning "ESLint configuration not found, skipping lint tests"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
  
  # Prettier 확인
  if [ -f ".prettierrc.js" ] || [ -f ".prettierrc.json" ]; then
    run_test "Prettier" "npm run format:check" 0
  else
    log_warning "Prettier configuration not found, skipping format tests"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 단위 테스트
run_unit_tests() {
  log_info "Running unit tests..."
  
  # Jest 확인
  if [ -f "jest.config.js" ] || grep -q "jest" package.json; then
    run_test "Unit Tests" "npm run test:unit" 0
  else
    log_warning "Jest configuration not found, skipping unit tests"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 통합 테스트
run_integration_tests() {
  log_info "Running integration tests..."
  
  # 통합 테스트 스크립트 확인
  if grep -q "test:integration" package.json; then
    run_test "Integration Tests" "npm run test:integration" 0
  else
    log_warning "Integration test script not found, skipping integration tests"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 빌드 테스트
run_build_test() {
  log_info "Running build test..."
  
  # 빌드 스크립트 확인
  if grep -q "build" package.json; then
    run_test "Build" "npm run build" 0
  else
    log_warning "Build script not found, skipping build test"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# SSL 인증서 테스트
run_ssl_test() {
  log_info "Running SSL certificate test..."
  
  # SSL 인증서 스크립트 확인
  if [ -f "scripts/ssl_fix.sh" ]; then
    run_test "SSL Certificate" "bash scripts/ssl_fix.sh --check" 0
  else
    log_warning "SSL certificate script not found, skipping SSL test"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 데이터베이스 마이그레이션 테스트
run_db_migration_test() {
  log_info "Running database migration test..."
  
  # 마이그레이션 파일 확인
  if [ -d "supabase/migrations" ]; then
    # 마이그레이션 파일 구문 검사
    local migration_files=$(find supabase/migrations -name "*.sql")
    local migration_test_passed=true
    
    for file in ${migration_files}; do
      log_info "Checking SQL syntax for ${file}"
      # SQL 구문 검사 (간단한 검사)
      if grep -q "DROP DATABASE" "${file}" || grep -q "DROP SCHEMA public" "${file}"; then
        log_error "Dangerous SQL command found in ${file}"
        migration_test_passed=false
      fi
    done
    
    if [ "${migration_test_passed}" = true ]; then
      log_success "Database migration test passed"
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      log_error "Database migration test failed"
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
  else
    log_warning "Migration directory not found, skipping database migration test"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 환경 변수 테스트
run_env_test() {
  log_info "Running environment variables test..."
  
  # .env 파일 확인
  if [ -f ".env" ]; then
    # 필수 환경 변수 확인
    local required_vars=("REACT_APP_SUPABASE_URL" "REACT_APP_SUPABASE_ANON_KEY")
    local env_test_passed=true
    
    for var in "${required_vars[@]}"; do
      if ! grep -q "${var}" .env; then
        log_error "Required environment variable ${var} not found in .env"
        env_test_passed=false
      fi
    done
    
    if [ "${env_test_passed}" = true ]; then
      log_success "Environment variables test passed"
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      log_error "Environment variables test failed"
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
  else
    log_warning ".env file not found, skipping environment variables test"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  fi
}

# 결과 출력
print_results() {
  echo ""
  echo "=============================="
  echo "       TEST RESULTS           "
  echo "=============================="
  echo "Total tests: ${TOTAL_TESTS}"
  echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
  echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
  echo -e "${YELLOW}Skipped: ${SKIPPED_TESTS}${NC}"
  echo "=============================="
  
  if [ ${FAILED_TESTS} -eq 0 ]; then
    log_success "All tests passed!"
    exit 0
  else
    log_error "Some tests failed!"
    exit 1
  fi
}

# 메인 함수
main() {
  log_info "Starting tests for cnecbiz.com"
  
  # 현재 디렉토리 확인
  if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root directory."
    exit 1
  fi
  
  # 의존성 확인
  check_dependencies
  
  # 테스트 실행
  run_lint_tests
  run_unit_tests
  run_integration_tests
  run_build_test
  run_ssl_test
  run_db_migration_test
  run_env_test
  
  # 결과 출력
  print_results
}

# 스크립트 실행
main "$@"
