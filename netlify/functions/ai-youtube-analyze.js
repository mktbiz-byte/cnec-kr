/**
 * AI 유튜브 영상 분석 Netlify Function
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
    const { youtubeUrl } = JSON.parse(event.body)

    if (!youtubeUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '유튜브 URL이 필요합니다.' })
      }
    }

    // 유튜브 ID 추출
    const videoId = extractYoutubeId(youtubeUrl)
    if (!videoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '올바른 유튜브 URL 형식이 아닙니다.' })
      }
    }

    // OpenAI API 호출
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI API 키가 설정되지 않았습니다.' })
      }
    }

    const analysisPrompt = `
당신은 유튜브 콘텐츠 분석 전문가입니다. 다음 유튜브 영상 ID를 바탕으로 콘텐츠 분석을 수행해주세요.

영상 ID: ${videoId}
영상 URL: ${youtubeUrl}

다음 항목들을 분석해주세요:

1. **예상 콘텐츠 주제**: 해당 채널/영상의 주제 추정
2. **성공 요인 분석**: 이 유형의 콘텐츠가 성공하는 핵심 요소들
3. **타겟 시청자**: 예상되는 주요 시청자층
4. **콘텐츠 구조 제안**: 효과적인 영상 구성 방법
5. **벤치마킹 포인트**: 참고할 수 있는 핵심 전략
6. **개선 아이디어**: 차별화를 위한 아이디어

JSON 형식으로 응답해주세요:
{
  "videoId": "영상 ID",
  "estimatedTopic": "예상 주제",
  "successFactors": ["요인1", "요인2", "요인3"],
  "targetAudience": {
    "ageRange": "연령대",
    "interests": ["관심사1", "관심사2"],
    "characteristics": "특성"
  },
  "contentStructure": {
    "hook": "오프닝 훅 제안",
    "mainContent": "본문 구성",
    "cta": "행동 유도"
  },
  "benchmarkPoints": ["포인트1", "포인트2", "포인트3"],
  "improvementIdeas": ["아이디어1", "아이디어2", "아이디어3"],
  "summary": "전체 요약 (2-3문장)"
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
            content: '당신은 유튜브 콘텐츠 전문 분석가입니다. 한국어로 상세하고 실용적인 분석을 제공합니다.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API 오류:', errorData)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.' })
      }
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // JSON 파싱 시도
    let analysisResult
    try {
      // JSON 블록 추출
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        analysisResult = { rawAnalysis: aiResponse }
      }
    } catch (parseError) {
      analysisResult = { rawAnalysis: aiResponse }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        videoId: videoId,
        analysis: analysisResult
      })
    }

  } catch (error) {
    console.error('분석 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '분석 처리 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}

// 유튜브 ID 추출 함수
function extractYoutubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
