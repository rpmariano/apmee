import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { Contact, ContactCategory } from '@/types/database'
import { CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS } from '@/lib/constants'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
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
  onClose: () => void
  onSubmit: (data: Partial<Contact>) => void
  isLoading?: boolean
}

export function ContactForm({ contact, onClose, onSubmit, isLoading }: ContactFormProps) {

  
  const [showUnsaved, setShowUnsaved] = useState(false)
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
  const [category, setCategory] = useState<ContactCategory>(contact?.category ?? 'pai')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(contact?.whatsapp ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [isMember, setIsMember] = useState(contact?.is_member ?? false)
  const [isEditing, setIsEditing] = useState(!contact)

  const isDirty = (
    name !== (contact?.name ?? '') ||
    category !== (contact?.category ?? 'pai') ||
    email !== (contact?.email ?? '') ||
    phone !== (contact?.phone ?? '') ||
    whatsapp !== (contact?.whatsapp ?? '') ||
    notes !== (contact?.notes ?? '') ||
    isMember !== (contact?.is_member ?? false)
  )


  // Metadata
  const initialMetadata = (contact?.metadata as Record<string, string>) ?? {}
  const [educando, setEducando] = useState(initialMetadata.educando ?? '')
  const [turma, setTurma] = useState(initialMetadata.turma ?? '')
  const [disciplina, setDisciplina] = useState(initialMetadata.disciplina ?? '')
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

    const metadata: Record<string, string> = {}
    if (turma) metadata.turma = turma
    if (category === 'pai' && educando) metadata.educando = educando
    if (category === 'professor' && disciplina) metadata.disciplina = disciplina

    onSubmit({
      name,
      category,
      email: email || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      notes: notes || null,
      is_member: isMember,
      metadata,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {!isEditing ? 'Detalhes do Contacto' : (contact ? 'Editar Contacto' : 'Novo Contacto')}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}  id="contact-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-3 shadow-sm z-[100] mb-2">
            <input disabled={!isEditing} 
              type="checkbox"
              id="is_member"
              checked={isMember}
              onChange={(e) => setIsMember(e.target.checked)}
              className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="is_member" className="flex flex-col">
              <span className="text-sm font-bold text-foreground">É Associado?</span>
              <span className="text-xs text-muted">Elegível para pagamento de quotas</span>
            </label>
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
            <label className="text-sm font-medium text-secondary-700">Nome <span className="text-primary-500">*</span></label>
            <input disabled={!isEditing} 
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
              <label className="text-sm font-medium text-secondary-700">Telemóvel</label>
              <input disabled={!isEditing} 
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">WhatsApp</label>
              <input disabled={!isEditing} 
                type="tel"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Email</label>
            <input disabled={!isEditing} 
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
              
              <div className="flex flex-col gap-1.5 z-[50]">
                <label className="text-sm font-medium text-secondary-700">Turma(s)</label>
                <CustomSelect disabled={!isEditing} 
                  value={turma}
                  onChange={(val) => setTurma(val)}
                  options={TURMA_OPTIONS}
                  placeholder="Selecione a turma..."
                />
              </div>
            </>
          )}

          {category === 'pai' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Nome do Educando</label>
              <input disabled={!isEditing} 
                type="text"
                value={educando}
                onChange={(e) => setEducando(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Nome do aluno"
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
            <label className="text-sm font-medium text-secondary-700">Notas / Observações</label>
            <textarea disabled={!isEditing} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Informação adicional relevante..."
            />
          </div>
        
<div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            
        <button
          type="submit"
          form="contact-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Contacto'}
        </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Contacto
            </button>
          )}
        </div>
</form>
      </div>

      {/* Footer / Submit Button */}
      
    
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />
</div>
  )
}
