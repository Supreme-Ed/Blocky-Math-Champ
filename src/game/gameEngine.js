// gameEngine.js
// Global game state manager for Blocky Math Champ

class GameEngine {
    setConfig(config) {
        this.config = config;
        if (this.emit) this.emit('config-set', config);
    }
    constructor() {
        // Initialize global state
        this.currentLevel = 1;
        this.score = 0;
        this.playerState = {
            health: 100,
            position: { x: 0, y: 0, z: 0 },
            inventory: [],
            status: 'idle',
        };
        // Main loop state
        this._running = false;
        this._lastFrameTime = null;
        this._updateCallbacks = new Set(); // Use Set for easy add/remove
        this._frameHandle = null;
    }

    // Getters
    getLevel() { return this.currentLevel; }
    getScore() { return this.score; }
    getPlayerState() { return this.playerState; }

    // Setters
    setLevel(level) { this.currentLevel = level; }
    setScore(score) { this.score = score; }
    setPlayerState(state) { this.playerState = { ...this.playerState, ...state }; }

    // Reset game state
    reset() {
        this.currentLevel = 1;
        this.score = 0;
        this.playerState = {
            health: 100,
            position: { x: 0, y: 0, z: 0 },
            inventory: [],
            status: 'idle',
        };
    }

    // --- Event Bus Logic ---

    /**
     * Register an event listener for a given event type.
     * @param {string} eventType
     * @param {function} callback
     */
    on(eventType, callback) {
        if (!this._eventListeners) this._eventListeners = new Map();
        if (!this._eventListeners.has(eventType)) {
            this._eventListeners.set(eventType, new Set());
        }
        this._eventListeners.get(eventType).add(callback);
    }

    /**
     * Register a one-time event listener (auto-unregisters after first call).
     * @param {string} eventType
     * @param {function} callback
     */
    once(eventType, callback) {
        const wrapper = (...args) => {
            this.off(eventType, wrapper);
            callback(...args);
        };
        this.on(eventType, wrapper);
    }

    /**
     * Unregister an event listener.
     * @param {string} eventType
     * @param {function} callback
     */
    off(eventType, callback) {
        if (this._eventListeners && this._eventListeners.has(eventType)) {
            this._eventListeners.get(eventType).delete(callback);
        }
    }

    /**
     * Emit an event to all listeners for the given type.
     * @param {string} eventType
     * @param {any} data
     */
    emit(eventType, data) {
        if (this._eventListeners && this._eventListeners.has(eventType)) {
            for (const cb of this._eventListeners.get(eventType)) {
                try { cb(data); } catch (e) { console.error('Event callback error:', e); }
            }
        }
    }

    // --- Main Game Loop Logic ---

    // Register a callback to be called every frame (fn: (dt, now) => void)
    registerUpdate(fn) {
        this._updateCallbacks.add(fn);
    }

    // Unregister a callback
    unregisterUpdate(fn) {
        this._updateCallbacks.delete(fn);
    }

    // Start the main game loop
    start() {
        if (this._running) return;
        this._running = true;
        this._lastFrameTime = performance.now();
        this._frameHandle = requestAnimationFrame(this._loop.bind(this));
    }

    // Stop the main game loop
    stop() {
        this._running = false;
        if (this._frameHandle) {
            cancelAnimationFrame(this._frameHandle);
            this._frameHandle = null;
        }
    }

    // Internal loop
    _loop(now) {
        if (!this._running) return;
        const dt = (now - this._lastFrameTime) / 1000; // seconds
        this._lastFrameTime = now;
        for (const fn of this._updateCallbacks) {
            try { fn(dt, now); } catch (e) { console.error('Update callback error:', e); }
        }
        this._frameHandle = requestAnimationFrame(this._loop.bind(this));
    }
}


import { handleRightAnswer } from './rightAnswerHandler.js';
import { handleWrongAnswer } from './wrongAnswerHandler.js';

GameEngine.prototype.handleAnswerSelection = function({ isCorrect, ...options }) {
  /**
   * Handles user answer selection.
   * Calls the appropriate handler based on correctness.
   * @param {object} param0 - { isCorrect, ...options }
   */
  if (isCorrect) {
    handleRightAnswer(options);
  } else {
    handleWrongAnswer(options);
  }
};

/**
 * Test method for manual handler call verification.
 * Calls handleAnswerSelection with both correct and incorrect answers.
 */
GameEngine.prototype.testHandlerSelection = function() {
  console.log('[testHandlerSelection] Testing correct answer...');
  this.handleAnswerSelection({ isCorrect: true });
  setTimeout(() => {
    console.log('[testHandlerSelection] Testing wrong answer...');
    this.handleAnswerSelection({ isCorrect: false });
  }, 1200);
};

// Export a singleton instance
const gameEngine = new GameEngine();
export default gameEngine;
