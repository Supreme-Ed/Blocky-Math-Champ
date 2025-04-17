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
function onTestEvent(data) {
    console.log('Test event received:', data);
}
gameEngine.on('test-event', onTestEvent);
gameEngine.once('test-event', (data) => {
    console.log('Test event received ONCE:', data);
});

// Emit the event after 1 second
setTimeout(() => {
    gameEngine.emit('test-event', { foo: 'bar', time: Date.now() });
    // Remove the persistent listener after test
    gameEngine.off('test-event', onTestEvent);
}, 1000);


// Render loop (Babylon.js)
engine.runRenderLoop(() => {
    scene.render();
});

// Resize the engine on window resize
window.addEventListener('resize', () => {
    engine.resize();
});
