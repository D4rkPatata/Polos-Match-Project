import type { PrendaConfig } from './types'

const BASE = '/assets/prendas/polo_pit'

export const POLO_PIT: PrendaConfig = {
  key:         'polo_pit',
  label:       'Polo Pit',
  canvasW:     1280,
  canvasH:     720,
  templateSrc: `${BASE}/template.png`,
  previewW:    1536,
  previewH:    1024,

  piezas: [
    { key: 'frente',       label: 'Frente',       x1: 63,  y1: 112, w: 373, h: 489, maskSrc: `${BASE}/masks/frente.png` },
    { key: 'espalda',      label: 'Espalda',      x1: 500, y1: 104, w: 369, h: 489, maskSrc: `${BASE}/masks/espalda.png` },
    { key: 'manga_arriba', label: 'Manga arriba', x1: 964, y1: 167, w: 250, h: 152, maskSrc: `${BASE}/masks/manga_arriba.png` },
    { key: 'manga_abajo',  label: 'Manga abajo',  x1: 960, y1: 389, w: 255, h: 150, maskSrc: `${BASE}/masks/manga_abajo.png` },
  ],

  colores: [
    { key: 'blanco', label: 'Blanco', hex: '#FFFFFF', photo: `${BASE}/colores/blanco.png`, blend: 'multiply', alpha: 0.85 },
    { key: 'gris',   label: 'Gris',   hex: '#9E9E9E', photo: `${BASE}/colores/gris.png`,   blend: 'screen',   alpha: 0.90 },
    { key: 'azul',   label: 'Azul',   hex: '#103560', photo: `${BASE}/colores/azul.png`,   blend: 'screen',   alpha: 0.95 },
    { key: 'rojo',   label: 'Rojo',   hex: '#C62828', photo: `${BASE}/colores/rojo.png`,   blend: 'screen',   alpha: 0.90 },
    { key: 'negro',  label: 'Negro',  hex: '#1C1C1C', photo: `${BASE}/colores/negro.png`,  blend: 'screen',   alpha: 0.90 },
  ],

  // Cada zona recorta una región del canvas de diseño y la proyecta sobre la foto del polo.
  // Manga: cada pieza se divide en mitad izq y derecha, mapeadas a mangas distintas.
  zonas: [
    {
      src: { sx: 63,   sy: 112, sw: 373, sh: 489 },
      dest: { dx: 182,  dy: 207, dw: 480, dh: 620 },
      maskKey: 'frente', flipH: false,
    },
    {
      src: { sx: 500,  sy: 104, sw: 369, sh: 489 },
      dest: { dx: 905,  dy: 207, dw: 467, dh: 620 },
      maskKey: 'espalda', flipH: false,
    },
    {
      src: { sx: 964,  sy: 167, sw: 125, sh: 152 },
      dest: { dx: 573,  dy: 280, dw: 160, dh: 195 },
      maskKey: 'manga_arriba', flipH: false, maskStartX: 0,   rotateDeg: -53,
    },
    {
      src: { sx: 1089, sy: 167, sw: 125, sh: 152 },
      dest: { dx: 825,  dy: 290, dw: 158, dh: 190 },
      maskKey: 'manga_arriba', flipH: false, maskStartX: 125, rotateDeg: +53,
    },
    {
      src: { sx: 960,  sy: 389, sw: 127, sh: 150 },
      dest: { dx: 1280, dy: 280, dw: 160, dh: 207 },
      maskKey: 'manga_abajo', flipH: false, maskStartX: 0,   rotateDeg: -53,
    },
    {
      src: { sx: 1087, sy: 389, sw: 128, sh: 150 },
      dest: { dx: 110,  dy: 280, dw: 160, dh: 207 },
      maskKey: 'manga_abajo', flipH: false, maskStartX: 127, rotateDeg: +54,
    },
  ],
}
