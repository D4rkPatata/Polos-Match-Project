# BRIEFING PARA ASISTENTE VS CODE
# Editor de sublimación de polos — Contexto y datos

---

## OBJETIVO
Construir un editor de diseño de sublimación para polos.
El usuario pintará sobre las piezas del molde (canvas izquierdo)
y verá el resultado reflejado en una vista 2D del polo (derecha).

---

## IMAGEN DE FONDO DEL CANVAS
El usuario colocará la imagen del template en una carpeta del proyecto.
- Ruta sugerida: `assets/template.png`
- Tamaño original: **1672x941 px**
- Descripción: imagen gris con 5 piezas de sublimación en blanco,
  bordeadas por líneas azul (interior) y verde (exterior).
- Esta imagen es el FONDO del canvas de edición. NO se modifica.
- Se debe dibujar encima de ella (la pintura va debajo de los bordes).

---

## ESCALA DE TRABAJO
Para el canvas del editor se recomienda trabajar al **30% del tamaño original**:
- Tamaño de trabajo: **501x282 px**
- Factor: imagen_original × 0.3
- Todas las coordenadas abajo están en esta escala (501x282).

Si se prefiere trabajar en resolución original (1672x941), multiplicar
todas las coordenadas por 1/0.3 = 3.333...
Los valores exactos en resolución original también se incluyen abajo.

---

## PIEZAS DEL MOLDE — ÁREAS DE EDICIÓN

Hay 5 piezas. Cada una tiene:
1. Un bounding box (rectángulo delimitador) — determina en qué zona está la pieza
2. Una máscara PNG — determina exactamente qué píxeles son pintables (respeta curvas)

### COORDENADAS EN ESCALA DE TRABAJO (501x282 px)

| Pieza     | x1  | y1  | x2  | y2  | ancho | alto |
|-----------|-----|-----|-----|-----|-------|------|
| frente    |  15 |  15 | 169 | 258 |  154  |  243 |
| espalda   | 182 |  20 | 339 | 254 |  156  |  234 |
| etiqueta  | 354 |  30 | 478 |  62 |  124  |   32 |
| arco_top  | 354 |  71 | 478 | 159 |  124  |   88 |
| arco_bot  | 354 | 165 | 478 | 253 |  124  |   88 |

### COORDENADAS EN RESOLUCIÓN ORIGINAL (1672x941 px)

| Pieza     | x1   | y1  | x2   | y2  | ancho | alto |
|-----------|------|-----|------|-----|-------|------|
| frente    |   51 |  51 |  564 | 860 |  513  |  809 |
| espalda   |  609 |  68 | 1130 | 847 |  521  |  779 |
| etiqueta  | 1182 | 100 | 1595 | 208 |  413  |  108 |
| arco_top  | 1182 | 237 | 1595 | 530 |  413  |  293 |
| arco_bot  | 1182 | 553 | 1595 | 846 |  413  |  293 |

---

## MÁSCARAS PNG (base64)

Cada máscara es un PNG en escala de grises donde:
- BLANCO (> 128) = píxel pintable (dentro de la pieza)
- NEGRO (= 0)    = píxel NO pintable (fuera de la pieza, respeta curvas y esquinas)

Las máscaras tienen exactamente el tamaño del bounding box de cada pieza.
Se aplican con `globalCompositeOperation = 'destination-in'` en Canvas 2D.

### Cómo usar la máscara en Canvas:

```javascript
// Para cada pieza, crear un offscreen canvas del tamaño de la pieza
const offscreen = document.createElement('canvas');
offscreen.width = bbox.w;   // ancho del bounding box
offscreen.height = bbox.h;  // alto del bounding box
const ctx = offscreen.getContext('2d');

// El usuario pinta directamente en este offscreen canvas

// Al renderizar, aplicar la máscara:
const tmp = document.createElement('canvas');
tmp.width = bbox.w;
tmp.height = bbox.h;
const tmpCtx = tmp.getContext('2d');

tmpCtx.drawImage(offscreen, 0, 0);                        // pintura del usuario
tmpCtx.globalCompositeOperation = 'destination-in';
tmpCtx.drawImage(maskImage, 0, 0, bbox.w, bbox.h);        // aplica máscara
tmpCtx.globalCompositeOperation = 'source-over';

// Dibujar en el canvas principal en la posición del bounding box
mainCtx.drawImage(tmp, bbox.x1, bbox.y1);

// Luego redibujar la imagen del template ENCIMA
// para que los bordes azul/verde tapen cualquier desborde
mainCtx.drawImage(templateImage, 0, 0);
```

