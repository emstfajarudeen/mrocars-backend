import { CalendarIcon } from 'lucide-react'
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
  id,
  min,
  max,
  disabled,
}: DatePickerProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          id={inputId}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-lg border bg-bg-secondary pl-9 pr-3 py-2 text-sm text-text-primary transition-colors',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer',
            !value && 'text-text-muted',
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border'
          )}
        />
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
