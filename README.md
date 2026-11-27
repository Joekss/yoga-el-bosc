# El Bosc · Ioga personalitzat — PWA

Aplicación web instalable (PWA) para las alumnas de Cèlia: práctica de yoga personalizada según un cuestionario, biblioteca de posturas, calendario, diario y chat con la profesora.

Estado: beta.

## Cómo funciona

- **Interfaz**: React 18 sin paso de compilación. Los archivos `.jsx` se cargan con `<script type="text/babel">` y se compilan en el navegador (`vendor/babel.min.js`). Todo lo necesario está en `vendor/`, sin CDN.
- **Servidor**: [Supabase](https://supabase.com) para el acceso (correo con enlace o código de 6 cifras), los roles, el cuestionario, el registro de prácticas, el catálogo de posturas y el chat. Las reglas de seguridad (RLS) están en `supabase/migrations/`.
- **Sin conexión**: el service worker (`sw.js`) guarda la app; lo que se hace sin red se envía al recuperarla.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `index.html` | Página de la app (producción) |
| `YOGA El Bosc.html` | Página de diseño con marco de iPhone y panel de ajustes |
| `app.jsx` | Estado global, acceso y navegación |
| `components/` | Pantallas: acceso, consentimiento, cuestionario, práctica, chat… |
| `data/backend.jsx` | Toda la comunicación con Supabase |
| `data/asanas.jsx` | Posturas y catálogo de la profesora |
| `supabase/` | Migraciones SQL y guía de configuración |
| `tests/` | Pruebas de los flujos principales con un Supabase simulado |
| `privacitat.html` | Política de privacidad |

## Arrancar en local

Requisitos: Python 3 (servidor estático) y Node.js 18+ para las pruebas.

```bash
npm start
```

Abre http://localhost:5000.

## Pruebas

```bash
npm test
```

Recorren el acceso (invitación, código, alumna revocada, profesora), el consentimiento, el cuestionario, la práctica, el catálogo compartido, el chat y el borrado de cuenta. Usan `tests/fake-supabase.js`, así que no tocan datos reales. Se ejecutan también en GitHub en cada pull request (`.github/workflows/tests.yml`).

## Configurar Supabase

Sigue `supabase/README.md`: ejecutar las migraciones, hacer profesora a Cèlia, plantilla del correo con código y direcciones permitidas.

## Publicar

La app se publica sola en **GitHub Pages** (`https://joekss.github.io/yoga-el-bosc/`) cada vez que se fusiona un cambio en `main` (`.github/workflows/deploy.yml`): compila `dist/`, pasa las pruebas y la publica.

Activarlo una vez: en GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Para generar la versión optimizada a mano:

```bash
npm install
```

```bash
npm run build
```

`dist/` es la misma app pero compilada antes: abre en unos 0,4 s en un móvil lento en vez de unos 9 s, y la versión de caché se calcula sola en cada build. La raíz del repositorio sigue funcionando sin compilar (útil para desarrollar con `npm start`).

## Licencia

Software propietario. © 2026 Cèlia Cuña Betriu. Todos los derechos reservados. Ver `LICENSE`.

Per a consultes o per sol·licitar permisos d'ús, contacteu amb la propietària.
