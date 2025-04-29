import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import AvatarSelector from './UI/AvatarSelector';
import MathTypeSelector from './UI/MathTypeSelector';
import DifficultySelector from './UI/DifficultySelector';
import ProblemCountSelector from './UI/ProblemCountSelector';
import levelManager from '../game/levelManager';
import generateProblemsFromSettings from '../game/generateProblemsFromSettings';
import styles from './StartScreen.module.css';
import { MathProblem, Avatar } from '../types/game';

interface OperandRange {
  min: number;
  max: number;
}

interface OperandRanges {
  addition: OperandRange;
  subtraction: OperandRange;
  multiplication?: OperandRange;
  division: OperandRange;
}

interface AvatarFile {
  file: string;
  name: string;
  index?: number;
}

interface StartScreenProps {
  onStart: (problems: MathProblem[], avatar: Avatar) => void;
}

interface MathTypeSettings {
  type: string;
  tables?: number[];
  min?: number;
  max?: number;
}

function StartScreen({ onStart }: StartScreenProps) {
  const [mathTypesSelected, setMathTypesSelected] = useState<string[]>(['addition']);
  const [operandRanges, setOperandRanges] = useState<OperandRanges>({
    addition: { min: 0, max: 10 },
    subtraction: { min: 0, max: 10 },
    division: { min: 0, max: 144 },
  });
  const [multiplicationTables, setMultiplicationTables] = useState<number[]>([2,3,4,5,6,7,8,9,10,11,12]); // default all
  const [divisionTables, setDivisionTables] = useState<number[]>([2,3,4,5,6,7,8,9,10,11,12]); // default all
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [problemCount, setProblemCount] = useState<number>(levelManager.getProblemCount());
  const [avatars, setAvatars] = useState<AvatarFile[]>([]);
  const [avatar, setAvatar] = useState<string>('');

  // Validation logic for enabling Start Game button
  function canStartGame(): boolean {
    if (mathTypesSelected.length === 0) return false;
    for (const type of mathTypesSelected) {
      if (type === 'multiplication') {
        if (multiplicationTables.length === 0) return false;
      } else if (type === 'division') {
        if (divisionTables.length === 0) return false;
      } else {
        const r = operandRanges[type as keyof OperandRanges];
        if (!r || r.min === undefined || r.max === undefined || !Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min > r.max) return false;
      }
    }
    return true;
  }

  useEffect(() => {
    async function fetchAvatars() {
      try {
        const res = await fetch('/models/avatars/manifest.json');
        const files = await res.json();
        setAvatars(files);
        if (files.length > 0 && !avatar) setAvatar(files[0].file);
      } catch (err) {
        setAvatars([]);
      }
    }
    fetchAvatars();
    // eslint-disable-next-line
  }, []);

  return (
    <Box className={styles.startScreenRoot}>
      <Typography className={styles.title} variant="h2" component="h1">
        Blocky Math Champ
      </Typography>
      {/* Math Type Selection */}
      <Box className={styles.section}>
        <MathTypeSelector
          mathTypesSelected={mathTypesSelected}
          setMathTypesSelected={setMathTypesSelected}
          operandRanges={operandRanges}
          setOperandRanges={setOperandRanges}
          multiplicationTables={multiplicationTables}
          setMultiplicationTables={setMultiplicationTables}
          divisionTables={divisionTables}
          setDivisionTables={setDivisionTables}
        />
      </Box>
      {/* Difficulty Selection */}
      <Box className={styles.section}>
        <DifficultySelector
          difficulty={difficulty}
          setDifficulty={(diff: string) => {
            setDifficulty(diff);
            levelManager.setDifficulty(diff);
            setProblemCount(levelManager.getProblemCount());
          }}
        />
      </Box>
      {/* Problem Count Selection for All Difficulties */}
      <Box className={styles.section}>
        <ProblemCountSelector
          problemCounts={levelManager.getProblemCounts()}
          selectedCount={problemCount}
          setSelectedCount={(count: number) => {
            setProblemCount(count);
            levelManager.setProblemCount(count);
          }}
        />
      </Box>
      {/* Avatar Selection */}
      <Box className={styles.section}>
        <Typography fontWeight="bold" sx={{ mb: 1 }}>Avatar:</Typography>
        <AvatarSelector
          avatars={avatars.map((avatarItem, index) => ({ ...avatarItem, index }))}
          selectedAvatar={avatar}
          onSelect={setAvatar}
        />
      </Box>
      <Button
        className={styles.startButton}
        variant="contained"
        size="large"
        onClick={() => {
          if (!canStartGame()) return;
          const settings = {
            mathTypes: mathTypesSelected.map(type => {
              if (type === 'multiplication') {
                return { type, tables: multiplicationTables } as MathTypeSettings;
              }
              if (type === 'division') {
                return { type, tables: divisionTables } as MathTypeSettings;
              }
              return {
                type,
                min: operandRanges[type as keyof OperandRanges]?.min,
                max: operandRanges[type as keyof OperandRanges]?.max
              } as MathTypeSettings;
            }),
            difficulty,
            avatar
          };
          const problems = generateProblemsFromSettings(settings, { numProblems: problemCount });
          onStart?.(problems, { file: avatar });
        }}
        disabled={!canStartGame()}
      >
        Start Game
      </Button>
    </Box>
  );
}

export default StartScreen;
