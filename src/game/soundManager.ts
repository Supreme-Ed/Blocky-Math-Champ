import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

interface SoundManifestItem {
  name: string;
  url: string;
}

interface PlayOptions {
  offset?: number;
  volume?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
  waitTime?: number;
  pan?: number;
  playbackRate?: number;
}

// Manifest of sounds to preload (can be moved to JSON/config later)
// All sounds use placeholder asset for now. Replace with final files as they become available.
const SOUND_MANIFEST: SoundManifestItem[] = [
  { name: 'correct', url: '/assets/sounds/correct.wav' },
  { name: 'wrong', url: '/assets/sounds/wrong.wav' },
  { name: 'click block', url: '/assets/sounds/click-block.wav' },
  { name: 'blocks slide', url: '/assets/sounds/blocks-sliding.wav' },
  { name: 'click button', url: '/assets/sounds/button-click.wav' },
  // Add more as needed
];

class SoundManager {
  private sounds: Map<string, any>; // Using any to avoid type issues with Babylon.js Sound
  private scene: BABYLON.Scene | null;
  private audioEngine: any; // Using any to avoid type issues with Babylon.js AudioEngine

  constructor() {
    this.sounds = new Map();
    this.scene = null;
    this.audioEngine = null;
  }

  /**
   * Call this once after Babylon scene is created.
   * @param scene - The Babylon.js scene
   */
  async preload(scene: BABYLON.Scene): Promise<void> {
    this.scene = scene;
    // Create the audio engine if not already present
    // Using any to avoid type issues with Babylon.js AudioEngine
    this.audioEngine = await (BABYLON as any).CreateAudioEngineAsync();

    this.sounds = new Map();

    // Load all sounds asynchronously
    await Promise.all(
      SOUND_MANIFEST.map(async ({ name, url }) => {
        try {
          // Using any to avoid type issues with Babylon.js Sound
          const sound = await (BABYLON as any).CreateSoundAsync(name, url, scene);
          this.sounds.set(name, sound);
        } catch (e) {
          // Error handling could be added here
        }
      })
    );

    // Wait for audio engine to be unlocked (user gesture)
    if (this.audioEngine && typeof this.audioEngine.unlockAsync === 'function') {
      await this.audioEngine.unlockAsync();
    }
  }

  getSound(name: string): any {
    return this.sounds.get(name);
  }

  /**
   * Play a sound by name, with optional playback parameters.
   *
   * @param name - The name of the sound to play.
   * @param options - Optional playback parameters:
   *   - offset (number, seconds): Where to start playback within the sound. Maps to Babylon.js 'startOffset'. Default: 0 (start at beginning).
   *   - volume (number, 0.0 to 1.0): Playback volume for this call. Maps to Babylon.js 'volume'. Default: current sound volume.
   *   - loop (boolean): Whether to loop the sound. Maps to Babylon.js 'loop'. Default: false.
   *   - loopStart (number, seconds): Loop region start time. Maps to Babylon.js 'loopStart'.
   *   - loopEnd (number, seconds): Loop region end time. Maps to Babylon.js 'loopEnd'.
   *   - waitTime (number, seconds): Time to wait before playback starts. Maps to Babylon.js 'waitTime'.
   *   - pan (number, -1.0 to 1.0): Stereo panning: -1 = left, 0 = center, 1 = right. Only for non-spatial sounds. Not part of Babylon.js options object.
   *   - playbackRate (number): Playback speed (1.0 = normal, 2.0 = double speed, 0.5 = half speed). Not part of Babylon.js options object. Default: 1.0.
   *
   * Example:
   *   soundManager.play('correct', { offset: 1, volume: 0.5, pan: -1, playbackRate: 1.2 });
   */
  play(name: string, options: PlayOptions = {}): { instance?: number } {
    const sound = this.getSound(name);
    if (!sound) {
      return {};
    }

    // Force playback duration to 0.5 seconds for all sounds
    const playOptions: any = { duration: 0.5 };
    if (typeof options.offset === 'number') playOptions.startOffset = options.offset;
    if (typeof options.volume === 'number') playOptions.volume = options.volume;
    if (typeof options.loop === 'boolean') playOptions.loop = options.loop;
    if (typeof options.loopStart === 'number') playOptions.loopStart = options.loopStart;
    if (typeof options.loopEnd === 'number') playOptions.loopEnd = options.loopEnd;
    if (typeof options.waitTime === 'number') playOptions.waitTime = options.waitTime;

    // Set pan if provided and supported
    if (typeof options.pan === 'number' && typeof sound.setPan === 'function') {
      sound.setPan(options.pan);
    }

    // Set playbackRate if provided and supported
    if (typeof options.playbackRate === 'number' && typeof sound.setPlaybackRate === 'function') {
      sound.setPlaybackRate(options.playbackRate);
    }

    // Play the sound using the options object
    let instance;
    try {
      instance = sound.play(playOptions);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
    return { instance };
  }

  stop(name: string): void {
    const sound = this.getSound(name);
    if (sound && typeof sound.stop === 'function') {
      sound.stop();
    }
  }

  /**
   * Mute all audio globally using Babylon.js AudioEngine API.
   */
  mute(): void {
    if (this.audioEngine && typeof this.audioEngine.volume !== 'undefined') {
      this.audioEngine.volume = 0;
    }
  }

  /**
   * Unmute all audio globally using Babylon.js AudioEngine API.
   */
  unmute(): void {
    if (this.audioEngine && typeof this.audioEngine.volume !== 'undefined') {
      this.audioEngine.volume = 1;
    }
  }

  setVolume(name: string | null, volume: number): void {
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
declare global {
  interface Window {
    soundManager?: SoundManager;
  }
}

if (typeof window !== 'undefined') {
  window.soundManager = soundManager;
}

export default soundManager;
