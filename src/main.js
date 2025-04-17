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

// Render loop
engine.runRenderLoop(() => {
    // Animate the torus rotation
    torus.rotation.x += 0.02;
    torus.rotation.y += 0.03;
    scene.render();
});

// Resize the engine on window resize
window.addEventListener('resize', () => {
    engine.resize();
});
