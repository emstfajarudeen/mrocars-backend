import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { cn } from '~/lib/utils'

export type SearchInputProps = {
  onSearch: (value: string) => void
  placeholder?: string
  defaultValue?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  onSearch,
  placeholder = 'Search…',
  defaultValue = '',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue)
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearchRef.current(value)
    }, debounceMs)

    return () => window.clearTimeout(timer)
  }, [value, debounceMs])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value)
  }

  function handleClear() {
    setValue('')
    onSearchRef.current('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-border bg-bg-secondary py-2 pl-9 pr-9 text-sm text-text-primary',
          'placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
