import { useEffect, useRef, useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DateTime } from 'luxon'
import { cn } from '~/lib/utils'

export type DatePickerProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  error?: string
  id?: string
  min?: string
  max?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  label,
  error,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const parsed = DateTime.fromISO(value)
      if (parsed.isValid) return parsed.startOf('month')
    }
    return DateTime.now().startOf('month')
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync current month view when value changes from external components
  useEffect(() => {
    if (value) {
      const parsed = DateTime.fromISO(value)
      if (parsed.isValid) {
        setCurrentMonth(parsed.startOf('month'))
      }
    }
  }, [value])

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(currentMonth.minus({ months: 1 }))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(currentMonth.plus({ months: 1 }))
  }

  const handleDateSelect = (day: DateTime) => {
    const formatted = day.toISODate()
    if (formatted) {
      onChange?.(formatted)
    }
    setIsOpen(false)
  }

  // Generate days in month including leading empty spaces
  const getDaysInMonth = () => {
    const daysInMonth = currentMonth.daysInMonth ?? 30
    const startDayOfWeek = currentMonth.weekday // Luxon Mon=1, Sun=7

    // Offset calculation for Sunday start
    const startOffset = startDayOfWeek === 7 ? 0 : startDayOfWeek

    const days: (DateTime | null)[] = []

    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(currentMonth.set({ day }))
    }

    return days
  }

  const days = getDaysInMonth()

  return (
    <div className={cn('space-y-1.5 select-none relative', className)} ref={containerRef}>
      {label ? (
        <label className="block text-sm font-medium text-text-secondary">{label}</label>
      ) : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'h-9 w-full rounded-lg border bg-bg-secondary pl-9 pr-8 py-2 text-sm text-left flex items-center justify-between text-text-primary transition-colors cursor-pointer select-none',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            value ? 'text-text-primary font-medium' : 'text-text-muted',
            error
              ? 'border-danger focus:border-danger focus:ring-danger'
              : 'border-border hover:border-text-muted'
          )}
        >
          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <span className="truncate">
            {value ? DateTime.fromISO(value).toFormat('dd LLL yyyy') : placeholder}
          </span>
        </button>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange?.('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary z-10 p-0.5 rounded-full hover:bg-bg-hover transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {isOpen && !disabled && (
          <div className="absolute left-0 mt-1.5 w-[280px] rounded-xl border border-border bg-bg-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg border border-border hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-text-primary">
                {currentMonth.toFormat('LLLL yyyy')}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg border border-border hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold uppercase tracking-wider text-text-muted py-0.5"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="w-8 h-8" />
                }

                const isSelected = value === day.toISODate()
                const isToday = DateTime.now().toISODate() === day.toISODate()

                return (
                  <button
                    key={day.toISODate()}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150',
                      isSelected
                        ? 'bg-accent text-white hover:bg-accent-hover font-bold shadow-md shadow-accent/20'
                        : isToday
                          ? 'border border-accent/40 text-accent bg-accent/5 hover:bg-bg-hover font-bold'
                          : 'text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    {day.day}
                  </button>
                )
              })}
            </div>

            {/* Calendar Footer */}
            <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange?.('')
                  setIsOpen(false)
                }}
                className="text-text-muted hover:text-text-primary font-medium"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = DateTime.now().toISODate()!
                  onChange?.(today)
                  setIsOpen(false)
                }}
                className="text-accent hover:text-accent-hover font-bold"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
