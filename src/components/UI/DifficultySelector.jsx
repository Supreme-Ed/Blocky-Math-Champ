import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function DifficultySelector({ difficulty, setDifficulty }) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Typography fontWeight="bold">Difficulty:</Typography>
      <Stack direction="row" spacing={2}>
        {difficulties.map(diff => (
          <Button
            key={diff.value}
            variant={difficulty === diff.value ? 'contained' : 'outlined'}
            color={difficulty === diff.value ? 'warning' : 'primary'}
            onClick={() => setDifficulty(diff.value)}
            sx={{ fontWeight: 'bold' }}
          >
            {diff.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

DifficultySelector.propTypes = {
  difficulty: PropTypes.string.isRequired,
  setDifficulty: PropTypes.func.isRequired,
};
