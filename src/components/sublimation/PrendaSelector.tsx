'use client'
import { PRENDAS, type PrendaConfig } from '@/lib/prendas'

// ── Iconos SVG por prenda ────────────────────────────────────────────────────

function IconPoloPit({ active }: { active: boolean }) {
  const c = active ? '#2C2C2A' : '#9CA3AF'
  return (
    <svg viewBox="0 0 48 44" fill="none" width={36} height={33} aria-hidden>
      {/* cuerpo */}
      <path
        d="M4 18 L10 42 L38 42 L44 18 L36 10 L30 8 L18 8 L12 10 Z"
        stroke={c} strokeWidth="2.2" strokeLinejoin="round" fill={active ? '#F3F4F6' : 'none'}
      />
      {/* cuello tipo camisa — solapa izq y der */}
      <path d="M18 8 L24 17 L30 8" stroke={c} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
      {/* placket central */}
      <line x1="24" y1="17" x2="24" y2="30" stroke={c} strokeWidth="1.5" strokeDasharray="2 2" />
      {/* botones */}
      <circle cx="24" cy="20" r="1.2" fill={c} />
      <circle cx="24" cy="24" r="1.2" fill={c} />
      <circle cx="24" cy="28" r="1.2" fill={c} />
    </svg>
  )
}

function IconPolo({ active }: { active: boolean }) {
  const c = active ? '#2C2C2A' : '#9CA3AF'
  return (
    <svg viewBox="0 0 48 44" fill="none" width={36} height={33} aria-hidden>
      {/* cuerpo */}
      <path
        d="M4 18 L10 42 L38 42 L44 18 L36 10 L30 8 C28 13 20 13 18 8 L12 10 Z"
        stroke={c} strokeWidth="2.2" strokeLinejoin="round" fill={active ? '#F3F4F6' : 'none'}
      />
      {/* cuello redondo */}
      <path d="M18 8 C18 8 20 13 24 13 C28 13 30 8 30 8" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

const ICONS: Record<string, (props: { active: boolean }) => JSX.Element> = {
  polo_pit: IconPoloPit,
  polo:     IconPolo,
}

function DefaultIcon({ active }: { active: boolean }) {
  const c = active ? '#2C2C2A' : '#9CA3AF'
  return (
    <svg viewBox="0 0 48 44" fill="none" width={36} height={33} aria-hidden>
      <rect x="8" y="10" width="32" height="32" rx="3" stroke={c} strokeWidth="2.2" fill={active ? '#F3F4F6' : 'none'} />
    </svg>
  )
}

// ── Componente ───────────────────────────────────────────────────────────────

interface Props {
  selected:  PrendaConfig
  onChange:  (p: PrendaConfig) => void
}

export default function PrendaSelector({ selected, onChange }: Props) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Tipo de prenda
      </p>
      <div className="flex gap-2">
        {PRENDAS.map(prenda => {
          const active = prenda.key === selected.key
          const Icon   = ICONS[prenda.key] ?? DefaultIcon
          return (
            <button
              key={prenda.key}
              onClick={() => onChange(prenda)}
              title={prenda.label}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                active
                  ? 'border-[#2C2C2A] bg-white shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
            >
              <Icon active={active} />
              <span className={`text-[11px] font-medium leading-none ${active ? 'text-[#2C2C2A]' : 'text-gray-400'}`}>
                {prenda.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
