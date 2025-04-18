import React from 'react';
import PropTypes from 'prop-types';

export default function SessionReview({ sessionComplete, mistakesLog, resetSession }) {
  if (!sessionComplete) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.75)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        maxWidth: 600,
        width: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
      }}>
        <h2 style={{marginTop:0}}>Session Review</h2>
        {mistakesLog.length === 0 ? (
          <div style={{fontWeight:'bold', color:'#4CAF50'}}>No mistakes! Perfect session!</div>
        ) : (
          <>
            <div style={{marginBottom:12, fontWeight:'bold'}}>Problems you missed (with answer history):</div>
            <ul style={{paddingLeft:18}}>
              {mistakesLog.map((m, idx) => (
                <li key={idx} style={{marginBottom:12}}>
                  <div><strong>Q:</strong> {m.question}</div>
                  <div><strong>Mistakes:</strong> {m.mistakeCount}</div>
                  <div><strong>Correct answer:</strong> <span style={{color:'#4CAF50'}}>{m.answer ?? '[unknown]'}</span></div>
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
        <button style={{marginTop:24, padding:'10px 24px', fontWeight:'bold', borderRadius:8, background:'#4CAF50', color:'white', fontSize:18}} onClick={resetSession}>Play Again</button>
      </div>
    </div>
  );
}

SessionReview.propTypes = {
  sessionComplete: PropTypes.bool.isRequired,
  mistakesLog: PropTypes.array.isRequired,
  resetSession: PropTypes.func.isRequired,
};
