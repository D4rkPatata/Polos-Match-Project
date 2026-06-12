// Shim: re-exporta desde polo_pit para compatibilidad con EditorSidebar/EditorClient
export type { ColorConfig as PoloColor } from './prendas/types'
import { POLO_PIT } from './prendas/polo_pit'

export const POLO_COLORS = POLO_PIT.colores
