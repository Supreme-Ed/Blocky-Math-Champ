// gameEngine.ts
// Global game state manager for Blocky Math Champ

import { handleRightAnswer } from './rightAnswerHandler';
import { handleWrongAnswer } from './wrongAnswerHandler';
import { MathProblem } from '../types/game';

interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

interface PlayerState {
  health: number;
  position: PlayerPosition;
  inventory: any[];
  status: string;
}

interface GameConfig {
  [key: string]: any;
}

interface AnswerSelectionOptions {
  isCorrect: boolean;
  problem?: MathProblem;
  mesh?: any;
  [key: string]: any;
}

type UpdateCallback = (dt: number, now: number) => void;
type EventCallback = (data: any) => void;

class GameEngine {
  private currentLevel: number;
  private score: number;
  private playerState: PlayerState;
  private mistakes: MathProblem[];
  private _running: boolean;
  private _lastFrameTime: number | null;
  private _updateCallbacks: Set<UpdateCallback>;
  private _frameHandle: number | null;
  private _eventListeners?: Map<string, Set<EventCallback>>;
  public config?: GameConfig;

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
    // Mistake tracking
    this.mistakes = [];
    // Main loop state
    this._running = false;
    this._lastFrameTime = null;
    this._updateCallbacks = new Set(); // Use Set for easy add/remove
    this._frameHandle = null;
  }

  setConfig(config: GameConfig): void {
    this.config = config;
    if (this.emit) this.emit('config-set', config);
  }

  // Getters
  getLevel(): number { return this.currentLevel; }
  getScore(): number { return this.score; }
  getPlayerState(): PlayerState { return this.playerState; }

  // Setters
  setLevel(level: number): void { this.currentLevel = level; }
  setScore(score: number): void { this.score = score; }
  setPlayerState(state: Partial<PlayerState>): void { 
    this.playerState = { ...this.playerState, ...state }; 
  }

  // Reset game state
  reset(): void {
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
   * @param eventType - The type of event to listen for
   * @param callback - The callback function to execute when the event is emitted
   */
  on(eventType: string, callback: EventCallback): void {
    if (!this._eventListeners) this._eventListeners = new Map();
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, new Set());
    }
    this._eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Register a one-time event listener (auto-unregisters after first call).
   * @param eventType - The type of event to listen for
   * @param callback - The callback function to execute when the event is emitted
   */
  once(eventType: string, callback: EventCallback): void {
    const wrapper = (...args: any[]) => {
      this.off(eventType, wrapper);
      callback(args.length === 1 ? args[0] : args);
    };
    this.on(eventType, wrapper);
  }

  /**
   * Unregister an event listener.
   * @param eventType - The type of event to stop listening for
   * @param callback - The callback function to remove
   */
  off(eventType: string, callback: EventCallback): void {
    if (this._eventListeners && this._eventListeners.has(eventType)) {
      this._eventListeners.get(eventType)!.delete(callback);
    }
  }

  /**
   * Emit an event to all listeners for the given type.
   * @param eventType - The type of event to emit
   * @param data - The data to pass to the event listeners
   */
  emit(eventType: string, data: any): void {
    if (this._eventListeners && this._eventListeners.has(eventType)) {
      for (const cb of this._eventListeners.get(eventType)!) {
        try { cb(data); } catch (e) { /* Ignore errors in callbacks */ }
      }
    }
  }

  // --- Main Game Loop Logic ---

  /**
   * Register a callback to be called every frame
   * @param fn - The callback function to register
   */
  registerUpdate(fn: UpdateCallback): void {
    this._updateCallbacks.add(fn);
  }

  /**
   * Unregister a callback
   * @param fn - The callback function to unregister
   */
  unregisterUpdate(fn: UpdateCallback): void {
    this._updateCallbacks.delete(fn);
  }

  /**
   * Start the main game loop
   */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._lastFrameTime = performance.now();
    this._frameHandle = requestAnimationFrame(this._loop.bind(this));
  }

  /**
   * Stop the main game loop
   */
  stop(): void {
    this._running = false;
    if (this._frameHandle) {
      cancelAnimationFrame(this._frameHandle);
      this._frameHandle = null;
    }
  }

  /**
   * Internal loop
   * @param now - The current timestamp
   */
  private _loop(now: number): void {
    if (!this._running) return;
    const dt = (now - (this._lastFrameTime || now)) / 1000; // seconds
    this._lastFrameTime = now;
    for (const fn of this._updateCallbacks) {
      try { fn(dt, now); } catch (e) { /* Ignore errors in callbacks */ }
    }
    this._frameHandle = requestAnimationFrame(this._loop.bind(this));
  }

  /**
   * Handles user answer selection.
   * Calls the appropriate handler based on correctness.
   * Records missed problems if wrong.
   * @param options - { isCorrect, problem, ...options }
   */
  handleAnswerSelection({ isCorrect, problem, ...options }: AnswerSelectionOptions): void {
    if (isCorrect) {
      handleRightAnswer(options);
    } else {
      // Record missed problem
      if (problem) {
        if (!this.mistakes.some(p => 'id' in p && 'id' in problem && p.id === problem.id)) {
          this.mistakes.push(problem);
        }
      }
      handleWrongAnswer(options);
    }
  }

  /**
   * Reinserts missed problems into the problem queue.
   * @param problemQueue - The current problem queue (array)
   * @returns The updated queue with mistakes reinserted at random positions
   */
  reinsertMissedProblems(problemQueue: MathProblem[]): MathProblem[] {
    if (!Array.isArray(problemQueue)) return problemQueue;
    if (!this.mistakes.length) return problemQueue;
    // Insert each mistake at a random position
    this.mistakes.forEach(problem => {
      const idx = Math.floor(Math.random() * (problemQueue.length + 1));
      problemQueue.splice(idx, 0, problem);
    });
    this.mistakes = [];
    return problemQueue;
  }

  /**
   * Test method for manual handler call verification.
   * Calls handleAnswerSelection with both correct and incorrect answers.
   */
  testHandlerSelection(): void {
    this.handleAnswerSelection({ isCorrect: true });
    setTimeout(() => {
      this.handleAnswerSelection({ isCorrect: false });
    }, 1200);
  }
}

// Export a singleton instance
const gameEngine = new GameEngine();
export default gameEngine;
