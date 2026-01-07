/**
 * AI 대본 생성 Netlify Function (Gemini API)
 * 브랜드와 스토리를 입력받아 촬영장면/대사 생성
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
    const { brandName, brandInfo, storyConcept, targetAudience, additionalNotes, videoLength } = JSON.parse(event.body)

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

    const scriptPrompt = `
당신은 인플루언서 마케팅 콘텐츠 전문 작가입니다. 다음 정보를 바탕으로 유튜브/인스타그램 영상 대본을 작성해주세요.

## 입력 정보
- **브랜드명**: ${brandName}
- **브랜드 정보**: ${brandInfo || '정보 없음'}
- **스토리 컨셉**: ${storyConcept} (예: 유머, 감동, 정보전달, 브이로그 등)
- **타겟 시청자**: ${targetAudience || '일반 시청자'}
- **영상 길이**: ${videoLength || '1-3분'}
- **추가 요청사항**: ${additionalNotes || '없음'}

## 대본 작성 가이드라인
1. 자연스럽고 친근한 말투 사용
2. 브랜드 메시지가 강제적이지 않게 녹아들도록
3. 시청자의 관심을 끄는 훅으로 시작
4. 실제 촬영 가능한 구체적인 장면 설명
5. 자막 및 효과음 삽입 포인트 제안

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "title": "대본 제목",
  "totalDuration": "예상 영상 길이",
  "hook": "첫 5초 훅 (시청자 주목 끌기)",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneTitle": "장면 제목",
      "duration": "예상 시간",
      "location": "촬영 장소",
      "description": "장면 상세 설명",
      "dialogue": "크리에이터 대사 (실제 말할 내용)",
      "cameraNote": "카메라 앵글/동작 제안",
      "effectNote": "자막, BGM, 효과음 제안"
    }
  ],
  "callToAction": "마지막 행동 유도 멘트",
  "hashtags": ["추천해시태그1", "추천해시태그2", "추천해시태그3", "추천해시태그4", "추천해시태그5"],
  "productPlacement": "제품 노출 타이밍 및 방법",
  "tips": ["촬영 팁1", "촬영 팁2", "촬영 팁3"]
}

최소 4-6개의 장면을 포함해주세요.
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
