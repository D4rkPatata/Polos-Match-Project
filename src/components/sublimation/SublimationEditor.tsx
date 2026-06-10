'use client'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { CANVAS_H, CANVAS_W, getPieceAt, PIECES, type PieceKey } from '@/lib/pieces'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlacedObj {
  id: string
  type: 'image' | 'text'
  piece: PieceKey
  cx: number        // center, canvas coords
  cy: number
  w: number         // base dims before scale
  h: number
  scale: number     // uniform scale
  rotation: number  // radians
  imgEl?: HTMLImageElement
  text: string
  fontSize: number
  fontFamily: string
  fill: string
}

type HandleKey = 'tl' | 'tr' | 'bl' | 'br' | 'rot'

interface DragState {
  mode: 'body' | HandleKey
  startMouse: { x: number; y: number }
  startObj: PlacedObj
}

export interface EditorHandle {
  addImage:       (dataUrl: string) => void
  addText:        () => void
  deleteSelected: () => void
  clearPiece:     (key: PieceKey) => void
  clearAll:       () => void
}

interface Props {
  activePiece:        PieceKey
  onPieceSelect:      (key: PieceKey) => void
  onSelectionChange:  (hasSelection: boolean) => void
  // Full design canvas (1280×720, no template/masks) sent to preview after every render
  onRender?:          (design: HTMLCanvasElement) => void
}

// ── Pure helpers (outside component, stable refs) ─────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function grayscaleToAlphaMask(src: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(src, 0, 0, w, h)
  const id = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < id.data.length; i += 4) {
    id.data[i + 3] = id.data[i]           // alpha = luminance
    id.data[i] = id.data[i + 1] = id.data[i + 2] = 255
  }
  ctx.putImageData(id, 0, 0)
  return c
}

function measureTextBounds(text: string, fontSize: number, fontFamily: string) {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  const m = ctx.measureText(text)
  return { w: Math.max(m.width + 24, 80), h: fontSize * 1.5 }
}

function getHandles(obj: PlacedObj): Record<HandleKey, { x: number; y: number }> {
  const hw = (obj.w * obj.scale) / 2
  const hh = (obj.h * obj.scale) / 2
  const cos = Math.cos(obj.rotation)
  const sin = Math.sin(obj.rotation)
  const toW = (lx: number, ly: number) => ({
    x: obj.cx + lx * cos - ly * sin,
    y: obj.cy + lx * sin + ly * cos,
  })
  return {
    tl:  toW(-hw, -hh),
    tr:  toW( hw, -hh),
    bl:  toW(-hw,  hh),
    br:  toW( hw,  hh),
    rot: toW(  0, -hh - 30),
  }
}

function hitHandle(pt: { x: number; y: number }, obj: PlacedObj): HandleKey | null {
  const hs = getHandles(obj)
  const R2 = 100  // 10px radius²
  for (const [k, p] of Object.entries(hs) as [HandleKey, { x: number; y: number }][]) {
    if ((pt.x - p.x) ** 2 + (pt.y - p.y) ** 2 <= R2) return k
  }
  return null
}

function hitObject(pt: { x: number; y: number }, obj: PlacedObj): boolean {
  const dx = pt.x - obj.cx, dy = pt.y - obj.cy
  const cos = Math.cos(-obj.rotation), sin = Math.sin(-obj.rotation)
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  return Math.abs(lx) <= (obj.w * obj.scale) / 2 &&
         Math.abs(ly) <= (obj.h * obj.scale) / 2
}

function drawObj(ctx: CanvasRenderingContext2D, obj: PlacedObj, ox = 0, oy = 0) {
  ctx.save()
  ctx.translate(obj.cx - ox, obj.cy - oy)
  ctx.rotate(obj.rotation)
  ctx.scale(obj.scale, obj.scale)
  if (obj.type === 'image' && obj.imgEl?.complete && obj.imgEl.naturalWidth > 0) {
    ctx.drawImage(obj.imgEl, -obj.w / 2, -obj.h / 2, obj.w, obj.h)
  } else if (obj.type === 'text' && obj.text) {
    ctx.font      = `bold ${obj.fontSize}px ${obj.fontFamily}`
    ctx.fillStyle = obj.fill
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(obj.text, 0, 0)
  }
  ctx.restore()
}

