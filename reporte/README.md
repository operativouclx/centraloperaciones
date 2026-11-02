# Reporte mensual (Santander)

Módulos del navegador (sin servidor). Se abren con el botón **Reporte mensual** de la central.

- `metricas.js` motor de métricas, chips, no retroceso, NPS, frescura (también corre en Node).
- `dashboard.js` página de 1240 × 958 y documento de impresión (carta horizontal, escala 0.8516).
- `export-pdf.js` iframe + `print()`; respaldo "Descarga rápida" (jsPDF 2.5.1 + html2canvas 1.4.1, cdnjs).
- `export-xlsx.js` base completa con ExcelJS. `correo.js` texto del correo. `ui.js` pantalla.

## Pruebas
```
node --test tests/metricas.test.js
```
`tests/harness.html` abre la pantalla con datos inventados (servir la carpeta con cualquier servidor estático).

## Firestore
Colecciones nuevas (no se tocó la estructura existente): `config_reporte/{slug}` y
`cierres/{AAAA-MM}/cursos/{slug}`. Reglas necesarias (ajusta a las que ya tengas):

```
match /config_reporte/{doc} { allow read, write: if request.auth != null && request.auth.token.email.matches('.*@uclx[.]media'); }
match /cierres/{periodo} { allow read, write: if request.auth != null && request.auth.token.email.matches('.*@uclx[.]media');
  match /cursos/{curso} { allow read, write: if request.auth != null && request.auth.token.email.matches('.*@uclx[.]media'); } }
```

El NPS cargado desde el reporte vive en `config_reporte/{slug}.nps_actual` (solo conteos);
si no existe se usa el NPS que ya tenga el curso en `courses/{slug}.nps`.
