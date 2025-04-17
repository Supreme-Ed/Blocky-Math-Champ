# Minecraft-Style 3D Math Game (Babylon.js)

## Overview
A fun, educational 3D math game inspired by Minecraft. Players walk in a field toward cubes, select answers to math problems, and when an answer is chosen, the character walks to the selected cube and mines it with their pickaxe.

## Features
- 3D Babylon.js graphics
- Math problem solving
- Walk-and-mine gameplay (select answer, walk to cube, mine with pickaxe)
- Third-person character movement
- Responsive UI for web, desktop, and mobile

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
