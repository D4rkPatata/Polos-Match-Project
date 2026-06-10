'use client'
import { useRef } from 'react'
import { PIECES, type PieceKey } from '@/lib/pieces'

interface Props {
  activePiece:   PieceKey
  hasSelection:  boolean
  onPieceChange: (p: PieceKey) => void
  onAddImage:    (dataUrl: string) => void
  onAddText:     () => void
  onDelete:      () => void
  onClearPiece:  () => void
  onClearAll:    () => void
}

export default function EditorSidebar({
  activePiece, hasSelection,
  onPieceChange, onAddImage, onAddText, onDelete, onClearPiece, onClearAll,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      const url = evt.target?.result as string
      if (url) onAddImage(url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 w-52">

      {/* ── Pieza activa ── */}
      <section>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Pieza activa
        </p>
        <div className="flex flex-col gap-1">
          {PIECES.map(p => (
            <button
              key={p.key}
              onClick={() => onPieceChange(p.key)}
              className={`py-2 px-3 rounded-lg text-sm font-medium text-left transition-colors ${
                activePiece === p.key
                  ? 'bg-[#2C2C2A] text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Insertar ── */}
      <section>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Insertar en pieza activa
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 px-3 bg-[#2C2C2A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            + Imagen / Logo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={onAddText}
            className="w-full py-2 px-3 bg-[#2C2C2A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            + Texto
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">
          Arrastra · esquinas escalan · ícono azul rota · doble clic edita texto
        </p>
      </section>

      {/* ── Selección ── */}
      <section>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Selección
        </p>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors ${
            hasSelection
              ? 'border-red-300 text-red-500 hover:bg-red-50'
              : 'border-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          Eliminar seleccionado
        </button>
      </section>

      {/* ── Limpiar ── */}
      <section className="flex flex-col gap-2">
        <button
          onClick={onClearPiece}
          className="w-full py-2 rounded-lg text-sm border border-orange-200 text-orange-500 hover:bg-orange-50 transition-colors"
        >
          Limpiar pieza activa
        </button>
        <button
          onClick={onClearAll}
          className="w-full py-2 rounded-lg text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        >
          Limpiar todo
        </button>
      </section>

    </div>
  )
}
