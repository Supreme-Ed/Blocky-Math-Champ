// Minimal Babylon.js initialization for Blocky Math Champ
import * as BABYLON from 'babylonjs';

// Get the canvas element
const canvas = document.getElementById('renderCanvas');

// Create Babylon engine
const engine = new BABYLON.Engine(canvas, true);

// Create a basic scene
const scene = new BABYLON.Scene(engine);

// Create a simple camera and point it at the center
const camera = new BABYLON.ArcRotateCamera('camera1', Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

// Add a light
const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

// Add a simple torus mesh for visual confirmation
const torus = BABYLON.MeshBuilder.CreateTorus('torus', {diameter: 2, thickness: 0.5, tessellation: 32}, scene);
torus.position.y = 1;

import gameEngine from './game/gameEngine.js';

// Animate torus and log dt using modular gameEngine main loop
gameEngine.registerUpdate((dt, now) => {
    torus.rotation.x += 0.5 * dt;
    torus.rotation.y += 0.7 * dt;
});

gameEngine.start();

// --- Test the event bus system ---
// (Commented out to reduce console noise)
// function onTestEvent(data) {
//     console.log('Test event received:', data);
// }
// gameEngine.on('test-event', onTestEvent);
// gameEngine.once('test-event', (data) => {
//     console.log('Test event received ONCE:', data);
// });
// setTimeout(() => {
//     gameEngine.emit('test-event', { foo: 'bar', time: Date.now() });
//     gameEngine.off('test-event', onTestEvent);
// }, 1000);

// --- Test the levelManager module ---
import levelManager from './game/levelManager.js';

gameEngine.on('level-changed', (level) => {
    console.log('Level changed to:', level);
});

console.log('Available levels:', levelManager.getAvailableLevels());
console.log('Current level:', levelManager.getCurrentLevel());

// Try to set to a locked level (should fail)
console.log('Set to locked level (id=3):', levelManager.setLevel(3));
// Unlock and set to level 3
levelManager.unlockLevel(3);
console.log('Set to unlocked level (id=3):', levelManager.setLevel(3));
// Move to next level (should wrap or fail gracefully)
console.log('Next level:', levelManager.nextLevel());
// Move to previous level
console.log('Previous level:', levelManager.prevLevel());
// Set difficulty to easy
levelManager.setDifficulty('easy');
console.log('Available levels after setting difficulty:', levelManager.getAvailableLevels());

// Test blueprint loading
levelManager.loadCurrentBlueprint().then(data => {
    console.log('Blueprint loaded (promise):', data);
});
gameEngine.on('blueprint-loaded', (data) => {
    console.log('Blueprint loaded (event):', data);
});


// Render loop (Babylon.js)
engine.runRenderLoop(() => {
    scene.render();
});

// Resize the engine on window resize
window.addEventListener('resize', () => {
    engine.resize();
});
