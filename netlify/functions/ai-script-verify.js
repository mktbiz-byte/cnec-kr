/**
 * AI 대본 검증 Netlify Function (Gemini API)
 * 생성된 대본을 검증하고 개선점 제안
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
    const { script, brandName, brandInfo, targetAudience } = JSON.parse(event.body)

    if (!script) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '검증할 대본이 필요합니다.' })
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const verifyPrompt = `
당신은 인플루언서 마케팅 콘텐츠 품질 관리 전문가입니다. 다음 대본을 검토하고 상세한 피드백을 제공해주세요.

## 대본 내용
${JSON.stringify(script, null, 2)}

## 브랜드 정보
- 브랜드명: ${brandName || '정보 없음'}
- 브랜드 상세: ${brandInfo || '정보 없음'}
- 타겟 시청자: ${targetAudience || '정보 없음'}

## 검토 항목
1. **브랜드 정합성**: 브랜드 메시지가 자연스럽게 전달되는가
2. **시청자 매력도**: 타겟 시청자가 끌릴 만한 콘텐츠인가
3. **잠재적 리스크**: 저작권, 광고법, 부적절한 표현 등
4. **광고 효과 예측**: 예상되는 마케팅 효과
5. **개선 제안**: 구체적인 수정 방향

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "overallScore": 85,
  "scores": {
    "brandAlignment": 90,
    "audienceAppeal": 85,
    "creativity": 80,
    "clarity": 88,
    "engagement": 82
  },
  "strengths": [
    "강점1",
    "강점2",
    "강점3"
  ],
  "riskAssessment": [
    {
      "type": "리스크 유형",
      "severity": "low",
      "description": "설명",
      "suggestion": "해결 방안"
    }
  ],
  "improvementSuggestions": [
    {
      "area": "개선 영역",
      "current": "현재 상태",
      "suggested": "개선 제안",
      "impact": "예상 효과"
    }
  ],
  "predictedPerformance": {
    "viewPotential": "상",
    "engagementPotential": "중",
    "conversionPotential": "상"
  },
  "finalVerdict": "승인",
  "summary": "전체 검토 요약 (3-4문장)"
}

finalVerdict는 "승인", "조건부승인", "수정필요" 중 하나입니다.
`

    const result = await model.generateContent(verifyPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // JSON 파싱
    let verificationResult
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0])
      } else {
        verificationResult = { rawVerification: aiResponse }
      }
    } catch (parseError) {
      verificationResult = { rawVerification: aiResponse }
    }

    // 검증 상태 결정
    let verificationStatus = 'pending'
    if (verificationResult.finalVerdict === '승인') {
      verificationStatus = 'verified'
    } else if (verificationResult.finalVerdict === '수정필요') {
      verificationStatus = 'needs_revision'
    } else {
      verificationStatus = 'verified' // 조건부승인도 verified로 처리
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        verification: verificationResult,
        status: verificationStatus
      })
    }

  } catch (error) {
    console.error('검증 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '검증 처리 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}
