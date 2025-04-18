import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import AvatarSelector from './UI/AvatarSelector.jsx';
import MathTypeSelector from './UI/MathTypeSelector.jsx';
import DifficultySelector from './UI/DifficultySelector.jsx';




function StartScreen({ onStart }) {
  const [mathTypesSelected, setMathTypesSelected] = useState(['addition']);
  const [operandRanges, setOperandRanges] = useState({
    addition: { min: 0, max: 10 },
    subtraction: { min: 0, max: 10 },
    division: { min: 0, max: 144 },
  });
  const [multiplicationTables, setMultiplicationTables] = useState([2,3,4,5,6,7,8,9,10,11,12]); // default all
  const [difficulty, setDifficulty] = useState('easy');
  const [avatars, setAvatars] = useState([]);
  const [avatar, setAvatar] = useState('');

  // Validation logic for enabling Start Game button
  function canStartGame() {
    if (mathTypesSelected.length === 0) return false;
    for (const type of mathTypesSelected) {
      if (type === 'multiplication') {
        if (multiplicationTables.length === 0) return false;
      } else {
        const r = operandRanges[type];
        if (!r || r.min === '' || r.max === '' || !Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min > r.max) return false;
      }
    }
    return true;
  }


  useEffect(() => {
    async function fetchAvatars() {
      try {
        const res = await fetch('/models/avatars/manifest.json');
        const files = await res.json();
        setAvatars(files);
        if (files.length > 0 && !avatar) setAvatar(files[0].file);
      } catch (err) {
        setAvatars([]);
      }
    }
    fetchAvatars();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f7fa',
    }}>
      <h1 style={{ marginBottom: 32 }}>Blocky Math Champ</h1>
      {/* Math Type Selection */}
      <MathTypeSelector
        mathTypesSelected={mathTypesSelected}
        setMathTypesSelected={setMathTypesSelected}
        operandRanges={operandRanges}
        setOperandRanges={setOperandRanges}
        multiplicationTables={multiplicationTables}
        setMultiplicationTables={setMultiplicationTables}
      />
      {/* Difficulty Selection */}
      <DifficultySelector
        difficulty={difficulty}
        setDifficulty={setDifficulty}
      />
      {/* Avatar Selection */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ fontWeight: 'bold' }}>Avatar:</label>
        <AvatarSelector avatars={avatars} selectedAvatar={avatar} onSelect={setAvatar} />
      </div>
      <button
        style={{
          padding: '12px 32px', fontSize: 18, background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8,
          cursor: !canStartGame() ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #b3c6ff',
          opacity: !canStartGame() ? 0.5 : 1
        }}
        onClick={() => {
          if (!canStartGame()) return;
          onStart?.({
            mathTypes: mathTypesSelected.map(type => {
              if (type === 'multiplication') {
                return { type, tables: multiplicationTables };
              }
              return { type, ...operandRanges[type] };
            }),
            difficulty,
            avatar
          });
        }}
        disabled={!mathTypesSelected.every(type => {
          if (type === 'multiplication') {
            return multiplicationTables.length > 0;
          }
          const r = operandRanges[type];
          return r && r.min !== '' && r.max !== '' && Number.isFinite(r.min) && Number.isFinite(r.max) && r.min <= r.max;
        })}
      >
        Start Game
      </button>
    </div>
  );
}

StartScreen.propTypes = {
  onStart: PropTypes.func.isRequired, // Receives { mathTypes: [{ type, min, max }], difficulty, avatar }
};

export default StartScreen;