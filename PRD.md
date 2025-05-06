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
- Dynamic procedural skybox with real-time color controls (Babylon.js CloudProceduralTexture, debug panel integration)
- Debug panel for adjusting skybox and other scene parameters

- Third-person, field-based camera
- Player character (blocky, Minecraft-inspired)
- Player avatar is selectable via an in-game UI
- Player is presented with a start screen to select math type, difficulty level, and avatar before starting the game
- Math problems displayed at the bottom; player selects the correct cube
- When an answer is selected, the character walks to the chosen cube and mines it with a pickaxe
- Collect different block types by answering correctly
- Structure visualization: as blocks are collected, a Minecraft-style structure blueprint is visualized with completed and remaining blocks shown on screen
- Structure building: once the player has collected enough blocks to complete a structure blueprint, they can build the structure which will be added to the game scene
- Multiple difficulty levels: each difficulty level features a more complex/elaborate structure that requires more blocks to be collected
- Modular level/difficulty framework: new levels and structures can be added in the future without modifying core game logic
- Responsive UI (HTML/CSS overlays), including a bottom-centered Minecraft-style inventory hotbar with auto-generated icons for each block type.
- Sound and visual feedback for answers
- On incorrect answers, a red feedback banner appears at the top, displaying 'WRONG!' and the correct equation (e.g., '2 + 2 = 4'), centered and visible for 2 seconds. The correct answer is not shown in the problem panel but only in this banner.

## Villager NPC
- A non-playable Villager NPC is present in the scene for feedback and engagement.
- Positioned at (3, 0, 0), facing the user/avatar (Y rotation = 0).
- Plays only an idle animation by default (if present).
- Plays "yes" or "no" animations in response to user answers, triggered modularly.
- Animation logic is modular and extensible for future NPCs or animation types.

## Technology
- Babylon.js (TypeScript)
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

