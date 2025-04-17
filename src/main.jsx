import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from './components/StartScreen.jsx';

function App() {
  const [showStart, setShowStart] = useState(true);
  const [selections, setSelections] = useState(null);

  return (
    <>
      {showStart ? (
        <StartScreen onStart={(opts) => {
          setSelections(opts);
          setShowStart(false);
        }} />
      ) : (
        <div style={{textAlign: 'center', marginTop: 80}}>
          <h2>Game would start here!</h2>
          <pre>{JSON.stringify(selections, null, 2)}</pre>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
