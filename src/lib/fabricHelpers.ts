export const exportDesignPNG = (canvas: any, zone: { left: number; top: number; width: number; height: number }) => {
  return canvas.toDataURL({
    format: 'png',
    quality: 1,
    left: zone.left,
    top: zone.top,
    width: zone.width,
    height: zone.height,
    multiplier: 3,
  })
}
