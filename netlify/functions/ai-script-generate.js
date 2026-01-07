/**
 * AI 숏폼 대본 생성 Netlify Function (Gemini API)
 * 브랜드와 스토리를 입력받아 15-60초 숏폼 대본 생성
 * Muse 등급 크리에이터 전용
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

    // 숏폼 길이에 따른 장면 수 결정
    const duration = videoLength || '30초'
    let sceneCount = 3
    if (duration === '15초') sceneCount = 2
    else if (duration === '45초') sceneCount = 4
    else if (duration === '60초') sceneCount = 5

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
이전 대본의 점수는 ${previousScore}점이었습니다. 85점 이상을 목표로 다음 피드백을 반드시 반영해주세요:

### 개선해야 할 점:
${improvements.map((item, i) => `${i + 1}. ${item.suggested || item.area || item}`).join('\n')}

### 주의사항:
${risks.map((risk, i) => `${i + 1}. ${risk.description || risk} → ${risk.suggestion || '개선 필요'}`).join('\n')}

### 이전 대본의 강점 (유지할 것):
${(improvementFeedback.strengths || []).slice(0, 2).join(', ')}

이전 대본보다 확실히 개선된 버전을 작성해주세요!
`
    }

    const scriptPrompt = `
당신은 숏폼 콘텐츠(YouTube Shorts, Instagram Reels, TikTok) 전문 대본 작가입니다.
다음 정보를 바탕으로 ${duration} 길이의 숏폼 영상 대본을 작성해주세요.

## 입력 정보
- **브랜드명**: ${brandName}
- **브랜드/제품 정보**: ${brandInfo || '정보 없음'}
- **스토리 컨셉**: ${storyConcept}
- **타겟 시청자**: ${targetAudience || '일반 시청자'}
- **영상 길이**: ${duration}
- **추가 요청사항**: ${additionalNotes || '없음'}
${feedbackSection}
## 숏폼 대본 작성 핵심 원칙
1. **첫 3초 훅**: 스크롤 멈추게 하는 강력한 훅 필수! (질문, 충격, 호기심 유발)
2. **빠른 전개**: 지루할 틈 없이 빠르게 진행
3. **짧은 컷**: 한 장면당 최대 5-10초
4. **세로 화면 최적화**: 9:16 비율 고려한 구도
5. **자막 친화적**: 소리 없이도 이해 가능한 대사
6. **트렌드 반영**: 현재 유행하는 숏폼 포맷 활용
7. **CTA 임팩트**: 마지막에 강렬한 행동 유도

## 숏폼 컨셉별 포맷
- **유머/밈**: 예상치 못한 반전, 밈 활용
- **비포애프터**: 극적인 변화 강조
- **GRWM**: 자연스러운 일상 + 제품 노출
- **언박싱**: 첫인상 리액션 강조
- **꿀팁**: 핵심만 빠르게 전달
- **챌린지**: 참여 유도 + 해시태그

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "title": "숏폼 대본 제목",
  "totalDuration": "${duration}",
  "format": "숏폼 포맷 (릴스/쇼츠/틱톡)",
  "hook": "첫 3초 훅 멘트 (스크롤 멈추게 하는 강력한 한마디)",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneTitle": "장면 제목 (예: 훅, 문제제기, 솔루션 등)",
      "duration": "0-3초",
      "dialogue": "실제 말할 대사 (짧고 임팩트있게)",
      "action": "화면에 보여질 행동/제스처",
      "textOverlay": "자막/텍스트 오버레이",
      "transition": "전환 효과 (컷/줌/스와이프 등)"
    }
  ],
  "callToAction": "마지막 CTA 멘트 (팔로우/좋아요/댓글 유도)",
  "hashtags": ["#추천해시태그1", "#추천해시태그2", "#추천해시태그3", "#추천해시태그4", "#추천해시태그5", "#추천해시태그6", "#추천해시태그7"],
  "musicSuggestion": "추천 BGM 스타일 또는 트렌딩 사운드",
  "tips": ["촬영 팁1", "촬영 팁2", "촬영 팁3"]
}

정확히 ${sceneCount}개의 장면으로 구성해주세요.
대사는 자연스럽고 친근하게, 하지만 짧고 임팩트있게 작성해주세요.
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
