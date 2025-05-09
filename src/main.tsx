console.log('MAIN.TSX LOADED');
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen';
import MainGame from './components/MainGame';
import soundManager from './game/soundManager';
import blockAwardManager from './game/blockAwardManager';
import { BLOCK_TYPES, loadBlockTypesSync } from './game/blockTypes';
import { initializeBlueprints } from './game/structureBlueprints';
import { MathProblem, Avatar } from './types/game';

// Create a loading component to show while resources are loading
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#333',
      color: 'white',
      fontFamily: 'Minecraft, monospace'
    }}>
      <h1>Loading Game Resources...</h1>
      <div style={{
        width: '300px',
        height: '30px',
        border: '3px solid #555',
        borderRadius: '5px',
        overflow: 'hidden',
        marginTop: '20px'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#5d5',
          animation: 'loading 2s infinite',
        }}></div>
      </div>
      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

// Initialize structure blueprints (including schematic files)
// Force reload to ensure we only get the actual files from the server
initializeBlueprints(true)
  .then(() => {
    console.log('Structure blueprints initialized successfully with forced reload');
  })
  .catch(error => {
    console.error('Error initializing structure blueprints:', error);
  });

// soundManager is already declared in soundManager.ts
window.soundManager = soundManager;
console.log('soundManager assigned to window:', window.soundManager);

function App() {
  const [problems, setProblems] = useState<MathProblem[] | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load resources before showing the game
  useEffect(() => {
    async function loadResources() {
      try {
        // Load block types synchronously
        await loadBlockTypesSync();

        // Initialize block award manager with the loaded block types
        blockAwardManager.setBlockTypes(BLOCK_TYPES);

        console.log('Resources loaded successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load resources:', error);
        // Show error message to user
        alert('Failed to load game resources. Please refresh the page and try again.');
      }
    }

    loadResources();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
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
