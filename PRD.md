# Product Requirements Document (PRD)

## 3D Avatar/Model Loading (Modularity Requirement)
- All 3D avatars and models must be loaded using the Babylon.js Asset Manager.
- No direct SceneLoader or legacy loading methods are permitted for new code.
- This ensures modularity, extensibility, and future-proofing for all avatar and asset features.
- See the README and `AvatarPreview3D.jsx` for implementation details.


## Title
Minecraft-Style 3D Math Game (Babylon.js)

## Objective
Build a cross-platform, Minecraft-themed 3D math game where players walk in a field toward cubes, select answers to math problems, and when an answer is chosen, the character walks to the selected cube and mines it with a pickaxe to collect blocks for building a Minecraft-style structure.

## Core Features
- 3D Minecraft-style cubes as interactive targets (Babylon.js)
- Third-person, field-based camera
- Player character (blocky, Minecraft-inspired)
- Player avatar is selectable via an in-game UI
- Player is presented with a start screen to select math type, difficulty level, and avatar before starting the game
- Math problems displayed at the bottom; player selects the correct cube
- When an answer is selected, the character walks to the chosen cube and mines it with a pickaxe
- Collect different block types by answering correctly
- Structure visualization: as blocks are collected, a Minecraft-style structure is built automatically and shown on screen
- Multiple difficulty levels: each difficulty level features a more complex/elaborate structure that requires more blocks to be collected
- Modular level/difficulty framework: new levels and structures can be added in the future without modifying core game logic
- Responsive UI (HTML/CSS overlays)
- Sound and visual feedback for answers

## Technology
- Babylon.js (JavaScript)
- HTML/CSS for UI overlays
- Electron (future: desktop app)
- Cordova/Capacitor (future: mobile app)

## Future Features
- Native desktop (Electron)
- Additional structure blueprints and complexity scaling for each difficulty level
- Native mobile (Cordova/Capacitor)
- Customizable avatars/skins
- Variety of structure blueprints to build
- Difficulty settings and progress tracking
- Block collection history and structure gallery

