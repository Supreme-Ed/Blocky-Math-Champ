console.log('MAIN.TSX LOADED');
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen';
import MainGame from './components/MainGame';

import soundManager from './game/soundManager';
import blockAwardManager from './game/blockAwardManager';
import { BLOCK_TYPES } from './game/blockTypes';
import { MathProblem, Avatar } from './types/game';

// Initialize block award manager with all block types
blockAwardManager.setBlockTypes(BLOCK_TYPES);

// soundManager is already declared in soundManager.ts

window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

function App() {
  const [problems, setProblems] = useState<MathProblem[] | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  return (
    <>
      {!problems ? (
        <StartScreen onStart={(problemSet: MathProblem[], selectedAvatar: Avatar) => {
          setProblems(problemSet);
          setAvatar(selectedAvatar);
        }} />
      ) : (
        <MainGame problems={problems} avatar={avatar} onReturnToStart={() => {
          setProblems(null);
          setAvatar(null);
        }} />
      )}
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
