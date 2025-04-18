import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import AvatarSelector from './UI/AvatarSelector.jsx';

const mathTypes = [
  { value: 'addition', label: 'Addition' },
  { value: 'subtraction', label: 'Subtraction' },
  { value: 'multiplication', label: 'Multiplication' },
  { value: 'division', label: 'Division' },
];

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];



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
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 'bold' }}>Math Type(s):</label>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {mathTypes.map(type => {
            const isSelected = mathTypesSelected.includes(type.value);
            return (
              <div key={type.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    background: isSelected ? '#4f8cff' : '#e0e7ef',
                    color: isSelected ? '#fff' : '#333',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
                    outline: isSelected ? '2px solid #1a5fd0' : 'none',
                  }}
                  onClick={() => {
                    setMathTypesSelected(prev =>
                      prev.includes(type.value)
                        ? prev.filter(val => val !== type.value)
                        : [...prev, type.value]
                    );
                  }}
                  aria-pressed={isSelected}
                >
                  {type.label}
                </button>
                {/* Operand Range Inputs for Selected Type */}
                {isSelected && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Addition, Subtraction, Division show min/max */}
                    {type.value !== 'multiplication' && (
                      <>
                        <label style={{ fontSize: 12, color: '#444' }}>Min
                          <input
                            type="number"
                            value={operandRanges[type.value]?.min ?? ''}
                            style={{ marginLeft: 4, width: 50 }}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              setOperandRanges(ranges => ({
                                ...ranges,
                                [type.value]: { ...ranges[type.value], min: isNaN(val) ? '' : val }
                              }));
                            }}
                            min={-999}
                            max={999}
                          />
                        </label>
                        <span style={{ fontSize: 12 }}>to</span>
                        <label style={{ fontSize: 12, color: '#444' }}>Max
                          <input
                            type="number"
                            value={operandRanges[type.value]?.max ?? ''}
                            style={{ marginLeft: 4, width: 50 }}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              setOperandRanges(ranges => ({
                                ...ranges,
                                [type.value]: { ...ranges[type.value], max: isNaN(val) ? '' : val }
                              }));
                            }}
                            min={-999}
                            max={999}
                          />
                        </label>
                      </>
                    )}
                    {/* Multiplication: Multi-select tables */}
                    {type.value === 'multiplication' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
    <span style={{ fontSize: 12, color: '#444', marginBottom: 2 }}>Tables:</span>
    {/* All Button */}
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      <button
        type="button"
        style={{
          padding: '4px 14px',
          background: multiplicationTables.length === 11 ? '#4f8cff' : '#e0e7ef',
          color: multiplicationTables.length === 11 ? '#fff' : '#333',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold',
          outline: multiplicationTables.length === 11 ? '2px solid #1a5fd0' : 'none',
          fontSize: 12
        }}
        onClick={() => {
          if (multiplicationTables.length === 11) {
            setMultiplicationTables([]);
          } else {
            setMultiplicationTables([2,3,4,5,6,7,8,9,10,11,12]);
          }
        }}
        aria-pressed={multiplicationTables.length === 11}
      >
        All
      </button>
    </div>
    {/* Table Buttons in 3-4 Rows */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 4 }}>
      {[2,3,4,5,6,7,8,9,10,11,12].map(n => {
        const selected = multiplicationTables.includes(n);
        return (
          <button
            key={n}
            type="button"
            style={{
              padding: '4px 10px',
              margin: 0,
              background: selected ? '#4f8cff' : '#e0e7ef',
              color: selected ? '#fff' : '#333',
              border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal',
              outline: selected ? '2px solid #1a5fd0' : 'none',
              fontSize: 12
            }}
            onClick={() => {
              setMultiplicationTables(prev =>
                prev.includes(n)
                  ? prev.filter(val => val !== n)
                  : [...prev, n]
              );
            }}
            aria-pressed={selected}
          >
            {n}s
          </button>
        );
      })}
    </div>
    {multiplicationTables.length === 0 && (
      <span style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Select at least one table</span>
    )}
  </div>
)}
                  </div>
                )}  
              </div>
            );
          })}
        </div>
        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          (You can select more than one)
        </div>
      </div>
      {/* Difficulty Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 'bold' }}>Difficulty:</label>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {difficulties.map(diff => (
            <button
              key={diff.value}
              style={{
                padding: '8px 16px',
                background: difficulty === diff.value ? '#ffb84f' : '#e0e7ef',
                color: difficulty === diff.value ? '#fff' : '#333',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
              }}
              onClick={() => setDifficulty(diff.value)}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>
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