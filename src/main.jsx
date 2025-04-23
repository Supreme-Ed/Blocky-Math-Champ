console.log('MAIN.JSX LOADED');
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen.jsx';
import MainGame from './components/MainGame.jsx';

import soundManager from './game/soundManager.js';
import blockAwardManager from './game/blockAwardManager.js';
import { BLOCK_TYPES } from './game/blockTypes.js';

// Initialize block award manager with all block types
blockAwardManager.setBlockTypes(BLOCK_TYPES);

window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

function App() {
  const [problems, setProblems] = useState(null);
  const [avatar, setAvatar] = useState(null);

  return (
    <>
      {!problems ? (
        <StartScreen onStart={(problemSet, selectedAvatar) => {
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
