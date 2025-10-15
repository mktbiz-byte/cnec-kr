#!/bin/bash

# SSL 인증서 문제 해결 스크립트
# 작성일: 2025-10-15

# 스크립트 실행 시작 메시지
echo "===== SSL 인증서 문제 해결 스크립트 시작 ====="
echo "현재 시간: $(date)"

# 환경 변수 설정
DOMAIN="cnec.jp"
NETLIFY_SITE_ID="your-netlify-site-id"  # 실제 Netlify 사이트 ID로 변경 필요
NETLIFY_AUTH_TOKEN="your-netlify-auth-token"  # 실제 Netlify 인증 토큰으로 변경 필요

# 현재 SSL 상태 확인
echo "현재 SSL 상태 확인 중..."
curl -s -I "https://$DOMAIN" | grep -i "HTTP\|SSL"

# Netlify 사용 시 SSL 설정 확인 및 업데이트
if [ ! -z "$NETLIFY_SITE_ID" ] && [ ! -z "$NETLIFY_AUTH_TOKEN" ]; then
  echo "Netlify SSL 설정 확인 중..."
  curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID" | grep -i "ssl"
  
  echo "Netlify SSL 설정 업데이트 중..."
  curl -X POST -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID/ssl"
fi

# Let's Encrypt 인증서 갱신 (서버에서 직접 호스팅하는 경우)
if command -v certbot &> /dev/null; then
  echo "Let's Encrypt 인증서 갱신 중..."
  certbot renew --force-renewal
fi

# DNS 설정 확인
echo "DNS 설정 확인 중..."
dig +short $DOMAIN
dig +short www.$DOMAIN

# HTTPS 리디렉션 설정 확인
echo "HTTPS 리디렉션 설정 확인 중..."
curl -s -I "http://$DOMAIN" | grep -i "Location"

# 인증서 만료일 확인
echo "인증서 만료일 확인 중..."
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates

# 브라우저 보안 경고 해결을 위한 추가 설정
echo "보안 헤더 설정 확인 중..."
curl -s -I "https://$DOMAIN" | grep -i "Strict-Transport-Security\|Content-Security-Policy"

# Netlify 사용 시 _headers 파일 생성
if [ ! -z "$NETLIFY_SITE_ID" ]; then
  echo "Netlify 보안 헤더 설정 파일 생성 중..."
  cat > ../public/_headers << EOL
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
EOL
  echo "보안 헤더 설정 파일이 생성되었습니다."
fi

# 문제 해결 가이드
echo ""
echo "===== SSL 문제 해결 가이드 ====="
echo "1. DNS 설정이 올바른지 확인하세요."
echo "   - A 레코드가 올바른 IP를 가리키는지 확인"
echo "   - CNAME 레코드가 올바른 도메인을 가리키는지 확인"
echo ""
echo "2. 인증서가 만료되었다면 갱신하세요."
echo "   - Let's Encrypt: certbot renew"
echo "   - Netlify: 자동 갱신 확인"
echo ""
echo "3. 혼합 콘텐츠(Mixed Content) 문제 확인:"
echo "   - 모든 리소스(이미지, 스크립트, 스타일시트)가 HTTPS로 로드되는지 확인"
echo "   - 브라우저 개발자 도구의 콘솔에서 오류 확인"
echo ""
echo "4. Netlify 설정 확인:"
echo "   - 사용자 정의 도메인이 올바르게 설정되었는지 확인"
echo "   - HTTPS 강제 설정이 활성화되어 있는지 확인"
echo ""
echo "5. 브라우저 캐시 문제:"
echo "   - 브라우저 캐시를 지우고 다시 시도"
echo "   - 시크릿 모드에서 사이트 접속 테스트"
echo ""

# 스크립트 실행 완료 메시지
echo "===== SSL 인증서 문제 해결 스크립트 완료 ====="
echo "현재 시간: $(date)"
