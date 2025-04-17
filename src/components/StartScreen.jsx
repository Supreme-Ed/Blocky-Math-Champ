import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AvatarPreview3D from './AvatarPreview3D.jsx';

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

function getLabelFromFilename(filename) {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function StartScreen({ onStart }) {
  const [mathType, setMathType] = useState('addition');
  const [difficulty, setDifficulty] = useState('easy');
  const [avatars, setAvatars] = useState([]);
  const [avatar, setAvatar] = useState('');

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
        <label style={{ fontWeight: 'bold' }}>Math Type:</label>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {mathTypes.map(type => (
            <button
              key={type.value}
              style={{
                padding: '8px 16px',
                background: mathType === type.value ? '#4f8cff' : '#e0e7ef',
                color: mathType === type.value ? '#fff' : '#333',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
              }}
              onClick={() => setMathType(type.value)}
            >
              {type.label}
            </button>
          ))}
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
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          {avatars.map(avatarObj => {
            const label = avatarObj.name || getLabelFromFilename(avatarObj.file);
            return (
              <div key={avatarObj.file} style={{ textAlign: 'center' }}>
                <AvatarPreview3D
                  modelUrl={`/models/avatars/${avatarObj.file}`}
                  selected={avatar === avatarObj.file}
                  onClick={() => setAvatar(avatarObj.file)}
                />
                <div style={{ marginTop: 8, fontWeight: avatar === avatarObj.file ? 'bold' : 'normal' }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <button
        style={{
          padding: '12px 32px', fontSize: 18, background: '#4f8cff', color: '#fff', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #b3c6ff',
        }}
        onClick={() => onStart?.({ mathType, difficulty, avatar })}
      >
        Start Game
      </button>
    </div>
  );
}

StartScreen.propTypes = {
  onStart: PropTypes.func.isRequired,
};

export default StartScreen;