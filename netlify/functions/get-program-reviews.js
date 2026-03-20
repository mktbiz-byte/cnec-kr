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
    const supabaseUrl = process.env.VITE_SUPABASE_BIZ_URL
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('get-program-reviews: Missing env vars', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Server configuration error: missing BIZ DB credentials' })
      }
    }

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
