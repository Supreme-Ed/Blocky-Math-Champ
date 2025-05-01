console.log('MAIN.TSX LOADED');
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen';
import MainGame from './components/MainGame';
import ShadowTestPage from './components/ShadowTestPage';
import TestScene from './components/TestScene';

import soundManager from './game/soundManager';
import blockAwardManager from './game/blockAwardManager';
import { BLOCK_TYPES } from './game/blockTypes';
import { MathProblem, Avatar } from './types/game';

// Initialize block award manager with all block types
blockAwardManager.setBlockTypes(BLOCK_TYPES);

// soundManager is already declared in soundManager.ts

window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

// Check for test modes in URL
const urlParams = new URLSearchParams(window.location.search);
const showShadowTest = urlParams.get('shadowTest') === 'true';
const showDirectTest = urlParams.get('directTest') === 'true';

function App() {
  const [problems, setProblems] = useState<MathProblem[] | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  // If test modes are enabled, show the appropriate test page
  if (showShadowTest) {
    return <ShadowTestPage />;
  }

  if (showDirectTest) {
    return <TestScene />;
  }

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
