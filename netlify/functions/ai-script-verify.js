/**
 * AI 대본 검증 Netlify Function
 * 생성된 대본을 검증하고 개선점 제안
 * Muse 등급 크리에이터 전용
 */

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

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI API 키가 설정되지 않았습니다.' })
      }
    }

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

JSON 형식으로 응답해주세요:
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
    "강점2"
  ],
  "riskAssessment": [
    {
      "type": "리스크 유형",
      "severity": "low/medium/high",
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
    "viewPotential": "상/중/하",
    "engagementPotential": "상/중/하",
    "conversionPotential": "상/중/하"
  },
  "finalVerdict": "승인/조건부승인/수정필요",
  "summary": "전체 검토 요약 (3-4문장)"
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 광고 및 인플루언서 마케팅 전문 심사관입니다. 공정하고 건설적인 피드백을 한국어로 제공합니다.'
          },
          {
            role: 'user',
            content: verifyPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API 오류:', errorData)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI 검증 중 오류가 발생했습니다.' })
      }
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

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
