import React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface ProblemCountSelectorProps {
  problemCounts: number[];
  selectedCount: number;
  setSelectedCount: (count: number) => void;
}

export default function ProblemCountSelector({ 
  problemCounts, 
  selectedCount, 
  setSelectedCount 
}: ProblemCountSelectorProps) {
  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Typography fontWeight="bold">How many problems?</Typography>
      <Stack direction="row" spacing={2}>
        {problemCounts.map(count => (
          <Button
            key={count}
            variant={selectedCount === count ? 'contained' : 'outlined'}
            color={selectedCount === count ? 'success' : 'primary'}
            onClick={() => setSelectedCount(count)}
            sx={{ fontWeight: 'bold' }}
          >
            {count}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
