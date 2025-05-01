# AI_INSTRUCTIONS.md

## Purpose
This document provides clear guidelines for any AI assistant or automation tools used in the development of the Minecraft-Style 3D Math Game (Babylon.js).

## General Principles
Always check for and adhere to PRD.md, TASKS.md, and README.md guidelines.
- Write all code in a manner that facilitates automated testing:
  - Use **Jest** for unit tests
  - Use **Playwright** for integration and end-to-end (e2e) tests
  - Use **ESLint** for code linting
  - Structure code to ensure it is modular, decoupled, and easily testable with these tools
- Always use ES module syntax (`import`/`export`) consistently throughout the codebase. Do not mix with CommonJS (`require`/`module.exports`).
- Ensure `package.json` contains `"type": "module"`.
- Configure Jest to support ES modules (e.g., `extensionsToTreatAsEsm: ['.js']` in jest.config.js) to avoid import/export errors during testing.
- Babel is **not required by default** for this project. Only add Babel if you:
  - Need to use advanced or experimental TypeScript features not supported in modern browsers
  - Need to support legacy browsers
  - Encounter Jest/ESM compatibility issues that cannot be solved with native configuration
- If Babel is used, ensure it is set up to transpile ES modules as needed for Jest and Playwright.
- Always iterate on existing code and patterns before introducing new ones.
- Keep the codebase clean, modular, and organized.
- Avoid code duplication and unnecessary complexity.
- Do not introduce new frameworks or technologies unless absolutely necessary and after exhausting existing solutions.
- Ensure all changes are relevant to the current task or feature.
- Write thorough tests for all major functionality.
- Respect environment-specific requirements (dev, test, prod).
- Never overwrite .env files or sensitive configuration without explicit confirmation.
- All code changes must be followed by running tests to ensure no breakage.
- Commit all changes to both local and remote (GitHub) repositories.
- Run ESlint on any file that is edited and fix errors before moving on.
- Use Powershell syntax for all commands
- All coding tasks must follow and approved PLANxxxx.md file associated with the current task.   Promp user for one if none is available.
- Do not allow any file to become larger than 300 lines.   If a file exceeds this limit, refactor and split into smaller files.  This is a sign of bad code organization and lack of modularity.
- Always update PRD, README, TASKS, and PLAN and DEBUG file as progress is made or features added etc.
- 

## Project-Specific Instructions
- The game must use Babylon.js with plain TypeScript as the core technology stack.
- The level/difficulty system must be modular, allowing new levels/structures to be added without modifying core logic.
- The gameplay loop is centered on collecting blocks to build a structure, not racing.
- Structure visualization replaces the progress bar.
- All UI overlays should be implemented using HTML/CSS for flexibility and accessibility.
- Plan for future cross-platform wrapping (Electron for desktop, Cordova/Capacitor for mobile).

## Collaboration
- Always check for and adhere to PRD.md, TASKS.md, and README.md guidelines.
- Document any architectural or pattern changes in the appropriate files.
- Seek clarification when requirements are ambiguous.

---

_Last updated: 2025-04-17_
