# Serenity Hub

<div align="center">

![Serenity Hub Logo](logo.png)

**La suite logicielle tout-en-un pour Windows dédiée à l'étalonnage audio haute précision et au design de couleurs professionnel.**

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0A84FF?style=flat-square&logo=windows)](https://github.com/aikaazuna/Serenity/releases)
[![Release](https://img.shields.io/badge/Release-v1.0.0-30D158?style=flat-square&logo=github)](https://github.com/aikaazuna/Serenity/releases)
[![License](https://img.shields.io/badge/License-MIT-BF5AF2?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

[Télécharger Serenity Hub](https://github.com/aikaazuna/Serenity/releases) • [Fonctionnalités](#-fonctionnalités-principales) • [Architecture](#-architecture-technique) • [Installation & Développement](#-installation--développement)

</div>

---

## 🌟 Présentation

**Serenity Hub** regroupe dans une interface élégante de type *Glassmorphism* deux univers indispensables :
1. **Audio Studio & DSP Engine** : Égaliseur paramétrique et graphique de précision connecté en temps réel à **Equalizer APO**, plus de 2000 calibrations de casques AutoEQ, et un rack d'effets audio avancés.
2. **Color Studio & Visual Toolkit** : Pipette système multi-écrans avec loupe pixel-perfect, inspecteur de formats pour développeurs, générateur de dégradés/palettes, extracteur d'image et vérificateur d'accessibilité WCAG.

---

## ✨ Fonctionnalités Principales

### 🎧 1. Audio Studio & Égalisation
* **Égaliseur Paramétrique & Graphique** :
  * **Mode Paramétrique** : Jusqu'à 24 filtres entièrement configurables (*Peaking*, *Low Shelf*, *High Shelf*, *Low Pass*, *High Pass*, *Notch*, *Band Pass*, *All Pass*) avec réglage fin de la fréquence (20 Hz - 20 kHz), du gain (±20 dB) et du facteur Q.
  * **Mode Graphique** : Égaliseur 10, 15 ou 31 bandes standard ISO.
* **Canvas Interactif 60 FPS** : Rendu visuel temps réel de la courbe de réponse en fréquence cumulée, prévisualisant instantanément le gain et la préamplification globale.
* **Rack d'Effets DSP Haute Qualité** :
  * **Sub-Bass Boost** : Renforcement dynamique des basses fréquences sans distorsion.
  * **Treble Air** : Ajout de clarté, de brillance et d'ouverture dans les très hautes fréquences (>10 kHz).
  * **Balance Stéréo** : Répartition panoramique L/R précise.
  * **Crossfeed Casque** : Spatialisation naturelle réduisant la fatigue auditive lors des longues sessions d'écoute.
  * **Loudness Guard** : Protection anti-saturation et anti-clipping automatique.
* **Base de Données AutoEQ (2000+ Modèles)** :
  * Recherche instantanée par marque et modèle (Sennheiser, Beyerdynamic, Sony, Audio-Technica, Apple, Bose, Moondrop, etc.).
  * Application de la courbe Harman en un clic.
  * Import direct de fichiers AutoEQ `.txt` personnalisés.
* **Synchronisation Native Equalizer APO** : Écriture et actualisation instantanée du fichier `config.txt` sous Windows.
* **Multi-Périphériques & Canaux** : Sélection simultanée de plusieurs cartes sons/sorties audio et routage indépendant (Canal Gauche / Droit / Tous).

---

### 🎨 2. Color Studio & Design
* **Pipette Système Multi-Écrans** :
  * Raccourci global configurable (`Ctrl+Shift+C` par défaut) opérant par-dessus n'importe quel écran ou application plein écran.
  * Loupe agrandie temps réel (zoom 2x à 16x) avec affichage de la grille de pixels et valeur HEX instantanée.
* **Inspecteur Multi-Formats** :
  * Formats généraux : **HEX**, **RGB**, **RGBA**, **HSL**, **HSV**, **CMYK**, **LAB**, **OKLCH**.
  * Formats Développeurs : **CSS**, **Variables CSS**, **Tailwind CSS**, **Flutter**, **SwiftUI**, **Android XML**, **SCSS**.
* **Palette & Harmonies de Couleurs** :
  * Génération automatique : Monochrome, Analogue, Complémentaire, Split-Complémentaire, Triadique, Tétradique.
  * Export rapide en JSON, CSS, Tailwind et image PNG.
* **Gradient Studio** : Créateur de dégradés linéaires et radiaux avec multi-stops, réglage d'angle et export CSS/Tailwind.
* **Simulateur d'Accessibilité & Vision** :
  * Simulation des différents daltonismes : *Protanopie*, *Deutéranopie*, *Tritanopie*, *Achromatopsie*.
  * Calculateur de contraste conforme aux normes **WCAG 2.1 (AA / AAA)**.
* **Extracteur d'Image** : Importez n'importe quelle image ou photo pour en extraire automatiquement la palette dominante.
* **Historique & Collections de Favoris** : Sauvegarde automatique de vos captures et organisation en dossiers thématiques.

---

### 🚀 3. Interface, Performance & Ergonomie
* **Design Glassmorphism Moderne** : Inspiré des directives esthétiques Apple macOS / iOS avec gestion fine du flou d'arrière-plan (*backdrop blur*) et des transparences.
* **Typographie Géométrique** : Intégration de la police **Space Grotesk** pour une lisibilité et une esthétique optimales.
* **Animations Fluides (Framer Motion)** : Micro-interactions, transitions de pages et menus dynamiques.
* **Palette de Commandes (`Ctrl+K`)** : Recherche rapide parmi les outils, fonctionnalités, couleurs et presets audio.
* **Système Bilingue Intégral** : Bascule instantanée entre **Français** et **Anglais** sur 100% de l'application.
* **Système de Mise à Jour Automatique** : Détection automatique des nouvelles versions publiées sur GitHub avec notification intégrée.

---

## 🛠 Choix Techniques & Architecture

```
Serenity/
├── electron/                  # Processus Principal Electron (Node.js / ESM)
│   ├── main.ts                # Cycle de vie, gestion des fenêtres et single instance lock
│   ├── preload.ts             # Pont contextBridge isolé (window.colorflow)
│   ├── ipc.ts                 # Handlers IPC (fichiers APO, audio devices, pipette, updater)
│   ├── updater.ts             # Module d'auto-update GitHub Releases
│   ├── store.ts               # Stockage persistant sécurisé (electron-store)
│   └── windows/               # Gestionnaires des fenêtres (mainWindow, pickerWindows)
├── shared/                    # Types partagés Main <-> Renderer (zero-dependency)
│   ├── types.ts
│   └── preloadApi.ts
├── src/                       # Application React (Renderer Vite)
│   ├── components/
│   │   ├── audio/             # ParametricEQ, GraphicEQ, EffectsRack, PresetsLibrary...
│   │   ├── color/             # ColorHero, Formats, Contrast, Palettes...
│   │   ├── picker/            # Overlay pipette plein écran et loupe
│   │   ├── layout/            # TitleBar, Sidebar, AppShell, Navigation
│   │   ├── ui/                # Composants Radix UI personnalisés (Switch, Select, Dialog...)
│   │   └── search/            # Command Palette (Ctrl+K)
│   ├── pages/                 # AudioPage, MixerPage, ClipsPage, PalettesPage, SettingsPage...
│   ├── state/                 # Stores Zustand (audioStore, appStore, uiStore)
│   ├── lib/                   # Moteurs DSP (eq-engine.ts, autoeq-service.ts, conversions couleur)
│   └── hooks/                 # Hooks réutilisables (useI18n, useTheme, useWindowState...)
├── build/                     # Assets d'empaquetage (.ico multi-résolutions, logos)
└── package.json               # Dépendances et scripts de packaging
```

| Composant | Technologie |
|---|---|
| **Shell Desktop** | **Electron 33** (Architecture isolée `contextIsolation: true`, `sandbox: true`) |
| **Interface Utilisateur** | **React 18** + **TypeScript** |
| **Styles & Thèmes** | **Tailwind CSS** + Variables CSS dynamiques |
| **Moteur d'Animation** | **Framer Motion 11** |
| **Gestion d'État** | **Zustand 5** avec synchronisation persistante |
| **Colorimétrie** | **Color.js** (Espace colorimétrique CIE LAB, OKLCH, sRGB) |
| **Moteur Audio** | **Equalizer APO Integration** + **Web Audio API** |
| **Packaging & Distribution** | **electron-builder** (Installateurs Windows NSIS & Portables) |

---

## 💻 Installation & Développement

### Prérequis
* **Node.js** ≥ 18.x
* **npm** ou **yarn**
* Windows 10 ou 11

### 1. Cloner le projet
```bash
git clone https://github.com/aikaazuna/Serenity.git
cd Serenity
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer en mode développement
```bash
npm run app:dev
```
*Cette commande lance simultanément le serveur de dev Vite et le processus Electron.*

---

## 📦 Compilation & Exportation (.exe)

Pour générer les exécutables Windows autonomes :

```bash
# Générer l'installateur complet NSIS (.exe)
npm run dist

# Générer la version portable sans installation (.exe)
npm run dist:portable

# Générer les deux formats à la fois
npm run dist:all
```

Les exécutables générés seront disponibles dans le répertoire `release/` :
* `release/SerenityHub-Setup-1.0.0.exe` (Installateur standard)
* `release/SerenityHub-Portable-1.0.0.exe` (Exécutable portable direct)

---

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|---|---|
| `Ctrl + Shift + C` | Lancer la pipette et la loupe système (global) |
| `Ctrl + K` | Ouvrir la palette de commandes globale |
| `Échap` (`Esc`) | Fermer la pipette / fermer une modale |
| `Ctrl + R` | Rafraîchir l'application en mode développement |

---

## 📄 Licence

Ce projet est distribué sous licence libre **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus d'informations.

---

<div align="center">
  Créé avec passion par <a href="https://github.com/aikaazuna"><strong>aikaazuna</strong></a>.
</div>
