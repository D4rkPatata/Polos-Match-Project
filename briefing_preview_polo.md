# BRIEFING — Preview 2D del polo con diseño de sublimación
# Para asistente VS Code

---

## OBJETIVO
Mostrar en tiempo real cómo queda el diseño pintado en el canvas de sublimación
proyectado sobre la foto del polo. El usuario pinta en el canvas izquierdo
y ve el resultado en la foto del polo derecha.

---

## ARCHIVOS NECESARIOS EN EL PROYECTO

```
assets/
  template.png       ← molde de sublimación (imagen con las 5 piezas)
  polo.png           ← foto del polo (ChatGPT_Image_4_jun_2026__15_44_30.png)
assets/masks/
  frente.png
  espalda.png
  etiqueta.png
  arco_top.png       ← pieza de MANGA (se parte a la mitad)
  arco_bot.png       ← pieza de MANGA espalda (se parte a la mitad)
```

---

## IMAGEN DEL POLO — ESPECIFICACIONES

- Archivo: `assets/polo.png`
- Tamaño: **1536x1024 px**
- Descripción: polo blanco sobre fondo gris, visto desde arriba/plano.
  Frente a la izquierda (x: 0-759), espalda a la derecha (x: 840-1479).
- Esta imagen es SOLO de fondo — nunca se modifica.
- El diseño se dibuja ENCIMA con `globalAlpha = 0.85` y `globalCompositeOperation = 'multiply'`
  para que las arrugas y sombras de la tela sean visibles a través del color.

---

## CANVAS DEL MOLDE — ESPECIFICACIONES

- Archivo: `assets/template.png`
- Tamaño original: **1672x941 px**
- Tamaño de trabajo recomendado (escala 30%): **501x282 px**
- Las máscaras PNG en `assets/masks/` están generadas a escala 30%.

---

## PIEZAS DEL CANVAS Y SU MAPEO AL POLO

### PIEZA 1 — frente
- **Canvas bbox (escala 30%):** x1=15, y1=15, x2=169, y2=258 (154x243px)
- **Máscara:** `assets/masks/frente.png` (154x243px)
- **Destino en polo:** x1=199, y1=260, x2=656, y2=830 (457x570px)
- **Transformación:** ninguna (proyección directa)

### PIEZA 2 — espalda
- **Canvas bbox (escala 30%):** x1=182, y1=20, x2=339, y2=254 (156x234px)
- **Máscara:** `assets/masks/espalda.png` (156x234px)
- **Destino en polo:** x1=915, y1=260, x2=1370, y2=831 (455x571px)
- **Transformación:** ninguna (proyección directa)

### PIEZA 3 — etiqueta
- **Canvas bbox (escala 30%):** x1=354, y1=30, x2=478, y2=62 (124x32px)
- **Máscara:** `assets/masks/etiqueta.png` (124x32px)
- **Destino en polo:** zona del cuello frente, x1=350, y1=200, x2=500, y2=265
- **Transformación:** ninguna

### PIEZA 4 — arco_top (MANGA FRENTE)
- **Canvas bbox (escala 30%):** x1=354, y1=71, x2=478, y2=159 (124x88px)
- **Máscara:** `assets/masks/arco_top.png` (124x88px)
- **La pieza se divide a la mitad verticalmente (x=206 en escala original, x=62 en escala 30%)**

| Mitad | Rango en canvas | Destino en polo | Transformación |
|-------|----------------|-----------------|----------------|
| Izquierda (x: 0–62) | mitad izq de arco_top | frente_manga_DER: x1=656, y1=300, x2=759, y2=490 | **flip horizontal** |
| Derecha (x: 62–124) | mitad der de arco_top | frente_manga_IZQ: x1=80, y1=300, x2=199, y2=490 | **flip horizontal** |

### PIEZA 5 — arco_bot (MANGA ESPALDA)
- **Canvas bbox (escala 30%):** x1=354, y1=165, x2=478, y2=253 (124x88px)
- **Máscara:** `assets/masks/arco_bot.png` (124x88px)
- **La pieza se divide a la mitad verticalmente igual que arco_top**

| Mitad | Rango en canvas | Destino en polo | Transformación |
|-------|----------------|-----------------|----------------|
| Izquierda (x: 0–62) | mitad izq de arco_bot | espalda_manga_DER: x1=1370, y1=300, x2=1479, y2=490 | **flip horizontal** |
| Derecha (x: 62–124) | mitad der de arco_bot | espalda_manga_IZQ: x1=840, y1=300, x2=915, y2=490 | **flip horizontal** |

---

## CÓMO APLICAR EL FLIP HORIZONTAL EN CANVAS 2D

```javascript
function drawFlipped(srcCanvas, destCtx, dx, dy, dw, dh) {
  destCtx.save();
  destCtx.translate(dx + dw, dy);  // mover origen al lado derecho
  destCtx.scale(-1, 1);            // espejo horizontal
  destCtx.drawImage(srcCanvas, 0, 0, dw, dh);
  destCtx.restore();
}
```

---

## CÓMO APLICAR UNA PIEZA CON MÁSCARA AL POLO

