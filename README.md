# Dashboard Día de la Madre

Dashboard ejecutivo en React, Tailwind y Recharts para analizar desempeño operativo de dark kitchens durante Día de la Madre.

## Cómo correrlo

```powershell
node server.mjs
```

Luego abre:

```text
http://localhost:5173
```

## Qué hace

- Carga Google Sheets vía el proxy local `/api/sheet`.
- Detecta columnas disponibles con aliases flexibles.
- Normaliza cocina, ciudad, SKU, producto, hora y periodo.
- Calcula KPIs ejecutivos, rankings, variaciones vs domingo anterior, presión operativa, score de voleo, diagnóstico automático y comparación MEP sugerido vs venta real.
- Muestra advertencias cuando una columna o pestaña no puede detectarse, pero continúa con las métricas disponibles.
- Permite filtrar por ciudad, cocina, hora, periodo y SKU.
- Incluye tablas descargables en CSV.

## Nota sobre pestañas de Google Sheets

El servidor intenta cargar pestañas por nombre usando `gviz`. Si una pestaña no está disponible públicamente o Google no resuelve el nombre, agrega el `gid` exacto en `src/app.jsx`, dentro de `DEFAULT_SHEETS`.

Para `orders comparison`, Google no resolvió bien la pestaña por CSV aunque sí existe en el workbook. Se validó descargando el `.xlsx`: la pestaña real se llama `orders comparison`, corresponde a `sheet5.xml` y contiene 5.605 filas. El dashboard usa `data/orders-comparison.csv`, extraído con:

```powershell
node scripts/extract-workbook-sheet.mjs main_xlsx 5 data\orders-comparison.csv
```

El archivo adicional de MEP sugerido se extrae a `data/suggested-mep-all.csv` con las 26 hojas de cocina. Cada hoja toma el sugerido desde columna `O`, SKU desde columna `D` y clasificación desde columna `A`.

```powershell
node scripts/download-url.mjs "https://docs.google.com/spreadsheets/d/1d1TNvKUz9-QsRPpDxHnvq9YWw7UmVRhpDwRe-eOSJzY/export?format=xlsx" mep.xlsx
Copy-Item -LiteralPath mep.xlsx -Destination mep.zip -Force
Expand-Archive -LiteralPath mep.zip -DestinationPath mep_xlsx -Force
node scripts/extract-all-mep-sheets.mjs mep_xlsx data\suggested-mep-all.csv
```

El extractor usa el nombre de la hoja para garantizar los 26 `kitchen_id`, porque algunas hojas descargadas traen `B2` heredado de otra cocina.
