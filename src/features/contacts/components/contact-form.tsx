import { useState } from 'react'
import { X } from 'lucide-react'
import type { Contact, ContactCategory } from '@/types/database'
import { CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS } from '@/lib/constants'

interface ContactFormProps {
  contact?: Contact
  onClose: () => void
  onSubmit: (data: Partial<Contact>) => void
  isLoading?: boolean
}

export function ContactForm({ contact, onClose, onSubmit, isLoading }: ContactFormProps) {
  const [name, setName] = useState(contact?.name ?? '')
  const [category, setCategory] = useState<ContactCategory>(contact?.category ?? 'pai')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(contact?.whatsapp ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')

  // Metadata
  const initialMetadata = (contact?.metadata as Record<string, string>) ?? {}
  const [educando, setEducando] = useState(initialMetadata.educando ?? '')
  const [turma, setTurma] = useState(initialMetadata.turma ?? '')
  const [disciplina, setDisciplina] = useState(initialMetadata.disciplina ?? '')

  // Auto-fill WhatsApp with phone number if it's empty when phone is typed
  const handlePhoneChange = (val: string) => {
    setPhone(val)
    if (!whatsapp) setWhatsapp(val)
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
      metadata,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {contact ? 'Editar Contacto' : 'Novo Contacto'}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form id="contact-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContactCategory)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              required
            >
              {Object.values(CONTACT_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{CONTACT_CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Nome <span className="text-primary-500">*</span></label>
            <input
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
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: 912345678"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="email@exemplo.pt"
            />
          </div>

          {/* Dynamic Metadata Fields */}
          <div className="my-2 border-t border-warm-200" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Turma(s)</label>
            <input
              type="text"
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: 5ºA, 7ºB"
            />
          </div>

          {category === 'pai' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Nome do Educando</label>
              <input
                type="text"
                value={educando}
                onChange={(e) => setEducando(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Nome do aluno"
              />
            </div>
          )}

          {category === 'professor' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Disciplina(s)</label>
              <input
                type="text"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: Matemática, Ciências"
              />
            </div>
          )}

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Notas / Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Informação adicional relevante..."
            />
          </div>
        
<div className="border-t border-warm-200 bg-surface p-4">
        <button
          type="submit"
          form="contact-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Contacto'}
        </button>
      </div>
</form>
      </div>

      {/* Footer / Submit Button */}
      
    </div>
  )
}
