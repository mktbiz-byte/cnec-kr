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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. meeting_settings에서 설정 가져오기
    const { data: settingsRows, error: settingsError } = await supabase
      .from('meeting_settings')
      .select('setting_key, setting_value')

    if (settingsError) throw settingsError

    const settings = {}
    for (const row of settingsRows || []) {
      settings[row.setting_key] = row.setting_value
    }

    const minAdvanceHours = settings.min_advance_hours || 24
    const maxAdvanceDays = settings.max_advance_days || 30

    const now = new Date()
    const minDate = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000)

    const todayStr = now.toISOString().split('T')[0]
    const maxDateStr = maxDate.toISOString().split('T')[0]

    // DB에 등록된 meeting_slots만 조회 (관리자가 등록한 슬롯만 표시)
    const { data: slots, error: slotsError } = await supabase
      .from('meeting_slots')
      .select('id, slot_date, slot_time, max_bookings, current_bookings, is_blocked')
      .eq('is_blocked', false)
      .gte('slot_date', todayStr)
      .lte('slot_date', maxDateStr)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })

    if (slotsError) throw slotsError

    const filteredSlots = (slots || [])
      .filter(s => {
        // current_bookings < max_bookings
        if (s.current_bookings >= s.max_bookings) return false
        // min_advance_hours 체크
        const slotDateTime = new Date(`${s.slot_date}T${s.slot_time}+09:00`)
        return slotDateTime > minDate
      })
      .map(s => ({
        id: s.id,
        date: s.slot_date,
        time: s.slot_time.substring(0, 5)
      }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, slots: filteredSlots })
    }

  } catch (error) {
    console.error('get-available-slots error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    }
  }
}
