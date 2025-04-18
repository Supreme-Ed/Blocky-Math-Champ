console.log('MAIN.JSX LOADED');
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen.jsx';
import MainGame from './components/MainGame.jsx';
import gameEngine from './game/gameEngine.js';
import soundManager from './game/soundManager.js';
window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

function App() {
  const [showStart, setShowStart] = useState(true);
  const [selections, setSelections] = useState(null);

  return (
    <>
      {showStart ? (
        <StartScreen onStart={(opts) => {
          setSelections(opts);
          gameEngine.setConfig(opts);
          setShowStart(false);
        }} />
      ) : (
        <MainGame />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
