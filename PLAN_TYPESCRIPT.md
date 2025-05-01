# TypeScript 7.0 Migration Plan for Blocky Math Champ

This document outlines a comprehensive plan for migrating the Blocky Math Champ project from JavaScript/JSX to TypeScript 7.0.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Migration Goals](#migration-goals)
3. [Preparation Phase](#preparation-phase)
4. [Implementation Phase](#implementation-phase)
5. [Testing and Validation Phase](#testing-and-validation-phase)
6. [Timeline and Milestones](#timeline-and-milestones)
7. [Appendix: TypeScript Configuration](#appendix-typescript-configuration)

## Project Overview

Blocky Math Champ is a React-based educational game that uses Babylon.js for 3D rendering. The project currently uses JavaScript/JSX without TypeScript. The migration will convert the codebase to TypeScript while maintaining all existing functionality.

## Migration Goals

- Implement static type checking to improve code quality and catch errors early
- Enhance developer experience with better IDE support and code navigation
- Improve integration with Babylon.js (which is written in TypeScript)
- Maintain backward compatibility with existing code
- Establish type definitions for core game concepts
- Minimize disruption to ongoing development

## Preparation Phase

### 1. Install TypeScript and Required Dependencies

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

### 2. Create Initial TypeScript Configuration

Create a basic `tsconfig.json` file in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* TypeScript Strictness */
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,

    /* Migration Helpers */
    "allowJs": true,
    "checkJs": false,

    /* Additional Options */
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create a `tsconfig.node.json` file for Vite configuration:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 3. Update Vite Configuration

Convert `vite.config.js` to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

### 4. Update ESLint Configuration

Install TypeScript ESLint dependencies:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Create or update `.eslintrc.js`:

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Relaxed rules for migration period
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
```

### 5. Update Jest Configuration

Install Jest TypeScript dependencies:

```bash
npm install --save-dev ts-jest @types/jest
```

Create or update `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
```

### 6. Define Core Type Definitions

Create a `src/types` directory with core type definitions:

**src/types/game.d.ts**:
```typescript
export interface MathProblem {
  question: string;
  answer: number | string;
  options?: (number | string)[];
  difficulty?: number;
  type?: string;
}

export interface BlockType {
  id: string;
  name: string;
  texture?: string;
  color?: string;
  rarity?: number;
}

export interface GameState {
  currentProblem: MathProblem | null;
  score: number;
  level: number;
  blocks: Record<string, number>;
  mistakesLog: MathProblem[];
  sessionComplete: boolean;
}

export interface Avatar {
  file: string;
  name?: string;
}
```

**src/types/babylon.d.ts**:
```typescript
import { Scene, Vector3, Mesh } from '@babylonjs/core';

export interface SceneProps {
  scene: Scene;
  problemQueue?: MathProblem[];
  onAnswerSelected?: (answer: number | string, correct: boolean) => void;
  selectedAvatar?: Avatar | null;
  resetKey?: string | number;
}

export interface BabylonObject {
  mesh: Mesh;
  position?: Vector3;
  rotation?: Vector3;
  scaling?: Vector3;
  dispose: () => void;
}
```

## Implementation Phase

### 1. Convert Core Utility Files

Start with non-UI utility files that have minimal dependencies:

1. `src/game/blockTypes.js` → `src/game/blockTypes.ts`
2. `src/game/mathProblem.js` → `src/game/mathProblem.ts`
3. `src/game/soundManager.js` → `src/game/soundManager.ts`
4. `src/game/problemBank.js` → `src/game/problemBank.ts`

### 2. Convert Game Logic Files

Next, convert the core game logic files:

1. `src/game/generateProblemsFromSettings.js` → `src/game/generateProblemsFromSettings.ts`
2. `src/game/rightAnswerHandler.js` → `src/game/rightAnswerHandler.ts`
3. `src/game/wrongAnswerHandler.js` → `src/game/wrongAnswerHandler.ts`
4. `src/game/blockAwardManager.js` → `src/game/blockAwardManager.ts`
5. `src/game/levelManager.js` → `src/game/levelManager.ts`
6. `src/game/problemQueueManager.js` → `src/game/problemQueueManager.ts`
7. `src/game/structureBuilder.js` → `src/game/structureBuilder.ts`
8. `src/game/gameEngine.js` → `src/game/gameEngine.ts`

### 3. Convert React Hooks

Convert custom hooks:

1. `src/components/hooks/useBabylonScene.js` → `src/components/hooks/useBabylonScene.ts`
2. `src/components/hooks/useGameState.js` → `src/components/hooks/useGameState.ts`
3. `src/components/hooks/useGameUIState.js` → `src/components/hooks/useGameUIState.ts`
4. `src/components/hooks/useGameEventListeners.js` → `src/components/hooks/useGameEventListeners.ts`

### 4. Convert Babylon.js Components

Convert Babylon.js-related components:

1. `src/components/scene/useBabylonAvatar.js` → `src/components/scene/useBabylonAvatar.ts`
2. `src/components/scene/useBabylonCamera.js` → `src/components/scene/useBabylonCamera.ts`
3. `src/components/scene/VillagerNPC.js` → `src/components/scene/VillagerNPC.tsx`
4. `src/components/AvatarRunner3D.js` → `src/components/AvatarRunner3D.ts`
5. `src/components/CubePlatform.js` → `src/components/CubePlatform.ts`
6. `src/components/Player.js` → `src/components/Player.ts`

### 5. Convert React UI Components

Convert React UI components:

1. `src/components/UI/AvatarSelector.jsx` → `src/components/UI/AvatarSelector.tsx`
2. `src/components/UI/DifficultySelector.jsx` → `src/components/UI/DifficultySelector.tsx`
3. `src/components/UI/MathTypeSelector.jsx` → `src/components/UI/MathTypeSelector.tsx`
4. `src/components/DebugPanel.jsx` → `src/components/DebugPanel.tsx`
5. `src/components/FeedbackBanner.jsx` → `src/components/FeedbackBanner.tsx`
6. `src/components/Inventory.jsx` → `src/components/Inventory.tsx`
7. `src/components/ProblemDisplay.jsx` → `src/components/ProblemDisplay.tsx`
8. `src/components/SessionReview.jsx` → `src/components/SessionReview.tsx`

### 6. Convert Main Components

Convert the main application components:

1. `src/components/BabylonSceneContent.jsx` → `src/components/BabylonSceneContent.tsx`
2. `src/components/StartScreen.jsx` → `src/components/StartScreen.tsx`
3. `src/components/MainGame.jsx` → `src/components/MainGame.tsx`
4. `src/main.jsx` → `src/main.tsx`

### 7. Update Import Statements

Update all import statements to use the new `.ts` and `.tsx` extensions. This can be done gradually as files are converted.

## Testing and Validation Phase

### 1. Run TypeScript Compiler

Run the TypeScript compiler to check for type errors:

```bash
npx tsc --noEmit
```

### 2. Fix Type Errors

Address any type errors identified by the TypeScript compiler. Common issues include:

- Missing type annotations for function parameters
- Incompatible types in assignments
- Null or undefined values not being checked
- Incorrect prop types in React components

### 3. Run Unit Tests

Run Jest tests to ensure functionality is maintained:

```bash
npm test
```

### 4. Run End-to-End Tests

Run Playwright tests to ensure the application works correctly:

```bash
npx playwright test
```

### 5. Manual Testing

Perform manual testing of key features:
- Game initialization
- Problem generation and display
- Answer selection and feedback
- Block collection and structure building
- Avatar movement and animation
- Sound effects and music

## Timeline and Milestones

### Week 1: Preparation and Setup
- Install TypeScript and dependencies
- Create TypeScript configuration files
- Define core type definitions
- Convert utility files

### Week 2: Game Logic Migration
- Convert game logic files
- Convert custom hooks
- Begin converting Babylon.js components

### Week 3: UI Component Migration
- Complete Babylon.js component conversion
- Convert React UI components
- Convert main application components

### Week 4: Testing and Refinement
- Run TypeScript compiler and fix errors
- Run automated tests
- Perform manual testing
- Refine type definitions
- Enable stricter TypeScript checks

## Appendix: TypeScript Configuration

### Progressive TypeScript Strictness

Once the initial migration is complete, gradually enable stricter TypeScript checks in `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ... other options ...

    /* TypeScript Strictness - Phase 2 */
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": true,

    // ... other options ...
  }
}
```

Final strictness settings (Phase 3):

```json
{
  "compilerOptions": {
    // ... other options ...

    /* TypeScript Strictness - Phase 3 */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,

    // ... other options ...
  }
}
```

### Path Aliases

Consider adding path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    // ... other options ...

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@game/*": ["src/game/*"],
      "@hooks/*": ["src/components/hooks/*"],
      "@types/*": ["src/types/*"]
    }

    // ... other options ...
  }
}
```

Update Vite configuration to support path aliases:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@game': path.resolve(__dirname, './src/game'),
      '@hooks': path.resolve(__dirname, './src/components/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  // ... other options ...
});
# TypeScript Migration Documentation for Blocky Math Champ

## Overview

This document outlines the comprehensive TypeScript migration performed on the Blocky Math Champ project. The migration converted JavaScript/JSX files to TypeScript/TSX, added proper type definitions, and fixed type-related issues to improve code quality, maintainability, and developer experience.

## Migration Scope

The migration covered the following areas:

1. Core React components
2. Scene components for Babylon.js
3. Custom hooks
4. Game logic modules
5. Visual effects
6. Procedural textures
7. Type definitions

## Files Converted

### Core Components
- `CubePlatform.js` → `CubePlatform.ts`
- `normalMapFromHeightmap.js` → `normalMapFromHeightmap.ts`
- `Player.js` → `Player.ts`
- `useVillagerNPC.js` → `useVillagerNPC.ts`
- `BabylonSceneContent.jsx` → `BabylonSceneContent.tsx`
- `Inventory.jsx` → `Inventory.tsx`
- `Tooltip.jsx` → `Tooltip.tsx`
- `MainGame.jsx` → `MainGame.tsx`
- `ProblemDisplay.jsx` → `ProblemDisplay.tsx`
- `SessionReview.jsx` → `SessionReview.tsx`
- `FeedbackBanner.jsx` → `FeedbackBanner.tsx`
- `StartScreen.jsx` → `StartScreen.tsx`

### Scene Components
- `Ground.js` → `Ground.ts`
- `Skybox.js` → `Skybox.ts`
- `Lighting.js` → `Lighting.ts`
- `perlin.js` → `perlin.ts`

### Hooks
- `useRowManager.js` → `useRowManager.ts`
- `useRowManager.helpers.js` → `useRowManager.helpers.ts`

### Game Logic
- `blockAwardManager.js` → `blockAwardManager.ts`
- `blockTypes.js` → `blockTypes.ts`
- `babylonProceduralWrappers.js` → `babylonProceduralWrappers.ts`

### Procedural Textures
- `CloudProceduralTexture.js` → `CloudProceduralTexture.ts`

## Key Improvements

### Type Definitions
- Created comprehensive interfaces for game data structures in `game.d.ts`:
  ```typescript
  export interface MathProblem {
    question: string;
    answer: number | string;
    options?: (number | string)[];
    difficulty?: number;
    type?: string;
    id?: string | number;
  }

  export interface ProblemHistory {
    answer: number | string;
    correct: boolean;
    timestamp: number;
  }

  export interface ExtendedMathProblem extends MathProblem {
    choices?: (number | string)[];
    history?: ProblemHistory[];
    correctStreak?: number;
    mistakeCount?: number;
    firstTryWasCorrect?: boolean;
  }

  export interface BlockType {
    id: string;
    name: string;
    texture?: string;
    color?: string;
    rarity?: number;
  }

  export interface Avatar {
    file: string;
    name?: string;
  }
  ```

- Added CSS module declarations in `css.d.ts`:
  ```typescript
  declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
  }

  declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
  }
  ```

### Component Props
- Added proper TypeScript interfaces for component props:
  ```typescript
  interface ProblemDisplayProps {
    currentProblem: ExtendedMathProblem | null;
    answered: boolean;
    onUserAnswer: (params: { mesh: BABYLON.AbstractMesh, answer: number | string, blockTypeId: string }) => void;
  }
  ```

### Babylon.js Integration
- Improved type safety for Babylon.js objects:
  - Updated mesh handling to use `AbstractMesh` instead of `Mesh` for better compatibility
  - Added proper type definitions for Babylon.js materials and textures
  - Fixed type issues with event handlers and callbacks

### Global Declarations
- Fixed global type declarations for window objects:
  ```typescript
  declare global {
    interface Window {
      babylonScene?: BABYLON.Scene;
      enableFreeSceneRotation?: boolean;
      soundManager?: SoundManager;
      correctBlocks: number;
    }
  }
  ```

### Error Handling
- Added proper type checking for error conditions:
  ```typescript
  if (!r || r.min === undefined || r.max === undefined || !Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min > r.max) return false;
  ```

## Challenges and Solutions

### Challenge 1: CSS Module Types
**Problem**: TypeScript couldn't find type declarations for CSS modules.
**Solution**: Created a `css.d.ts` file with module declarations for CSS and CSS modules.

### Challenge 2: Mesh Type Compatibility
**Problem**: `AbstractMesh` vs `Mesh` type incompatibility in Babylon.js.
**Solution**: Updated effect functions to accept `AbstractMesh` instead of `Mesh` for better compatibility:
```typescript
export async function playRightAnswerEffect(mesh: AbstractMesh, options: RightAnswerEffectOptions = {}): Promise<void> {
  // Implementation
}
```

### Challenge 3: Component Prop Types
**Problem**: Mismatched prop types between components.
**Solution**: Updated interfaces to ensure consistent prop types across components:
```typescript
// In StartScreen.tsx
interface StartScreenProps {
  onStart: (problems: MathProblem[], avatar: Avatar) => void;
}

// In main.tsx
<StartScreen onStart={(problemSet: MathProblem[], selectedAvatar: Avatar) => {
  setProblems(problemSet);
  setAvatar(selectedAvatar);
}} />
```

### Challenge 4: Global Window Properties
**Problem**: Inconsistent type definitions for global window properties.
**Solution**: Standardized window property declarations across files and made them optional where appropriate.

## Testing and Verification

The migration was verified through:

1. TypeScript compiler checks (`npx tsc --noEmit`)
2. Development server tests (`npm run dev`)
3. Manual verification of component rendering and functionality

All TypeScript errors were resolved, and the application runs successfully with TypeScript.

## Future Recommendations

1. **Enable Stricter Type Checking**:
   - Enable `strict` mode in tsconfig.json
   - Add `noImplicitAny` and other strict flags
   - Add ESLint rules for TypeScript

2. **Add Unit Tests**:
   - Set up Jest with TypeScript
   - Create test files with proper type definitions
   - Test components with typed props and state

3. **Improve Third-Party Type Definitions**:
   - Add more specific type definitions for Babylon.js
   - Add type definitions for any other libraries used in the project

4. **Refactor for TypeScript Features**:
   - Use more specific types instead of `any`
   - Use generics where appropriate
   - Use discriminated unions for state management

## Conclusion

The TypeScript migration has significantly improved the codebase by adding type safety, better documentation through types, and improved developer experience. The application now benefits from TypeScript's static type checking, which will help catch errors earlier in the development process and make the codebase more maintainable.

```