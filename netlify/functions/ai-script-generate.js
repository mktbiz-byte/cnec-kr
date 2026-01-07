/**
 * AI 숏폼 대본 생성 Netlify Function (Gemini API)
 * 브랜드와 스토리를 입력받아 15-60초 숏폼 대본 생성
 * Muse 등급 크리에이터 전용 - 프리미엄 품질
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const { brandName, brandInfo, storyConcept, targetAudience, additionalNotes, videoLength, previousScript, improvementFeedback } = JSON.parse(event.body)

    if (!brandName || !storyConcept) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '브랜드명과 스토리 컨셉이 필요합니다.' })
      }
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gemini API 키가 설정되지 않았습니다.' })
      }
    }

    // Gemini 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // 숏폼 길이에 따른 장면 수 결정 (더 많은 장면)
    const duration = videoLength || '30초'
    let sceneCount = 7
    if (duration === '15초') sceneCount = 5
    else if (duration === '45초') sceneCount = 8
    else if (duration === '60초') sceneCount = 10

    // 이전 대본과 피드백이 있는 경우 (재생성)
    const isRegeneration = previousScript && improvementFeedback

    // 피드백 정보 추출
    let feedbackSection = ''
    if (isRegeneration) {
      const improvements = improvementFeedback.improvementSuggestions || []
      const risks = improvementFeedback.riskAssessment || []
      const previousScore = improvementFeedback.overallScore || 0

      feedbackSection = `
## ⚠️ 중요: 이전 대본 개선 요청
이전 대본의 점수는 ${previousScore}점이었습니다. 90점 이상을 목표로 다음 피드백을 반드시 반영해주세요:

### 개선해야 할 점:
${improvements.map((item, i) => `${i + 1}. ${item.suggested || item.area || item}`).join('\n')}

### 주의사항:
${risks.map((risk, i) => `${i + 1}. ${risk.description || risk} → ${risk.suggestion || '개선 필요'}`).join('\n')}

### 이전 대본의 강점 (유지할 것):
${(improvementFeedback.strengths || []).slice(0, 2).join(', ')}

완전히 새로운 창의적인 접근으로 작성해주세요!
`
    }

    const scriptPrompt = `
당신은 한국 최고의 숏폼 콘텐츠 바이럴 전문가이자 대본 작가입니다.
조회수 100만 이상의 바이럴 숏폼을 만들어온 경험을 바탕으로 ${duration} 길이의 프리미엄 숏폼 대본을 작성해주세요.

## 브랜드 정보
- **브랜드명**: ${brandName}
- **브랜드/제품 정보**: ${brandInfo || '정보 없음'}
- **스토리 컨셉**: ${storyConcept}
- **타겟 시청자**: ${targetAudience || '일반 시청자'}
- **영상 길이**: ${duration}
- **추가 요청사항**: ${additionalNotes || '없음'}
${feedbackSection}

## 🔥 바이럴 숏폼 대본 필수 원칙

### 1. 킬러 훅 (첫 1-3초) - 가장 중요!
절대로 평범한 시작 금지! 다음 중 하나로 시작:
- 충격적인 질문: "이거 모르면 손해예요", "진짜 이게 된다고?"
- 호기심 유발: "이 영상 저장 안 하면 후회해요"
- 대비/반전 예고: "나만 몰랐던 꿀팁", "처음 써보고 소름"
- 강렬한 리액션: 놀란 표정 + 짧은 감탄사

### 2. 대사 작성 원칙 (매우 중요!)
- ❌ 금지: "안녕하세요", "오늘은 ~를 소개해드릴게요", "구독 좋아요"
- ✅ 필수: 친구한테 말하듯 자연스럽고 솔직하게
- 모든 대사는 짧고 리듬감 있게 (한 문장 10자 이내 권장)
- 자막으로 봤을 때도 임팩트 있어야 함
- MZ세대 말투 + 트렌디한 표현 사용

### 3. 장면별 템포
- 각 장면 2-5초로 빠른 전환
- 지루한 부분 0초 - 무조건 스킵
- 클로즈업, 빠른 줌, 속도감 있는 컷 전환

### 4. 컨셉별 필살기
${getConceptTips(storyConcept)}

## 출력 형식
반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "title": "임팩트 있는 대본 제목",
  "totalDuration": "${duration}",
  "viralScore": 85,
  "hook": {
    "text": "첫 1-3초에 말할 킬러 훅 (예: '이거 진짜야?' / '대박 찾았다')",
    "visualAction": "동시에 보여줄 화면/표정",
    "hookType": "질문형/충격형/호기심형/반전형"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneTitle": "장면 제목",
      "duration": "0-2초",
      "dialogue": "짧고 임팩트 있는 대사",
      "tone": "대사 톤 (놀람/확신/속삭임/흥분)",
      "action": "크리에이터 행동/제스처",
      "cameraWork": "카메라 앵글 (클로즈업/와이드/틸트 등)",
      "textOverlay": "자막 텍스트 (강조 포인트)",
      "bgmMood": "BGM 분위기",
      "transitionToNext": "다음 장면 연결 (컷/줌인/스와이프)"
    }
  ],
  "climax": {
    "timing": "클라이맥스 위치 (예: 장면 5-6)",
    "element": "클라이맥스 요소 (반전/결과공개/극적변화)"
  },
  "callToAction": {
    "text": "마지막 CTA (자연스럽게, '구독' 금지)",
    "visualCue": "CTA와 함께 보여줄 시각 요소"
  },
  "hashtags": ["#트렌딩태그1", "#브랜드관련", "#컨셉관련", "#타겟관련", "#바이럴태그"],
  "trendingSoundSuggestion": "추천 트렌딩 사운드/BGM",
  "proTips": [
    "촬영 시 이것만 주의하세요",
    "이 장면에서 자연광 활용하면 좋아요",
    "편집 시 이 효과 추가 추천"
  ],
  "alternativeHooks": [
    "대안 훅 1 (다른 스타일)",
    "대안 훅 2 (더 자극적인 버전)"
  ]
}

## 중요 지침
1. 정확히 ${sceneCount}개의 장면으로 구성 (더 많이!)
2. 모든 대사는 실제 인플루언서가 말할 법한 자연스러운 톤
3. 각 장면의 대사는 최대 2문장, 10자 이내로 짧게
4. 브랜드는 자연스럽게 녹아들게 (광고 티 금지)
5. MZ세대가 공감하고 저장할 만한 내용
6. 클릭베이트가 아닌 진짜 가치 있는 정보 포함
`

    const result = await model.generateContent(scriptPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // JSON 파싱
    let scriptResult
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        scriptResult = JSON.parse(jsonMatch[0])
      } else {
        scriptResult = { rawScript: aiResponse }
      }
    } catch (parseError) {
      scriptResult = { rawScript: aiResponse }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        script: scriptResult
      })
    }

  } catch (error) {
    console.error('대본 생성 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '대본 생성 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}

// 컨셉별 특화 팁 제공
function getConceptTips(concept) {
  const tips = {
    '유머/밈': `
- 예상을 완전히 깨는 반전 필수
- 밈 템플릿 활용: "POV: ~할 때", "Nobody: / Me:"
- 타이밍이 생명: 펀치라인 직전 0.5초 멈춤
- 과장된 리액션 + 자막 효과`,

    '비포애프터': `
- Before는 최대한 문제 상황 강조
- After는 드라마틱하게 변화 보여주기
- 변화 순간에 효과음 + 슬로우모션
- "진짜?" 리액션 삽입`,

    'GRWM': `
- 일상적인 말투로 친근하게
- 제품 노출은 자연스럽게 사용하면서
- "요즘 빠진 거", "매일 쓰는 거" 표현 활용
- 마지막에 완성된 모습 강조`,

    '언박싱': `
- 첫인상 리액션이 전부! 오버 연기 OK
- 포장 뜯는 ASMR 느낌 활용
- 제품 디테일 클로즈업 필수
- "이거 실화?" 같은 감탄사 활용`,

    '꿀팁': `
- "이거 나만 알고 싶은데" 로 시작
- 핵심 팁을 숫자로 명확하게
- 각 팁마다 자막 강조
- 마지막에 "저장해두세요" 유도`,

    '일상': `
- 공감 포인트 잡기: "다들 이러지 않아요?"
- 소소한 일상이지만 특별하게 연출
- BGM으로 분위기 살리기
- 자연스러운 모습이 포인트`,

    '챌린지': `
- 참여하기 쉬운 동작/말
- 해시태그 명확하게 노출
- "너도 해봐" 유도
- 실패하는 장면도 귀엽게 활용`,

    '리뷰': `
- 솔직한 첫인상이 가장 중요
- 장점 3개, 단점 1개 구조
- 실제 사용 장면 필수
- "솔직히 말하면..." 으로 신뢰감 형성`
  }

  return tips[concept] || tips['꿀팁']
}
