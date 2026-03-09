const { createClient } = require('@supabase/supabase-js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
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

    const body = JSON.parse(event.body || '{}')
    const {
      creator_name,
      creator_phone,
      creator_email,
      youtube_url,
      instagram_url,
      preferred_slots
    } = body

    // 필수 필드 검증
    if (!creator_name || !creator_phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '이름과 연락처는 필수입니다.' })
      }
    }

    if (!preferred_slots || preferred_slots.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: '최소 1개의 미팅 희망일을 선택해주세요.' })
      }
    }

    // 연락처 정규화 (하이픈 제거 후 비교)
    const normalizedPhone = creator_phone.replace(/-/g, '')

    // 1. 이미 pending 상태 예약 확인
    const { data: existingBookings, error: checkError } = await supabase
      .from('meeting_bookings')
      .select('id')
      .eq('status', 'pending')
      .or(`creator_phone.eq.${creator_phone},creator_phone.eq.${normalizedPhone}`)
      .limit(1)

    if (checkError) throw checkError

    if (existingBookings && existingBookings.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: '이미 대기 중인 신청이 있습니다. 담당자 확인 후 연락드리겠습니다.'
        })
      }
    }

    // 2. 각 slot_id가 유효한지 확인 (auto_ 접두사가 아닌 실제 슬롯만)
    const realSlotIds = preferred_slots
      .filter(s => s.slot_id && !String(s.slot_id).startsWith('auto_'))
      .map(s => s.slot_id)

    if (realSlotIds.length > 0) {
      const { data: validSlots, error: slotCheckError } = await supabase
        .from('meeting_slots')
        .select('id, slot_date, slot_time, current_bookings, max_bookings, is_blocked')
        .in('id', realSlotIds)

      if (slotCheckError) throw slotCheckError

      for (const slot of validSlots || []) {
        if (slot.is_blocked) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: `${slot.slot_date} ${slot.slot_time} 슬롯은 더 이상 예약할 수 없습니다.`
            })
          }
        }
        if (slot.current_bookings >= slot.max_bookings) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: `${slot.slot_date} ${slot.slot_time} 슬롯은 이미 마감되었습니다.`
            })
          }
        }
      }
    }

    // 3. 자동 생성 슬롯이 있으면 DB에 실제 슬롯으로 생성
    const autoSlots = preferred_slots.filter(s => String(s.slot_id).startsWith('auto_'))
    const slotIdMap = {} // auto_id -> real_id mapping

    for (const autoSlot of autoSlots) {
      const { data: newSlot, error: createError } = await supabase
        .from('meeting_slots')
        .insert({
          slot_date: autoSlot.date,
          slot_time: autoSlot.time,
          duration_minutes: 30,
          max_bookings: 1,
          current_bookings: 0,
          is_blocked: false
        })
        .select('id')
        .single()

      if (createError) {
        // 이미 존재할 수 있음 - 기존 슬롯 조회
        const { data: existingSlot } = await supabase
          .from('meeting_slots')
          .select('id, current_bookings, max_bookings')
          .eq('slot_date', autoSlot.date)
          .eq('slot_time', autoSlot.time)
          .single()

        if (existingSlot) {
          if (existingSlot.current_bookings >= existingSlot.max_bookings) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: `${autoSlot.date} ${autoSlot.time} 슬롯은 이미 마감되었습니다.`
              })
            }
          }
          slotIdMap[autoSlot.slot_id] = existingSlot.id
        }
      } else {
        slotIdMap[autoSlot.slot_id] = newSlot.id
      }
    }

    // preferred_slots에서 slot_id를 실제 ID로 교체
    const resolvedSlots = preferred_slots.map(s => {
      const resolvedId = String(s.slot_id).startsWith('auto_')
        ? (slotIdMap[s.slot_id] || s.slot_id)
        : s.slot_id
      return {
        slot_id: resolvedId,
        date: s.date,
        time: s.time
      }
    })

    // 1순위 slot_id
    const primarySlotId = resolvedSlots[0]?.slot_id
    const isValidUUID = primarySlotId && !String(primarySlotId).startsWith('auto_')

    // 4. meeting_bookings에 INSERT
    const bookingData = {
      creator_name,
      creator_phone: creator_phone,
      creator_email: creator_email || null,
      youtube_url: youtube_url || null,
      instagram_url: instagram_url || null,
      slot_id: isValidUUID ? primarySlotId : null,
      preferred_slots: resolvedSlots,
      status: 'pending',
      source: 'kakao_alimtalk'
    }

    const { data: booking, error: insertError } = await supabase
      .from('meeting_bookings')
      .insert(bookingData)
      .select('id')
      .single()

    if (insertError) throw insertError

    // 5. 1순위 슬롯의 current_bookings 증가
    if (isValidUUID) {
      await supabase.rpc('increment_booking_count', { slot_uuid: primarySlotId }).catch(() => {
        // RPC가 없으면 직접 업데이트
        return supabase
          .from('meeting_slots')
          .update({ current_bookings: supabase.rpc ? undefined : 1 })
          .eq('id', primarySlotId)
      })

      // fallback: 직접 SQL로 증가
      const { data: currentSlot } = await supabase
        .from('meeting_slots')
        .select('current_bookings')
        .eq('id', primarySlotId)
        .single()

      if (currentSlot) {
        await supabase
          .from('meeting_slots')
          .update({ current_bookings: (currentSlot.current_bookings || 0) + 1 })
          .eq('id', primarySlotId)
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        booking_id: booking.id
      })
    }

  } catch (error) {
    console.error('submit-meeting-booking error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
    }
  }
}
