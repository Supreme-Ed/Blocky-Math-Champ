import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';


// Manifest of sounds to preload (can be moved to JSON/config later)
// All sounds use placeholder asset for now. Replace with final files as they become available.
const SOUND_MANIFEST = [
  { name: 'correct', url: '/assets/sounds/placeholder.wav' },
  { name: 'wrong', url: '/assets/sounds/placeholder.wav' },
  { name: 'block', url: '/assets/sounds/placeholder.wav' },
  { name: 'win', url: '/assets/sounds/placeholder.wav' },
  { name: 'lose', url: '/assets/sounds/placeholder.wav' },
  // Add more as needed
];

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.scene = null;
  }

  /**
   * Call this once after Babylon scene is created.
   * @param {BABYLON.Scene} scene
   */
  async preload(scene) {
    this.scene = scene;
    // Create the audio engine if not already present
    this.audioEngine = await BABYLON.CreateAudioEngineAsync();
    this.sounds = new Map();

    // Load all sounds asynchronously
    await Promise.all(
      SOUND_MANIFEST.map(async ({ name, url }) => {
        try {
          const sound = await BABYLON.CreateSoundAsync(name, url, scene);
          this.sounds.set(name, sound);
          console.log(`[soundManager] Loaded sound: ${name}`);
        } catch (e) {
          console.error(`[soundManager] Error loading sound ${name}:`, e);
        }
      })
    );

    // Wait for audio engine to be unlocked (user gesture)
    await this.audioEngine.unlockAsync();
    console.log('[soundManager] All sounds loaded and audio engine unlocked');
  }

  getSound(name) {
    return this.sounds.get(name);
  }
}

const soundManager = new SoundManager();

// Attach to window for debugging and browser console access
if (typeof window !== 'undefined') {
  window.soundManager = soundManager;
}

export default soundManager;
