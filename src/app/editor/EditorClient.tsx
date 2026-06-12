'use client'
import { useCallback, useRef, useState } from 'react'
import SublimationEditor, { type EditorHandle } from '@/components/sublimation/SublimationEditor'
import EditorSidebar from '@/components/sublimation/EditorSidebar'
import PoloPreview, { type PoloPreviewHandle } from '@/components/sublimation/PoloPreview'
import PrendaSelector from '@/components/sublimation/PrendaSelector'
import { POLO_PIT, type ColorConfig, type PrendaConfig } from '@/lib/prendas'

export default function EditorClient() {
  const editorRef  = useRef<EditorHandle>(null)
  const previewRef = useRef<PoloPreviewHandle>(null)

  const [prenda,       setPrenda]       = useState<PrendaConfig>(POLO_PIT)
  const [activePiece,  setActivePiece]  = useState<string>(POLO_PIT.piezas[0].key)
  const [hasSelection, setHasSelection] = useState(false)
  const [poloColor,    setPoloColor]    = useState<ColorConfig>(POLO_PIT.colores[0])

  const handlePrendaChange = useCallback((newPrenda: PrendaConfig) => {
    setPrenda(newPrenda)
    setActivePiece(newPrenda.piezas[0].key)
    setPoloColor(newPrenda.colores[0])
    setHasSelection(false)
    editorRef.current?.clearAll()
  }, [])

  const handleRender = useCallback((design: HTMLCanvasElement) => {
    previewRef.current?.update(design)
  }, [])

  const handleAddImage   = useCallback((url: string) => editorRef.current?.addImage(url),  [])
  const handleAddText    = useCallback(() => editorRef.current?.addText(),                  [])
  const handleDelete     = useCallback(() => editorRef.current?.deleteSelected(),           [])
  const handleClearPiece = useCallback(() => editorRef.current?.clearPiece(activePiece),   [activePiece])
  const handleClearAll   = useCallback(() => editorRef.current?.clearAll(),                [])

  return (
    <div className="flex flex-col gap-6">

      {/* ── Selector de prenda ── */}
      <PrendaSelector selected={prenda} onChange={handlePrendaChange} />

      {/* ── 3 columnas: controles · editor · preview ── */}
      <div className="flex gap-6 items-start">

        {/* Columna izquierda: controles */}
        <div className="shrink-0">
          <EditorSidebar
            prenda={prenda}
            activePiece={activePiece}
            hasSelection={hasSelection}
            poloColor={poloColor}
            onPieceChange={setActivePiece}
            onColorChange={setPoloColor}
            onAddImage={handleAddImage}
            onAddText={handleAddText}
            onDelete={handleDelete}
            onClearPiece={handleClearPiece}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Columna central: editor (flexible, protagonista) */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-2">
            Clic en una pieza para activarla · inserta imagen o texto desde el panel ←
          </p>
          <SublimationEditor
            ref={editorRef}
            activePiece={activePiece}
            onPieceSelect={setActivePiece}
            onSelectionChange={setHasSelection}
            onRender={handleRender}
          />
        </div>

        {/* Columna derecha: preview en vivo */}
        <div className="shrink-0 w-[440px]">
          <PoloPreview ref={previewRef} prenda={prenda} poloColor={poloColor} />
        </div>

      </div>
    </div>
  )
}