```javascript
// Para cada pieza (ej: frente):
function renderPieza(pieceOffscreen, maskImg, destCtx, dest) {
  // 1. Crear canvas temporal del tamaño de la pieza
  const tmp = document.createElement('canvas');
  tmp.width = pieceOffscreen.width;
  tmp.height = pieceOffscreen.height;
  const tmpCtx = tmp.getContext('2d');

  // 2. Dibujar la pintura del usuario
  tmpCtx.drawImage(pieceOffscreen, 0, 0);

  // 3. Aplicar máscara — recorta los píxeles fuera de la silueta
  tmpCtx.globalCompositeOperation = 'destination-in';
  tmpCtx.drawImage(maskImg, 0, 0, tmp.width, tmp.height);
  tmpCtx.globalCompositeOperation = 'source-over';

  // 4. Proyectar al polo con multiply para respetar arrugas
  destCtx.save();
  destCtx.globalAlpha = 0.85;
  destCtx.globalCompositeOperation = 'multiply';
  destCtx.drawImage(tmp, dest.x1, dest.y1, dest.x2 - dest.x1, dest.y2 - dest.y1);
  destCtx.restore();
}
```

---

## CÓMO PARTIR LA PIEZA DE MANGA A LA MITAD

```javascript
// arco_top en escala 30% es 124x88px → mitad en x=62
function renderManga(arcCanvas, maskImg, destCtx, side, dest) {
  const halfW = Math.floor(arcCanvas.width / 2);
  const h = arcCanvas.height;

  // Extraer la mitad correcta
  const half = document.createElement('canvas');
  half.width = halfW;
  half.height = h;
  const halfCtx = half.getContext('2d');

  const srcX = side === 'left' ? 0 : halfW;
  halfCtx.drawImage(arcCanvas, srcX, 0, halfW, h, 0, 0, halfW, h);

  // Aplicar máscara (mitad correspondiente de la máscara)
  const maskHalf = document.createElement('canvas');
  maskHalf.width = halfW;
  maskHalf.height = h;
  const maskHalfCtx = maskHalf.getContext('2d');
  maskHalfCtx.drawImage(maskImg, srcX, 0, halfW, h, 0, 0, halfW, h);

  halfCtx.globalCompositeOperation = 'destination-in';
  halfCtx.drawImage(maskHalf, 0, 0);
  halfCtx.globalCompositeOperation = 'source-over';

  // Dibujar en el polo con flip horizontal
  const dw = dest.x2 - dest.x1;
  const dh = dest.y2 - dest.y1;
  destCtx.save();
  destCtx.globalAlpha = 0.85;
  destCtx.globalCompositeOperation = 'multiply';
  destCtx.translate(dest.x1 + dw, dest.y1);
  destCtx.scale(-1, 1);
  destCtx.drawImage(half, 0, 0, dw, dh);
  destCtx.restore();
}

// Uso:
// Manga frente derecha: renderManga(arcoTopCanvas, maskArcoTop, poloCtx, 'left',  {x1:656, y1:300, x2:759, y2:490})
// Manga frente izq:     renderManga(arcoTopCanvas, maskArcoTop, poloCtx, 'right', {x1:80,  y1:300, x2:199, y2:490})
// Manga espalda der:    renderManga(arcoBotCanvas, maskArcoBot, poloCtx, 'left',  {x1:1370,y1:300, x2:1479,y2:490})
// Manga espalda izq:    renderManga(arcoBotCanvas, maskArcoBot, poloCtx, 'right', {x1:840, y1:300, x2:915, y2:490})
```

---

## ORDEN DE RENDERIZADO DEL POLO

```javascript
function renderPolo() {
  poloCtx.clearRect(0, 0, POLO_W, POLO_H);

  // 1. Dibujar foto del polo como fondo
  poloCtx.drawImage(poloImg, 0, 0);

  // 2. Frente — cuerpo
  renderPieza(piezaCanvases.frente, masks.frente, poloCtx,
    {x1:199, y1:260, x2:656, y2:830});

  // 3. Espalda — cuerpo
  renderPieza(piezaCanvases.espalda, masks.espalda, poloCtx,
    {x1:915, y1:260, x2:1370, y2:831});

  // 4. Mangas frente
  renderManga(piezaCanvases.arco_top, masks.arco_top, poloCtx, 'left',
    {x1:656, y1:300, x2:759, y2:490});
  renderManga(piezaCanvases.arco_top, masks.arco_top, poloCtx, 'right',
    {x1:80, y1:300, x2:199, y2:490});

  // 5. Mangas espalda
  renderManga(piezaCanvases.arco_bot, masks.arco_bot, poloCtx, 'left',
    {x1:1370, y1:300, x2:1479, y2:490});
  renderManga(piezaCanvases.arco_bot, masks.arco_bot, poloCtx, 'right',
    {x1:840, y1:300, x2:915, y2:490});

  // 6. Etiqueta (opcional, zona cuello)
  renderPieza(piezaCanvases.etiqueta, masks.etiqueta, poloCtx,
    {x1:350, y1:200, x2:500, y2:265});
}
```

---

## NOTAS IMPORTANTES

1. **multiply blend:** hace que el color pintado se oscurezca donde hay sombras
   en la foto del polo, dando sensación de tela real. Sin esto se ve plano.

2. **El flip es obligatorio en mangas:** la pieza del canvas está "volcada"
   respecto a cómo se ve en el polo. Sin flip queda al revés.

3. **Llamar renderPolo() en cada trazo del pincel** para actualización en tiempo real.

4. **Las máscaras están en escala 30%** — si se trabaja a otra escala,
   escalar las máscaras con el mismo factor antes de aplicarlas.

5. **globalAlpha = 0.85:** dejar un poco de transparencia para que las
   costuras y textura del polo sean visibles. Ajustar según preferencia visual.
