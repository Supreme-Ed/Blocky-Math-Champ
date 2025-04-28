# Minecraft-Style Inventory Implementation Plan

## 1. Clarify Requirements
- Inventory appears at the bottom center of the game, styled as a Minecraft hotbar.
- Always reflects all block types in `BLOCK_TYPES`.
- Mini-block icons are automatically generated as 2D images by rendering 3D blocks at an isometric angle using Babylon.js, then using those images as static inventory icons.
- Updates live as blocks are collected or removed.
- Visual style is inspired by Minecraft.
- Extensible for future features (selection, drag-and-drop, tooltips).

## 2. Component Structure
- Create a new React component: `Inventory.jsx`.
- Import and render this in the main scene (e.g., `BabylonSceneContent.jsx`).
- Use CSS for fixed positioning: bottom center, with responsive layout for different screen sizes.

## 3. Data Flow
- Inventory subscribes to `blockAwarded` and `blockRemoved` events.
- Uses `blockAwardManager.getBlocks()` for quantities and `BLOCK_TYPES` for slot definitions.
- Always maps over `BLOCK_TYPES` so new block types are automatically included.

## 4. Visual Rendering of Slots
- For each block type, render a mini-block icon:
  - For each block type, check localStorage for a cached icon (key: `blocky_icon_{blockTypeId}`).
  - If not present, create a hidden Babylon.js scene with the block at an isometric angle, render to an offscreen canvas (e.g., 48x48px), and convert to a data URL image.
  - Store the generated image as a base64 string in localStorage for future use.
  - Use the resulting image as the inventory icon for that block type.
  - Slot design: square, bordered, quantity overlay, visually similar to Minecraft.
  - When new block types are added, generate and cache their icons on first use.
  - Cache is invalidated if the user clears storage, or if block appearance changes (by deleting the relevant key or all icons).

## 5. Layout and Styling
- Use CSS to fix inventory to the bottom center.
- Use flexbox for a horizontal hotbar-style arrangement.
- Ensure inventory is visually distinct but does not obstruct gameplay.
- Responsive design for different screen sizes.

## 6. Interactivity and Extensibility
- Structure code for future features:
  - Block selection (clicking a slot)
  - Drag-and-drop rearrangement
  - Tooltips/context menus
- For now, focus on display only, but keep extension in mind.

## 7. Edge Cases and Testing
- Inventory should handle:
  - Zero blocks (show 0, but keep slot visible)
  - Addition of new block types (slots appear automatically)
  - Live updates as inventory changes
- Test on various screen sizes and with different block type configurations.

## 8. Documentation and Next Steps
- Document this plan in `PLAN_INVENTORY.md` (this file).
- Next: Scaffold `Inventory.jsx` as described, wire up event/data flow, and implement the 2D icon generation pipeline for Minecraft-style look.

---

**Future Enhancements:**
- Upgrade mini-block icons to 3D render-to-texture.
- Add user-selectable inventory slots and keyboard shortcuts.
- Implement backend/cloud sync for cross-device persistence.
- Add drag-and-drop and tooltips for richer UX.
