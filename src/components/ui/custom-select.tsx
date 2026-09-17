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
  creatable?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  required,
  creatable = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // If creatable, allow the value itself to be displayed even if not in options
  const selectedOption = options.find((o) => o.value === value) || (creatable && value ? { label: value, value: value } : undefined)

  // Reset search when opening
  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

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
        <span className={selectedOption || value ? 'text-foreground' : 'text-muted'}>
          {selectedOption ? selectedOption.label : (value || placeholder)}
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
          <div className="absolute left-0 top-full z-[70] mt-1 max-h-60 w-full overflow-y-auto rounded-[var(--radius-card)] border border-warm-200 bg-surface py-1 shadow-xl animate-in fade-in slide-in-from-top-2 flex flex-col">
            
            {creatable && (
              <div className="p-2 border-b border-warm-100">
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar ou criar novo..."
                  className="w-full rounded-md border border-warm-200 bg-warm-50 px-3 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {(() => {
                const filtered = creatable && search 
                  ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
                  : options;
                
                const exactMatch = filtered.some(o => o.label.toLowerCase() === search.toLowerCase());

                return (
                  <>
                    {filtered.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value)
                          setIsOpen(false)
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-warm-50 active:bg-warm-100"
                      >
                        <span className={cn(value === option.value ? 'font-bold text-primary-600' : 'text-foreground')}>
                          {option.label}
                        </span>
                        {value === option.value && <Check className="h-4 w-4 text-primary-600" />}
                      </button>
                    ))}

                    {creatable && search && !exactMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange(search.trim())
                          setIsOpen(false)
                        }}
                        className="flex w-full items-center px-3 py-2.5 text-left text-sm text-primary-600 font-medium transition-colors hover:bg-warm-50 active:bg-warm-100"
                      >
                        + Criar "{search}"
                      </button>
                    )}
                    
                    {filtered.length === 0 && (!creatable || !search) && (
                      <div className="px-3 py-3 text-center text-sm text-muted">
                        Sem opções
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
