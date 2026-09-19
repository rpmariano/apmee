import { useState, useRef, useMemo } from 'react'
import { X, Trash2, CheckCircle2, Landmark, Coins, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Contact, ContactCategory } from '@/types/database'
import { CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useQuotas } from '@/features/quotas/api/use-quotas'
import { formatSchoolYear } from '@/lib/school-year'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { CustomSelect } from '@/components/ui/custom-select'

const TURMA_OPTIONS = [
  { label: 'JI', value: 'JI' },
  { label: '1º ano', value: '1º ano' },
  { label: '2º ano', value: '2º ano' },
  { label: '3º ano', value: '3º ano' },
  { label: '4º ano', value: '4º ano' },
]

const DISCIPLINA_OPTIONS = [
  { label: 'Inglês', value: 'Inglês' },
  { label: 'Expressão Plástica', value: 'Expressão Plástica' },
  { label: 'Educação Física', value: 'Educação Física' },
  { label: 'Secundária', value: 'Secundária' },
  { label: 'Principal', value: 'Principal' },
  { label: 'Diretor(a)', value: 'Diretor(a)' },
]


interface ContactFormProps {
  contact?: Contact
  initialCategory?: ContactCategory
  onClose: () => void
  onSubmit: (data: Partial<Contact>) => void
  onDelete?: (id: string) => Promise<void>
  isLoading?: boolean
}

