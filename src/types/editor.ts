export type Prenda = 'polo' | 'hoodie'
export type Vista = 'frente' | 'espalda'
export type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export interface PoloColor {
  name: string
  hex: string
  mockup: string
  mockupEspalda?: string
}

export interface PrintZone {
  left: number
  top: number
  width: number
  height: number
}

export interface Pedido {
  id: string
  prenda: Prenda
  colorNombre: string
  talla: Talla
  cantidad: number
  precio: number
  designPNG: string
  canvasJSON: string
  nombre: string
  telefono: string
  direccion: string
  distrito: string
  ciudad: string
  nota?: string
  fecha: string
}
