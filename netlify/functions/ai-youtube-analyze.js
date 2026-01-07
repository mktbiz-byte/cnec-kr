/**
 * AI 유튜브 영상 분석 Netlify Function (Gemini API)
 * Muse 등급 크리에이터 전용
 * Gemini는 유튜브 영상을 직접 분석할 수 있음
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

    const analysisPrompt = `
당신은 유튜브 콘텐츠 분석 전문가입니다. 다음 유튜브 영상을 분석하고 크리에이터에게 유용한 인사이트를 제공해주세요.

다음 항목들을 분석해주세요:

1. **콘텐츠 주제**: 영상의 핵심 주제와 카테고리
2. **성공 요인 분석**: 이 영상이 잘 된 (또는 잘 될) 핵심 요소들
3. **타겟 시청자**: 예상되는 주요 시청자층
4. **콘텐츠 구조**: 영상의 구성 방식 분석
5. **벤치마킹 포인트**: 참고할 수 있는 핵심 전략
6. **개선/차별화 아이디어**: 비슷한 콘텐츠를 만들 때 차별화할 수 있는 아이디어

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "videoId": "${videoId}",
  "title": "영상 제목 (분석된 내용 기반)",
  "estimatedTopic": "예상 주제",
  "category": "카테고리",
  "successFactors": ["요인1", "요인2", "요인3", "요인4", "요인5"],
  "targetAudience": {
    "ageRange": "연령대",
    "interests": ["관심사1", "관심사2", "관심사3"],
    "characteristics": "시청자 특성 설명"
  },
  "contentStructure": {
    "hook": "오프닝 훅 분석",
    "mainContent": "본문 구성 분석",
    "cta": "행동 유도 분석"
  },
  "benchmarkPoints": ["포인트1", "포인트2", "포인트3", "포인트4", "포인트5"],
  "improvementIdeas": ["아이디어1", "아이디어2", "아이디어3", "아이디어4", "아이디어5"],
  "thumbnailAnalysis": "썸네일 분석 (있다면)",
  "engagementTips": ["팁1", "팁2", "팁3"],
  "summary": "전체 요약 (3-4문장)"
}
`

    // Gemini로 유튜브 영상 직접 분석
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'video/youtube',
          fileUri: youtubeUrl
        }
      },
      { text: analysisPrompt }
    ])

    const response = await result.response
    const aiResponse = response.text()

    // JSON 파싱
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
