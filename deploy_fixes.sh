#!/bin/bash

# 수정된 코드를 빌드하고 배포하는 스크립트

echo "===== CNEC-KR 관리자 로그인 문제 해결 배포 스크립트 ====="

# 1. 의존성 설치
echo "1. 의존성 설치 중..."
npm install

# 2. 프로젝트 빌드
echo "2. 프로젝트 빌드 중..."
npm run build

# 3. 빌드 결과 확인
if [ -d "dist" ]; then
  echo "빌드 성공: dist 디렉토리가 생성되었습니다."
else
  echo "빌드 실패: dist 디렉토리가 생성되지 않았습니다."
  exit 1
fi

# 4. Netlify 배포 (Netlify CLI가 설치된 경우)
if command -v netlify &> /dev/null; then
  echo "4. Netlify에 배포 중..."
  netlify deploy --prod --dir=dist
else
  echo "4. Netlify CLI가 설치되어 있지 않습니다. 수동으로 배포해주세요."
  echo "   배포 방법: dist 디렉토리를 Netlify 대시보드에 업로드하거나 Git 저장소에 푸시하세요."
fi

echo "===== 배포 프로세스 완료 ====="
echo "다음 단계:"
echo "1. 관리자 계정(mkt@howlab.co.kr)으로 로그인을 시도하세요."
echo "2. 브라우저 콘솔에서 로그 메시지를 확인하여 문제를 진단하세요."
echo "3. 문제가 지속되면 DEBUG_SOLUTION.md 파일을 참조하여 추가 조치를 취하세요."
