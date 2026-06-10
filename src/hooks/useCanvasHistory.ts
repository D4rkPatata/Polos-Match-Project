import { useRef } from 'react'

export function useCanvasHistory() {
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)

  const saveState = (json: string) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(json)
    historyIndexRef.current++
  }

  const undo = () => {
    if (historyIndexRef.current <= 0) return null
    historyIndexRef.current--
    return historyRef.current[historyIndexRef.current]
  }

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return null
    historyIndexRef.current++
    return historyRef.current[historyIndexRef.current]
  }

  return { saveState, undo, redo }
}