### Base64 de las máscaras:

#### frente (154x243px)
```
iVBORw0KGgoAAAANSUhEUgAAAJoAAADzCAAAAABbb1BZAAAEUUlEQVR42u1d3dKrIAzMMn3/V95zIQhaVH6sX067XDkdi0uSTTZoq9lTg6bhbzzplfAgMvZ9P/TNjQet3gGNfDYi0DnnlNkIdkyBvsVi0mJYpsJtDiXNYMAsD4Ce1YVWixE2TYJirbwDGmFmABaIN1ChdYGva5MRuAUUEfNPY2C8GlfJdEgQk+AMBqPZxUzhwmIJGVKQYCLisD3mcKzRyEjLosRwLnvkg0h4DsQkt75cTuYETZM7iyufejVcsZt3iQ1WbISzmh+OLY99jsXi35sqKCtuuXQo7ehLMx7d+XND/qpXXycrq64GnDfYVmXBSFT0FvbrsrwAHqQ4jBmN9VUd0iHsT0phWS1z/IAEj4mEb4QLdbV4xMthbCepOhkBu6nD2ymnJGwugL2WA4w7cGEXaUAsR3bEAdxGgp3KXMQN32hAS+KYV3VwBB5BnNUklpfGxmqxkrd6i91GO6c1zbAUbOT0tFU8LdccMNuSttgwdexsDDHlErRzg1dm6G5Xmk8EI6OZY5vNwDrNxg5eZ9+FnC7YYQOwI8N1RWau+uhbU5EbcW/6KOm6gIqlq49yPY0u06W6hXoYSQbsOrW/eHD16kDhwRXxkoppy+PVC2CsIqIpKXAoXNIlwkytxunCaFgU1qhWGYW2RsJBS1RsWHH0CsNmw/HeViotmFg8MKO+ii9jk/qZrcnPREtrcqwDmBOdGE0eO2Ox9fMHoWUpupo/02JKqM9DO22zp+Zkf4E7nOk2WIWUHG/JP9ig0sLasXgaWJTHgPZ6ABkNYUBPPzSCuRw0LNDoFFy8lUhPoUZD7Kjoj540CwkZ3MELc5rtY0ZDuR3jLn+89nLBCzmj1Tx5NEvjkD+AT4e6S7ar1cDe50M+iazYxMotjJNgK61m8BJpBSND3p3xVuXDNvTcpI/SoS7qAcrsH5zljSKqwmk3+QdmwzsNvFT4d6s57FtC6WW6hOa62YNfaM4S7oYGcGY4d1arpVz6AAanKhf1vIb7Hrq6uYbCRfood/pXveamM1gTBcwXDwrlWNyqhbMMErI76YymYX3qyk8bWghwOKztXLt3BzltQ9L0MDzhbKcZaQfcHTJLG6aeyBlxLZCCyxstZumWhvfeQNB6oBH0bDXIob3Q6C2vUQwdF2y+rQY5dIyhbq0GOVTQfhRaUagoqwnar0PzVwsgh35rH+ru5pQcKmh/AI0+tYccKmhPCnBvtUDKQ9AE7b+poW7zmhz6DdBUDb6XBlIeqgaigbvtGNHgy2JNDhU0QRM0KQ9Zbac8tAMuaNJr0muKNUFzWQsohw5lEFlNheqXraYaOt0bQDQQDdS9O4bmtnvXb1tEA8WaCpWgPZg8HD/Ur21mQRM0QVOzpz5UUlKx9hw0/dKxGxr0wzhBEzTKaoImaIImaNJrcugXQnNZ4eH0BYA0uH0FYPynfooGfeNVDb6L2Dz9FMUbicsXAG9fBsztUW1KDY2nxj+c7ZGfKHcdawAAAABJRU5ErkJggg==
```

