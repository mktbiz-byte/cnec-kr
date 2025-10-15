#!/bin/bash

cd /home/ubuntu/cnec-kr

# 변경사항 스테이징
git add package.json netlify.toml

# 커밋 메시지 작성
git commit -m "빌드 설정 수정: Node.js 버전 지정 및 빌드 명령어 개선"

# GitHub에 푸시
git push origin main
