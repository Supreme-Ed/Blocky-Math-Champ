console.log('MAIN.JSX LOADED');
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen.jsx';
import MainGame from './components/MainGame.jsx';

import soundManager from './game/soundManager.js';
window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

function App() {
  const [problems, setProblems] = useState(null);

  return (
    <>
      {!problems ? (
        <StartScreen onStart={(problemSet) => {
          setProblems(problemSet);
        }} />
      ) : (
        <MainGame problems={problems} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
