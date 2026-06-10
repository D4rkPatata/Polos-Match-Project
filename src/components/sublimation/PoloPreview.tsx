'use client'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

// polo.png es 1536×1024 — el canvas del preview trabaja a resolución completa
const POLO_W = 1536
const POLO_H = 1024

// CSS display al 50% para que quepa en pantalla
const DISPLAY_W = 768
const DISPLAY_H = 512

// ── grayscale PNG → alpha mask ──────────────────────────────────────────────
function grayscaleToAlphaMask(src: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0, w, h)
  const id = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < id.data.length; i += 4) {
    id.data[i + 3] = id.data[i]
    id.data[i] = id.data[i + 1] = id.data[i + 2] = 255
  }
  ctx.putImageData(id, 0, 0)
  return c
}

// ── projectZone ─────────────────────────────────────────────────────────────
// Recorta una zona del canvas de diseño, aplica la máscara de esa zona,
// y la proyecta sobre el canvas del polo con multiply blend.
// src.sx/sy: origen en el canvas de diseño (1280×720)
// src.sw/sh: tamaño de la zona a recortar
// dest.dx/dy/dw/dh: destino en el polo (1536×1024)
// maskImg: máscara alpha del tamaño de src (o se escala)
// flipH: voltear horizontalmente (mangas)
function projectZone(
  srcCanvas: HTMLCanvasElement,
  destCtx:    CanvasRenderingContext2D,
  src:        { sx: number; sy: number; sw: number; sh: number },
  dest:       { dx: number; dy: number; dw: number; dh: number },
  maskImg:    HTMLCanvasElement | undefined,
  flipH:      boolean,
  maskStartX  = 0,   // desde qué x del mask recortar (para mitades de manga)
  rotateDeg   = 0,   // grados de rotación alrededor del centro del destino
) {
  const tmp  = document.createElement('canvas')
  tmp.width  = src.sw; tmp.height = src.sh
  const tCtx = tmp.getContext('2d')!

  // 1. Recortar zona del canvas de diseño
  tCtx.drawImage(srcCanvas, src.sx, src.sy, src.sw, src.sh, 0, 0, src.sw, src.sh)

  // 2. Aplicar máscara — recortar la mitad correcta del mask según maskStartX
  if (maskImg) {
    tCtx.globalCompositeOperation = 'destination-in'
    tCtx.drawImage(maskImg, maskStartX, 0, src.sw, src.sh, 0, 0, src.sw, src.sh)
    tCtx.globalCompositeOperation = 'source-over'
  }

  // 3. Proyectar al polo con multiply — preserva arrugas y sombras de la tela
  destCtx.save()
  destCtx.globalAlpha              = 0.85
  destCtx.globalCompositeOperation = 'multiply'
  // Rotar y/o flipear alrededor del centro del destino
  const cx = dest.dx + dest.dw / 2
  const cy = dest.dy + dest.dh / 2
  destCtx.translate(cx, cy)
  if (rotateDeg !== 0) destCtx.rotate(rotateDeg * Math.PI / 180)
  if (flipH) destCtx.scale(-1, 1)
  destCtx.drawImage(tmp, -dest.dw / 2, -dest.dh / 2, dest.dw, dest.dh)
  destCtx.restore()
}

// ── Tipos públicos ───────────────────────────────────────────────────────────
export interface PoloPreviewHandle {
  update: (designCanvas: HTMLCanvasElement) => void
}

