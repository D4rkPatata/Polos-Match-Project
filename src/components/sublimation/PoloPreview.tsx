'use client'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { ColorConfig, PrendaConfig } from '@/lib/prendas'

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
function projectZone(
  srcCanvas: HTMLCanvasElement,
  destCtx:   CanvasRenderingContext2D,
  src:       { sx: number; sy: number; sw: number; sh: number },
  dest:      { dx: number; dy: number; dw: number; dh: number },
  maskImg:   HTMLCanvasElement | undefined,
  flipH:     boolean,
  maskStartX = 0,
  rotateDeg  = 0,
  blend:     'multiply' | 'screen' = 'multiply',
  alpha      = 0.85,
) {
  const tmp  = document.createElement('canvas')
  tmp.width  = src.sw; tmp.height = src.sh
  const tCtx = tmp.getContext('2d')!

  tCtx.drawImage(srcCanvas, src.sx, src.sy, src.sw, src.sh, 0, 0, src.sw, src.sh)

  if (maskImg) {
    tCtx.globalCompositeOperation = 'destination-in'
    tCtx.drawImage(maskImg, maskStartX, 0, src.sw, src.sh, 0, 0, src.sw, src.sh)
    tCtx.globalCompositeOperation = 'source-over'
  }

  destCtx.save()
  destCtx.globalAlpha              = alpha
  destCtx.globalCompositeOperation = blend
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

interface Props {
  prenda:    PrendaConfig
  poloColor: ColorConfig
}

// ── Componente ───────────────────────────────────────────────────────────────
const PoloPreview = forwardRef<PoloPreviewHandle, Props>(function PoloPreview({ prenda, poloColor }, ref) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const poloImg    = useRef<HTMLImageElement | null>(null)
  const masks      = useRef<Record<string, HTMLCanvasElement>>({})
  const masksReady = useRef(false)
  const poloReady  = useRef(false)
  const lastDesign = useRef<HTMLCanvasElement | null>(null)

  // Sync refs sin efecto para evitar lecturas stale en callbacks
  const prendaRef = useRef(prenda)
  const colorRef  = useRef(poloColor)
  prendaRef.current = prenda
  colorRef.current  = poloColor

  // ── Render principal — data-driven por prenda.zonas ──────────────────────
  const render = useCallback((design: HTMLCanvasElement) => {
    const canvas = canvasRef.current
    const polo   = poloImg.current
    if (!canvas || !polo || !masksReady.current || !poloReady.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { blend, alpha } = colorRef.current
    const { previewW, previewH, zonas } = prendaRef.current

    ctx.clearRect(0, 0, previewW, previewH)
    ctx.drawImage(polo, 0, 0, previewW, previewH)

    for (const zona of zonas) {
      projectZone(
        design, ctx,
        zona.src, zona.dest,
        masks.current[zona.maskKey],
        zona.flipH      ?? false,
        zona.maskStartX ?? 0,
        zona.rotateDeg  ?? 0,
        blend, alpha,
      )
    }
  }, [])

  // ── Carga de máscaras — se recarga cuando cambia la prenda ────────────────
  useEffect(() => {
    masksReady.current = false
    masks.current = {}

    const piezas = prenda.piezas
    let loaded = 0

    const onLoad = () => {
      if (++loaded < piezas.length) return
      masksReady.current = true
      if (poloReady.current && lastDesign.current) render(lastDesign.current)
    }

    for (const pieza of piezas) {
      const m = new Image()
      m.onload = () => {
        if (m.naturalWidth > 0) masks.current[pieza.key] = grayscaleToAlphaMask(m, pieza.w, pieza.h)
        onLoad()
      }
      m.onerror = onLoad
      m.src = pieza.maskSrc
    }
  }, [prenda.key, render])  // re-carga solo cuando cambia la prenda

  // ── Recarga foto del polo cuando cambia el color ──────────────────────────
  useEffect(() => {
    poloReady.current = false
    const polo = new Image()
    polo.onload = () => {
      poloImg.current = polo
      poloReady.current = true
      if (masksReady.current && lastDesign.current) render(lastDesign.current)
    }
    polo.onerror = () => { poloReady.current = true }
    polo.src = poloColor.photo
  }, [poloColor.photo, render])

  // ── API imperativa ────────────────────────────────────────────────────────
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
        width={prenda.previewW}
        height={prenda.previewH}
        className="rounded-lg shadow border border-gray-100 block w-full h-auto"
      />
    </div>
  )
})

export default PoloPreview
