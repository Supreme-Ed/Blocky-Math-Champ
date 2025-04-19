// Modular wrappers for Babylon.js built-in procedural textures
// Exports: GrassProceduralTexture, MarbleProceduralTexture, WoodProceduralTexture, CloudProceduralTexture
// Each function returns a Babylon.js built-in procedural texture instance.

import { GrassProceduralTexture, MarbleProceduralTexture, WoodProceduralTexture, CloudProceduralTexture } from '@babylonjs/procedural-textures';

export function getBabylonProceduralTexture(type, name, size, scene) {
  switch (type) {
    case 'GrassProceduralTexture':
      return new GrassProceduralTexture(name, size, scene);
    case 'MarbleProceduralTexture':
      return new MarbleProceduralTexture(name, size, scene);
    case 'WoodProceduralTexture':
      return new WoodProceduralTexture(name, size, scene);
    case 'CloudProceduralTexture':
      return new CloudProceduralTexture(name, size, scene);
    default:
      return null;
  }
}
