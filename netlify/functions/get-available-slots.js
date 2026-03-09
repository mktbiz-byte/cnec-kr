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

    if (!supabaseKey) {
      console.error('Missing SUPABASE_BIZ_SERVICE_KEY environment variable')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Server configuration error: missing service key' })
      }
    }

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
    const autoGenerateSlots = settings.auto_generate_slots || false
    const availableTimes = settings.available_times || ['10:00', '14:00', '16:00']
    const blockedWeekdays = settings.blocked_weekdays || [0, 6] // 일(0), 토(6)
    const slotDuration = settings.slot_duration || 30

    const now = new Date()
    const minDate = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000)
    const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000)

    const todayStr = now.toISOString().split('T')[0]
    const maxDateStr = maxDate.toISOString().split('T')[0]

    // 2. 자동 생성 모드이면 DB에 슬롯이 없어도 가상 슬롯을 생성
    if (autoGenerateSlots) {
      // DB에서 기존 슬롯 + 블록된 슬롯 조회
      const { data: existingSlots, error: slotsError } = await supabase
        .from('meeting_slots')
        .select('id, slot_date, slot_time, max_bookings, current_bookings, is_blocked')
        .gte('slot_date', todayStr)
        .lte('slot_date', maxDateStr)

      if (slotsError) throw slotsError

      // 기존 슬롯을 맵으로
      const existingMap = new Map()
      for (const s of existingSlots || []) {
        existingMap.set(`${s.slot_date}_${s.slot_time}`, s)
      }

      const slots = []
      const current = new Date(todayStr)
      current.setDate(current.getDate()) // start from today

      while (current <= maxDate) {
        const dateStr = current.toISOString().split('T')[0]
        const dayOfWeek = current.getDay()

        // 차단된 요일 건너뛰기
        if (!blockedWeekdays.includes(dayOfWeek)) {
          for (const time of availableTimes) {
            const key = `${dateStr}_${time}`

            // 해당 날짜+시간의 datetime이 min_advance 이후인지 확인
            const slotDateTime = new Date(`${dateStr}T${time}:00+09:00`) // KST
            if (slotDateTime <= minDate) continue

            const existing = existingMap.get(key)

            if (existing) {
              // DB에 있는 슬롯 - 조건 확인
              if (existing.is_blocked) continue
              if (existing.current_bookings >= existing.max_bookings) continue
              slots.push({
                id: existing.id,
                date: existing.slot_date,
                time: existing.slot_time.substring(0, 5) // HH:MM 형태
              })
            } else {
              // 자동 생성 가상 슬롯 (DB에 없음 - 가상 ID 부여)
              slots.push({
                id: `auto_${dateStr}_${time}`,
                date: dateStr,
                time: time
              })
            }
          }
        }

        current.setDate(current.getDate() + 1)
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, slots })
      }
    }

    // 3. 수동 모드 - DB의 meeting_slots만 조회
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
