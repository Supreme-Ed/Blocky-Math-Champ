import { DirectionalLight, HemisphericLight, Vector3 } from '@babylonjs/core';

/**
 * Creates a default hemispheric light for basic scene illumination.
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} [options]
 * @param {string} [options.name='light'] - Light name
 * @param {BABYLON.Vector3} [options.direction=new Vector3(0,1,0)] - Light direction
 * @param {number} [options.intensity=1.0] - Light intensity
 * @returns {BABYLON.HemisphericLight}
 */
export function createDefaultLight(scene, options = {}) {
  const { name = 'light', direction = new Vector3(0, 1, 0), intensity = 1.0 } = options;
  const light = new HemisphericLight(name, direction, scene);
  light.intensity = intensity;
  return light;
}

/**
 * Creates a directional light for shadows.
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} [options]
 * @param {string} [options.name='dirLight'] - Light name
 * @param {BABYLON.Vector3} [options.direction=new Vector3(0,-1,0)] - Light direction
 * @param {BABYLON.Vector3} [options.position=new Vector3(5,15,5)] - Light position
 * @param {number} [options.intensity=1.0] - Light intensity
 * @returns {BABYLON.DirectionalLight}
 */
export function createShadowLight(scene, options = {}) {
  const { name = 'dirLight', direction = new Vector3(-1, -2, -1), position = new Vector3(5, 15, 5), intensity = 1.0 } = options;
  const light = new DirectionalLight(name, direction, scene);
  light.position = position;
  light.intensity = intensity;
  return light;
}
