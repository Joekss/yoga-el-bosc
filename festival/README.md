# Festival Timetable

App PWA independiente para gestionar timetables de festivales (música electrónica, conciertos, etc.).

> **No mezcla código con la app de yoga del repo**: vive aislada en esta carpeta con su propio `package.json`, build, manifest y service worker.

## Características

- **Importar lineup** desde:
  - Texto pegado (parser local con regex/heurística, sin conexión)
  - Foto del flyer (Claude API con visión)
  - PDF de la web (extracción local con pdf.js o Claude API si quieres más precisión)
  - HTML de la web (limpieza local + parser, o Claude API)
- **Timetable visual** con escenarios en columnas y horas en filas, con línea de "ahora".
- **Highlight por celdas**: marca cada set como ★ Imprescindible / ◐ Quizá / ✕ Paso o aplica un color libre.
- **Alarmas** locales por set vía Notification API + Service Worker (los sets `must` reciben aviso por defecto).
- **Vista Watch** compacta pensada para Apple Watch / Wear OS vía notificaciones del móvil emparejado y UI minimal.
- **Offline-first**: todo se guarda en IndexedDB; sin servidor.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Zustand + idb-keyval para estado y persistencia
- vite-plugin-pwa para manifest y service worker
- pdfjs-dist para PDF → texto en cliente
- @anthropic-ai/sdk con `dangerouslyAllowBrowser` para la integración con Claude

## Empezar

```bash
cd festival
npm install
npm run dev      # arranca el servidor de desarrollo
npm run build    # compila a dist/
npm run preview  # sirve la build
```

## Configurar Claude API

1. Abre la app y ve a **Ajustes**.
2. Pega tu Anthropic API key (`sk-ant-...`). Se guarda solo en tu dispositivo.
3. En **Importar → Foto/PDF/HTML**, activa "Usar Claude API" cuando quieras delegar la extracción.

## Instalación como PWA

Desde Chrome/Safari móvil: *Compartir → Añadir a pantalla de inicio*. Una vez instalada en el móvil, las notificaciones llegan también al smartwatch emparejado.
