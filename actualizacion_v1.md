# ACTUALIZACIÓN DE ASSETS — Editor de Sublimación
# Pega esto a tu asistente de VS Code tal cual

---

Necesito que actualices el editor con los nuevos assets.
NO reescribas el código desde cero — solo actualiza lo que corresponde
a las coordenadas, rutas de máscaras y mapeo al polo.

---

## NUEVA ESTRUCTURA DE ARCHIVOS

```
assets/
  template.png         ← NUEVO (1280x720px) — reemplaza el anterior
  polo.png             ← sin cambios
  masks/
    frente.png         ← NUEVA máscara (364x487px)
    espalda.png        ← NUEVA máscara (371x488px)
    manga_arriba.png   ← NUEVA máscara (251x153px) — antes arco_top
    manga_abajo.png    ← NUEVA máscara (251x153px) — antes arco_bot, mismo archivo
```

---

## NUEVOS BOUNDING BOXES EN EL TEMPLATE (1280x720px)

Reemplaza todos los bboxes anteriores con estos:

```javascript
const BBOXES = {
  frente:       { x1: 63,  y1: 112, x2: 436,  y2: 601 },
  espalda:      { x1: 500, y1: 104, x2: 869,  y2: 593 },
  manga_arriba: { x1: 964, y1: 167, x2: 1214, y2: 319 },
  manga_abajo:  { x1: 960, y1: 389, x2: 1215, y2: 539 },
};
```

---

## NUEVAS RUTAS DE MÁSCARAS

```javascript
const MASK_PATHS = {
  frente:       'assets/masks/frente.png',
  espalda:      'assets/masks/espalda.png',
  manga_arriba: 'assets/masks/manga_arriba.png',
  manga_abajo:  'assets/masks/manga_abajo.png',  // mismo archivo que manga_arriba
};
```

---

## MAPEO AL POLO (polo.png — 1536x1024px) — sin cambios en destinos

```javascript
// FRENTE → proyección directa
// fuente template: x1=68, y1=112, w=363, h=486
// destino polo:    x1=199, y1=260, x2=656, y2=830

// ESPALDA → proyección directa
// fuente template: x1=496, y1=112, w=370, h=487
// destino polo:    x1=915, y1=260, x2=1370, y2=831

// MANGA_ARRIBA (B+C) — se parte a la mitad en x=125, flip horizontal en ambas mitades
// mitad izq (x:0–125)   → manga B frente der:   polo x1=656,  y1=300, x2=759,  y2=490
// mitad der (x:125–250) → manga C espalda izq:  polo x1=840,  y1=300, x2=915,  y2=490

// MANGA_ABAJO (A+D) — se parte a la mitad en x=127, flip horizontal en ambas mitades
// mitad izq (x:0–127)   → manga A frente izq:   polo x1=80,   y1=300, x2=199,  y2=490
// mitad der (x:127–255) → manga D espalda der:  polo x1=1370, y1=300, x2=1479, y2=490
```

---

## FUNCIÓN projectZone — reemplaza la anterior completa

```javascript
function projectZone(srcImg, destCtx, src, dest, maskImg, flipH) {
  const tmp = document.createElement('canvas');
  tmp.width = src.sw; tmp.height = src.sh;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.drawImage(srcImg, src.sx, src.sy, src.sw, src.sh, 0, 0, src.sw, src.sh);

  if (maskImg) {
    tmpCtx.globalCompositeOperation = 'destination-in';
    tmpCtx.drawImage(maskImg, 0, 0, src.sw, src.sh);
    tmpCtx.globalCompositeOperation = 'source-over';
  }

  destCtx.save();
  destCtx.globalAlpha = 0.85;
  destCtx.globalCompositeOperation = 'multiply';
  if (flipH) {
    destCtx.translate(dest.dx + dest.dw, dest.dy);
    destCtx.scale(-1, 1);
    destCtx.drawImage(tmp, 0, 0, dest.dw, dest.dh);
  } else {
    destCtx.drawImage(tmp, dest.dx, dest.dy, dest.dw, dest.dh);
  }
  destCtx.restore();
}
```

---

## FUNCIÓN renderPolo — reemplaza la anterior completa

```javascript
function renderPolo() {
  const fabricDataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
  const fabricImg = new Image();
  fabricImg.onload = () => {
    poloCtx.clearRect(0, 0, 1536, 1024);
    poloCtx.drawImage(poloImg, 0, 0);

    // Frente
    projectZone(fabricImg, poloCtx,
      { sx:68,  sy:112, sw:363, sh:486 },
      { dx:199, dy:260, dw:457, dh:570 },
      masks.frente, false
    );

    // Espalda
    projectZone(fabricImg, poloCtx,
      { sx:496, sy:112, sw:370, sh:487 },
      { dx:915, dy:260, dw:455, dh:571 },
      masks.espalda, false
    );

    // Manga arriba — mitad izq → manga B (frente der) con flip
    projectZone(fabricImg, poloCtx,
      { sx:964,  sy:167, sw:125, sh:152 },
      { dx:656,  dy:300, dw:103, dh:190 },
      masks.manga_arriba, true
    );

    // Manga arriba — mitad der → manga C (espalda izq) con flip
    projectZone(fabricImg, poloCtx,
      { sx:1089, sy:167, sw:125, sh:152 },
      { dx:840,  dy:300, dw:75,  dh:190 },
      masks.manga_arriba, true
    );

    // Manga abajo — mitad izq → manga A (frente izq) con flip
    projectZone(fabricImg, poloCtx,
      { sx:960,  sy:389, sw:127, sh:150 },
      { dx:80,   dy:300, dw:119, dh:190 },
      masks.manga_abajo, true
    );

    // Manga abajo — mitad der → manga D (espalda der) con flip
    projectZone(fabricImg, poloCtx,
      { sx:1087, sy:389, sw:128, sh:150 },
      { dx:1370, dy:300, dw:109, dh:190 },
      masks.manga_abajo, true
    );
  };
  fabricImg.src = fabricDataUrl;
}
```

---

## NOTAS PARA EL ASISTENTE

- `manga_abajo.png` y `manga_arriba.png` son el mismo archivo físico — cárgalos por separado igual
- El canvas de Fabric sigue siendo 1280x720 (tamaño del template)
- polo.png sigue siendo 1536x1024 — el canvas del preview también
- El resto del código (UI, herramientas, deshacer/rehacer, etc.) no cambia
