import React from 'react';
import PropTypes from 'prop-types';

/**
 * FeedbackBanner is a placeholder for future feedback UI (sounds, 3D animations, etc).
 * For now, it shows a simple banner, but can be expanded for more complex feedback.
 */
export default function FeedbackBanner({ show, type }) {
  if (!show) return null;
  let message = '';
  let color = '';
  if (type === 'correct') {
    message = 'Correct!';
    color = '#4CAF50';
  } else if (type === 'wrong') {
    message = 'Try again!';
    color = '#F44336';
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        background: color,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 24,
        padding: '16px 48px',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        opacity: 0.95,
        pointerEvents: 'none',
        transition: 'opacity 0.3s',
      }}
      aria-live="polite"
    >
      {message}
    </div>
  );
}

FeedbackBanner.propTypes = {
  show: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['correct', 'wrong']).isRequired,
};
