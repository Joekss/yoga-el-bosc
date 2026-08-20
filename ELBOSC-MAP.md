# El Bosc · Mapa conceptual (diagrama amb connexions i colors)

> Aquest fitxer conté un diagrama Mermaid amb connexions entre els fitxers principals del projecte. Obre'l amb un visor que suporti Mermaid (VS Code amb extensió Mermaid, o https://mermaid.live/).

## Diagrama (Mermaid)

```mermaid
graph TD
  %% Nodes amb informació i mida
  index["index.html<br/><small>3.63 KB</small>"]
  pkg["package.json<br/><small>206 B (npm start)</small>"]
  manifest["manifest.webmanifest<br/><small>0.64 KB</small>"]
  sw["sw.js<br/><small>5.30 KB (service worker)</small>"]
  vendor["vendor/<br/><small>Babel 3.00 MB, React</small>"]
  styles["styles/<br/><small>tokens.css, shell.css</small>"]
  icons["icons/<br/><small>png: 152/192/512</small>"]
  uploads["uploads/<br/><small>imatges d'usuari</small>"]

  %% App i components
  app["app.jsx<br/><small>9.07 KB</small>"]
  subgraph COMPONENTS ["components/ (React)"]
    Auth["Auth.jsx<br/><small>38.86 KB</small>"]
    Chat["Chat.jsx<br/><small>77.49 KB</small>"]
    Screens["Screens.jsx<br/><small>33.30 KB</small>"]
    Onboarding["Onboarding.jsx<br/><small>14.13 KB</small>"]
    Practice["Practice.jsx<br/><small>5.91 KB</small>"]
    Pose["PoseIllustrations.jsx<br/><small>5.98 KB</small>"]
    IconsComp["Icons.jsx<br/><small>5.36 KB</small>"]
  end

  subgraph DATA ["data/ (dades i lògica)"]
    asanas["asanas.jsx<br/><small>24.98 KB</small>"]
    i18n["i18n.jsx<br/><small>14.07 KB</small>"]
    seq["sequencer.jsx<br/><small>4.28 KB</small>"]
  end

  %% Relacions principals (fletxes amb etiquetes senzilles)
  index -- "carrega" --> vendor
  index -- "carrega" --> app
  index -- "registra" --> sw
  index -- "usa" --> manifest
  index -- "aplica estils" --> styles

  app -- "orquestra / mostra pantalles" --> Screens
  app -- "carrega components" --> Auth
  app -- "carrega components" --> Onboarding
  app -- "carrega components" --> Practice
  app -- "carrega components" --> Chat

  Auth -- "gestiona credencials" --> localStorage["localStorage / sessió"]
  Auth -- "textos" --> i18n
  Onboarding -- "textos" --> i18n
  Practice -- "seqüències" --> seq
  Practice -- "llista postures" --> asanas
  Chat -- "pot usar" --> asanas
  Chat -- "textos" --> i18n

  %% Service worker caché i offline
  sw -- "emmagatzema (cache)" --> index
  sw -- "emmagatzema" --> vendor
  sw -- "emmagatzema" --> styles
  sw -- "emmagatzema" --> icons
  sw -- "pot emmagatzemar" --> uploads

  %% Vendor i transpilat
  vendor -- "Babel compila JSX al vol" --> app
  vendor -- "React/ReactDOM provee UI" --> COMPONENTS

  %% Package / start
  pkg -- "script npm start -> npx serve" --> index

  %% Classes per color
  class index,pkg,manifest,sw,vendor,styles,icons,uploads root;
  class app,Auth,Chat,Screens,Onboarding,Practice,Pose,IconsComp comp;
  class asanas,i18n,seq data;

  classDef root fill:#FFF3E0,stroke:#F57C00,stroke-width:1px,color:#000;
  classDef comp fill:#E8F5E9,stroke:#2E7D32,stroke-width:1px,color:#000;
  classDef data fill:#E3F2FD,stroke:#1565C0,stroke-width:1px,color:#000;
  classDef localStorage fill:#FFF9C4,stroke:#F9A825,stroke-width:1px,color:#000;

  class localStorage localStorage

  linkStyle 0,1,2,3 stroke:#888,stroke-width:1px

  %% Etiquetes de grup per llegenda
  classDef legend fill:#fafafa,stroke:#ccc,color:#000;

``` 

## Llegenda (colors)
- Nodes taronja clar (arrel / recursos) — fitxers que serveixen l'aplicació i recursos PWA (index.html, sw.js, manifest, vendor, styles, icons). 
- Nodes verd clar (components) — components React que mostren la interfície (Auth, Chat, Practice...)
- Nodes blau clar (data) — fitxers amb dades i lògica no UI (asanas, i18n, sequencer)
- Node groc (localStorage) — on es guarda sessió/localStorage a l'execució

## Notes
- Obre aquest fitxer en un visor Mermaid per veure el diagrama amb colors i connexions interactives.
- Si vols puc generar també una imatge SVG del diagrama i pujar-la al repo perquè es vegi directament al navegador.
