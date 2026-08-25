# Serenity Hub

<p align="center"><img src="logo.png" width="120" alt="Serenity Hub"></p>

Application Windows qui réunit un égaliseur audio piloté par Equalizer APO et une boîte à outils couleur (pipette, palettes, contrastes) dans la même interface.

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0A84FF?style=flat-square&logo=windows)](https://github.com/aikaazuna/Serenity/releases)
[![Release](https://img.shields.io/badge/Release-v1.0.0-30D158?style=flat-square&logo=github)](https://github.com/aikaazuna/Serenity/releases)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-BF5AF2?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)

[Télécharger](https://github.com/aikaazuna/Serenity/releases) • [Fonctionnalités](#fonctionnalités) • [À venir](#à-venir--v110) • [Installation](#installation--développement)

## Présentation

Serenity Hub, c'est deux outils dans la même appli :

- un **studio audio** qui parle directement à Equalizer APO pour égaliser le son en temps réel (mode paramétrique ou graphique), avec accès à toute la base AutoEQ ;
- un **studio couleur** avec pipette système, inspecteur de formats pour devs, générateur de palettes et vérificateur d'accessibilité — hérité du projet ColorFlow, sur la base duquel Serenity Hub a été construit.

## Fonctionnalités

### Audio

- Égaliseur paramétrique — jusqu'à 24 filtres (peaking, low/high shelf, low/high pass, notch, band pass, all pass), réglables en fréquence, gain et Q.
- Égaliseur graphique 10, 15 ou 31 bandes (normes ISO).
- Courbe de réponse en fréquence en temps réel sur canvas, filtres déplaçables directement à la souris.
- Bass boost, treble air, balance stéréo, crossfeed casque, et un loudness guard qui compense automatiquement le préamp pour éviter la saturation.
- Plus de 2000 profils AutoEQ (Sennheiser, Beyerdynamic, Sony, Audio-Technica, Moondrop, etc.), ou import d'un fichier `.txt` AutoEQ perso.
- Écriture directe dans le `config.txt` d'Equalizer APO, sélection de plusieurs sorties audio en même temps, routage par canal (gauche / droite / les deux).

### Couleur

- Pipette système multi-écrans (raccourci global `Ctrl+Shift+C` par défaut), loupe zoomable de 2x à 16x avec grille pixel.
- Conversion HEX, RGB(A), HSL, HSV, CMYK, LAB, OKLCH — plus les formats dev (CSS, variables CSS, Tailwind, Flutter, SwiftUI, Android XML, SCSS).
- Génération de palettes et harmonies (monochrome, analogue, complémentaire, triadique...), export JSON/CSS/Tailwind/PNG.
- Gradient Studio pour construire des dégradés linéaires/radiaux et les exporter en CSS.
- Simulateur de daltonisme et calcul de contraste WCAG 2.1 (AA/AAA).
- Extraction de palette depuis une image, historique et favoris rangeables en dossiers.

### Interface

- Thème glassmorphism, police Space Grotesk, animations Framer Motion.
- Palette de commandes (`Ctrl+K`) pour naviguer vite entre les outils et les presets.
- Français / anglais, bascule instantanée.
- Mise à jour automatique via GitHub Releases.

## À venir — v1.1.0

Le prochain gros morceau : un **mixer audio** pour gérer le volume de plusieurs sources/applications indépendamment, et un nouvel onglet **Clips** pour capturer et garder des extraits vidéo directement depuis l'appli.

## Architecture

```
Serenity/
├── electron/                  # Processus principal (Node.js / ESM)
│   ├── main.ts                # Cycle de vie, fenêtres, single instance lock
│   ├── preload.ts             # Pont contextBridge isolé (window.colorflow)
│   ├── ipc.ts                 # Handlers IPC (config APO, devices audio, pipette, updater)
│   ├── updater.ts             # Auto-update via GitHub Releases
│   ├── store.ts               # Stockage persistant (electron-store)
│   └── windows/                # mainWindow, pickerWindows
├── shared/                    # Types partagés main <-> renderer
│   ├── types.ts
│   └── preloadApi.ts
├── src/                        # Renderer React (Vite)
│   ├── components/
│   │   ├── audio/               # ParametricEQ, GraphicEQ, EffectsRack, PresetsLibrary...
│   │   ├── color/                # ColorHero, Formats, Contrast, Palettes...
│   │   ├── picker/                # Overlay pipette + loupe
│   │   ├── layout/                # TitleBar, Sidebar, AppShell
│   │   ├── ui/                    # Composants Radix UI personnalisés
│   │   └── search/                # Palette de commandes (Ctrl+K)
│   ├── pages/                  # AudioPage, MixerPage, ClipsPage, PalettesPage, SettingsPage...
│   ├── state/                  # Stores Zustand (audioStore, appStore, uiStore)
│   ├── lib/                    # eq-engine.ts, autoeq-service.ts, conversions couleur
│   └── hooks/                  # useI18n, useTheme, useWindowState...
├── build/                       # Icônes et assets d'empaquetage
└── package.json
```

| Composant | Techno |
|---|---|
| Shell desktop | Electron 33 (`contextIsolation: true`, `sandbox: true`) |
| UI | React 18 + TypeScript |
| Style | Tailwind CSS + variables CSS |
| Animation | Framer Motion 11 |
| État | Zustand 5, persisté |
| Couleur | Color.js (LAB, OKLCH, sRGB) |
| Audio | Equalizer APO + Web Audio API |
| Packaging | electron-builder (NSIS + portable) |

## Installation & développement

Prérequis : Node.js ≥ 18, npm, Windows 10/11.

```bash
git clone https://github.com/aikaazuna/Serenity.git
cd Serenity
npm install
npm run app:dev
```

`app:dev` lance Vite et Electron en parallèle.

## Compilation

```bash
npm run dist            # installateur NSIS (.exe)
npm run dist:portable   # version portable (.exe)
npm run dist:all        # les deux
```

Les binaires sortent dans `release/` :
- `release/SerenityHub-Setup-1.0.0.exe`
- `release/SerenityHub-Portable-1.0.0.exe`

## Raccourcis clavier

| Raccourci | Action |
|---|---|
| `Ctrl + Shift + C` | Lancer la pipette / loupe système |
| `Ctrl + K` | Ouvrir la palette de commandes |
| `Échap` | Fermer la pipette ou une modale |
| `Ctrl + R` | Rafraîchir l'appli en dev |

## Licence

Distribué sous licence **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC BY-NC-SA 4.0)** — voir [LICENSE](LICENSE) ou le [résumé officiel](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr).

---

Fait par [aikaazuna](https://github.com/aikaazuna).
