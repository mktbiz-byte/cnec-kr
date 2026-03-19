const { createClient } = require('@supabase/supabase-js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    }
  }

  try {
    const supabaseUrl = process.env.SUPABASE_BIZ_URL
      || process.env.VITE_SUPABASE_BIZ_URL
      || 'https://hbymozdhjseqebpomjsp.supabase.co'
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY
      || process.env.SUPABASE_BIZ_ANON_KEY
      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhieW1vemRoanNlcWVicG9tanNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NzA5NTgsImV4cCI6MjA3NjI0Njk1OH0.7th9Tz7oyHKqp03M68k1G0WqLwCSYTnoY9ECgy3pSzE'

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: reviews, error } = await supabase
      .from('creator_program_reviews')
      .select('display_name, review_text')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, reviews: reviews || [] })
    }

  } catch (error) {
    console.error('get-program-reviews error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    }
  }
}
