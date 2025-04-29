import React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import * as BABYLON from '@babylonjs/core';
import { ExtendedMathProblem } from '../types/game';

interface ProblemDisplayProps {
  currentProblem: ExtendedMathProblem | null;
  answered: boolean;
  onUserAnswer: (params: { mesh: BABYLON.AbstractMesh, answer: number | string, blockTypeId: string }) => void;
}

export default function ProblemDisplay({ currentProblem, answered, onUserAnswer }: ProblemDisplayProps) {
  if (!currentProblem) {
    return <Typography variant="h6">All problems complete!</Typography>;
  }
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2, fontSize: '30px' }}>{currentProblem.question}</Typography>
    </>
  );
}
