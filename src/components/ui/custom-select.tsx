import { useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Option {
  label: string
  value: string
}

interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  required
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((o) => o.value === value)

  // Allow closing when pressing Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative">
      {/* Hidden native input just to trigger native HTML5 validation (required) if needed */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute inset-0 -z-10 h-full w-full opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-[var(--radius-button)] border bg-surface px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1",
          isOpen ? "border-primary-400 ring-1 ring-primary-400" : "border-warm-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-secondary-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop to catch clicks outside */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />

          {/* Dropdown menu */}
          <div className="absolute left-0 top-full z-[70] mt-1 max-h-60 w-full overflow-y-auto rounded-[var(--radius-card)] border border-warm-200 bg-surface py-1 shadow-xl animate-in fade-in slide-in-from-top-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-warm-50 active:bg-warm-100"
              >
                <span
                  className={cn(
                    value === option.value ? 'font-bold text-primary-600' : 'text-foreground'
                  )}
                >
                  {option.label}
                </span>
                {value === option.value && <Check className="h-4 w-4 text-primary-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
