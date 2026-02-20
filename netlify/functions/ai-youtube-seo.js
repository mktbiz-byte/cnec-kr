/**
 * AI 유튜브 SEO 추천 Netlify Function (Gemini API)
 * 키워드/URL을 입력받아 유튜브 SEO 최적화 추천
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
    const { keyword, category, platform, contentType } = JSON.parse(event.body)

    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '키워드 또는 주제를 입력해주세요.' })
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

    const seoPrompt = `
당신은 한국 유튜브 SEO 최적화 전문가입니다.
다음 정보를 바탕으로 유튜브 영상의 검색 노출과 조회수를 극대화할 수 있는 SEO 전략을 제안해주세요.

## 입력 정보
- **키워드/주제**: ${keyword}
- **카테고리**: ${category || '뷰티/라이프스타일'}
- **플랫폼**: ${platform || 'YouTube Shorts'}
- **콘텐츠 유형**: ${contentType || '숏폼'}

## 분석 항목
1. **제목 최적화**: CTR(클릭률) 높은 제목 패턴 3개 제안
2. **설명문 최적화**: 검색 노출에 최적화된 설명문 템플릿
3. **태그/키워드 전략**: 메인 키워드, 롱테일 키워드, 관련 키워드
4. **해시태그 전략**: 노출 극대화 해시태그 조합
5. **썸네일 전략**: CTR 높이는 썸네일 디자인 가이드
6. **업로드 전략**: 최적 업로드 시간대 및 빈도
7. **경쟁 분석**: 해당 키워드의 경쟁 강도 및 틈새 공략법

## 한국 유튜브 SEO 핵심 원칙
- 한국어 검색 패턴 반영 (초성 검색, 축약어 등)
- 네이버/구글 동시 노출 고려
- YouTube Shorts 알고리즘 특성 반영
- 2024-2025 한국 유튜브 트렌드 반영

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "keyword": "${keyword}",
  "competitionLevel": "높음/보통/낮음",
  "searchVolumeTrend": "상승/유지/하락",
  "titles": [
    {
      "title": "CTR 높은 제목 예시",
      "pattern": "사용된 제목 패턴 (예: 숫자형, 질문형, 반전형)",
      "estimatedCTR": "예상 CTR (상/중/하)",
      "reason": "이 제목이 효과적인 이유"
    },
    {
      "title": "두 번째 제목 예시",
      "pattern": "패턴",
      "estimatedCTR": "상/중/하",
      "reason": "이유"
    },
    {
      "title": "세 번째 제목 예시",
      "pattern": "패턴",
      "estimatedCTR": "상/중/하",
      "reason": "이유"
    }
  ],
  "description": {
    "template": "검색 최적화된 설명문 템플릿 (300자 이상, 키워드 자연스럽게 포함)",
    "mustInclude": ["설명문에 꼭 넣을 요소1", "요소2", "요소3"],
    "keywordPlacement": "키워드 배치 전략 설명"
  },
  "tags": {
    "primary": ["메인 키워드 태그1", "메인 키워드 태그2", "메인 키워드 태그3"],
    "longTail": ["롱테일 키워드1", "롱테일 키워드2", "롱테일 키워드3", "롱테일 키워드4"],
    "related": ["관련 키워드1", "관련 키워드2", "관련 키워드3"],
    "trending": ["트렌딩 키워드1", "트렌딩 키워드2"]
  },
  "hashtags": {
    "must": ["#필수해시태그1", "#필수해시태그2", "#필수해시태그3"],
    "recommended": ["#추천해시태그1", "#추천해시태그2", "#추천해시태그3"],
    "niche": ["#틈새해시태그1", "#틈새해시태그2"]
  },
  "thumbnail": {
    "style": "추천 썸네일 스타일",
    "mainText": "썸네일에 넣을 텍스트",
    "colorScheme": "추천 색상 조합",
    "tips": ["썸네일 팁1", "썸네일 팁2", "썸네일 팁3"]
  },
  "uploadStrategy": {
    "bestTimes": ["최적 시간대1", "최적 시간대2"],
    "bestDays": ["최적 요일1", "최적 요일2"],
    "frequency": "추천 업로드 빈도",
    "reason": "이유"
  },
  "competitorInsight": {
    "topStrategy": "상위 영상들의 공통 전략",
    "gap": "경쟁자 대비 공략 가능한 틈새",
    "differentiation": "차별화 포인트 제안"
  },
  "proTips": [
    "SEO 프로 팁1",
    "SEO 프로 팁2",
    "SEO 프로 팁3"
  ]
}
`

    const result = await model.generateContent(seoPrompt)
    const response = await result.response
    const aiResponse = response.text()

    // JSON 파싱
    let seoResult
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        seoResult = JSON.parse(jsonMatch[0])
      } else {
        seoResult = { rawSeo: aiResponse }
      }
    } catch (parseError) {
      seoResult = { rawSeo: aiResponse }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        seo: seoResult
      })
    }

  } catch (error) {
    console.error('SEO 분석 오류:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'SEO 분석 중 오류가 발생했습니다.',
        details: error.message
      })
    }
  }
}
