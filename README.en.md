# Serenity Hub

<p align="center"><img src="logo.png" alt="Serenity Hub"></p>

A Windows app that combines an Equalizer APO-powered audio EQ with a color toolkit (picker, palettes, contrast checker) in one interface.

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0A84FF?style=flat-square&logo=windows)](https://github.com/aikaazuna/Serenity/releases)
[![Release](https://img.shields.io/badge/Release-v1.0.0-30D158?style=flat-square&logo=github)](https://github.com/aikaazuna/Serenity/releases)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-BF5AF2?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)

[Download](https://github.com/aikaazuna/Serenity/releases) • [Features](#features) • [Coming next](#coming-next--v110) • [Setup](#setup--development)

## Overview

Serenity Hub is really two tools in one app:

- an **audio studio** that talks directly to Equalizer APO to EQ your sound in real time (parametric or graphic), with access to the full AutoEQ database;
- a **color studio** with a system picker, a format inspector for devs, a palette generator and an accessibility checker — carried over from ColorFlow, the project Serenity Hub was built on top of.

## Features

### Audio

- Parametric EQ — up to 24 filters (peaking, low/high shelf, low/high pass, notch, band pass, all pass), each adjustable in frequency, gain and Q.
- Graphic EQ with 10, 15 or 31 bands (ISO standard).
- Real-time frequency response curve on canvas, with filter nodes you can drag directly.
- Bass boost, treble air, stereo balance, headphone crossfeed, and a loudness guard that automatically pulls back the preamp to avoid clipping.
- Over 2000 AutoEQ profiles (Sennheiser, Beyerdynamic, Sony, Audio-Technica, Moondrop, and more), or import your own AutoEQ `.txt` file.
- Writes straight to Equalizer APO's `config.txt`, lets you target several audio outputs at once, and route by channel (left / right / both).

### Color

- Multi-monitor system picker (global shortcut, `Ctrl+Shift+C` by default), with a magnifier zoomable from 2x to 16x and a pixel grid.
- Converts to HEX, RGB(A), HSL, HSV, CMYK, LAB, OKLCH — plus dev formats (CSS, CSS variables, Tailwind, Flutter, SwiftUI, Android XML, SCSS).
- Palette and harmony generation (monochrome, analogous, complementary, triadic...), export to JSON/CSS/Tailwind/PNG.
- Gradient Studio for linear/radial gradients, exportable to CSS.
- Color-blindness simulator and WCAG 2.1 (AA/AAA) contrast checker.
- Palette extraction from an image, plus history and favorites you can sort into folders.

### Interface

- Glassmorphism theme, Space Grotesk typeface, Framer Motion animations.
- Command palette (`Ctrl+K`) to jump between tools and presets fast.
- French / English, switch instantly.
- Auto-updates via GitHub Releases.

## Coming next — v1.1.0

The next big addition is an **audio mixer** for controlling the volume of several sources/apps independently, plus a new **Clips** tab for capturing and keeping video clips right from the app.

## Architecture

```
Serenity/
├── electron/                  # Main process (Node.js / ESM)
│   ├── main.ts                # Lifecycle, windows, single instance lock
│   ├── preload.ts             # Isolated contextBridge (window.colorflow)
│   ├── ipc.ts                 # IPC handlers (APO config, audio devices, picker, updater)
│   ├── updater.ts             # Auto-update via GitHub Releases
│   ├── store.ts               # Persistent storage (electron-store)
│   └── windows/                # mainWindow, pickerWindows
├── shared/                    # Types shared between main and renderer
│   ├── types.ts
│   └── preloadApi.ts
├── src/                        # React renderer (Vite)
│   ├── components/
│   │   ├── audio/               # ParametricEQ, GraphicEQ, EffectsRack, PresetsLibrary...
│   │   ├── color/                # ColorHero, Formats, Contrast, Palettes...
│   │   ├── picker/                # Picker overlay + magnifier
│   │   ├── layout/                # TitleBar, Sidebar, AppShell
│   │   ├── ui/                    # Custom Radix UI components
│   │   └── search/                # Command palette (Ctrl+K)
│   ├── pages/                  # AudioPage, MixerPage, ClipsPage, PalettesPage, SettingsPage...
│   ├── state/                  # Zustand stores (audioStore, appStore, uiStore)
│   ├── lib/                    # eq-engine.ts, autoeq-service.ts, color conversions
│   └── hooks/                  # useI18n, useTheme, useWindowState...
├── build/                       # Packaging icons and assets
└── package.json
```

| Part | Tech |
|---|---|
| Desktop shell | Electron 33 (`contextIsolation: true`, `sandbox: true`) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS + CSS variables |
| Animation | Framer Motion 11 |
| State | Zustand 5, persisted |
| Color | Color.js (LAB, OKLCH, sRGB) |
| Audio | Equalizer APO + Web Audio API |
| Packaging | electron-builder (NSIS + portable) |

## Setup & development

Requirements: Node.js ≥ 18, npm, Windows 10/11.

```bash
git clone https://github.com/aikaazuna/Serenity.git
cd Serenity
npm install
npm run app:dev
```

`app:dev` runs Vite and Electron side by side.

## Building

```bash
npm run dist            # NSIS installer (.exe)
npm run dist:portable   # portable build (.exe)
npm run dist:all        # both
```

Output lands in `release/`:
- `release/SerenityHub-Setup-1.0.0.exe`
- `release/SerenityHub-Portable-1.0.0.exe`

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + C` | Launch the picker / system magnifier |
| `Ctrl + K` | Open the command palette |
| `Esc` | Close the picker or a modal |
| `Ctrl + R` | Reload the app in dev mode |

## License

Licensed under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC BY-NC-SA 4.0)** — see [LICENSE](LICENSE) or the [official summary](https://creativecommons.org/licenses/by-nc-sa/4.0/).

---

Made by [aikaazuna](https://github.com/aikaazuna).
