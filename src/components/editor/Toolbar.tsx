'use client'
import { useRef } from 'react'
import { useEditorStore } from '@/lib/store'
import { POLO_COLORS } from '@/lib/poloColors'
import { PRINT_ZONES } from '@/lib/printZones'
import type { Canvas as FabricCanvas } from 'fabric'

interface ToolbarProps {
  fabricRef: React.RefObject<FabricCanvas | null>
  onSaveState: () => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
}

export default function Toolbar({ fabricRef, onSaveState, onUndo, onRedo, onDelete }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { colorIndex, setColor, vista, setVista, prenda } = useEditorStore()

  const zone = PRINT_ZONES[prenda][vista]

  const addText = async () => {
    const { IText, Rect } = await import('fabric')
    if (!fabricRef.current) return
    const clipRect = new Rect({
      left: zone.left, top: zone.top,
      width: zone.width, height: zone.height,
      absolutePositioned: true,
    })
    const text = new IText('Tu texto', {
      left: zone.left + 20,
      top: zone.top + 20,
      fontFamily: 'Georgia',
      fontSize: 24,
      fill: '#2C2C2A',
      cornerColor: '#378ADD',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#378ADD',
    })
    text.clipPath = clipRect
    fabricRef.current.add(text)
    fabricRef.current.setActiveObject(text)
    fabricRef.current.renderAll()
    onSaveState()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return
    const { FabricImage, Rect } = await import('fabric')
    const url = URL.createObjectURL(file)
    const clipRect = new Rect({
      left: zone.left, top: zone.top,
      width: zone.width, height: zone.height,
      absolutePositioned: true,
    })
    const img = await FabricImage.fromURL(url)
    img.scaleToWidth(120)
    img.set({
      left: zone.left + zone.width / 2 - 60,
      top: zone.top + 20,
      cornerColor: '#378ADD',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#378ADD',
    })
    img.clipPath = clipRect
    fabricRef.current.add(img)
    fabricRef.current.setActiveObject(img)
    fabricRef.current.renderAll()
    onSaveState()
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* vista frente/espalda */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Vista</p>
        <div className="flex gap-2">
          {(['frente', 'espalda'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                vista === v
                  ? 'bg-[#2C2C2A] text-white border-[#2C2C2A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* color del polo */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Color del polo</p>
        <div className="flex flex-wrap gap-2">
          {POLO_COLORS.map((c, i) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => setColor(i)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                colorIndex === i ? 'border-[#378ADD] scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* herramientas */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Agregar</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={addText}
            className="w-full py-2 px-4 bg-[#2C2C2A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            + Texto
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-4 bg-[#2C2C2A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            + Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* historial */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Historial</p>
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            className="flex-1 py-2 rounded-lg text-sm border border-gray-200 hover:border-gray-400 transition-colors"
          >
            ↩ Undo
          </button>
          <button
            onClick={onRedo}
            className="flex-1 py-2 rounded-lg text-sm border border-gray-200 hover:border-gray-400 transition-colors"
          >
            Redo ↪
          </button>
        </div>
        <button
          onClick={onDelete}
          className="mt-2 w-full py-2 rounded-lg text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        >
          🗑 Eliminar seleccionado
        </button>
      </div>
    </div>
  )
}
