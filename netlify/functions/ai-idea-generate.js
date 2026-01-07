/**
 * AI 숏폼 콘텐츠 아이디어 생성 Netlify Function (Gemini API)
 * 키워드/주제를 입력받아 숏폼 콘텐츠 아이디어 추천
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
    const { keyword, category, platform, creatorStyle } = JSON.parse(event.body)

    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '키워드가 필요합니다.' })
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

    const ideaPrompt = `
당신은 숏폼 콘텐츠(YouTube Shorts, Instagram Reels, TikTok) 기획 전문가입니다.
다음 정보를 바탕으로 바이럴될 수 있는 숏폼 콘텐츠 아이디어를 제안해주세요.

## 입력 정보
- **키워드/주제**: ${keyword}
- **카테고리**: ${category || '뷰티/라이프스타일'}
- **플랫폼**: ${platform || 'YouTube Shorts, Instagram Reels, TikTok'}
- **크리에이터 스타일**: ${creatorStyle || '친근하고 자연스러운'}

## 숏폼 아이디어 생성 핵심 원칙
1. **트렌드 반영**: 2024-2025 최신 숏폼 트렌드 반영
2. **바이럴 요소**: 공유/저장되기 좋은 콘텐츠
3. **첫 3초 훅**: 스크롤 멈추게 하는 강력한 오프닝
4. **15-60초 최적화**: 짧은 시간 내 임팩트
5. **참여 유도**: 댓글/좋아요/공유 유도 요소
6. **브랜드 협업 연계**: 브랜드 마케팅 활용 가능성

## 인기 숏폼 포맷
- 비포&애프터 (Before/After)
- GRWM (Get Ready With Me)
- POV (Point of View)
- 저장해두세요 시리즈
- 꿀팁/라이프핵
- 언박싱/첫인상
- 밈/유머
- 챌린지/트렌드
- 스토리타임

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "keyword": "${keyword}",
  "trendingTopics": ["관련 트렌드1", "관련 트렌드2", "관련 트렌드3"],
  "ideas": [
    {
      "title": "숏폼 콘텐츠 제목",
      "format": "포맷 (릴스/쇼츠/틱톡)",
      "duration": "15초/30초/45초/60초",
      "hook": "첫 3초 훅 아이디어",
      "description": "콘텐츠 상세 설명",
      "viralPotential": "상/중/하",
      "difficulty": "쉬움/보통/어려움",
      "trendingElement": "활용할 트렌드 요소",
      "brandCollabPotential": "브랜드 협업 연계 아이디어",
      "hashtags": ["#추천해시태그1", "#추천해시태그2"]
    }
  ],
  "trendingSounds": [
    {
      "name": "트렌딩 사운드/BGM",
      "usage": "활용 방법"
    }
  ],
  "tips": ["숏폼 성공 팁1", "성공 팁2", "성공 팁3"],
  "avoidThese": ["피해야 할 것1", "피해야 할 것2"]
}

최소 6개 이상의 다양한 숏폼 아이디어를 제안해주세요. ideas 배열에 6개 이상 포함.
각 아이디어는 실제로 바로 촬영할 수 있을 정도로 구체적이어야 합니다.
`

    const result = await model.generateContent(ideaPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // JSON 파싱
    let ideasResult
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        ideasResult = JSON.parse(jsonMatch[0])
      } else {
        ideasResult = { rawIdeas: aiResponse }
      }
    } catch (parseError) {
      ideasResult = { rawIdeas: aiResponse }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ideas: ideasResult
      })
    }

  } catch (error) {
    console.error('아이디어 생성 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '아이디어 생성 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}
