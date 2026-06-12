// Shim: re-exporta desde polo_pit para compatibilidad con SublimationEditor
import { POLO_PIT } from './prendas/polo_pit'
export type { PiezaConfig as Piece } from './prendas/types'

export const CANVAS_W    = POLO_PIT.canvasW
export const CANVAS_H    = POLO_PIT.canvasH
export const TEMPLATE_SRC = POLO_PIT.templateSrc
export const PIECES      = POLO_PIT.piezas
export type  PieceKey    = string

export function getPieceAt(x: number, y: number): string | null {
  for (const p of PIECES) {
    if (x >= p.x1 && x <= p.x1 + p.w && y >= p.y1 && y <= p.y1 + p.h) return p.key
  }
  return null
}
