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
    console.log('[soundManager] audioEngine created:', this.audioEngine);
    if (this.audioEngine) {
      console.log('[soundManager] audioEngine methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.audioEngine)));
      console.log('[soundManager] audioEngine.lockAsync:', typeof this.audioEngine.lockAsync);
      console.log('[soundManager] audioEngine.unlockAsync:', typeof this.audioEngine.unlockAsync);
      console.log('[soundManager] audioEngine.globalVolume:', typeof this.audioEngine.globalVolume);
    }
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

  /**
   * Play a sound by name, with optional playback parameters.
   *
   * @param {string} name - The name of the sound to play.
   * @param {object} [options] - Optional playback parameters:
   *   - offset (number, seconds): Where to start playback within the sound. Maps to Babylon.js 'startOffset'. Default: 0 (start at beginning).
   *   - duration (number, seconds): How long to play the sound. Maps to Babylon.js 'duration'. Default: 0 (play to end).
   *   - volume (number, 0.0 to 1.0): Playback volume for this call. Maps to Babylon.js 'volume'. Default: current sound volume.
   *   - loop (boolean): Whether to loop the sound. Maps to Babylon.js 'loop'. Default: false.
   *   - loopStart (number, seconds): Loop region start time. Maps to Babylon.js 'loopStart'.
   *   - loopEnd (number, seconds): Loop region end time. Maps to Babylon.js 'loopEnd'.
   *   - waitTime (number, seconds): Time to wait before playback starts. Maps to Babylon.js 'waitTime'.
   *   - pan (number, -1.0 to 1.0): Stereo panning: -1 = left, 0 = center, 1 = right. Only for non-spatial sounds. Not part of Babylon.js options object.
   *   - playbackRate (number): Playback speed (1.0 = normal, 2.0 = double speed, 0.5 = half speed). Not part of Babylon.js options object. Default: 1.0.
   *
   * Example:
   *   soundManager.play('correct', { offset: 1, duration: 2, volume: 0.5, pan: -1, playbackRate: 1.2 });
   */
  play(name, options = {}) {
    const sound = this.getSound(name);
    if (!sound) {
      console.warn(`[soundManager] play: Sound '${name}' not found.`);
      return;
    }

    // Build IStaticSoundPlayOptions from input options
    const playOptions = {};
    if (typeof options.duration === 'number') playOptions.duration = options.duration;
    if (typeof options.offset === 'number') playOptions.startOffset = options.offset;
    if (typeof options.volume === 'number') playOptions.volume = options.volume;
    if (typeof options.loop === 'boolean') playOptions.loop = options.loop;
    if (typeof options.loopStart === 'number') playOptions.loopStart = options.loopStart;
    if (typeof options.loopEnd === 'number') playOptions.loopEnd = options.loopEnd;
    if (typeof options.waitTime === 'number') playOptions.waitTime = options.waitTime;

    // Log the options object for debugging
    console.log('[soundManager] play(): sound.play(options) called with', playOptions);

    // Set pan if provided and supported
    if (typeof options.pan === 'number' && typeof sound.setPan === 'function') {
      sound.setPan(options.pan);
    }
    // Set playbackRate if provided and supported
    if (typeof options.playbackRate === 'number' && typeof sound.setPlaybackRate === 'function') {
      sound.setPlaybackRate(options.playbackRate);
    }

    // Play the sound using the options object
    const instance = sound.play(playOptions);
    return { instance };

  }

  stop(name) {
    const sound = this.getSound(name);
    if (sound && typeof sound.stop === 'function') {
      sound.stop();
    } else {
      console.warn(`[soundManager] stop: Sound '${name}' not found or cannot be stopped.`);
    }
  }

  /**
   * Mute a sound by name, or all sounds if no name is provided.
   */
  /**
   * Mute the entire audio engine.
   */
  /**
   * Mute all audio by locking the Babylon audio engine.
   * This silences all sounds at the engine level.
   */
  /**
   * Mute all audio globally using Babylon.js v8+ AudioEngineV2 API.
   * See: https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
   */
  mute() {
    if (this.audioEngine && typeof this.audioEngine.volume === 'number') {
      this.audioEngine.volume = 0;
      console.log('[soundManager] Audio engine volume set to 0 (muted)');
    } else {
      console.warn('[soundManager] mute: audioEngine or volume property not available');
    }
  }

  /**
   * Unmute the entire audio engine.
   */
  /**
   * Unmute all audio by unlocking the Babylon audio engine.
   * This must be called from a user gesture (e.g. button click).
   */
  /**
   * Unmute all audio globally using Babylon.js v8+ AudioEngineV2 API.
   * See: https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
   */
  unmute() {
    if (this.audioEngine && typeof this.audioEngine.volume === 'number') {
      this.audioEngine.volume = 1;
      console.log('[soundManager] Audio engine volume set to 1 (unmuted)');
    } else {
      console.warn('[soundManager] unmute: audioEngine or volume property not available');
    }
  }

  setVolume(name, volume) {
    if (name) {
      const sound = this.getSound(name);
      if (sound && typeof sound.setVolume === 'function') {
        sound.setVolume(volume);
      }
    } else {
      // Set volume for all sounds
      for (const sound of this.sounds.values()) {
        if (typeof sound.setVolume === 'function') {
          sound.setVolume(volume);
        }
      }
    }
  }
}

const soundManager = new SoundManager();
// Attach to window for debugging and browser console access
if (typeof window !== 'undefined') {
  window.soundManager = soundManager;
}
export default soundManager;
