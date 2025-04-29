import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

/**
 * FeedbackBanner is a placeholder for future feedback UI (sounds, 3D animations, etc).
 * For now, it shows a simple banner, but can be expanded for more complex feedback.
 */

interface FeedbackBannerProps {
  show: boolean;
  type: 'correct' | 'wrong';
  message?: string;
  onClose: () => void;
}

export default function FeedbackBanner({ show, type, message, onClose }: FeedbackBannerProps) {
  let bannerMessage = '';
  let severity: 'success' | 'error' = 'success';
  
  if (type === 'correct') {
    bannerMessage = message || 'Correct!';
    severity = 'success';
  } else if (type === 'wrong') {
    bannerMessage = message || 'Try again!';
    severity = 'error';
  }
  
  return (
    <Snackbar
      open={show}
      autoHideDuration={2000}
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {typeof bannerMessage === 'string' && bannerMessage.includes('\n')
          ? bannerMessage.split('\n').map((line, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>{line}</div>
            ))
          : <span style={{ textAlign: 'center', display: 'block' }}>{bannerMessage}</span>
        }
      </Alert>
    </Snackbar>
  );
}
