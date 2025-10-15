#!/bin/bash

cd /home/ubuntu/cnec-kr

# 변경사항 스테이징
git add .

# 커밋 메시지 작성
git commit -m "디자인 개선 및 테스트 계정 추가"

# GitHub에 푸시
git push origin main
