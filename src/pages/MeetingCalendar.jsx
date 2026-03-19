import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const MeetingCalendar = ({ slots = [], selectedSlots = [], onSelectSlot, onRemoveSlot, maxSelections = 3 }) => {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)

  // 날짜별 슬롯 그룹화
  const slotsByDate = useMemo(() => {
    const map = {}
    for (const slot of slots) {
      if (!map[slot.date]) map[slot.date] = []
      map[slot.date].push(slot)
    }
    // 시간순 정렬
    for (const date in map) {
      map[date].sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [slots])

  // 캘린더 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    // 이전 달 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // 이번 달 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        date: dateStr,
        hasSlots: !!slotsByDate[dateStr],
        isToday: dateStr === formatDate(today),
        isPast: new Date(dateStr) < new Date(formatDate(today))
      })
    }
    return days
  }, [currentMonth, slotsByDate])

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const handleDateClick = (dateInfo) => {
    if (!dateInfo || !dateInfo.hasSlots || dateInfo.isPast) return
    setSelectedDate(dateInfo.date)
  }

  const handleTimeClick = (slot) => {
    // 이미 선택된 슬롯인지 확인
    const alreadySelected = selectedSlots.find(s => s.id === slot.id)
    if (alreadySelected) return

    if (selectedSlots.length >= maxSelections) return

    onSelectSlot(slot)
  }

  const isSlotSelected = (slotId) => {
    return selectedSlots.some(s => s.id === slotId)
  }

  const getPriorityLabel = (index) => {
    const labels = ['1순위', '2순위', '3순위']
    return labels[index] || `${index + 1}순위`
  }

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekday = WEEKDAYS[d.getDay()]
    return `${month}/${day}(${weekday})`
  }

  return (
    <div className="space-y-4">
      {/* 캘린더 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-base font-bold text-gray-900">
            {currentMonth.getFullYear()}년 {MONTHS[currentMonth.getMonth()]}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {calendarDays.map((dateInfo, i) => {
            if (!dateInfo) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }

            const isActive = dateInfo.hasSlots && !dateInfo.isPast
            const isSelected = selectedDate === dateInfo.date
            const hasSelectedSlot = selectedSlots.some(s => s.date === dateInfo.date)
            const dayOfWeek = new Date(dateInfo.date + 'T00:00:00').getDay()

            return (
              <button
                key={dateInfo.date}
                type="button"
                onClick={() => handleDateClick(dateInfo)}
                disabled={!isActive}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all ${
                  isSelected
                    ? 'bg-[#6C5CE7] text-white font-bold shadow-md'
                    : hasSelectedSlot
                      ? 'bg-[#F0EDFF] text-[#6C5CE7] font-semibold'
                      : isActive
                        ? 'hover:bg-[#F8F7FF] text-gray-900 cursor-pointer font-medium'
                        : 'text-gray-300 cursor-not-allowed'
                } ${dateInfo.isToday && !isSelected ? 'ring-2 ring-[#B4ADFF]' : ''}`}
              >
                <span className={dayOfWeek === 0 && !isSelected ? 'text-red-400' : dayOfWeek === 6 && !isSelected ? 'text-blue-400' : ''}>
                  {dateInfo.day}
                </span>
                {isActive && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-[#6C5CE7] rounded-full mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택한 날짜의 시간대 */}
      {selectedDate && slotsByDate[selectedDate] && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#6C5CE7]" />
            <h4 className="text-sm font-bold text-gray-900">
              {formatDisplayDate(selectedDate)} 가능 시간
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slotsByDate[selectedDate].map(slot => {
              const selected = isSlotSelected(slot.id)
              const disabled = !selected && selectedSlots.length >= maxSelections

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleTimeClick(slot)}
                  disabled={disabled || selected}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    selected
                      ? 'bg-[#6C5CE7] text-white cursor-default'
                      : disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#F8F7FF] text-[#6C5CE7] hover:bg-[#F0EDFF] active:bg-[#E4E0FF]'
                  }`}
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
          {selectedSlots.length >= maxSelections && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              최대 {maxSelections}개까지 선택 가능합니다
            </p>
          )}
        </div>
      )}

      {/* 선택된 슬롯 목록 */}
      {selectedSlots.length > 0 && (
        <div className="bg-[#F8F7FF] rounded-2xl p-4">
          <h4 className="text-sm font-bold text-[#1A1A2E] mb-3">선택한 희망일</h4>
          <div className="space-y-2">
            {selectedSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    index === 0
                      ? 'bg-[#6C5CE7] text-white'
                      : index === 1
                        ? 'bg-[#E4E0FF] text-[#6C5CE7]'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getPriorityLabel(index)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDisplayDate(slot.date)} {slot.time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSlot(slot.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default MeetingCalendar
