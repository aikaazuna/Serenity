# ColorFlow

Color picker professionnel pour Windows — pipette système, formats développeurs,
générateur de palettes, analyse de contraste WCAG, historique, favoris et export.
Interface glassmorphism premium (Electron + React + TypeScript + Tailwind + Framer Motion).

![Node](https://img.shields.io/badge/node-%3E%3D18-informational)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Sommaire

- [Aperçu](#aperçu)
- [Choix techniques](#choix-techniques)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Scripts npm](#scripts-npm)
- [Build & installateur Windows](#build--installateur-windows)
- [Fonctionnalités](#fonctionnalités)
- [Raccourcis clavier](#raccourcis-clavier)

## Aperçu

ColorFlow est une application desktop Windows complète destinée aux développeurs,
designers et graphistes. Elle reste accessible en permanence depuis la barre système
et permet de capturer, analyser, convertir et organiser des couleurs sans quitter
son flux de travail.

## Choix techniques

| Domaine        | Choix                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Shell desktop   | **Electron** (Main process / Renderer séparés, `contextIsolation`)     |
| UI              | **React 18** + **TypeScript strict**                                   |
| Build           | **Vite** (renderer + fenêtre pipette), **tsc** (main process ESM)      |
| Style           | **Tailwind CSS** (design system glassmorphism, variables CSS pour les thèmes) |
| Animations      | **Framer Motion** (transitions de pages, listes, notifications, pipette) |
| Composants      | **Radix UI** (Dialog, Select, Switch, Tabs, Tooltip) — accessibles et sans style imposé |
| État            | **Zustand** (store applicatif persistant + store UI éphémère)          |
| Couleur         | **colorjs.io** (LAB / OKLCH), conversions maison pour RGB/HSL/HSV/CMYK  |
| Stockage local  | **electron-store** (JSON chiffré sur disque, jamais accédé directement par le renderer) |
| Packaging       | **electron-builder** (NSIS + portable, icône .ico multi-résolutions)   |

### Sécurité / architecture Electron

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` sur **toutes** les fenêtres (principale + pipette).
- Aucun accès direct à Node.js depuis React : tout passe par un **preload** qui expose une API
  typée et minimale via `contextBridge` (`window.colorflow`).
- Les canaux IPC sont centralisés dans `shared/types.ts` (`IpcChannels`) pour éviter les typos
  et garder une seule source de vérité entre le main process et le renderer.
- Le module `desktopCapturer` (capture d'écran pour la pipette) n'est utilisé que dans le
  main process, jamais exposé au renderer — seule l'image déjà capturée est transmise.

## Architecture du projet

```
colorflow/
├── electron/                  # Main process (Node.js, compilé avec tsc en ESM)
│   ├── main.ts                 # Entrée app, cycle de vie, single-instance lock
│   ├── preload.ts              # Pont contextBridge (aucune autre porte d'entrée)
│   ├── ipc.ts                  # Tous les handlers IPC
│   ├── store.ts                # electron-store (settings/historique/favoris)
│   ├── tray.ts                 # Icône & menu system tray
│   ├── shortcuts.ts            # Raccourci global configurable (globalShortcut)
│   ├── autostart.ts            # Démarrage avec Windows
│   └── windows/
│       ├── mainWindow.ts       # Fenêtre principale (frameless, glass)
│       └── pickerWindows.ts    # Fenêtres pipette (une par écran physique)
├── shared/                    # Types partagés main <-> renderer (aucune dépendance Node)
│   ├── types.ts
│   └── preloadApi.ts
├── src/                        # Renderer React (Vite)
│   ├── components/
│   │   ├── layout/              # TitleBar, Sidebar, AppShell, SplashScreen
│   │   ├── color/                # ColorHero, formats, contraste, palettes, capture flash
│   │   ├── picker/                # Overlay pipette + loupe (fenêtre dédiée)
│   │   ├── notifications/         # Centre de notifications animé
│   │   ├── search/                # Palette de commande (Ctrl+K)
│   │   └── ui/                    # Design system (Button, GlassCard, Dialog, Select…)
│   ├── pages/                  # Home, Palettes, History, Favorites, Settings
│   ├── hooks/                  # useColorSnapshot, useClipboard, usePickerBridge…
│   ├── state/                  # appStore (données) / uiStore (navigation, éphémère)
│   ├── lib/color/               # convert, formats, palette, contrast, names
│   └── lib/export/              # export JSON/CSS/SCSS/Tailwind/PNG
├── logo.png                    # Source unique du logo de l'application
├── scripts/generate-icons.mjs  # Génère les icônes app + tray depuis logo.png
├── build/                      # Icônes utilisées par electron-builder
├── index.html / picker.html    # Points d'entrée Vite (fenêtre principale / pipette)
└── vite.config.ts, tailwind.config.js, electron/tsconfig.json, tsconfig.json
```

## Installation

Prérequis : **Node.js ≥ 18** et **npm**.

```bash
npm install
```

### Lancer en développement

```bash
npm run dev            # démarre le serveur Vite (http://localhost:5173)
# puis, dans un second terminal :
npm run electron:dev   # lance Electron en pointant vers le serveur Vite
```

Ou en une seule commande (Vite + Electron orchestrés ensemble) :

```bash
npm run app:dev
```

## Scripts npm

| Script                  | Description                                                            |
| ------------------------ | -------------------------------------------------------------------------- |
| `npm run dev`             | Démarre le serveur de développement Vite (renderer)                      |
| `npm run electron:dev`    | Lance Electron en mode développement (connecté au serveur Vite)          |
| `npm run app:dev`         | Démarre Vite **et** Electron ensemble (`concurrently` + `wait-on`)        |
| `npm run build`           | Typecheck + compile le main process + build de production du renderer   |
| `npm run typecheck`       | Vérifie les types (renderer + main process) sans rien émettre           |
| `npm run lint`            | ESLint (TypeScript strict, hooks React, imports inutilisés…)             |
| `npm run pack`            | Build + package Electron **sans** installateur (dossier `release/*-unpacked`) |
| `npm run dist`            | Build + génère l'installateur Windows **NSIS** (`.exe`)                  |
| `npm run dist:portable`   | Build + génère un exécutable **portable** Windows (sans installation)    |

## Build & installateur Windows

```bash
npm run dist            # release/ColorFlow-Setup-<version>.exe (installateur NSIS)
npm run dist:portable    # release/ColorFlow-Portable-<version>.exe (portable)
```

Configuration dans `package.json` (`"build"`) :

- Icône multi-résolutions `build/icon.ico` (16 → 256 px), générée automatiquement
  depuis `logo.png` via `node scripts/generate-icons.mjs`.
- Cible `nsis` : installateur avec choix du dossier d'installation, raccourcis
  Bureau/Menu Démarrer.
- Cible `portable` : exécutable unique, aucune installation requise.
- `asar: true` pour empaqueter le code applicatif.

> Le build croisé Windows depuis Linux/macOS fonctionne (testé avec `wine` +
> `wine32:i386` installés). Sous Windows, `npm run dist` fonctionne nativement
> sans dépendance supplémentaire.

## Fonctionnalités

- **Pipette système multi-écrans** avec loupe zoomée, raccourci global configurable,
  échantillonnage pixel exact (aucune perte de précision entre écrans capturés).
- **8 formats de couleur** : HEX, RGB, RGBA, HSL, HSV, CMYK, LAB, OKLCH — copie en un clic.
- **Formats développeurs** : CSS, CSS Variable, Tailwind, Flutter, SwiftUI, Android XML, SCSS.
- **Générateur de palettes** : monochrome, analogue, complémentaire, split-complémentaire,
  triadique, tétradique — export JSON / CSS Variables / Tailwind / SCSS / PNG.
- **Analyse de contraste WCAG** (AA/AAA, normal/large) avec recommandation texte noir/blanc.
- **Historique** local (recherche, tri, suppression, favoris) et **Favoris** organisés en
  collections (créer / renommer / supprimer / exporter).
- **Recherche globale** (`Ctrl+K`) : HEX, noms de couleurs CSS, historique.
- **Barre système** : ouvrir l'app, lancer la pipette, quitter.
- **Paramètres** : raccourci clavier, démarrage avec Windows, thème clair/sombre/système,
  animations activées/désactivées, format de copie par défaut, langue.
- **Notifications internes animées** (pas de notifications Windows natives).

## Raccourcis clavier

| Raccourci                 | Action                          |
| --------------------------- | ---------------------------------- |
| `Ctrl+Shift+C` (configurable) | Lancer la pipette (global, même en arrière-plan) |
| `Ctrl+K`                     | Recherche globale                 |
| `Échap`                      | Annuler la pipette / fermer un panneau |
| `Entrée`                      | Valider un champ HEX              |
