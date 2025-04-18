import React from 'react';
import PropTypes from 'prop-types';

export default function ProblemDisplay({ currentProblem, answered, onUserAnswer }) {
  if (!currentProblem) {
    return <div>All problems complete!</div>;
  }
  return (
    <>
      <div style={{ fontSize: 20, marginBottom: 14 }}>{currentProblem.question}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
        {currentProblem.choices.map((choice, i) => (
          <button
            key={i}
            style={{
              minWidth: 60,
              padding: '10px 20px',
              fontSize: 18,
              borderRadius: 8,
              background: answered ? (choice === currentProblem.answer ? '#4CAF50' : '#F44336') : '#2196F3',
              color: 'white',
              opacity: answered && choice !== currentProblem.answer ? 0.7 : 1,
              pointerEvents: answered ? 'none' : 'auto',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.2s, opacity 0.2s',
            }}
            onClick={() => onUserAnswer(choice)}
            disabled={answered}
          >
            {choice}
          </button>
        ))}
      </div>
      {answered && (
        <div style={{ marginTop: 10, fontWeight: 'bold', color: '#333' }}>
          {`The answer is ${currentProblem.answer}.`}
        </div>
      )}
    </>
  );
}

ProblemDisplay.propTypes = {
  currentProblem: PropTypes.object,
  answered: PropTypes.bool.isRequired,
  onUserAnswer: PropTypes.func.isRequired,
};
