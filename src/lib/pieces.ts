// Template nuevo: 1280×720px
export const CANVAS_W = 1280
export const CANVAS_H = 720

export type PieceKey = 'frente' | 'espalda' | 'manga_arriba' | 'manga_abajo'

export interface Piece {
  key:     PieceKey
  label:   string
  x1:      number
  y1:      number
  w:       number
  h:       number
  maskSrc: string
}

export const PIECES: Piece[] = [
  { key: 'frente',       label: 'Frente',       x1: 63,  y1: 112, w: 373, h: 489, maskSrc: '/assets/masks/frente.png' },
  { key: 'espalda',      label: 'Espalda',      x1: 500, y1: 104, w: 369, h: 489, maskSrc: '/assets/masks/espalda.png' },
  { key: 'manga_arriba', label: 'Manga arriba', x1: 964, y1: 167, w: 250, h: 152, maskSrc: '/assets/masks/manga_arriba.png' },
  { key: 'manga_abajo',  label: 'Manga abajo',  x1: 960, y1: 389, w: 255, h: 150, maskSrc: '/assets/masks/manga_abajo.png' },
]

export function getPieceAt(x: number, y: number): PieceKey | null {
  for (const p of PIECES) {
    if (x >= p.x1 && x <= p.x1 + p.w && y >= p.y1 && y <= p.y1 + p.h) return p.key
  }
  return null
}