#### espalda (156x234px)
```
iVBORw0KGgoAAAANSUhEUgAAAJwAAADqCAAAAAByqHNNAAADNUlEQVR42u2d23ajMBRDj7z6/7+sebDxDQiQDFSZkd/aJnhXOhfbsJKINwfj/oEP0HDPqz+E45U3MxCMAK9Phs/8xFX3cR9cLxnBoyuwn6O+l/j7cESTAcf2cj0Dr86K85oh2EUOsW1bU4uBmFQqap+NP1xTDW0KMBNUno2Lc/B//f/gU7jJDHYsNXw4qDZemSva0wbjJBm2bWzR3c/HGpR4ka08zA+8jLKxevLaJXg4KQ8usXtljKlI8MiAohfjVRhu8OV4xnk4gjk5cV8nRRwJiF3RbsSa59/LX+y4OVaBJ9YeNeOxA8fh74+grTzq8DCzlar+DNYMyK7NYE39TKS90q+1H+YeuLXa+I1RxOHUqDe7zW/Q9V4iHqwb1+oLmCIQyClAEbZunciAjmaDv0yCYHWkYjG0dMtmpkCQiuohkFQtBRdbKWZrWeflUiKnG4MlISgYbkO26qmHDFdEFAu5otwH50339lfFUlIPZZKeaBjaV2hlbMuA1GChVEjQ4JYDI7HxU7WEUjpA1dYGklZrYyG8JFiDOdS5ss+HCpuqrdgqwlKurmJOhQzT7ks0Vyfl1DJCdvc1JQQ1LO1uPUmuhCla57hlq1SmYgOOVu7sBmKCk9tXq9k6HN3oFWHuxRwE0LDXvihgKnUTQrqUDF3+K1YlknU49eVFo39Rdpm+2/hltl6k8GJzOhOms/V0Ays29g/DCd2nZjtNJ0ipqCu3MVNwAVW5i062sxKNxyLW5pLLjTno5USOOYbmWXrEj1YmVO0QEfm5Ep1kWOItK7bzoKhGtYMkWXnMGbqPvKCrc4JNVnoPIWyr+u5LWDgkWLl/L+aobWsYznAuJQ3O2Wo4wxnOcIYznBu/bTWc4VxKbOt/D+cOYTjDGc5whjOc4QznZbrhDGc4774M5w5hOMMZznDurbbVcF6VOFsNZziXEpcSx5zhDOc6Z+UM5/ZlOMMZznCG85LJyr0x4Jh7Wzp/doThDPctRVh4gwO4fXnfajjDGc5whvPW0L3VCeGEcEI4Ibxvta221bZ+BRycEB6PBx2dEG8NLl/LW77noHxKPusv86tOKz/8CJZvKRx+2eY5HH8Aj5QCwtk2+ZoAAAAASUVORK5CYII=
```

#### etiqueta (124x32px)
```
iVBORw0KGgoAAAANSUhEUgAAAHwAAAAgCAAAAAD1OUPuAAAAjElEQVR42u2XwQrDMAxDn0L+/5ffDmWwww6hK1Uh8yUEHIQlK4kjtcjoQcM8FkCIx86Fk8Ys5X2FFcD4Br85bNIecBJXeL4eutpwwMCS4uCoKQ40aW9r3gv7lbsh7fs23APA8/f5dt1+/yXz8aRmr8r3tloofqPMJD3eB3rKJ1eYLc0p9Rx4fiXgmBVfzOUiQHxb8sAAAAAASUVORK5CYII=
```

#### arco_top (124x88px)
```
iVBORw0KGgoAAAANSUhEUgAAAHwAAABYCAAAAAASSMxCAAAByUlEQVR42u2azZKEIAyE05Tv/8q9BxTDjEpAfqYWPO1hyUcn6QBVAyn8CPo/IEKUxShZxlqhUIlcFA7WJMdoUC+lCIQghFl85ImGiDAsilGhC8xBkYXmscKLVFH21LAFnPF/XxUeio+6yk/NhmgMO3kNJxjJSsezJh85bKbDhaYUg3ok020WHQVV9Ps9wFjqHHZIfkqZszhbyCy23ymEL+Yhd//mgSPxeJTvEu1TyhYeFWORciYXG22X3XDcTVOOPsr+ANkeM/7+8/u/cRsapVyF5+28wZO9WU26XTktZ0he4a+lu8uzsyZbH/dJ5SyZp5ZR/81yFzlnXbaICLDfg5JpR222n3a0+rwuW5vuvub16/1h+Gd4LXub2g5fJmuDvqS7OOOQOiP9dmRjb7+vmzhE2unW2g/qx1W3KVszoOY++7DDY88nOuqC9uzQ0yD2l2UrcyceNXDd2efVMlyXuqFV48P5c6w3Ww2Z/mgYnkvt6n7CMWYHo5RjZM2HKpcfqflkaeeP1Fym9flkVuOacNOdags+9ZBZ8AVf8P8PH3Sec9V8wbueqyvt65Xa/w6HaWs+9KGIQeI3GUUHZRP9Q7aJLhNjfT7y4x94vqeKWFKXHgAAAABJRU5ErkJggg==
```

