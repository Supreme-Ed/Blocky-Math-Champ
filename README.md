# Minecraft-Style 3D Math Game (Babylon.js)

## Overview
A fun, educational 3D math game inspired by Minecraft. Players walk in a field toward cubes, select answers to math problems, and when an answer is chosen, the character walks to the selected cube and mines it with their pickaxe.

## Features
- 3D Babylon.js graphics
- Math problem solving
- Walk-and-mine gameplay (select answer, walk to cube, mine with pickaxe)
- Third-person character movement
- Responsive UI for web, desktop, and mobile

## Avatar System & Customization
- Avatars are loaded dynamically from `/public/models/avatars/manifest.json`.
- Each duck model (Duck0.gltf, Duck1.gltf, Duck2.gltf) is displayed with a unique color tint (yellow, red, green) using per-model color logic in `AvatarPreview3D.jsx`.
- To add or change avatars, update the manifest and place the correct model/texture files in the avatars directory.
- Troubleshooting: If an avatar is blank, check for missing textures or incorrect manifest entries.
- The Start Screen allows users to select their avatar before starting the game.

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

## Project Structure
- `src/` — Main source code
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
