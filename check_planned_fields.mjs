import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vluqhvuhykncicgvkosd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXFodnVoeWtuY2ljZ3Zrb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg2MzAsImV4cCI6MjA3Njg0NDYzMH0.ikEqdx6Le54YJUP-NROKg6EmeHJ4TbKkQ76pw29OQG8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 기획형 캠페인 조회
const { data, error } = await supabase
  .from('campaigns')
  .select('id, title, campaign_type, start_date, end_date, application_deadline')
  .eq('campaign_type', 'planned')
  .limit(1)

if (error) {
  console.error('Error:', JSON.stringify(error, null, 2))
} else {
  console.log('기획형 캠페인 필드:')
  console.log(JSON.stringify(data[0], null, 2))
}
