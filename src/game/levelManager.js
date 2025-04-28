// levelManager.js
// Manages level selection, difficulty filtering, and blueprint loading for Blocky Math Champ

import gameEngine from './gameEngine.js';

class LevelManager {
    constructor() {
        // Example level data structure
        this.levels = [
            { id: 1, name: 'Tutorial', blueprint: 'tutorial.json', difficulty: 'easy', unlocked: true },
            { id: 2, name: 'Addition Basics', blueprint: 'addition1.json', difficulty: 'easy', unlocked: true },
            { id: 3, name: 'Subtraction Start', blueprint: 'subtraction1.json', difficulty: 'easy', unlocked: false },
            // ...more levels
        ];
        this.currentLevelId = 1;
        this.currentDifficulty = 'easy';
    }

    // Get current level object
    getCurrentLevel() {
        return this.levels.find(lvl => lvl.id === this.currentLevelId);
    }

    // Set current level by id (if unlocked)
    setLevel(levelId) {
        const lvl = this.levels.find(l => l.id === levelId);
        if (lvl && lvl.unlocked) {
            this.currentLevelId = levelId;
            gameEngine.emit('level-changed', lvl);
            return true;
        }
        return false;
    }

    // Get all available (unlocked) levels for current difficulty
    getAvailableLevels() {
        return this.levels.filter(lvl => lvl.difficulty === this.currentDifficulty && lvl.unlocked);
    }

    // Move to next unlocked level
    nextLevel() {
        const idx = this.levels.findIndex(lvl => lvl.id === this.currentLevelId);
        for (let i = idx + 1; i < this.levels.length; i++) {
            if (this.levels[i].unlocked && this.levels[i].difficulty === this.currentDifficulty) {
                this.setLevel(this.levels[i].id);
                return true;
            }
        }
        return false;
    }

    // Move to previous unlocked level
    prevLevel() {
        const idx = this.levels.findIndex(lvl => lvl.id === this.currentLevelId);
        for (let i = idx - 1; i >= 0; i--) {
            if (this.levels[i].unlocked && this.levels[i].difficulty === this.currentDifficulty) {
                this.setLevel(this.levels[i].id);
                return true;
            }
        }
        return false;
    }

    // Set difficulty and optionally reset to first unlocked level of that difficulty
    setDifficulty(difficulty) {
        if (this.currentDifficulty !== difficulty) {
            this.currentDifficulty = difficulty;
            gameEngine.emit('difficulty-changed', difficulty);
        }
        const first = this.levels.find(lvl => lvl.difficulty === difficulty && lvl.unlocked);
        if (first) {
            this.setLevel(first.id);
        }
    }

    // Get current difficulty
    getDifficulty() {
        return this.currentDifficulty;
    }

    // Unlock a level by id
    unlockLevel(levelId) {
        const lvl = this.levels.find(l => l.id === levelId);
        if (lvl) lvl.unlocked = true;
    }

    // Load and cache the blueprint for the current level (async)
    async loadCurrentBlueprint() {
        const lvl = this.getCurrentLevel();
        if (!lvl || !lvl.blueprint) return null;
        if (!this._blueprintCache) this._blueprintCache = new Map();
        if (this._blueprintCache.has(lvl.blueprint)) {
            return this._blueprintCache.get(lvl.blueprint);
        }
        try {
            const resp = await fetch(`./game/levels/${lvl.blueprint}`);
            if (!resp.ok) throw new Error('Failed to load blueprint: ' + lvl.blueprint);
            const data = await resp.json();
            this._blueprintCache.set(lvl.blueprint, data);
            gameEngine.emit('blueprint-loaded', data);
            return data;
        } catch (e) {
            return null;
        }
    }
}

const levelManager = new LevelManager();
export default levelManager;
