/**
 * AI 숏폼 영상 분석 Netlify Function (Gemini API)
 * Muse 등급 크리에이터 전용
 * YouTube Shorts, Instagram Reels, TikTok 최적화 분석
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
당신은 숏폼 콘텐츠(YouTube Shorts, Instagram Reels, TikTok) 분석 전문가입니다.
다음 숏폼 영상을 분석하고 크리에이터에게 유용한 인사이트를 제공해주세요.

## 숏폼 분석 핵심 항목

1. **훅 분석**: 첫 3초에서 시청자를 어떻게 사로잡았는가
2. **콘텐츠 구조**: 짧은 시간 내 스토리 전개 방식
3. **성공 요인**: 조회수/좋아요를 높인 핵심 요소
4. **타겟 시청자**: 주요 시청자층 예측
5. **벤치마킹 포인트**: 참고할 수 있는 기법
6. **차별화 아이디어**: 비슷한 콘텐츠 제작 시 차별화 방법

## 숏폼 특화 분석 기준
- 첫 3초 주목도 (스크롤 멈춤 유도력)
- 세로 화면 활용도 (9:16 최적화)
- 자막/텍스트 오버레이 효과
- BGM/사운드 활용
- 컷 전환 속도와 리듬감
- CTA(행동 유도) 효과
- 트렌딩 요소 활용 (밈, 챌린지, 트렌드 사운드 등)

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "videoId": "${videoId}",
  "estimatedTopic": "영상 주제",
  "category": "카테고리 (뷰티/패션/먹방/리뷰/브이로그/유머/정보 등)",
  "estimatedDuration": "예상 영상 길이",
  "hookAnalysis": "첫 3초 훅 분석 - 어떻게 시청자를 사로잡았는지",
  "hookScore": 85,
  "successFactors": [
    "성공요인1 - 구체적으로",
    "성공요인2",
    "성공요인3",
    "성공요인4",
    "성공요인5"
  ],
  "contentStructure": {
    "opening": "오프닝 방식 (0-3초)",
    "middle": "본문 전개 방식",
    "ending": "마무리/CTA 방식"
  },
  "targetAudience": {
    "ageRange": "예상 연령대",
    "gender": "예상 성별",
    "interests": ["관심사1", "관심사2", "관심사3"]
  },
  "technicalAnalysis": {
    "cameraWork": "카메라 앵글/움직임 분석",
    "editingPace": "편집 속도 (빠름/보통/느림)",
    "textOverlay": "자막/텍스트 활용 분석",
    "soundUsage": "BGM/효과음 활용 분석"
  },
  "benchmarkPoints": [
    "벤치마킹 포인트1",
    "벤치마킹 포인트2",
    "벤치마킹 포인트3",
    "벤치마킹 포인트4",
    "벤치마킹 포인트5"
  ],
  "improvementIdeas": [
    "차별화 아이디어1",
    "차별화 아이디어2",
    "차별화 아이디어3"
  ],
  "trendingElements": ["활용된 트렌드 요소1", "트렌드 요소2"],
  "recommendedHashtags": ["#추천해시태그1", "#추천해시태그2", "#추천해시태그3"],
  "summary": "전체 분석 요약 (3-4문장)"
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
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
