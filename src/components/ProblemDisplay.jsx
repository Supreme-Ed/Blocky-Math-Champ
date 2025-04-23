import React from 'react';
import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function ProblemDisplay({ currentProblem, answered, onUserAnswer }) {
  if (!currentProblem) {
    return <Typography variant="h6">All problems complete!</Typography>;
  }
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>{currentProblem.question}</Typography>
      {answered && (
        <Typography sx={{ mt: 1, fontWeight: 'bold', color: '#333' }}>{`The answer is ${currentProblem.answer}.`}</Typography>
      )}
    </>
  );
}

ProblemDisplay.propTypes = {
  currentProblem: PropTypes.object,
  answered: PropTypes.bool.isRequired,
  onUserAnswer: PropTypes.func.isRequired,
};
