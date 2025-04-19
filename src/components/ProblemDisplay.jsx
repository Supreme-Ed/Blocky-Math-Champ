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
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 1 }}>
        {currentProblem.choices.map((choice, i) => (
          <Button
            key={i}
            variant="contained"
            size="large"
            color={answered ? (choice === currentProblem.answer ? 'success' : 'error') : 'primary'}
            onClick={() => onUserAnswer(choice)}
            disabled={answered}
            sx={{ minWidth: 60, fontWeight: 'bold' }}
          >
            {choice}
          </Button>
        ))}
      </Stack>
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
