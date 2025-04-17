# PLAN_SCAFFOLDING.md

## Purpose
This plan outlines the initial scaffolding for the Minecraft-Style 3D Math Game using Babylon.js and plain JavaScript, ensuring modularity, testability, and extensibility as required by project guidelines.

---

## 1. Directory Structure

```
Blocky Math Champ/
├── src/
│   ├── index.html
│   ├── main.js
│   ├── game/
│   │   ├── gameEngine.js
│   │   ├── levelManager.js
│   │   ├── structureBuilder.js
│   │   ├── mathProblem.js
│   │   ├── soundManager.js
│   │   ├── rightAnswerHandler.js
│   │   └── wrongAnswerHandler.js
│   ├── components/
│   │   ├── CubePlatform.js
│   │   ├── Player.js
│   │   └── UI/
│   │       ├── MathDisplay.js
│   │       ├── StructureView.js
│   │       ├── DifficultySelector.js
│   │       └── StartScreen.js
│   └── assets/
│       ├── textures/
│       └── sounds/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── README.md
├── PRD.md
├── TASKS.md
├── AI_INSTRUCTIONS.md
└── PLAN_SCAFFOLDING.md
```

---

## 2. Core Files & Responsibilities

- **index.html**: Loads Babylon.js, includes main.js, and hosts the canvas and UI overlays.
- **main.js**: Entry point. Initializes Babylon.js engine, loads assets, and starts the game loop.
- **game/gameEngine.js**: Manages game state, main loop, and event flow.
- **game/levelManager.js**: Modular manager for difficulty levels and structure blueprints. Allows easy addition of new levels/structures.
- **game/structureBuilder.js**: Handles logic for collecting blocks and visualizing the Minecraft-style structure.
- **game/mathProblem.js**: Generates and validates math problems per difficulty.
- **game/soundManager.js**: Centralized module for loading, playing, and managing all game sounds.
- **game/rightAnswerHandler.js**: Handles all effects and logic when a player selects the correct answer (e.g., sound, animation, block collection, progress).
- **game/wrongAnswerHandler.js**: Handles all effects and logic when a player selects the wrong answer (e.g., sound, animation, penalties, retry logic).
- **components/CubePlatform.js**: Renders and manages interactive 3D cubes.
- **components/Player.js**: Handles player avatar and movement.
- **components/UI/AvatarSelector.js**: UI for selecting the player avatar.
- **components/UI/MathDisplay.js**: Renders the current math problem and handles answer input.
- **components/UI/StructureView.js**: Visualizes the player's structure as it is built.
- **components/UI/DifficultySelector.js**: UI for selecting difficulty/level.
- **components/UI/StartScreen.js**: Start screen for selecting math type, difficulty, and avatar before starting the game.
- **assets/**: Textures, sounds, and other media.

---

## Design Note: Start Screen Option Wiring

- The StartScreen component collects user selections for math type, difficulty, and avatar.
- On clicking "Start Game," these selections are passed as a single state object to the main game engine (e.g., via a callback or event).
- All game modules (levelManager, mathProblem, Player, etc.) read from this state to configure their behavior and rendering.
- Adding new options (e.g., structure theme) only requires updating StartScreen and the state object; core game logic remains unchanged.
- This ensures modularity, extensibility, and clean separation of UI and game logic.

---

## Design Note: Displaying Math Answers on Cube Platforms

- Each cube platform is a Babylon.js 3D box mesh.
- Math answers are rendered using Babylon.js DynamicTexture, which draws the answer as text onto a 2D canvas and applies it as a texture to the cube face.
- The CubePlatform component receives the answer as a prop/config and encapsulates the rendering logic.
- This approach allows for easy updates to font, color, style, and supports localization and future visual upgrades.
- For advanced visuals, a base block texture can be combined with a dynamic overlay for the answer.
- This method is modular, testable, and fully extensible for new block types or answer formats.

---

## Design Note: Math Answer Generation

- Math problems and answers are generated in a dedicated, testable module (e.g., game/mathProblem.js).
- Each row of cubes displays one correct answer and several plausible distractors, all generated based on the selected math type and difficulty.
- The correct answer and distractors are shuffled and assigned to the cube platforms.
- The generator is data-driven and easily extensible for new math types or difficulty levels.
- All logic is decoupled from rendering/UI, ensuring modularity and testability.
- Unit tests will verify correctness, inclusion of the right answer, and plausibility of distractors.

---

## Design Note: Ensuring Cube Platforms Use Needed Block Types

- At level start, the structure blueprint is analyzed to determine all block types required and their counts.
- A dynamic tracker maintains how many of each block type are still needed as the structure is built.
- When generating cube platforms, the correct answer is always associated with a block type that is still needed (count > 0).
- Distractor cubes may use other needed types, completed types, or even unused types, depending on desired challenge.
- This ensures every correct answer advances the structure, prevents wasted blocks, and maintains steady player progress.
- All logic is modular and testable, and can be extended for new blueprint or gameplay rules.

---

## Design Note: Dedicated Right/Wrong Answer Handlers

- The game includes two dedicated modules: `rightAnswerHandler.js` and `wrongAnswerHandler.js`.
- `rightAnswerHandler.js` manages all effects and logic for correct answers: playing sounds, triggering animations, awarding blocks, updating progress, and any success feedback.
- `wrongAnswerHandler.js` manages all effects and logic for incorrect answers:
  - Plays a sound and visual feedback (e.g., flashing red).
  - Removes a previously collected block from the structure (if any blocks have been collected).
  - Records the missed math problem in a "missed problems" queue/list.
  - Ensures the missed problem is presented again later in the session (e.g., by reinserting it into the problem queue).
- Both handlers are called by the main game loop or UI event handler when a player selects an answer.
- This separation ensures modularity, makes it easy to update or extend feedback/logic for right or wrong answers, and supports thorough unit testing.

---

## Design Note: Sound Handling

- All sound files are stored in `src/assets/sounds/` with clear, descriptive filenames.
- A centralized, modular `soundManager.js` module handles loading, playing, and managing sounds using Babylon.js's audio system.
- **Audio playback uses Babylon.js's `BABYLON.Sound` class, which wraps the HTML5 Web Audio API (with fallback to <audio> if needed). This supports both 2D and 3D positional sound and is fully cross-platform.**
- Game components trigger sounds via the sound manager (e.g., `playSound('jump')`), never directly.
- The sound manager supports volume control, muting, and user preferences.
- Adding new sounds only requires updating the assets folder and sound manager config.
- All sound logic is testable and decoupled from UI/gameplay logic, ensuring maintainability and extensibility.

---

## 3. Testing Structure
- **tests/unit/**: Jest unit tests for each module/component.
- **tests/integration/**: Playwright integration tests for multi-module flows.
- **tests/e2e/**: Playwright end-to-end tests simulating user behavior.

---

## 4. Modularity & Extensibility
- All levels/structures defined as data/config, not hardcoded in logic.
- Each major feature in its own file; no file >300 lines.
- New levels/structures can be added by extending config and assets only.

---

## 5. Detailed Numbered Implementation & Testing Plan

1. Project Scaffolding
- [x] 1.1. Create the full directory structure as specified in this plan.
  - [x] 1.1.1. Review PLAN_SCAFFOLDING.md for the exact directory and subdirectory structure.
  - [x] 1.1.2. Create the root project directory if it does not exist.
  - [x] 1.1.3. Create the src directory.
  - [x] 1.1.4. Create the game directory inside src.
  - [x] 1.1.5. Create the components directory inside src.
  - [x] 1.1.6. Create the UI directory inside components.
  - [x] 1.1.7. Create the assets directory inside src.
  - [x] 1.1.8. Create the textures and sounds directories inside assets.
  - [x] 1.1.9. Create the tests directory at the root.
  - [x] 1.1.10. Create the unit, integration, and e2e directories inside tests.
  - [x] 1.1.11. Run ESLint on the new folders/files (if applicable). (ESLint run: no errors, see results.log, Step 1.1)
  - [x] 1.1.12. Manually verify that the structure matches PLAN_SCAFFOLDING.md exactly. (Verified: structure matches plan)
  - [x] 1.1.13. Record the result of the manual verification and ESLint run in a results log. (See results.log, Step 1.1: PASS)
  - [ ] 1.1.14. Commit the directory structure to git if all checks pass.
- [ ] 1.2. Create all empty module files: gameEngine.js, levelManager.js, structureBuilder.js, mathProblem.js, soundManager.js, rightAnswerHandler.js, wrongAnswerHandler.js, blockTypes.js, structureBlueprints.js.
  - [x] 1.2.1. For each module file, create the file in the appropriate directory. (All except blockTypes.js and structureBlueprints.js exist and are empty)
  - [ ] 1.2.2. Run ESLint on the new file.
  - [x] 1.2.3. Manually verify the file exists and is empty. (Verified: all present files checked and empty, see results.log, Step 1.2)
  - [ ] 1.2.4. Record the result of the manual verification and ESLint run in a results log.
  - [ ] 1.2.5. Commit the file to git if all checks pass.
- [ ] 1.3. Create all empty component files: CubePlatform.js, Player.js, UI/MathDisplay.js, UI/StructureView.js, UI/DifficultySelector.js, UI/AvatarSelector.js, UI/StartScreen.js.
  - [ ] 1.3.1. For each component file, create the file in the appropriate directory.
  - [ ] 1.3.2. Run ESLint on the new file.
  - [ ] 1.3.3. Manually verify the file exists and is empty.
  - [ ] 1.3.4. Record the result of the manual verification and ESLint run in a results log.
  - [ ] 1.3.5. Commit the file to git if all checks pass.
- [ ] 1.4. Create placeholder asset folders and add at least one dummy texture and one dummy sound file to assets/textures and assets/sounds.
  - [ ] 1.4.1. Add a dummy texture file (e.g., placeholder.png) to assets/textures.
  - [ ] 1.4.2. Add a dummy sound file (e.g., placeholder.wav) to assets/sounds.
  - [ ] 1.4.3. Run ESLint on the assets directory (if applicable).
  - [ ] 1.4.4. Manually verify the files exist and are accessible.
  - [ ] 1.4.5. Record the result of the manual verification and ESLint run in a results log.
  - [ ] 1.4.6. Commit the files to git if all checks pass.
- [ ] 1.5. Create a minimal index.html file with a canvas element for Babylon.js rendering.
  - [x] 1.5.1. Write the HTML file with a <canvas> element and minimal boilerplate.
  - [x] 1.5.2. Run ESLint (if applicable) on index.html.
  - [x] 1.5.3. Manually open index.html in a browser and verify that the canvas appears.
  - [x] 1.5.4. Record the result of the manual verification and ESLint run in a results log. (See results.log, Step 1.5: PASS)
  - [ ] 1.5.5. Commit the file to git if all checks pass.
- [ ] 1.6. Create a minimal main.js that initializes the Babylon.js engine, attaches it to the canvas, and renders a blank scene.
  - [ ] 1.6.1. Write minimal initialization code for Babylon.js in main.js.
  - [ ] 1.6.2. Run ESLint on main.js.
  - [ ] 1.6.3. Manually verify that Babylon.js renders a blank scene in the browser.
  - [ ] 1.6.4. Record the result of the manual verification and ESLint run in a results log.
  - [ ] 1.6.5. Commit the file to git if all checks pass.
- [ ] 1.7. Add or update README.md and TASKS.md to reflect the initial structure and project goals.
  - [ ] 1.7.1. Write or update README.md with project description and setup instructions.
  - [ ] 1.7.2. Write or update TASKS.md with initial tasks and structure.
  - [ ] 1.7.3. Run ESLint on both files.
  - [ ] 1.7.4. Manually verify the content for completeness and accuracy.
  - [ ] 1.7.5. Record the result of the manual verification and ESLint run in a results log.
  - [ ] 1.7.6. Commit the files to git if all checks pass.

[ ] 2A. PRECHECK. Before starting Step 2, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 2. Core Engine and UI Foundation
- [ ] 2.1. Implement Babylon.js scene setup in main.js, including engine creation, scene creation, camera, and lighting.
    - [ ] 2.1.1. Write code to initialize Babylon.js engine in main.js.
    - [ ] 2.1.2. Add camera and lighting setup to the scene.
    - [ ] 2.1.3. Run ESLint on main.js.
    - [ ] 2.1.4. Manually verify the scene renders with camera and lighting.
    - [ ] 2.1.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.1.6. Commit the changes to git if all checks pass.
  - [ ] 2.2. Develop gameEngine.js to manage global game state, handle main game loop, and dispatch events between modules.
    - [ ] 2.2.1. Implement global game state management in gameEngine.js.
    - [ ] 2.2.2. Add main game loop logic.
    - [ ] 2.2.3. Add event dispatching between modules.
    - [ ] 2.2.4. Run ESLint on gameEngine.js.
    - [ ] 2.2.5. Manually verify state/event flow works as expected.
    - [ ] 2.2.6. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.2.7. Commit the changes to git if all checks pass.
  - [ ] 2.3. Implement levelManager.js to select the current level, load the appropriate structure blueprint, and manage difficulty settings.
    - [ ] 2.3.1. Implement level selection logic.
    - [ ] 2.3.2. Implement blueprint loading logic.
    - [ ] 2.3.3. Implement difficulty management logic.
    - [ ] 2.3.4. Run ESLint on levelManager.js.
    - [ ] 2.3.5. Manually verify correct blueprint/difficulty loading.
    - [ ] 2.3.6. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.3.7. Commit the changes to git if all checks pass.
  - [ ] 2.4. Build StartScreen.js UI component to display math type, difficulty, and avatar selection options.
    - [ ] 2.4.1. Implement UI for math type selection.
    - [ ] 2.4.2. Implement UI for difficulty selection.
    - [ ] 2.4.3. Implement UI for avatar selection.
    - [ ] 2.4.4. Run ESLint on StartScreen.js.
    - [ ] 2.4.5. Manually verify UI displays and collects selections.
    - [ ] 2.4.6. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.4.7. Commit the changes to git if all checks pass.
  - [ ] 2.5. Wire StartScreen.js to collect user selections and pass them to gameEngine.js on game start.
    - [ ] 2.5.1. Implement data flow from StartScreen.js to gameEngine.js.
    - [ ] 2.5.2. Run ESLint on both files.
    - [ ] 2.5.3. Manually verify data flow works.
    - [ ] 2.5.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.5.5. Commit the changes to git if all checks pass.
  - [ ] 2.6. Implement AvatarSelector.js and ensure it integrates with StartScreen.js, allowing the user to select an avatar.
    - [ ] 2.6.1. Implement AvatarSelector.js.
    - [ ] 2.6.2. Integrate AvatarSelector.js with StartScreen.js.
    - [ ] 2.6.3. Run ESLint on both files.
    - [ ] 2.6.4. Manually verify avatar selection works.
    - [ ] 2.6.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.6.6. Commit the changes to git if all checks pass.
  - [ ] 2.7. Add logic to hide StartScreen and show the main game UI after selections are made.
    - [ ] 2.7.1. Implement logic to hide StartScreen.
    - [ ] 2.7.2. Implement logic to show main game UI.
    - [ ] 2.7.3. Run ESLint on all affected files.
    - [ ] 2.7.4. Manually verify transition works.
    - [ ] 2.7.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 2.7.6. Commit the changes to git if all checks pass.

- [ ] 3a. PRECHECK. Before starting Step 3, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 3. Block, Structure, and Math Problem Logic
  - [ ] 3.1. Implement blockTypes.js as a config file listing all block types, their IDs, and texture paths.
    - [ ] 3.1.1. Define block types, IDs, and texture paths.
    - [ ] 3.1.2. Run ESLint on blockTypes.js.
    - [ ] 3.1.3. Manually verify config is correct.
    - [ ] 3.1.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.1.5. Commit the file to git if all checks pass.
  - [ ] 3.2. Implement CubePlatform.js to create Babylon.js box meshes and use DynamicTexture to render math answers on cube faces.
    - [ ] 3.2.1. Implement Babylon.js box mesh creation.
    - [ ] 3.2.2. Implement DynamicTexture for math answers.
    - [ ] 3.2.3. Run ESLint on CubePlatform.js.
    - [ ] 3.2.4. Manually verify cubes and text display.
    - [ ] 3.2.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.2.6. Commit the file to git if all checks pass.
  - [ ] 3.3. Develop structureBlueprints.js with sample blueprints for each difficulty, using 2D/3D arrays of block type IDs.
    - [ ] 3.3.1. Create sample blueprints for each difficulty.
    - [ ] 3.3.2. Use 2D/3D arrays for block type IDs.
    - [ ] 3.3.3. Run ESLint on structureBlueprints.js.
    - [ ] 3.3.4. Manually verify blueprint structure.
    - [ ] 3.3.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.3.6. Commit the file to git if all checks pass.
  - [ ] 3.4. Implement structureBuilder.js to read the blueprint, track which blocks are needed, and visualize the structure as blocks are collected.
    - [ ] 3.4.1. Implement blueprint reading logic.
    - [ ] 3.4.2. Implement block tracking logic.
    - [ ] 3.4.3. Implement structure visualization logic.
    - [ ] 3.4.4. Run ESLint on structureBuilder.js.
    - [ ] 3.4.5. Manually verify visualization and tracking.
    - [ ] 3.4.6. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.4.7. Commit the file to git if all checks pass.
  - [ ] 3.5. Implement mathProblem.js to generate random math problems and correct answers according to selected type and difficulty.
    - [ ] 3.5.1. Implement random problem generation logic.
    - [ ] 3.5.2. Implement correct answer logic.
    - [ ] 3.5.3. Run ESLint on mathProblem.js.
    - [ ] 3.5.4. Manually verify problem/answer generation.
    - [ ] 3.5.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.5.6. Commit the file to git if all checks pass.
  - [ ] 3.6. Implement distractor answer generation and ensure correct/distractor answers are shuffled and assigned to cube platforms.
    - [ ] 3.6.1. Implement distractor answer generation logic.
    - [ ] 3.6.2. Shuffle and assign answers to cubes.
    - [ ] 3.6.3. Run ESLint on mathProblem.js and CubePlatform.js.
    - [ ] 3.6.4. Manually verify answer assignment.
    - [ ] 3.6.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.6.6. Commit the changes to git if all checks pass.
  - [ ] 3.7. Integrate logic in structureBuilder.js to analyze the blueprint and dynamically track remaining block requirements.
    - [ ] 3.7.1. Implement blueprint analysis logic.
    - [ ] 3.7.2. Implement dynamic tracking logic.
    - [ ] 3.7.3. Run ESLint on structureBuilder.js.
    - [ ] 3.7.4. Manually verify tracking works.
    - [ ] 3.7.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.7.6. Commit the changes to git if all checks pass.
  - [ ] 3.8. Ensure CubePlatform.js only presents block types still needed for structure completion.
    - [ ] 3.8.1. Implement logic to filter block types.
    - [ ] 3.8.2. Run ESLint on CubePlatform.js.
    - [ ] 3.8.3. Manually verify block type selection.
    - [ ] 3.8.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 3.8.5. Commit the changes to git if all checks pass.

- [ ] 4a. PRECHECK. Before starting Step 4, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 4. Game Flow and Handlers
  - [ ] 4.1. Implement rightAnswerHandler.js to play correct answer sound, trigger positive animation, award the correct block, update the structure, and show feedback.
    - [ ] 4.1.1. Implement correct answer sound logic in rightAnswerHandler.js.
    - [ ] 4.1.2. Implement positive animation logic.
    - [ ] 4.1.3. Implement block awarding and structure update.
    - [ ] 4.1.4. Implement feedback UI.
    - [ ] 4.1.5. Run ESLint on rightAnswerHandler.js and affected files.
    - [ ] 4.1.6. Manually verify all effects.
    - [ ] 4.1.7. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 4.1.8. Commit the changes to git if all checks pass.
  - [ ] 4.2. Implement wrongAnswerHandler.js to play wrong answer sound, trigger negative animation, remove a collected block if possible, record the missed problem, and ensure it is presented again later.
    - [ ] 4.2.1. Implement wrong answer sound logic in wrongAnswerHandler.js.
    - [ ] 4.2.2. Implement negative animation logic.
    - [ ] 4.2.3. Implement block removal logic.
    - [ ] 4.2.4. Implement missed problem recording and reinsertion.
    - [ ] 4.2.5. Run ESLint on wrongAnswerHandler.js and affected files.
    - [ ] 4.2.6. Manually verify all effects and logic.
    - [ ] 4.2.7. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 4.2.8. Commit the changes to git if all checks pass.
  - [ ] 4.3. Add logic in gameEngine.js to call the appropriate handler based on user answer selection.
    - [ ] 4.3.1. Implement handler selection logic in gameEngine.js.
    - [ ] 4.3.2. Run ESLint on gameEngine.js.
    - [ ] 4.3.3. Manually verify handler calls.
    - [ ] 4.3.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 4.3.5. Commit the changes to git if all checks pass.
  - [ ] 4.4. Ensure all UI and game state updates (structure, score, retry, etc.) are routed through the handlers.
    - [ ] 4.4.1. Implement UI/game state update logic.
    - [ ] 4.4.2. Run ESLint on affected files.
    - [ ] 4.4.3. Manually verify updates.
    - [ ] 4.4.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 4.4.5. Commit the changes to git if all checks pass.
  - [ ] 4.5. Add mistake tracking and logic to reinsert missed problems into the problem queue.
    - [ ] 4.5.1. Implement mistake tracking logic.
    - [ ] 4.5.2. Implement reinsertion logic.
    - [ ] 4.5.3. Run ESLint on affected files.
    - [ ] 4.5.4. Manually verify reinsertion works.
    - [ ] 4.5.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 4.5.6. Commit the changes to git if all checks pass.

- [ ] 5a. PRECHECK. Before starting Step 5, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 5. Sound and Asset Management
  - [ ] 5.1. Implement soundManager.js to preload all required sounds using Babylon.js's BABYLON.Sound class.
    - [ ] 5.1.1. Implement sound preloading logic in soundManager.js.
    - [ ] 5.1.2. Run ESLint on soundManager.js.
    - [ ] 5.1.3. Manually verify preloading.
    - [ ] 5.1.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 5.1.5. Commit the changes to git if all checks pass.
  - [ ] 5.2. Add functions in soundManager.js to play, stop, mute, and set volume for sounds by name/event.
    - [ ] 5.2.1. Implement play/stop/mute/volume functions.
    - [ ] 5.2.2. Run ESLint on soundManager.js.
    - [ ] 5.2.3. Manually verify functions work.
    - [ ] 5.2.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 5.2.5. Commit the changes to git if all checks pass.
  - [ ] 5.3. Integrate soundManager.js with rightAnswerHandler.js, wrongAnswerHandler.js, and UI components for all relevant events.
    - [ ] 5.3.1. Implement integration logic.
    - [ ] 5.3.2. Run ESLint on all affected files.
    - [ ] 5.3.3. Manually verify integration.
    - [ ] 5.3.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 5.3.5. Commit the changes to git if all checks pass.
  - [ ] 5.4. Replace placeholder assets with final textures and sound files as they become available.
    - [ ] 5.4.1. Replace texture files.
    - [ ] 5.4.2. Replace sound files.
    - [ ] 5.4.3. Run ESLint on assets directory (if applicable).
    - [ ] 5.4.4. Manually verify assets.
    - [ ] 5.4.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 5.4.6. Commit the changes to git if all checks pass.

- [ ] 6a. PRECHECK. Before starting Step 6, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 6. Modular UI & Feedback
  - [ ] 6.1. Implement MathDisplay.js to show the current math problem and accept user input/selection.
    - [ ] 6.1.1. Implement MathDisplay.js UI.
    - [ ] 6.1.2. Run ESLint on MathDisplay.js.
    - [ ] 6.1.3. Manually verify UI.
    - [ ] 6.1.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.1.5. Commit the file to git if all checks pass.
  - [ ] 6.2. Implement StructureView.js to visualize the player's structure as it is built.
    - [ ] 6.2.1. Implement StructureView.js UI.
    - [ ] 6.2.2. Run ESLint on StructureView.js.
    - [ ] 6.2.3. Manually verify visualization.
    - [ ] 6.2.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.2.5. Commit the file to git if all checks pass.
  - [ ] 6.3. Implement DifficultySelector.js and ensure it is integrated into StartScreen.js.
    - [ ] 6.3.1. Implement DifficultySelector.js UI.
    - [ ] 6.3.2. Integrate with StartScreen.js.
    - [ ] 6.3.3. Run ESLint on both files.
    - [ ] 6.3.4. Manually verify selector works.
    - [ ] 6.3.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.3.6. Commit the changes to git if all checks pass.
  - [ ] 6.4. Ensure all UI components are wired to game state and update responsively.
    - [ ] 6.4.1. Implement state wiring logic.
    - [ ] 6.4.2. Run ESLint on all affected files.
    - [ ] 6.4.3. Manually verify state updates.
    - [ ] 6.4.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.4.5. Commit the changes to git if all checks pass.
  - [ ] 6.5. Add accessibility features such as ARIA labels and keyboard navigation.
    - [ ] 6.5.1. Implement ARIA labels.
    - [ ] 6.5.2. Implement keyboard navigation.
    - [ ] 6.5.3. Run ESLint on all affected files.
    - [ ] 6.5.4. Manually verify accessibility features.
    - [ ] 6.5.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.5.6. Commit the changes to git if all checks pass.
  - [ ] 6.6. Add hooks or placeholders for localization support.
    - [ ] 6.6.1. Implement localization hooks/placeholders.
    - [ ] 6.6.2. Run ESLint on all affected files.
    - [ ] 6.6.3. Manually verify hooks.
    - [ ] 6.6.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 6.6.5. Commit the changes to git if all checks pass.

- [ ] 7a. PRECHECK. Before starting Step 7, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 7. Testing Setup and Coverage
  - [ ] 7.1. Set up Jest for unit testing all modules and components, ensuring ES module compatibility.
    - [ ] 7.1.1. Set up Jest config.
    - [ ] 7.1.2. Run ESLint on Jest config and test files.
    - [ ] 7.1.3. Manually verify Jest config.
    - [ ] 7.1.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.1.5. Commit the changes to git if all checks pass.
  - [ ] 7.2. Set up Playwright for integration and end-to-end testing, including start screen, game flow, and answer selection.
    - [ ] 7.2.1. Set up Playwright config.
    - [ ] 7.2.2. Run ESLint on Playwright config and test files.
    - [ ] 7.2.3. Manually verify Playwright config.
    - [ ] 7.2.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.2.5. Commit the changes to git if all checks pass.
  - [ ] 7.3. Write unit tests for mathProblem.js to verify correct and distractor answer generation for all math types and difficulties.
    - [ ] 7.3.1. Write unit tests for mathProblem.js.
    - [ ] 7.3.2. Run ESLint on test files.
    - [ ] 7.3.3. Manually verify test coverage and logic.
    - [ ] 7.3.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.3.5. Commit the changes to git if all checks pass.
  - [ ] 7.4. Write unit tests for structureBlueprints.js and structureBuilder.js to verify blueprint parsing and block requirement tracking.
    - [ ] 7.4.1. Write unit tests for structureBlueprints.js and structureBuilder.js.
    - [ ] 7.4.2. Run ESLint on test files.
    - [ ] 7.4.3. Manually verify test coverage and logic.
    - [ ] 7.4.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.4.5. Commit the changes to git if all checks pass.
  - [ ] 7.5. Write unit tests for rightAnswerHandler.js and wrongAnswerHandler.js to verify all feedback, state, and missed problem logic.
    - [ ] 7.5.1. Write unit tests for rightAnswerHandler.js and wrongAnswerHandler.js.
    - [ ] 7.5.2. Run ESLint on test files.
    - [ ] 7.5.3. Manually verify test coverage and logic.
    - [ ] 7.5.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.5.5. Commit the changes to git if all checks pass.
  - [ ] 7.6. Write unit tests for soundManager.js to verify sound loading, playback, and control APIs.
    - [ ] 7.6.1. Write unit tests for soundManager.js.
    - [ ] 7.6.2. Run ESLint on test files.
    - [ ] 7.6.3. Manually verify test coverage and logic.
    - [ ] 7.6.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.6.5. Commit the changes to git if all checks pass.
  - [ ] 7.7. Write integration tests for the full game session, including block collection, structure completion, and handling of wrong answers.
    - [ ] 7.7.1. Write integration tests for game session.
    - [ ] 7.7.2. Run ESLint on test files.
    - [ ] 7.7.3. Manually verify test coverage and logic.
    - [ ] 7.7.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.7.5. Commit the changes to git if all checks pass.
  - [ ] 7.8. Write e2e tests for user flows: start-to-finish session, retry after wrong answer, and reinsertion of missed problems.
    - [ ] 7.8.1. Write e2e tests for user flows.
    - [ ] 7.8.2. Run ESLint on test files.
    - [ ] 7.8.3. Manually verify test coverage and logic.
    - [ ] 7.8.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.8.5. Commit the changes to git if all checks pass.
  - [ ] 7.9. Ensure all tests pass after each major feature is implemented and before merging changes.
    - [ ] 7.9.1. Run all tests.
    - [ ] 7.9.2. Run ESLint on all test files.
    - [ ] 7.9.3. Manually verify all tests pass.
    - [ ] 7.9.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 7.9.5. Commit the changes to git if all checks pass.

- [ ] 8a. PRECHECK. Before starting Step 8, check the line count of all relevant files to ensure none will exceed 300 lines. If any file is at risk, refactor and retest as needed. Record results in the log.
- [ ] 8. Documentation and Review
  - [ ] 8.1. Update README.md with setup, usage, and contribution instructions as features are implemented.
    - [ ] 8.1.1. Update README.md content.
    - [ ] 8.1.2. Run ESLint on README.md.
    - [ ] 8.1.3. Manually verify content for completeness and accuracy.
    - [ ] 8.1.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 8.1.5. Commit the changes to git if all checks pass.
  - [ ] 8.2. Update PRD.md and all design notes to reflect any changes or additions.
    - [ ] 8.2.1. Update PRD.md and design notes.
    - [ ] 8.2.2. Run ESLint on PRD.md and design notes.
    - [ ] 8.2.3. Manually verify content for completeness and accuracy.
    - [ ] 8.2.4. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 8.2.5. Commit the changes to git if all checks pass.
  - [ ] 8.3. Review the full plan and implementation for modularity, extensibility, and testability at each milestone.
    - [ ] 8.3.1. Review plan and implementation for modularity.
    - [ ] 8.3.2. Review for extensibility.
    - [ ] 8.3.3. Review for testability.
    - [ ] 8.3.4. Run ESLint on all reviewed files.
    - [ ] 8.3.5. Manually verify review findings.
    - [ ] 8.3.6. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 8.3.7. Commit the changes to git if all checks pass.
  - [ ] 8.4. Solicit user and stakeholder feedback and iterate on unclear or incomplete areas before starting full implementation.
    - [ ] 8.4.1. Gather feedback from users and stakeholders.
    - [ ] 8.4.2. Update plan and documentation as needed.
    - [ ] 8.4.3. Run ESLint on updated files.
    - [ ] 8.4.4. Manually verify feedback is addressed.
    - [ ] 8.4.5. Record the result of the manual verification and ESLint run in a results log.
    - [ ] 8.4.6. Commit the changes to git if all checks pass.

---

_Last updated: 2025-04-17_
