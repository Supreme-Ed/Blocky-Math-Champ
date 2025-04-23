import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import AvatarSelector from './UI/AvatarSelector.jsx';
import MathTypeSelector from './UI/MathTypeSelector.jsx';
import DifficultySelector from './UI/DifficultySelector.jsx';
import generateProblemsFromSettings from '../game/generateProblemsFromSettings.js';
import styles from './StartScreen.module.css';

function StartScreen({ onStart }) {
  const [mathTypesSelected, setMathTypesSelected] = useState(['addition']);
  const [operandRanges, setOperandRanges] = useState({
    addition: { min: 0, max: 10 },
    subtraction: { min: 0, max: 10 },
    division: { min: 0, max: 144 },
  });
  const [multiplicationTables, setMultiplicationTables] = useState([2,3,4,5,6,7,8,9,10,11,12]); // default all
  const [divisionTables, setDivisionTables] = useState([2,3,4,5,6,7,8,9,10,11,12]); // default all
  const [difficulty, setDifficulty] = useState('easy');
  const [avatars, setAvatars] = useState([]);
  const [avatar, setAvatar] = useState('');

  // Validation logic for enabling Start Game button
  function canStartGame() {
    if (mathTypesSelected.length === 0) return false;
    for (const type of mathTypesSelected) {
      if (type === 'multiplication') {
        if (multiplicationTables.length === 0) return false;
      } else if (type === 'division') {
        if (divisionTables.length === 0) return false;
      } else {
        const r = operandRanges[type];
        if (!r || r.min === '' || r.max === '' || !Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min > r.max) return false;
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
          setDifficulty={setDifficulty}
        />
      </Box>
      {/* Avatar Selection */}
      <Box className={styles.section}>
        <Typography fontWeight="bold" sx={{ mb: 1 }}>Avatar:</Typography>
        <AvatarSelector
          avatars={avatars.map((avatar, index) => ({ ...avatar, index }))}
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
                return { type, tables: multiplicationTables };
              }
              if (type === 'division') {
                return { type, tables: divisionTables };
              }
              return { type, ...operandRanges[type] };
            }),
            difficulty,
            avatar
          };
          const problems = generateProblemsFromSettings(settings, { numProblems: 10 });
          onStart?.(problems, avatar);
        }}
        disabled={!canStartGame()}
      >
        Start Game
      </Button>
    </Box>
  );
}

StartScreen.propTypes = {
  onStart: PropTypes.func.isRequired, // Receives { mathTypes: [{ type, min, max }], difficulty, avatar }
};

export default StartScreen;