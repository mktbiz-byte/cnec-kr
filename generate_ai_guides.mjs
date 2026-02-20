import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabaseUrl = 'https://vluqhvuhykncicgvkosd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXFodnVoeWtuY2ljZ3Zrb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg2MzAsImV4cCI6MjA3Njg0NDYzMH0.ikEqdx6Le54YJUP-NROKg6EmeHJ4TbKkQ76pw29OQG8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// 캠페인 타입별 프롬프트 생성
function generatePrompt(campaign) {
  const baseInfo = `
브랜드: ${campaign.brand || '제공된 브랜드'}
제품명: ${campaign.product_name || '제공된 제품'}
제품 설명: ${campaign.product_description || '제공된 제품 설명'}
타겟 플랫폼: ${campaign.target_platforms?.join(', ') || 'Instagram, YouTube'}
캠페인 요구사항: ${campaign.requirements || '없음'}
`

  if (campaign.campaign_type === '4week_challenge') {
    return `
당신은 한국의 SNS 마케팅 전문가입니다. 다음 4주 챌린지 캠페인을 위한 크리에이터 가이드를 작성해주세요.

${baseInfo}

**4주 챌린지 특성:**
- 4주 동안 매주 제품을 사용하며 변화 과정을 기록
- Before/After 비교가 핵심
- 주차별로 일관된 측정 방법 필요
- 진정성 있는 장기 리뷰

다음 JSON 형식으로 응답해주세요:
{
  "product_intro": "제품 소개 (2-3문장)",
  "must_include": ["필수 포함 사항 1", "필수 포함 사항 2", "필수 포함 사항 3"],
  "filming_tips": ["촬영 팁 1", "촬영 팁 2", "촬영 팁 3"],
  "video_concept": "4주 챌린지에 적합한 영상 컨셉 (주차별 구성 포함)",
  "caution": ["주의사항 1", "주의사항 2"]
}
`
  } else if (campaign.campaign_type === 'oliveyoung') {
    return `
당신은 한국의 SNS 마케팅 전문가입니다. 다음 올리브영 패키지 캠페인을 위한 크리에이터 가이드를 작성해주세요.

${baseInfo}

**올리브영 패키지 특성:**
- 올리브영 매장/온라인에서 구매 가능한 제품
- 제품 효능과 특징을 명확히 전달
- 올리브영 구매 링크 포함 필수
- 뷰티/헬스케어 제품 특화

다음 JSON 형식으로 응답해주세요:
{
  "product_intro": "제품 소개 (올리브영 제품 특징 강조, 2-3문장)",
  "must_include": ["필수 포함 사항 1 (올리브영 구매 링크 포함)", "필수 포함 사항 2", "필수 포함 사항 3"],
  "filming_tips": ["촬영 팁 1", "촬영 팁 2", "촬영 팁 3"],
  "video_concept": "올리브영 제품에 적합한 영상 컨셉",
  "caution": ["주의사항 1", "주의사항 2"]
}
`
  } else {
    // 기획형 (planned)
    return `
당신은 한국의 SNS 마케팅 전문가입니다. 다음 기획형 캠페인을 위한 크리에이터 가이드를 작성해주세요.

${baseInfo}

**기획형 캠페인 특성:**
- 제품의 핵심 가치와 차별점 강조
- 실제 사용 경험과 솔직한 리뷰
- 자연스러운 제품 노출
- 한국 트렌드에 맞는 콘텐츠

다음 JSON 형식으로 응답해주세요:
{
  "product_intro": "제품 소개 (핵심 가치 강조, 2-3문장)",
  "must_include": ["필수 포함 사항 1", "필수 포함 사항 2", "필수 포함 사항 3"],
  "filming_tips": ["촬영 팁 1", "촬영 팁 2", "촬영 팁 3"],
  "video_concept": "기획형 캠페인에 적합한 영상 컨셉",
  "caution": ["주의사항 1", "주의사항 2"]
}
`
  }
}

// AI 가이드 생성
async function generateGuide(campaign) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = generatePrompt(campaign)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const guide = JSON.parse(jsonMatch[0])
      return guide
    }
    
    throw new Error('JSON 형식을 찾을 수 없습니다')
  } catch (error) {
    console.error(`AI 가이드 생성 실패 (${campaign.id}):`, error.message)
    return null
  }
}

// 메인 실행
async function main() {
  // 4주 챌린지와 올영 패키지 캠페인 조회
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .in('campaign_type', ['4week_challenge', 'oliveyoung'])
  
  if (error) {
    console.error('캠페인 조회 실패:', error)
    return
  }
  
  console.log(`총 ${campaigns.length}개 캠페인의 AI 가이드를 생성합니다...\n`)
  
  for (const campaign of campaigns) {
    console.log(`[${campaign.campaign_type}] ${campaign.title}`)
    console.log(`  ID: ${campaign.id}`)
    
    const guide = await generateGuide(campaign)
    
    if (guide) {
      // Supabase에 저장
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ ai_generated_guide: guide })
        .eq('id', campaign.id)
      
      if (updateError) {
        console.error(`  ❌ 저장 실패:`, updateError.message)
      } else {
        console.log(`  ✅ AI 가이드 생성 및 저장 완료`)
      }
    } else {
      console.log(`  ❌ AI 가이드 생성 실패`)
    }
    
    console.log('')
    
    // API 제한을 피하기 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('모든 AI 가이드 생성 완료!')
}

main()