#### arco_bot (124x88px)
```
iVBORw0KGgoAAAANSUhEUgAAAHwAAABYCAAAAAASSMxCAAAB1ElEQVR42u2a2xKDIAxEc5z+/y9vHwQLispNnan41MuYI8myRNGs9VDiU+ZBK9FFUU0oarGYzAy1RJtK0Wwvheh6Lhq5js7RgqY/XIg50URXE34vxZOf71+K5UodVBwTxXSyE875hGKrg2Z4GE058bSqRgNcYdC8gJmDpy86Sj6tcDFHSThKTvJb4IpEVOAeXvpUO5xyFL5zppsfqhm5CCykeLVaQus4t9PhNWH1bB9GNTUXwprQy9JXOHJ5bTeyj8fOsZ82sU9Fz5GztKHDqlMouC7sUPZ5I8+ao2WqQynSlPaWjmwzAyXjcWG9N7OdM3h/tqeTq3Z6wueCJ+yGlK91HXasePbhss5S2zY47KhdtTdPOYusnNVIaTgSzMvpRQdxI8q6V9OV5F9bFtVchV1iW+EddnIFoapXKy58lPow0VzNXjXh+DswGTeQV2317CkdGqY6r5fdIbWk3+GVfyfa4/mYPYCueyZzAVxPwrG3pn3Ab53mI+0DPuBjVRtpH/D/g9/fRum183w0E88dGml/E3x+MPFGex0ONx4OjPX8/9POENxLTeYTbXrcnPmP30fzL5Mlp53b4wz/XN68UrxP418l8i/Pafl9u6WAniv5s83EF98Mro6hpXF7AAAAAElFTkSuQmCC
```

---

## LÓGICA GENERAL DEL EDITOR

### Stack recomendado
- HTML + Canvas 2D API (vanilla JS) o React con useRef
- Sin librerías externas necesarias

### Capas del canvas principal (de abajo hacia arriba):
1. Imagen template.png (fondo)
2. Pintura del usuario por pieza (con máscara aplicada)
3. Imagen template.png otra vez (para que los bordes tapen desbordes)
4. Canvas de interacción (transparente, captura eventos de mouse/touch)

### Flujo de pintado:
1. Usuario selecciona una pieza (frente, espalda, etc.)
2. El click/drag solo se procesa si cae dentro del bounding box de esa pieza
3. Se pinta en el offscreen canvas de esa pieza
4. Al renderizar, se aplica la máscara PNG → los píxeles fuera de la silueta desaparecen
5. Se redibuja el template encima para restaurar bordes

### Restricción importante:
- El pincel SOLO debe activarse si el punto de click está dentro del bounding box
  de la pieza actualmente seleccionada.
- Esto evita pintar en el área de otra pieza sin querer.

---

## ARCHIVOS A INCLUIR EN EL PROYECTO

```
assets/
  template.png         ← imagen que el usuario pondrá aquí
masks/
  frente.png           ← decodificar los base64 de arriba y guardar
  espalda.png
  etiqueta.png
  arco_top.png
  arco_bot.png
```

O alternativamente, embeber los base64 directamente en el JS/HTML.

---

## NOTAS FINALES
- Las máscaras fueron generadas automáticamente detectando los píxeles blancos
  (valor > 248 en RGB) del interior de cada pieza.
- La separación entre la espalda y las 3 piezas derechas empieza en x=1182
  (en resolución original), equivalente a x=354 en escala de trabajo.
- Los bounding boxes fueron verificados visualmente y están correctos.
