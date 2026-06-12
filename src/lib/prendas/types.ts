export interface PiezaConfig {
  key:     string
  label:   string
  x1:      number
  y1:      number
  w:       number
  h:       number
  maskSrc: string
}

export interface ColorConfig {
  key:   string
  label: string
  hex:   string
  photo: string
  blend: 'multiply' | 'screen'
  alpha: number
}

export interface ZonaPreview {
  src:         { sx: number; sy: number; sw: number; sh: number }
  dest:        { dx: number; dy: number; dw: number; dh: number }
  maskKey:     string
  flipH?:      boolean
  maskStartX?: number
  rotateDeg?:  number
}

export interface PrendaConfig {
  key:         string
  label:       string
  canvasW:     number
  canvasH:     number
  templateSrc: string
  previewW:    number
  previewH:    number
  piezas:      PiezaConfig[]
  colores:     ColorConfig[]
  zonas:       ZonaPreview[]
}
