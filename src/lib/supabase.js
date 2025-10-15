import { createClient } from '@supabase/supabase-js';

// 환경 변수 또는 기본값 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xywmnutnpaxamrijqlci.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d211bnRucGF4YW1yaWpxbGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0MzI0NTcsImV4cCI6MjAxMzAwODQ1N30.JzdXpRvlwKLQlmijMB3ErKUVkpJ-bhK_xfJn9GQ5m7o';

// 환경 변수가 없을 경우 콘솔에 경고 메시지 출력
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 기본값을 사용합니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
