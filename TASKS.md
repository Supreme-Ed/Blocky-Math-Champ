# Project Tasks & Roadmap

## MVP Web Game
- [x] Set up project structure (src, components, assets, tests)
- [x] Implement dynamic procedural skybox with debug panel color controls (Babylon.js CloudProceduralTexture)
  - [x] Integrate Apply button for manual skybox updates
  - [x] Document Babylon.js color quirk (cloudColor is background, skyColor is clouds)

- [x] Set up Vite for fast dev/build
- [x] Install and configure Babylon.js
- [x] Install and configure Jest for unit testing
- [x] Install and configure Playwright for integration/e2e testing
- [x] Initial scaffolding: index.html, main.tsx, placeholder assets
- [x] Render 3D scene with Minecraft-style cubes
- [x] Implement player character and movement
- [x] Math problem generation and answer checking
- [x] UI overlays (math problem, structure visualization)
- [ ] Basic sound and feedback
- [ ] Responsive design for desktop/mobile browsers
- [ ] Modular level/difficulty framework: allow new levels and structures to be added without modifying core game logic

## Cross-Platform Wrapping
- [ ] Electron: Package web app for Windows/Mac/Linux
- [ ] Cordova/Capacitor: Package for iOS/Android
- [ ] Test and optimize for all platforms

## Enhancements
- [ ] Customizable characters/skins
- [ ] Save progress and settings
- [ ] Advanced sound and effects
- [ ] Analytics and reporting
- [ ] **Server-side caching for inventory block icons:** Upload and serve generated block icons from backend or CDN for cross-device and cross-user consistency.