export function ContactForm({ contact, initialCategory, onClose, onSubmit, onDelete, isLoading }: ContactFormProps) {
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isEditing = true
  const formRef = useRef<HTMLFormElement>(null)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)


  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const [name, setName] = useState(contact?.name ?? '')
  const [category, setCategory] = useState<ContactCategory>(contact?.category ?? initialCategory ?? 'pai')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(contact?.whatsapp ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [isMember, setIsMember] = useState(contact?.is_member ?? false)

  const initialIsActive = contact?.is_active !== undefined
    ? contact.is_active
    : (contact?.metadata as any)?.is_active !== undefined
    ? (contact?.metadata as any)?.is_active
    : true
  const [isActive, setIsActive] = useState<boolean>(initialIsActive)

  const { data: allQuotas = [] } = useQuotas()

  const contactPaidQuotas = useMemo(() => {
    if (!contact?.id) return []
    return allQuotas
      .filter((q) => q.contact_id === contact.id && q.paid)
      .sort((a, b) => b.year - a.year)
  }, [contact?.id, allQuotas])

  // Metadata
  const initialMetadata = (contact?.metadata as Record<string, any>) ?? {}
  const [educando, setEducando] = useState(initialMetadata.educando ?? '')
  const [disciplina, setDisciplina] = useState(initialMetadata.disciplina ?? '')

  const parsedInitialTurmas = useMemo(() => {
    const raw = initialMetadata.turmas ?? initialMetadata.turma
    if (Array.isArray(raw)) return raw.map(String)
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    return []
  }, [initialMetadata])

  const [selectedTurmas, setSelectedTurmas] = useState<string[]>(parsedInitialTurmas)

  const allTurmaOptions = useMemo(() => {
    const existingSet = new Set(TURMA_OPTIONS.map((o) => o.value))
    const customOptions = parsedInitialTurmas
      .filter((t: string) => !existingSet.has(t))
      .map((t: string) => ({ label: t, value: t }))
    return [...TURMA_OPTIONS, ...customOptions]
  }, [parsedInitialTurmas])

  const toggleTurma = (t: string) => {
    if (!isEditing) return
    setSelectedTurmas((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    )
  }

  const isTurmasDirty = useMemo(() => {
    const a = [...selectedTurmas].sort().join(',')
    const b = [...parsedInitialTurmas].sort().join(',')
    return a !== b
  }, [selectedTurmas, parsedInitialTurmas])

  const isDirty = (
    name !== (contact?.name ?? '') ||
    category !== (contact?.category ?? initialCategory ?? 'pai') ||
    email !== (contact?.email ?? '') ||
    phone !== (contact?.phone ?? '') ||
    whatsapp !== (contact?.whatsapp ?? '') ||
    notes !== (contact?.notes ?? '') ||
    isMember !== (contact?.is_member ?? false) ||
    isActive !== initialIsActive ||
    educando !== (initialMetadata.educando ?? '') ||
    disciplina !== (initialMetadata.disciplina ?? '') ||
    isTurmasDirty
  )

  const handlePhoneChange = (val: string) => {
    if (whatsapp === phone || !whatsapp) {
      setWhatsapp(val)
    }
    setPhone(val)
  }

  const handleWhatsappChange = (val: string) => {
    if (phone === whatsapp || !phone) {
      setPhone(val)
    }
    setWhatsapp(val)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const metadata: Record<string, any> = {}
    if (selectedTurmas.length > 0) {
      metadata.turma = selectedTurmas.join(', ')
      metadata.turmas = selectedTurmas
    }
    if (category === 'pai' && educando.trim()) {
      metadata.educando = educando.trim()
    }
    if (category === 'professor' && disciplina) {
      metadata.disciplina = disciplina
    }

    onSubmit({
      name,
      category,
      email: email || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      notes: notes || null,
      is_member: isMember,
      is_active: isActive,
      metadata: {
        ...metadata,
        is_active: isActive,
      },
    })
  }

  const handleConfirmDelete = async () => {
    if (!contact?.id || !onDelete) return
    try {
      setIsDeleting(true)
      await onDelete(contact.id)
      setShowDeleteConfirm(false)
    } catch (err: any) {
      console.error('Failed to delete contact:', err)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {contact ? 'Editar Contacto' : 'Novo Contacto'}
        </h2>
        <div className="flex items-center gap-1">
          {contact && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Eliminar contacto"
              title="Eliminar contacto"
              className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleCloseClick} aria-label="Fechar formulário" className="rounded-full p-2 text-muted hover:bg-warm-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}  id="contact-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Status & Member Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-3 shadow-sm">
              <input disabled={!isEditing} 
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="is_active" className="flex flex-col cursor-pointer select-none">
                <span className="text-sm font-bold text-foreground">Contacto Ativo</span>
                <span className="text-xs text-muted">
                  {isActive ? 'Ativo no sistema' : 'Inativo / Arquivado'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-3 shadow-sm">
              <input disabled={!isEditing} 
                type="checkbox"
                id="is_member"
                checked={isMember}
                onChange={(e) => setIsMember(e.target.checked)}
                className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="is_member" className="flex flex-col cursor-pointer select-none">
                <span className="text-sm font-bold text-foreground">É Associado?</span>
                <span className="text-xs text-muted">Elegível para quotas</span>
              </label>
            </div>
          </div>


          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect disabled={!isEditing} 
              value={category}
              onChange={(val) => setCategory(val as ContactCategory)}
              options={Object.values(CONTACT_CATEGORIES).filter(cat => cat !== 'associado').map((cat) => ({
                label: CONTACT_CATEGORY_LABELS[cat],
                value: cat,
              }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-name" className="text-sm font-medium text-secondary-700">Nome <span className="text-primary-500">*</span></label>
            <input id="contact-name" disabled={!isEditing} 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-phone" className="text-sm font-medium text-secondary-700">Telemóvel</label>
              <input id="contact-phone" disabled={!isEditing} 
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-whatsapp" className="text-sm font-medium text-secondary-700">WhatsApp</label>
              <input id="contact-whatsapp" disabled={!isEditing} 
                type="tel"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-sm font-medium text-secondary-700">Email</label>
            <input id="contact-email" disabled={!isEditing} 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="email@exemplo.pt"
            />
          </div>

          {/* Dynamic Metadata Fields */}
          {(category === 'pai' || category === 'professor') && (
            <>
              <div className="my-2 border-t border-warm-200" />
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-secondary-700">Turma(s)</label>
                  <span className="text-xs text-muted">
                    {category === 'pai' ? 'Pode escolher mais que uma turma' : 'Selecione as turmas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allTurmaOptions.map((option) => {
                    const isChecked = selectedTurmas.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg border p-2.5 text-xs font-semibold cursor-pointer transition-all select-none',
                          isChecked
                            ? 'border-primary-400 bg-primary-50 text-primary-900 shadow-xs ring-1 ring-primary-300'
                            : 'border-warm-200 bg-surface text-secondary-700 hover:bg-warm-50',
                          !isEditing && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={!isEditing}
                          checked={isChecked}
                          onChange={() => toggleTurma(option.value)}
                          className="h-4 w-4 rounded border-warm-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                        />
                        <span>{option.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {category === 'pai' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-educando" className="text-sm font-medium text-secondary-700">Nome do(s) Educando(s)</label>
              <input id="contact-educando" disabled={!isEditing} 
                type="text"
                value={educando}
                onChange={(e) => setEducando(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: Pedro Silva, Ana Silva"
              />
            </div>
          )}

          {category === 'professor' && (
            <div className="flex flex-col gap-1.5 z-[40]">
              <label className="text-sm font-medium text-secondary-700">Disciplina(s)</label>
              <CustomSelect disabled={!isEditing} 
                value={disciplina}
                onChange={(val) => setDisciplina(val)}
                options={DISCIPLINA_OPTIONS}
                placeholder="Selecione a disciplina..."
              />
            </div>
          )}

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-notes" className="text-sm font-medium text-secondary-700">Notas / Observações</label>
            <textarea id="contact-notes" disabled={!isEditing} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Informação adicional relevante..."
            />
          </div>

          {/* Paid Quotas Listing (if contact has paid quotas) */}
          {contact?.id && contactPaidQuotas.length > 0 && (
            <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-green-200 bg-green-50/40 p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Quotas Pagas</span>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                  {contactPaidQuotas.length} {contactPaidQuotas.length === 1 ? 'ano' : 'anos'}
                </span>
              </div>

              <div className="mt-1 flex flex-col gap-1.5">
                {contactPaidQuotas.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-lg border border-green-100 bg-surface p-2.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs font-bold text-secondary-800">
                        {formatSchoolYear(q.year)}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {Number(q.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                      </span>
                      {q.account && (
                        <span className="inline-flex items-center gap-1 rounded bg-warm-100 px-1.5 py-0.5 text-xs font-medium text-secondary-700">
                          {q.account === 'caixa' ? (
                            <>
                              <Coins className="h-3 w-3 text-amber-600" />
                              Caixa
                            </>
                          ) : (
                            <>
                              <Landmark className="h-3 w-3 text-sky-600" />
                              Banco
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {q.paid_date && (
                        <span className="text-muted">
                          {format(parseISO(q.paid_date), "d MMM yyyy", { locale: pt })}
                        </span>
                      )}
                      {q.receipt_url && (
                        <a
                          href={q.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-primary-500 hover:text-primary-600"
                          title="Ver Recibo"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs underline">Recibo</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contact?.id && (contact.is_member || contact.category === 'associado') && contactPaidQuotas.length === 0 && (
            <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-warm-50/60 p-3 text-xs text-muted">
              <CheckCircle2 className="h-4 w-4 text-warm-400 shrink-0" />
              <span>Nenhuma quota paga registada para este associado.</span>
            </div>
          )}
        
        <div className="border-t border-warm-200 bg-surface p-4 flex flex-col gap-2.5">
          {contact && onDelete && (
            <button
              type="button"
              disabled={isLoading || isDeleting}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:border-red-300 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Eliminar Contacto</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || isDeleting}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'A Guardar...' : (contact ? 'Guardar Contacto' : 'Criar Contacto')}
          </button>
        </div>
      </form>
      </div>

      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Contacto?"
        description="Tem a certeza de que pretende eliminar este contacto? Esta ação pode ser revertida por um administrador."
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  </div>
  )
}
