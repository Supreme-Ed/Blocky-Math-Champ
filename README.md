# Minecraft-Style 3D Math Game (Babylon.js)

## Overview
A fun, educational 3D math game inspired by Minecraft. Players walk in a field toward cubes, select answers to math problems, and when an answer is chosen, the character walks to the selected cube and mines it with their pickaxe.

## Features
- 3D Babylon.js graphics
- Dynamic procedural skybox with real-time color controls (debug panel)

- Math problem solving
- Walk-and-mine gameplay (select answer, walk to cube, mine with pickaxe)
- Third-person character movement
- Responsive UI for web, desktop, and mobile
- **Visual Answer Feedback:** When a player selects a cube, the chosen cube flashes green (correct) or red (incorrect) using a modular glow effect. This feedback is implemented in an extensible way for future effects.

## Progressive Learning & Mastery Logic

The game uses a modular, adaptive progressive learning engine to help players master math problems efficiently and effectively. This logic is implemented in `src/game/problemQueueManager.js` and includes:

- **Adaptive Mastery Thresholds:**
  - If a problem is answered correctly on the first try, only 2 correct-in-a-row are required for mastery.
  - If a problem is missed at least once, 3 correct-in-a-row are required to master it.
- **Spaced Repetition:**
  - Missed or not-yet-mastered problems are reinserted into the queue at a random interval (2–6 problems ahead), so players see them again soon but not immediately.
- **Mistake Logging:**
  - Every incorrect answer is logged with the question, the answer given, the correct answer, and a timestamped answer history.
- **Session Review UI:**
  - At the end of each session, a detailed summary is shown, listing all missed problems, the correct answers, and your answer history for each problem.
  - This helps players (and educators) easily identify which problems were challenging and review mistakes for future improvement.

All progressive learning logic is modularized for easy maintenance and future enhancements. See `src/game/problemQueueManager.js` for details and customization options.

## Avatar System & Customization
### Avatars

Blocky Math Champ supports customizable 3D avatars for players, each represented by a 3D model (OBJ or GLTF/GLB) and optional textures. The available avatars are listed in `public/models/avatars/manifest.json`. To add a new avatar, add an entry to this manifest and place the model and textures in a new folder under `public/models/avatars/voxel-characters/`.

**Default Avatars:**
- Small Human 1
- Small Human 2
- Small Human 3
- Steve (new in this release)

Avatars are displayed in the selection screen, and your chosen avatar is used in-game. The system automatically loads all avatars listed in the manifest, so you can add more by updating the manifest and placing the files in the correct folder.

## Dynamic Skybox Controls

The game features a dynamic procedural skybox with real-time controls accessible from the Debug Panel:
- Open the Debug Panel (top-right of the game window).
- Adjust **Sky Color (Background)**, **Cloud Color (Cloud Shapes)**, **Amplitude (Contrast)**, and **Cloud Detail (numOctaves)** sliders to experiment with different sky/cloud looks.
- **Cloud Detail (numOctaves)** now defaults to the maximum value (12) for maximum cloud fidelity in both the skybox and the Debug Panel.
- Click **Apply** to update the skybox in real time.
- The **Reset Skybox Colors** button restores recommended blue sky/white clouds and resets all sliders to their default values (including max detail).

**Babylon.js Quirk:**
- The CloudProceduralTexture uses `cloudColor` as the background and `skyColor` as the color of the cloud shapes. The Debug Panel swaps these for correct visuals (blue sky, white clouds).

**Local CloudProceduralTexture:**
- The project uses a local, customizable copy of `CloudProceduralTexture` (`src/procedural/CloudProceduralTexture.js`).
- Only the following properties are exposed for real-time control: `skyColor`, `cloudColor`, `amplitude`, and `numOctaves`.
- This local module allows for future enhancements or bugfixes independent of the Babylon.js library.

**Cloud Animation:**
- Animation of clouds is not currently implemented, but is tracked as a future low-priority improvement.

## Getting Started

1. **Clone the repository**
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the development server (Vite):**
   ```sh
   npm run dev
   ```
   Visit [http://localhost:5173](http://localhost:5173) to view the game.

## Answer Feedback Effects

Blocky Math Champ features modular, extensible visual feedback for answer selection:

- **Glow Effects:** When a player selects a cube, the answer face glows green (correct) or red (incorrect) for a short duration.
- **Modularity:** All answer feedback effects are defined in `src/effects/rightAnswerEffects.js` and `src/effects/wrongAnswerEffects.js`. The effect modules are designed for easy extension (e.g., to add particles or mesh animation).
- **Mesh Parameter Flow:** The Babylon.js mesh for the clicked cube is passed through event handlers and answer logic, ensuring the correct cube receives the visual effect. See `useRowManager.js`, `MainGame.jsx`, and the effect modules for details.
- **Extensibility:** To add new effects, extend the exported functions in the effect modules or add new ones. The answer handler logic is decoupled from effect details for maintainability.

## Project Structure
- `src/` — Main source code
  - `components/scene/Skybox.js` — Modular procedural skybox (Babylon.js CloudProceduralTexture)
  - `components/DebugPanel.jsx` — Debug panel with real-time skybox controls

  - `game/` — Game engine and logic modules
  - `components/` — Visual and gameplay components
    - `UI/` — UI components
  - `assets/` — Textures and sounds
- `tests/` — Unit, integration, and e2e tests
- `index.html` — Main HTML entry point

## Testing
- **Unit tests:**
  ```sh
  npm test
  ```
  (Runs Jest for all tests in `tests/unit/`)
- **Integration & e2e tests:**
  ```sh
  npx playwright test
  ```
  (Runs Playwright tests in `tests/integration/` and `tests/e2e/`)

## Development Notes

### PropTypes Usage

This project uses [PropTypes](https://reactjs.org/docs/typechecking-with-proptypes.html) for runtime type-checking of React component props. PropTypes help:
- Catch bugs early by warning if the wrong type of prop is passed
- Document component APIs for other developers
- Satisfy linting rules (such as those from eslint-plugin-react)

**How to add PropTypes to a component:**

1. Import PropTypes:
   ```js
   import PropTypes from 'prop-types';
   ```
2. Define the prop types after your component:
   ```js
   MyComponent.propTypes = {
     someProp: PropTypes.string.isRequired,
     anotherProp: PropTypes.number,
   };
   ```
3. Mark props as `.isRequired` if they must be provided.

**Best Practice:**
All React components that receive props should define PropTypes for those props.

### Babylon.js Render Loop
- Avoid manual calls to `scene.render()` inside update functions (e.g., `updateAnswerCubesNoBlank`). Let Babylon.js manage the render loop to prevent screen blanking issues.

## Development Tools
- [Vite](https://vitejs.dev/) for fast dev/build
- [Babylon.js](https://www.babylonjs.com/) for 3D rendering
- [Jest](https://jestjs.io/) for unit testing
- [Playwright](https://playwright.dev/) for integration/e2e testing
- [ESLint](https://eslint.org/) for code linting

## Future Plans
- Native desktop app (Electron)
- Native mobile app (Cordova/Capacitor)

## Contributing
PRs welcome! See TASKS.md for roadmap.
