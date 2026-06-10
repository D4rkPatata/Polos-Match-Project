'use client'
import { useRef, useCallback } from 'react'
import type { Canvas as FabricCanvas } from 'fabric'
import PoloCanvas from './PoloCanvas'
import Toolbar from './Toolbar'
import { useCanvasHistory } from '@/hooks/useCanvasHistory'

export default function EditorLayout() {
  const fabricRef = useRef<FabricCanvas | null>(null)
  const { saveState, undo: historyUndo, redo: historyRedo } = useCanvasHistory()

  const saveCurrentState = useCallback(() => {
    if (!fabricRef.current) return
    saveState(JSON.stringify(fabricRef.current.toJSON()))
  }, [saveState])

  const undo = useCallback(() => {
    const json = historyUndo()
    if (!json || !fabricRef.current) return
    fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => fabricRef.current?.renderAll())
  }, [historyUndo])

  const redo = useCallback(() => {
    const json = historyRedo()
    if (!json || !fabricRef.current) return
    fabricRef.current.loadFromJSON(JSON.parse(json)).then(() => fabricRef.current?.renderAll())
  }, [historyRedo])

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current) return
    const active = fabricRef.current.getActiveObject()
    if (active) {
      fabricRef.current.remove(active)
      fabricRef.current.discardActiveObject()
      fabricRef.current.renderAll()
      saveCurrentState()
    }
  }, [saveCurrentState])

  return (
    <div className="flex gap-8 items-start">
      <PoloCanvas fabricRef={fabricRef} onSaveState={saveCurrentState} />
      <aside className="w-56 shrink-0">
        <Toolbar
          fabricRef={fabricRef}
          onSaveState={saveCurrentState}
          onUndo={undo}
          onRedo={redo}
          onDelete={deleteSelected}
        />
      </aside>
    </div>
  )
}
