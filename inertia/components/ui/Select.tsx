import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '~/lib/utils'

// Radix Select does not allow value="" on items (empty string is reserved for
// the "no selection / show placeholder" state on the Root). We use this
// sentinel internally and convert back on the way out.
const EMPTY_SENTINEL = '__EMPTY__'

export type SelectOption = {
  value: string
  label: string
}

export type SelectProps = {
  label?: string
  error?: string
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function Select({
  label,
  error,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
  id,
  disabled,
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  // Convert external "" → sentinel for Radix, and back on change
  const toRadix = (v: string | undefined) => (v === '' || v === undefined ? '' : v)
  const toInternal = (opt: SelectOption) => (opt.value === '' ? EMPTY_SENTINEL : opt.value)
  const fromRadix = (v: string) => (v === EMPTY_SENTINEL ? '' : v)

  // The Root value: if external is "", pass "" so Radix shows placeholder
  const rootValue = value === '' || value === undefined ? '' : value

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <RadixSelect.Root
        value={rootValue}
        onValueChange={(v) => onChange?.(fromRadix(v))}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary transition-colors',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-text-muted',
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border'
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'relative z-[100] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
              'rounded-lg border border-border bg-bg-card shadow-xl',
              'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => {
                const itemValue = toInternal(opt)
                return (
                  <RadixSelect.Item
                    key={itemValue}
                    value={itemValue}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-text-primary outline-none',
                      'focus:bg-accent/10 focus:text-accent',
                      'data-[state=checked]:text-accent data-[state=checked]:font-medium',
                      'transition-colors duration-100'
                    )}
                  >
                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="absolute right-2">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                )
              })}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