// ── Component ──────────────────────────────────────────────────────────────────

const SublimationEditor = forwardRef<EditorHandle, Props>(function SublimationEditor(
  { activePiece, onPieceSelect, onSelectionChange, onRender }, ref,
) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const tmpRef         = useRef<Record<PieceKey, HTMLCanvasElement>>({} as any)
  const designCanvas   = useRef<HTMLCanvasElement | null>(null)  // full 1280×720, objects only, no template
  const alphaMasks     = useRef<Record<PieceKey, HTMLCanvasElement>>({} as any)
  const templateImg = useRef<HTMLImageElement | null>(null)
  const isReady     = useRef(false)
  const onRenderRef = useRef(onRender)
  useEffect(() => { onRenderRef.current = onRender }, [onRender])

  const objectsRef    = useRef<PlacedObj[]>([])
  const selectedIdRef = useRef<string | null>(null)
  const dragRef       = useRef<DragState | null>(null)
  const activeRef     = useRef(activePiece)

  useEffect(() => { activeRef.current = activePiece }, [activePiece])

  // Text editing overlay (React state — affects JSX)
  const [textEdit, setTextEdit] = useState<{ id: string } | null>(null)

  // ── Render ──────────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !isReady.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const objs  = objectsRef.current
    const selId = selectedIdRef.current
    const sel   = objs.find(o => o.id === selId) ?? null

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // 1 — template background
    const tmpl = templateImg.current
    if (tmpl && tmpl.naturalWidth > 0) {
      try { ctx.drawImage(tmpl, 0, 0, CANVAS_W, CANVAS_H) } catch { /* skip */ }
    } else {
      ctx.fillStyle = '#d1d5db'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    }

    // 2a — design canvas (all objects at absolute coords, no mask/template, for preview)
    const dc = designCanvas.current
    if (dc) {
      const dCtx = dc.getContext('2d')
      if (dCtx) {
        dCtx.clearRect(0, 0, CANVAS_W, CANVAS_H)
        for (const obj of objs) drawObj(dCtx, obj)  // absolute coords, ox/oy = 0
      }
    }

    // 2b — objects per piece with mask clipping (editor display)
    for (const piece of PIECES) {
      const pieceObjs = objs.filter(o => o.piece === piece.key)
      if (pieceObjs.length === 0) continue

      const tmp = tmpRef.current[piece.key]
      if (!tmp) continue
      const tCtx = tmp.getContext('2d')
      if (!tCtx) continue

      tCtx.clearRect(0, 0, piece.w, piece.h)
      for (const obj of pieceObjs) drawObj(tCtx, obj, piece.x1, piece.y1)

      const mask = alphaMasks.current[piece.key]
      if (mask) {
        tCtx.globalCompositeOperation = 'destination-in'
        tCtx.drawImage(mask, 0, 0, piece.w, piece.h)
        tCtx.globalCompositeOperation = 'source-over'
      }
      ctx.drawImage(tmp, piece.x1, piece.y1)
    }

    // notify preview
    if (dc) onRenderRef.current?.(dc)

    // 3 — active piece highlight
    const ap = PIECES.find(p => p.key === activeRef.current)
    if (ap) {
      ctx.save()
      ctx.strokeStyle = 'rgba(55,138,221,0.55)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect(ap.x1 + 0.5, ap.y1 + 0.5, ap.w - 1, ap.h - 1)
      ctx.setLineDash([])
      ctx.restore()
    }

    // 4 — selection handles (drawn OUTSIDE the mask — always visible)
    if (sel) {
      const hw = (sel.w * sel.scale) / 2
      const hh = (sel.h * sel.scale) / 2
      const hs = getHandles(sel)

      // Rotated bounding box
      ctx.save()
      ctx.translate(sel.cx, sel.cy)
      ctx.rotate(sel.rotation)
      ctx.strokeStyle = '#378ADD'
      ctx.lineWidth   = 1.5
      ctx.setLineDash([6, 3])
      ctx.strokeRect(-hw, -hh, hw * 2, hh * 2)
      ctx.setLineDash([])
      // Vertical line from top-center to rotate handle
      ctx.beginPath()
      ctx.moveTo(0, -hh)
      ctx.lineTo(0, -hh - 30)
      ctx.strokeStyle = '#378ADD'
      ctx.lineWidth   = 1
      ctx.stroke()
      ctx.restore()

      // Corner handles
      for (const k of ['tl', 'tr', 'bl', 'br'] as const) {
        const { x, y } = hs[k]
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fillStyle   = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#378ADD'
        ctx.lineWidth   = 2
        ctx.stroke()
      }

      // Rotate handle — circular arrow icon
      const { x: rx, y: ry } = hs.rot
      ctx.beginPath()
      ctx.arc(rx, ry, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#378ADD'
      ctx.fill()
      ctx.save()
      ctx.translate(rx, ry)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.arc(0, 0, 4, -Math.PI * 0.8, Math.PI * 0.8)
      ctx.stroke()
      // Arrow tip
      ctx.beginPath()
      ctx.moveTo(3.5, -4.5)
      ctx.lineTo(5.5, -2)
      ctx.lineTo(1.5, -2)
      ctx.closePath()
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.restore()
    }
  }, [])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // per-piece tmp canvases (editor display, masked)
    for (const piece of PIECES) {
      const t = document.createElement('canvas')
      t.width = piece.w; t.height = piece.h
      tmpRef.current[piece.key] = t
    }

    // full design canvas (objects at absolute coords, no mask/template — preview source)
    const dc = document.createElement('canvas')
    dc.width  = CANVAS_W
    dc.height = CANVAS_H
    designCanvas.current = dc

    let loaded = 0
    const total   = 1 + PIECES.length
    const maskBuf: Record<string, HTMLImageElement> = {}

    const done = () => {
      for (const piece of PIECES) {
        const m = maskBuf[piece.key]
        if (m?.naturalWidth > 0) {
          alphaMasks.current[piece.key] = grayscaleToAlphaMask(m, piece.w, piece.h)
        }
      }
      isReady.current = true
      render()
    }
    const onLoad = () => { if (++loaded === total) done() }

    const tmpl = new Image()
    tmpl.onload = onLoad; tmpl.onerror = onLoad
    tmpl.src = '/assets/template.png'
    templateImg.current = tmpl

    for (const piece of PIECES) {
      const m = new Image()
      m.onload = onLoad; m.onerror = onLoad
      m.src = piece.maskSrc
      maskBuf[piece.key] = m
    }
  }, [render])

  useEffect(() => { render() }, [activePiece, render])

  // ── Imperative API ──────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    addImage: (dataUrl) => {
      const key   = activeRef.current
      const piece = PIECES.find(p => p.key === key)!
      const img   = new Image()
      img.onload = () => {
        const scale = Math.min(piece.w * 0.72 / img.naturalWidth, piece.h * 0.72 / img.naturalHeight)
        const obj: PlacedObj = {
          id: uid(), type: 'image', piece: key,
          cx: piece.x1 + piece.w / 2,
          cy: piece.y1 + piece.h / 2,
          w: img.naturalWidth, h: img.naturalHeight,
          scale, rotation: 0,
          imgEl: img,
          text: '', fontSize: 36, fontFamily: 'Georgia', fill: '#2C2C2A',
        }
        objectsRef.current = [...objectsRef.current, obj]
        selectedIdRef.current = obj.id
        onSelectionChange(true)
        render()
      }
      img.src = dataUrl
    },

    addText: () => {
      const key   = activeRef.current
      const piece = PIECES.find(p => p.key === key)!
      const text  = 'Texto'
      const fs    = 42
      const ff    = 'Georgia'
      const { w, h } = measureTextBounds(text, fs, ff)
      const obj: PlacedObj = {
        id: uid(), type: 'text', piece: key,
        cx: piece.x1 + piece.w / 2,
        cy: piece.y1 + piece.h / 2,
        w, h, scale: 1, rotation: 0,
        imgEl: undefined,
        text, fontSize: fs, fontFamily: ff, fill: '#2C2C2A',
      }
      objectsRef.current = [...objectsRef.current, obj]
      selectedIdRef.current = obj.id
      onSelectionChange(true)
      render()
      setTextEdit({ id: obj.id })
    },

    deleteSelected: () => {
      const id = selectedIdRef.current
      if (!id) return
      objectsRef.current = objectsRef.current.filter(o => o.id !== id)
      selectedIdRef.current = null
      onSelectionChange(false)
      render()
    },

    clearPiece: (key) => {
      objectsRef.current = objectsRef.current.filter(o => o.piece !== key)
      if (selectedIdRef.current && !objectsRef.current.find(o => o.id === selectedIdRef.current)) {
        selectedIdRef.current = null
        onSelectionChange(false)
      }
      render()
    },

    clearAll: () => {
      objectsRef.current = []
      selectedIdRef.current = null
      onSelectionChange(false)
      render()
    },
  }))

  // ── Mouse interaction ───────────────────────────────────────────────────────
  const getPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect  = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
    }
  }, [])

  const handleDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (textEdit) return
    e.preventDefault()
    const pt   = getPoint(e)
    const objs = objectsRef.current
    const selId = selectedIdRef.current
    const sel   = objs.find(o => o.id === selId) ?? null

    // Handles first (only on selected)
    if (sel) {
      const handle = hitHandle(pt, sel)
      if (handle) {
        dragRef.current = { mode: handle, startMouse: pt, startObj: { ...sel } }
        canvasRef.current!.style.cursor = handle === 'rot' ? 'grabbing' : 'nwse-resize'
        return
      }
    }

    // Objects (top-to-bottom)
    for (let i = objs.length - 1; i >= 0; i--) {
      const obj = objs[i]
      if (hitObject(pt, obj)) {
        selectedIdRef.current = obj.id
        dragRef.current = { mode: 'body', startMouse: pt, startObj: { ...obj } }
        canvasRef.current!.style.cursor = 'grabbing'
        if (obj.piece !== activeRef.current) {
          activeRef.current = obj.piece
          onPieceSelect(obj.piece)
        }
        onSelectionChange(true)
        render()
        return
      }
    }

    // Miss — deselect + maybe switch active piece
    const hitP = getPieceAt(pt.x, pt.y)
    if (hitP && hitP !== activeRef.current) {
      activeRef.current = hitP
      onPieceSelect(hitP)
    }
    selectedIdRef.current = null
    onSelectionChange(false)
    render()
  }, [textEdit, getPoint, onPieceSelect, onSelectionChange, render])

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt   = getPoint(e)
    const drag = dragRef.current

    if (!drag) {
      // Update cursor based on hover
      const sel = objectsRef.current.find(o => o.id === selectedIdRef.current)
      if (sel) {
        const h = hitHandle(pt, sel)
        if (h === 'rot') { canvasRef.current!.style.cursor = 'grab'; return }
        if (h)           { canvasRef.current!.style.cursor = 'nwse-resize'; return }
        if (hitObject(pt, sel)) { canvasRef.current!.style.cursor = 'move'; return }
      }
      // Check any other object
      const hit = objectsRef.current.slice().reverse().find(o => hitObject(pt, o))
      canvasRef.current!.style.cursor = hit ? 'move' : 'default'
      return
    }

    const { mode, startMouse, startObj } = drag
    const objs = objectsRef.current
    const idx  = objs.findIndex(o => o.id === startObj.id)
    if (idx < 0) return

    const updated = { ...objs[idx] }

    if (mode === 'body') {
      updated.cx = startObj.cx + (pt.x - startMouse.x)
      updated.cy = startObj.cy + (pt.y - startMouse.y)
    } else if (mode === 'rot') {
      const a0 = Math.atan2(startMouse.y - startObj.cy, startMouse.x - startObj.cx)
      const a1 = Math.atan2(pt.y         - startObj.cy, pt.x         - startObj.cx)
      updated.rotation = startObj.rotation + (a1 - a0)
    } else {
      // Scale uniformly from center
      const d0 = Math.hypot(startMouse.x - startObj.cx, startMouse.y - startObj.cy)
      const d1 = Math.hypot(pt.x         - startObj.cx, pt.y         - startObj.cy)
      if (d0 > 0) updated.scale = Math.max(0.04, startObj.scale * (d1 / d0))
    }

    objectsRef.current = [...objs.slice(0, idx), updated, ...objs.slice(idx + 1)]
    render()
  }, [getPoint, render])

  const handleUp = useCallback(() => {
    dragRef.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
  }, [])

  const handleDblClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    const textObj = objectsRef.current.slice().reverse().find(o => o.type === 'text' && hitObject(pt, o))
    if (textObj) {
      selectedIdRef.current = textObj.id
      onSelectionChange(true)
      render()
      setTextEdit({ id: textObj.id })
    }
  }, [getPoint, onSelectionChange, render])

  // ── Text overlay ────────────────────────────────────────────────────────────
  const commitText = useCallback((val: string) => {
    const id  = textEdit?.id
    if (!id) return
    objectsRef.current = objectsRef.current.map(o => {
      if (o.id !== id) return o
      const { w, h } = measureTextBounds(val || ' ', o.fontSize, o.fontFamily)
      return { ...o, text: val || ' ', w, h }
    })
    setTextEdit(null)
    render()
  }, [textEdit, render])

  // Compute screen position of the text input overlay
  const textOverlayStyle = (): React.CSSProperties => {
    if (!textEdit || !canvasRef.current) return { display: 'none' }
    const obj  = objectsRef.current.find(o => o.id === textEdit.id)
    if (!obj) return { display: 'none' }
    const rect = canvasRef.current.getBoundingClientRect()
    const sx   = rect.left + obj.cx * (rect.width  / CANVAS_W)
    const sy   = rect.top  + obj.cy * (rect.height / CANVAS_H)
    return {
      position: 'fixed',
      left: sx - 120,
      top:  sy - 22,
      width: 240,
      zIndex: 9999,
      fontSize: 15,
      padding: '3px 10px',
      border: '2px solid #378ADD',
      borderRadius: 6,
      outline: 'none',
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onDoubleClick={handleDblClick}
        className="rounded-lg shadow-sm border border-gray-200 block"
        style={{ cursor: 'default', userSelect: 'none', width: CANVAS_W, height: CANVAS_H }}
      />
      {textEdit && (
        <input
          key={textEdit.id}
          autoFocus
          defaultValue={objectsRef.current.find(o => o.id === textEdit.id)?.text ?? ''}
          onChange={e => {
            const val = e.target.value
            objectsRef.current = objectsRef.current.map(o => {
              if (o.id !== textEdit.id) return o
              const { w, h } = measureTextBounds(val || ' ', o.fontSize, o.fontFamily)
              return { ...o, text: val || ' ', w, h }
            })
            render()
          }}
          onBlur={e  => commitText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter')  commitText((e.target as HTMLInputElement).value)
            if (e.key === 'Escape') { setTextEdit(null); render() }
          }}
          style={textOverlayStyle()}
        />
      )}
    </>
  )
})

export default SublimationEditor
