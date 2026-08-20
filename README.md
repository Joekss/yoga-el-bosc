# El Bosc · Ioga personalitzat — PWA

Breve descripción
El Bosc és una aplicació web progressiva (PWA) per a sessions de ioga personalitzades: seqüències, seguiment de progrés i una experiència optimitzada per a dispositius mòbils. Aquest repositori conté la interfície (principalment JavaScript/TypeScript) i actius per a la PWA.

[![Estado](https://img.shields.io/badge/status-beta-yellow)](https://github.com/Joekss/yoga-el-bosc) [![Lenguajes](https://img.shields.io/badge/JavaScript-75.7%25-orange)](https://github.com/Joekss/yoga-el-bosc) [![Lenguajes](https://img.shields.io/badge/TypeScript-18.6%25-blue)](https://github.com/Joekss/yoga-el-bosc)

## Tabla de contenidos
- [Acerca del proyecto](#acerca-del-proyecto)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Uso](#uso)
- [PWA / Despliegue](#pwa--despliegue)
- [Configuración](#configuración)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Acerca del proyecto
El Bosc és una PWA pensada per oferir ioga personalitzat: crear i seguir seqüències, guardar preferències i utilitzar l'app offline en mòbil i escriptori. L'objectiu és una experiència lleugera i ràpida amb un enfocament mòbil first.

Estado: Beta

## Características
- Seqüències de ioga personalitzables
- Interfície adaptada a mòbils (PWA)
- Ús offline amb sincronització quan hi ha connexió
- Interfície simple i accessible

## Tecnologías
Composició del repositori (estimat):
- JavaScript — 75.7%
- TypeScript — 18.6%
- HTML — 3.1%
- CSS — 2.6%

Stack esperat (ajusta si és diferent):
- Frontend: JavaScript / TypeScript (pot ser una app amb framework com React, Vue o similar)
- PWA: manifest.json, service worker
- Build / Tooling: (Vite / Webpack / Create React App / etc.) — [Rellenar]

## Instalación
Requisitos previs:
- Node.js >= 14 (o la versió requerida pel projecte)
- npm o yarn

Clona el repositori:
```bash
git clone https://github.com/Joekss/yoga-el-bosc.git
cd yoga-el-bosc
```
Instal·la dependències:
```bash
# amb npm
npm install

# o amb yarn
yarn
```

## Uso
Comandes comunes (ajusta segons el package.json):
```bash
# mode desenvolupament
npm run dev
# o
yarn dev

# build per producció
npm run build
# o
yarn build

# servir build localment (opcional)
npm run serve
```

Si utilitzeu TypeScript, assegureu-vos de compilar/activar l'server de desenvolupament corresponent (p. ex. `tsc --noEmit` o integrat en l'script `dev`).

## PWA / Despliegue
- Comprova que `manifest.json` i el service worker estan correctament configurats.
- Per desplegar: Netlify, Vercel, GitHub Pages (si és estàtica) o qualsevol hosting d'static files.
- Verifica el suport offline i la correcta gestió de rutes.

## Configuración
Variables d'entorn (afegeix `.env.example` al repo):
- VITE_API_URL=http://api.example.com
- NODE_ENV=production
- OTHER_KEY=[Rellenar]

## Contribuir
1. Fes fork del repositori.
2. Crea una branca: `git checkout -b feature/mi-cambio`.
3. Afegeix commits clars i proves si s'escau.
4. Obre un Pull Request descrivint els canvis.

## Licencia
[Aquesta app es propietat de Cèlia Betriu Acunya]

MIT © 2026 Joekss

## Contacto
Autor: Joekss
Repositorio: https://github.com/Joekss/yoga-el-bosc

## - Avis Legal - Aviso legal
La propietat i ús Aquesta aplicació, el seu codi, dissenys, continguts i tots els materials associats són propietat exclusiva de La Cèlia Cuña Betriu. L’usuari no està autoritzat a copiar, modificar, redistribuir o fer un ús comercial del programari sense l’autorització prèvia i per escrit del propietari. Qualsevol ús indegut, alteració no autoritzada o explotació il·licitada d’aquestes aportacions podrà ser objecte d’accions legals i reclamacions per danys i perjudicis, segons la legislació aplicable.

Per a consultes o per sol·licitar permisos d’ús: contacta amb Joelreintegra@gmail.com

Peu de pàgina / copyright (breu) © 2026 La Cèlia. Tots els drets reservats. L’ús, la modificació o la distribució no autoritzats poden donar lloc a accions legals.

---

