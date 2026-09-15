const fs = require('fs');

let content = fs.readFileSync('src/features/contacts/components/contact-form.tsx', 'utf8');

const imports = `import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
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
`;
content = content.replace("import { UnsavedDialog } from '@/components/ui/unsaved-dialog'", imports);

const formRegex = /(<form[^>]*>)[\s\S]*?(<div className="my-2 border-t border-warm-200" \/>\s*<div className="flex flex-col gap-1\.5">\s*<label className="text-sm font-medium text-secondary-700">Notas \/ Observações<\/label>)/;

const newFormFields = `$1
          
          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val as ContactCategory)}
              options={Object.values(CONTACT_CATEGORIES).map((cat) => ({
                label: CONTACT_CATEGORY_LABELS[cat],
                value: cat,
              }))}
              required
            />
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
          {(category === 'pai' || category === 'professor') && (
            <>
              <div className="my-2 border-t border-warm-200" />
              
              <div className="flex flex-col gap-1.5 z-[50]">
                <label className="text-sm font-medium text-secondary-700">Turma(s)</label>
                <CustomSelect
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
            <div className="flex flex-col gap-1.5 z-[40]">
              <label className="text-sm font-medium text-secondary-700">Disciplina(s)</label>
              <CustomSelect
                value={disciplina}
                onChange={(val) => setDisciplina(val)}
                options={DISCIPLINA_OPTIONS}
                placeholder="Selecione a disciplina..."
              />
            </div>
          )}

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Notas / Observações</label>`;

content = content.replace(formRegex, newFormFields);
fs.writeFileSync('src/features/contacts/components/contact-form.tsx', content);
