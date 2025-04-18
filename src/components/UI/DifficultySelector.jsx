import React from 'react';
import PropTypes from 'prop-types';

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function DifficultySelector({ difficulty, setDifficulty }) {
  return (
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
  );
}

DifficultySelector.propTypes = {
  difficulty: PropTypes.string.isRequired,
  setDifficulty: PropTypes.func.isRequired,
};
