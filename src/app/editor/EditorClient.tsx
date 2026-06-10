'use client'
import { useCallback, useRef, useState } from 'react'
import SublimationEditor, { type EditorHandle } from '@/components/sublimation/SublimationEditor'
import EditorSidebar from '@/components/sublimation/EditorSidebar'
import PoloPreview, { type PoloPreviewHandle } from '@/components/sublimation/PoloPreview'
import type { PieceKey } from '@/lib/pieces'

export default function EditorClient() {
  const editorRef  = useRef<EditorHandle>(null)
  const previewRef = useRef<PoloPreviewHandle>(null)

  const [activePiece,  setActivePiece]  = useState<PieceKey>('frente')
  const [hasSelection, setHasSelection] = useState(false)

  // Called after every editor render — update preview without React re-render
  const handleRender = useCallback((design: HTMLCanvasElement) => {
    previewRef.current?.update(design)
  }, [])

  const handleAddImage   = useCallback((url: string) => editorRef.current?.addImage(url),    [])
  const handleAddText    = useCallback(() => editorRef.current?.addText(),                    [])
  const handleDelete     = useCallback(() => editorRef.current?.deleteSelected(),             [])
  const handleClearPiece = useCallback(() => editorRef.current?.clearPiece(activePiece),     [activePiece])
  const handleClearAll   = useCallback(() => editorRef.current?.clearAll(),                  [])

  return (
    <div className="flex flex-col gap-8">
      {/* ── Row 1: editor + sidebar ── */}
      <div className="flex gap-6 items-start">
        <div>
          <p className="text-xs text-gray-400 mb-2">
            Clic en una pieza para activarla · insertar imagen o texto desde el panel →
          </p>
          <SublimationEditor
            ref={editorRef}
            activePiece={activePiece}
            onPieceSelect={setActivePiece}
            onSelectionChange={setHasSelection}
            onRender={handleRender}
          />
        </div>
        <EditorSidebar
          activePiece={activePiece}
          hasSelection={hasSelection}
          onPieceChange={setActivePiece}
          onAddImage={handleAddImage}
          onAddText={handleAddText}
          onDelete={handleDelete}
          onClearPiece={handleClearPiece}
          onClearAll={handleClearAll}
        />
      </div>

      {/* ── Row 2: polo preview ── */}
      <PoloPreview ref={previewRef} />
    </div>
  )
}
