import { POLO_PIT } from './prendas/polo_pit'
import { POLO }     from './prendas/polo'
import type { PrendaConfig } from './prendas/types'

export type { PrendaConfig }
export type { PiezaConfig, ColorConfig, ZonaPreview } from './prendas/types'
export { POLO_PIT, POLO }

export const PRENDAS: PrendaConfig[] = [
  POLO_PIT,
  POLO,
  // agregar aquí: POLERA, POLO_DEPORTIVO, etc.
]

export function getPrenda(key: string): PrendaConfig {
  return PRENDAS.find(p => p.key === key) ?? POLO_PIT
}
