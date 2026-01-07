/**
 * AI 콘텐츠 아이디어 생성 Netlify Function
 * 키워드/주제를 입력받아 콘텐츠 아이디어 추천
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
    const { keyword, category, platform, creatorStyle } = JSON.parse(event.body)

    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '키워드가 필요합니다.' })
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

    const ideaPrompt = `
당신은 인플루언서 콘텐츠 기획 전문가입니다. 다음 정보를 바탕으로 독창적인 콘텐츠 아이디어를 제안해주세요.

## 입력 정보
- **키워드/주제**: ${keyword}
- **카테고리**: ${category || '뷰티/라이프스타일'}
- **플랫폼**: ${platform || '유튜브, 인스타그램'}
- **크리에이터 스타일**: ${creatorStyle || '친근하고 자연스러운'}

## 아이디어 생성 가이드라인
1. 2024-2025 최신 트렌드 반영
2. 바이럴 가능성 높은 아이디어
3. 다양한 형식 제안 (롱폼, 숏폼, 챌린지 등)
4. 실제 제작 가능한 현실적인 아이디어
5. 브랜드 협업 연계 가능성

JSON 형식으로 응답해주세요:
{
  "keyword": "입력된 키워드",
  "trendingTopics": ["관련 트렌드1", "관련 트렌드2"],
  "ideas": [
    {
      "title": "콘텐츠 제목",
      "format": "영상 형식 (롱폼/숏폼/릴스 등)",
      "platform": "추천 플랫폼",
      "description": "콘텐츠 상세 설명",
      "hook": "시청자 주목 포인트",
      "viralPotential": "상/중/하",
      "difficulty": "쉬움/보통/어려움",
      "estimatedTime": "제작 예상 시간",
      "brandCollabPotential": "브랜드 협업 연계 아이디어"
    }
  ],
  "challengeIdeas": [
    {
      "name": "챌린지명",
      "description": "챌린지 설명",
      "hashtag": "추천 해시태그"
    }
  ],
  "seriesIdeas": [
    {
      "name": "시리즈명",
      "episodeCount": "예상 에피소드 수",
      "description": "시리즈 설명"
    }
  ],
  "tips": ["성공 팁1", "성공 팁2"],
  "avoidThese": ["피해야 할 것1", "피해야 할 것2"]
}

최소 5개 이상의 다양한 아이디어를 제안해주세요.
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
            content: '당신은 SNS 트렌드와 인플루언서 마케팅에 정통한 콘텐츠 기획 전문가입니다. 창의적이고 실용적인 아이디어를 한국어로 제안합니다.'
          },
          {
            role: 'user',
            content: ideaPrompt
          }
        ],
        temperature: 0.9,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API 오류:', errorData)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI 아이디어 생성 중 오류가 발생했습니다.' })
      }
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

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
