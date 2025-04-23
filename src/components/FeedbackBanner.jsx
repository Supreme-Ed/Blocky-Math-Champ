import React from 'react';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

/**
 * FeedbackBanner is a placeholder for future feedback UI (sounds, 3D animations, etc).
 * For now, it shows a simple banner, but can be expanded for more complex feedback.
 */

export default function FeedbackBanner({ show, type, onClose }) {
  let message = '';
  let severity = '';
  if (type === 'correct') {
    message = 'Correct!';
    severity = 'success';
  } else if (type === 'wrong') {
    message = 'Try again!';
    severity = 'error';
  }
  return (
    <Snackbar
      open={show}
      autoHideDuration={1000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      // Move the Snackbar below the problem display (e.g., 90px from top)
      style={{ top: 130 }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          fontSize: 26,
          fontWeight: 'bold',
          minWidth: 340,
          px: 6,
          py: 3,
          borderRadius: 3,
          boxShadow: 4,
          letterSpacing: 1,
          textAlign: 'center',
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}


FeedbackBanner.propTypes = {
  show: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['correct', 'wrong']).isRequired,
  onClose: PropTypes.func.isRequired,
};
