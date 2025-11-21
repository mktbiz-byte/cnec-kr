/**
 * AI 가이드 재생성 스크립트
 * 지정된 캠페인의 AI 가이드를 삭제하고 재생성합니다.
 */

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Supabase 클라이언트 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xvjnkwrfzwqmgdlnqbhg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2am5rd3JmendxbWdkbG5xYmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NTExNTgsImV4cCI6MjA0MTAyNzE1OH0.qUqCFQGGOyHsALPDxzBZwH_5Qc6JYqY3eMqXRLZzO1k'
const supabase = createClient(supabaseUrl, supabaseKey)

// Gemini AI 클라이언트 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// 캠페인 ID 목록
const campaignIds = [
  '6011c483-3b0a-44a9-a42f-0db47e3a1eaa', // 올영세일 테스트
  '83f250b2-cff0-4de6-838b-aa093f4842f8', // 일본(기획형)
  '7f34cd9d-3afd-49d3-bb53-575a5d6f7e51'  // 4주 챌린지
]

/**
 * 캠페인 타입별 AI 가이드 생성 프롬프트
 */
function getPromptForCampaignType(campaign) {
  const baseInfo = `
캠페인 정보:
- 제품명: ${campaign.product_name || '제품명'}
- 브랜드: ${campaign.brand_name || '브랜드명'}
- 캠페인 타입: ${campaign.package_type || '일반'}
- 제공 내용: ${campaign.provide_details || '제품 제공'}
- 미션: ${campaign.mission || '리뷰 작성'}
`

  if (campaign.package_type === 'oliveyoung' || campaign.title?.includes('올영')) {
    // 올리브영 패키지
    return `${baseInfo}

올리브영 패키지 캠페인을 위한 크리에이터 가이드를 작성해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "product_intro": "제품 소개 (2-3문장)",
  "must_include": ["필수 포함 사항 1", "필수 포함 사항 2", "필수 포함 사항 3"],
  "filming_tips": ["촬영 팁 1", "촬영 팁 2", "촬영 팁 3"],
  "video_concepts": ["영상 컨셉 아이디어 1", "영상 컨셉 아이디어 2"],
  "cautions": ["주의사항 1", "주의사항 2"]
}

올리브영 제품 특성을 고려하여:
- 제품의 핵심 효능과 특징을 명확히 전달
- 올리브영 매장 방문 또는 온라인 구매 링크 포함
- 실제 사용 전후 비교 강조
- 피부타입별 사용 팁 포함`
  } else if (campaign.package_type === '4week_challenge') {
    // 4주 챌린지
    return `${baseInfo}

4주 챌린지 캠페인을 위한 크리에이터 가이드를 작성해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "product_intro": "제품 소개 및 4주 챌린지 설명 (3-4문장)",
  "must_include": ["필수 포함 사항 1", "필수 포함 사항 2", "필수 포함 사항 3", "필수 포함 사항 4"],
  "filming_tips": ["1주차 촬영 팁", "2주차 촬영 팁", "3주차 촬영 팁", "4주차 촬영 팁"],
  "video_concepts": ["주차별 영상 구성 아이디어 1", "주차별 영상 구성 아이디어 2"],
  "cautions": ["주의사항 1", "주의사항 2", "주의사항 3"]
}

4주 챌린지 특성을 고려하여:
- 주차별 변화 과정을 명확히 기록
- Before/After 비교를 위한 동일 조건 촬영
- 매주 일관된 측정 및 기록 방법
- 솔직한 후기와 느낀 점 공유`
  } else {
    // 일반 기획형 캠페인
    return `${baseInfo}

일반 기획형 캠페인을 위한 크리에이터 가이드를 작성해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "product_intro": "제품 소개 (2-3문장)",
  "must_include": ["필수 포함 사항 1", "필수 포함 사항 2", "필수 포함 사항 3"],
  "filming_tips": ["촬영 팁 1", "촬영 팁 2", "촬영 팁 3"],
  "video_concepts": ["영상 컨셉 아이디어 1", "영상 컨셉 아이디어 2"],
  "cautions": ["주의사항 1", "주의사항 2"]
}

일반 캠페인 특성을 고려하여:
- 제품의 핵심 가치와 차별점 강조
- 실제 사용 경험과 솔직한 리뷰
- 타겟 고객층에 맞는 컨텐츠 구성
- 자연스러운 제품 노출과 사용 장면`
  }
}

/**
 * AI 가이드 생성
 */
async function generateAIGuide(campaign) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = getPromptForCampaignType(campaign)
    
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return text
  } catch (error) {
    console.error('AI 가이드 생성 오류:', error)
    return null
  }
}

/**
 * 캠페인 AI 가이드 재생성
 */
async function regenerateCampaignGuide(campaignId) {
  try {
    console.log(`\n캠페인 ${campaignId} 처리 중...`)
    
    // 1. 캠페인 정보 조회
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    
    if (fetchError) {
      console.error('캠페인 조회 오류:', fetchError)
      return
    }
    
    if (!campaign) {
      console.error('캠페인을 찾을 수 없습니다.')
      return
    }
    
    console.log(`캠페인명: ${campaign.title}`)
    console.log(`타입: ${campaign.package_type}`)
    
    // 2. 기존 AI 가이드 삭제
    console.log('기존 AI 가이드 삭제 중...')
    const { error: deleteError } = await supabase
      .from('campaigns')
      .update({ ai_generated_guide: null })
      .eq('id', campaignId)
    
    if (deleteError) {
      console.error('AI 가이드 삭제 오류:', deleteError)
      return
    }
    
    console.log('기존 AI 가이드 삭제 완료')
    
    // 3. 새 AI 가이드 생성
    console.log('새 AI 가이드 생성 중...')
    const newGuide = await generateAIGuide(campaign)
    
    if (!newGuide) {
      console.error('AI 가이드 생성 실패')
      return
    }
    
    console.log('AI 가이드 생성 완료:', JSON.stringify(newGuide, null, 2))
    
    // 4. 새 AI 가이드 저장
    console.log('새 AI 가이드 저장 중...')
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ ai_generated_guide: newGuide })
      .eq('id', campaignId)
    
    if (updateError) {
      console.error('AI 가이드 저장 오류:', updateError)
      return
    }
    
    console.log('✅ AI 가이드 재생성 완료!')
  } catch (error) {
    console.error('오류 발생:', error)
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('=== AI 가이드 재생성 시작 ===\n')
  
  for (const campaignId of campaignIds) {
    await regenerateCampaignGuide(campaignId)
    // API 호출 제한을 피하기 위해 대기
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n=== AI 가이드 재생성 완료 ===')
}

// 스크립트 실행
main()
