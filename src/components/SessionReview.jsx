import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function SessionReview({ sessionComplete, mistakesLog, resetSession }) {
  if (!sessionComplete) return null;
  return (
    <Dialog open={sessionComplete} maxWidth="sm" fullWidth>
      <Paper sx={{ p: 4, borderRadius: 2, maxHeight: '80vh', overflowY: 'auto' }}>
        <Typography variant="h5" sx={{ mt: 0, mb: 2 }}>Session Review</Typography>
        {mistakesLog.length === 0 ? (
          <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>No mistakes! Perfect session!</Typography>
        ) : (
          <>
            <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Problems you missed (with answer history):</Typography>
            <ul style={{paddingLeft:18}}>
              {mistakesLog.map((m, idx) => (
                <li key={idx} style={{marginBottom:12}}>
                  <Typography><strong>Q:</strong> {m.question}</Typography>
                  <Typography><strong>Mistakes:</strong> {m.mistakeCount}</Typography>
                  <Typography><strong>Correct answer:</strong> <span style={{color:'#4CAF50'}}>{m.answer ?? '[unknown]'}</span></Typography>
                  <div style={{fontSize:'0.95em',marginTop:4}}>
                    <strong>Answer history:</strong>
                    <ul style={{margin:'4px 0 0 16px'}}>
                      {m.history.map((h, i) => (
                        <li key={i} style={{color: h.correct ? '#4CAF50' : '#F44336'}}>
                          {new Date(h.timestamp).toLocaleTimeString()}: <strong>{h.answer}</strong> {h.correct ? '✅' : <span style={{color:'#F44336'}}>❌ (incorrect, should be {m.answer ?? '[unknown]'})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="contained" color="success" size="large" onClick={resetSession}>Play Again</Button>
        </Stack>
      </Paper>
    </Dialog>
  );
}

SessionReview.propTypes = {
  sessionComplete: PropTypes.bool.isRequired,
  mistakesLog: PropTypes.array.isRequired,
  resetSession: PropTypes.func.isRequired,
};
