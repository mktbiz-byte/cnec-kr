import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vluqhvuhykncicgvkosd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXFodnVoeWtuY2ljZ3Zrb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg2MzAsImV4cCI6MjA3Njg0NDYzMH0.ikEqdx6Le54YJUP-NROKg6EmeHJ4TbKkQ76pw29OQG8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 4주 챌린지와 올영 패키지 캠페인 확인
const { data, error } = await supabase
  .from('campaigns')
  .select('id, title, campaign_type, ai_generated_guide')
  .in('campaign_type', ['4week_challenge', 'oliveyoung'])
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error:', JSON.stringify(error, null, 2))
} else {
  console.log('4주 챌린지 및 올영 패키지 캠페인:')
  data.forEach(campaign => {
    console.log(`\n- ID: ${campaign.id}`)
    console.log(`  제목: ${campaign.title}`)
    console.log(`  타입: ${campaign.campaign_type}`)
    console.log(`  AI 가이드: ${campaign.ai_generated_guide ? '있음' : '없음'}`)
  })
}
