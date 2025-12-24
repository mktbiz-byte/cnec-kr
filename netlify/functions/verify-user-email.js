const { createClient } = require('@supabase/supabase-js')

// Supabase Admin Client (service role key required)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vluqhvuhykncicgvkosd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY // This must be set in Netlify environment variables
)

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const { userId, action } = JSON.parse(event.body)

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'userId is required' })
      }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Server configuration error' })
      }
    }

    if (action === 'verify_email') {
      // Update user to confirm email
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      })

      if (error) {
        console.error('Email verification error:', error)
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        }
      }

      console.log('Email verified for user:', userId)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email verified successfully',
          user: data.user
        })
      }
    }

    if (action === 'resend_verification') {
      // Get user email first
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

      if (userError || !userData.user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'User not found' })
        }
      }

      // Resend verification email
      const { error } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email: userData.user.email
      })

      if (error) {
        console.error('Resend verification error:', error)
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Verification email resent successfully'
        })
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid action' })
    }

  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
