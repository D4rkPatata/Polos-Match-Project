'use client'
import { useEffect, useRef } from 'react'
import type { Canvas as FabricCanvas } from 'fabric'
import { PRINT_ZONES } from '@/lib/printZones'
import { POLO_COLORS } from '@/lib/poloColors'
import { useEditorStore } from '@/lib/store'

const CANVAS_W = 500
const CANVAS_H = 580

interface PoloCanvasProps {
  fabricRef: React.MutableRefObject<FabricCanvas | null>
  onSaveState: () => void
}

export default function PoloCanvas({ fabricRef, onSaveState }: PoloCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { colorIndex, vista, prenda } = useEditorStore()

  const color = POLO_COLORS[colorIndex]

  useEffect(() => {
    if (!canvasRef.current) return
    let mounted = true

    async function init() {
      const { Canvas, Rect } = await import('fabric')
      if (!mounted || !canvasRef.current) return

      fabricRef.current?.dispose()

      const zone = PRINT_ZONES[prenda][vista]

      const c = new Canvas(canvasRef.current, {
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
      })

      // guía visual de la zona de impresión (no seleccionable)
      const guide = new Rect({
        left: zone.left,
        top: zone.top,
        width: zone.width,
        height: zone.height,
        fill: 'rgba(55,138,221,0.05)',
        stroke: '#378ADD',
        strokeWidth: 1,
        strokeDashArray: [5, 4],
        selectable: false,
        evented: false,
      })
      c.add(guide)

      c.on('object:modified', onSaveState)
      c.on('object:added', onSaveState)
      c.on('object:removed', onSaveState)

      c.renderAll()
      fabricRef.current = c
    }

    init()
    return () => {
      mounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenda, vista])

  return (
    <div
      className="relative inline-block select-none rounded-xl shadow-sm overflow-hidden"
      style={{ width: CANVAS_W, height: CANVAS_H }}
    >
      {/* polo: color sólido hasta que tengas los PNG reales */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: color.hex, border: '1px solid #e5e7eb' }}
      />
      {/* cuando tengas los PNG reales, descomenta esto y elimina el div de arriba:
      <img
        src={vista === 'frente' ? color.mockup : color.mockupEspalda}
        className="absolute inset-0 w-full h-full object-contain"
        alt="polo mockup"
      /> */}

      {/* canvas de Fabric.js encima, transparente */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
