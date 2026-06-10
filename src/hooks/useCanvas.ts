'use client'
import { useRef, useCallback } from 'react'
import type { Canvas as FabricCanvas } from 'fabric'
import { useCanvasHistory } from './useCanvasHistory'

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const { saveState, undo: historyUndo, redo: historyRedo } = useCanvasHistory()

  const saveCurrentState = useCallback(() => {
    if (!fabricRef.current) return
    const json = JSON.stringify(fabricRef.current.toJSON())
    saveState(json)
  }, [saveState])

  const undo = useCallback(() => {
    const json = historyUndo()
    if (!json || !fabricRef.current) return
    fabricRef.current.loadFromJSON(JSON.parse(json), () => {
      fabricRef.current?.renderAll()
    })
  }, [historyUndo])

  const redo = useCallback(() => {
    const json = historyRedo()
    if (!json || !fabricRef.current) return
    fabricRef.current.loadFromJSON(JSON.parse(json), () => {
      fabricRef.current?.renderAll()
    })
  }, [historyRedo])

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current) return
    const active = fabricRef.current.getActiveObject()
    if (active) {
      fabricRef.current.remove(active)
      saveCurrentState()
    }
  }, [saveCurrentState])

  return { canvasRef, fabricRef, saveCurrentState, undo, redo, deleteSelected }
}
