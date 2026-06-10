import { create } from 'zustand'
import type { Prenda, Vista, Talla } from '@/types/editor'

interface EditorStore {
  prenda: Prenda
  colorIndex: number
  vista: Vista
  canvasJSON: string | null
  talla: Talla
  cantidad: number
  setPrenda: (p: Prenda) => void
  setColor: (i: number) => void
  setVista: (v: Vista) => void
  setCanvasJSON: (json: string) => void
  setTalla: (t: Talla) => void
  setCantidad: (n: number) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  prenda: 'polo',
  colorIndex: 0,
  vista: 'frente',
  canvasJSON: null,
  talla: 'M',
  cantidad: 1,
  setPrenda: (prenda) => set({ prenda }),
  setColor: (colorIndex) => set({ colorIndex }),
  setVista: (vista) => set({ vista }),
  setCanvasJSON: (canvasJSON) => set({ canvasJSON }),
  setTalla: (talla) => set({ talla }),
  setCantidad: (cantidad) => set({ cantidad }),
}))
