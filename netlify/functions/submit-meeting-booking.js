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
    const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('submit-meeting-booking: Missing env vars', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Server configuration error: missing SUPABASE_BIZ_URL or SUPABASE_BIZ_SERVICE_KEY' })
      }
    }

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
          error: '이미 상담 신청을 해주셨어요! 담당자가 곧 연락드릴게요 :)'
        })
      }
    }

    // 2. 각 slot_id가 유효한지 확인
    const slotIds = preferred_slots.map(s => s.slot_id)

    const { data: validSlots, error: slotCheckError } = await supabase
      .from('meeting_slots')
      .select('id, slot_date, slot_time, current_bookings, max_bookings, is_blocked')
      .in('id', slotIds)

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

    // 3. meeting_bookings에 INSERT
    const primarySlotId = preferred_slots[0]?.slot_id

    const bookingData = {
      creator_name,
      creator_phone,
      creator_email: creator_email || null,
      youtube_url: youtube_url || null,
      instagram_url: instagram_url || null,
      slot_id: primarySlotId || null,
      preferred_slots: preferred_slots,
      status: 'pending',
      source: 'kakao_alimtalk'
    }

    const { data: booking, error: insertError } = await supabase
      .from('meeting_bookings')
      .insert(bookingData)
      .select('id')
      .single()

    if (insertError) throw insertError

    // 4. 1순위 슬롯의 current_bookings 증가
    if (primarySlotId) {
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