// ── Componente ───────────────────────────────────────────────────────────────
const PoloPreview = forwardRef<PoloPreviewHandle>(function PoloPreview(_, ref) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const poloImg       = useRef<HTMLImageElement | null>(null)
  const masks         = useRef<Record<string, HTMLCanvasElement>>({})
  const isReady       = useRef(false)
  const lastDesign    = useRef<HTMLCanvasElement | null>(null)

  // ── Render principal ──────────────────────────────────────────────────────
  const render = useCallback((design: HTMLCanvasElement) => {
    const canvas = canvasRef.current
    const polo   = poloImg.current
    if (!canvas || !polo || !isReady.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, POLO_W, POLO_H)
    ctx.drawImage(polo, 0, 0, POLO_W, POLO_H)

    // ── Frente (proyección directa)
    projectZone(design, ctx,
      { sx: 63,  sy: 112, sw: 373, sh: 489 },
      { dx: 182, dy: 207, dw: 480, dh: 620 },
      masks.current.frente, false,
    )

    // ── Espalda (proyección directa)
    projectZone(design, ctx,
      { sx: 500, sy: 104, sw: 369, sh: 489 },
      { dx: 905, dy: 207, dw: 467, dh: 620 },
      masks.current.espalda, false,
    )

    // ── Manga arriba — mitad izq (x:0–125) → manga C (espalda izq) sin flip
    projectZone(design, ctx,
      { sx: 964,  sy: 167, sw: 125, sh: 152 },
      { dx: 573,  dy: 280, dw: 160,  dh: 195 },
      masks.current.manga_arriba, false, 0,-53
    )

    // ── Manga arriba — mitad der (x:125–250) → manga C (espalda izq) con flip
    projectZone(design, ctx,
      { sx: 1089, sy: 167, sw: 125, sh: 152 },
      { dx: 825,  dy: 290, dw: 158,  dh: 190 },
      masks.current.manga_arriba, false, 125,+53
    )

    // ── Manga abajo — mitad izq (x:0–127) → manga A (frente izq) con flip
    projectZone(design, ctx,
      { sx: 960,  sy: 389, sw: 127, sh: 150 },
      { dx: 1280,   dy: 280, dw: 160, dh: 207 },
      masks.current.manga_abajo, false, 0,-53
    )

    // ── Manga abajo — mitad der (x:127–255) → manga D (espalda der) con flip
    projectZone(design, ctx,
      // { sx: 1087, sy: 389, sw: 128, sh: 150 },
      // { dx: 1370, dy: 300, dw: 109, dh: 190 },
      // masks.current.manga_abajo, true, 127,
      { sx: 1087,  sy: 389, sw: 128, sh: 150 },
      { dx: 110,   dy: 280, dw: 160, dh: 207 },
      masks.current.manga_abajo, false, 127,+54
    )
  }, [])

  // ── Carga de polo.png + máscaras ──────────────────────────────────────────
  useEffect(() => {
    const MASK_FILES: { key: string; src: string; w: number; h: number }[] = [
      { key: 'frente',       src: '/assets/masks/frente.png',       w: 373, h: 489 },
      { key: 'espalda',      src: '/assets/masks/espalda.png',      w: 369, h: 489 },
      { key: 'manga_arriba', src: '/assets/masks/manga_arriba.png', w: 250, h: 152 },
      { key: 'manga_abajo',  src: '/assets/masks/manga_abajo.png',  w: 255, h: 150 },
    ]

    let loaded = 0
    const total = 1 + MASK_FILES.length
    const onLoad = () => {
      if (++loaded < total) return
      isReady.current = true
      if (lastDesign.current) render(lastDesign.current)
    }

    const polo = new Image()
    polo.onload  = onLoad
    polo.onerror = onLoad
    polo.src = '/assets/polo.png'
    poloImg.current = polo

    for (const { key, src, w, h } of MASK_FILES) {
      const m = new Image()
      m.onload = () => {
        if (m.naturalWidth > 0) masks.current[key] = grayscaleToAlphaMask(m, w, h)
        onLoad()
      }
      m.onerror = onLoad
      m.src = src
    }
  }, [render])

  // ── API imperativa (llamada desde EditorClient en cada render del editor) ─
  useImperativeHandle(ref, () => ({
    update: (design) => {
      lastDesign.current = design
      render(design)
    },
  }))

  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">
        Preview en tiempo real
      </p>
      <canvas
        ref={canvasRef}
        width={POLO_W}
        height={POLO_H}
        style={{ width: DISPLAY_W, height: DISPLAY_H }}
        className="rounded-lg shadow border border-gray-100 block"
      />
    </div>
  )
})

export default PoloPreview
