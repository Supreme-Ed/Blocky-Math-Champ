import React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface DifficultyOption {
  value: string;
  label: string;
}

interface DifficultySelectorProps {
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
}

const difficulties: DifficultyOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function DifficultySelector({ difficulty, setDifficulty }: DifficultySelectorProps) {
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
