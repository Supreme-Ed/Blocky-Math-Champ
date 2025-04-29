import React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

interface MathType {
  value: string;
  label: string;
}

interface OperandRange {
  min: number;
  max: number;
}

interface OperandRanges {
  [key: string]: OperandRange;
}

interface MathTypeSelectorProps {
  mathTypesSelected: string[];
  setMathTypesSelected: React.Dispatch<React.SetStateAction<string[]>>;
  operandRanges: OperandRanges;
  setOperandRanges: React.Dispatch<React.SetStateAction<OperandRanges>>;
  multiplicationTables: number[];
  setMultiplicationTables: React.Dispatch<React.SetStateAction<number[]>>;
  divisionTables: number[];
  setDivisionTables: React.Dispatch<React.SetStateAction<number[]>>;
}

const mathTypes: MathType[] = [
  { value: 'addition', label: 'Addition' },
  { value: 'subtraction', label: 'Subtraction' },
  { value: 'multiplication', label: 'Multiplication' },
  { value: 'division', label: 'Division' },
];

export default function MathTypeSelector({
  mathTypesSelected,
  setMathTypesSelected,
  operandRanges,
  setOperandRanges,
  multiplicationTables,
  setMultiplicationTables,
  divisionTables,
  setDivisionTables
}: MathTypeSelectorProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Typography fontWeight="bold">Math Type(s):</Typography>
      <Stack direction="row" spacing={2}>
        {mathTypes.map(type => {
          const isSelected = mathTypesSelected.includes(type.value);
          return (
            <Stack key={type.value} alignItems="center">
              <Button
                variant={isSelected ? 'contained' : 'outlined'}
                color={isSelected ? 'primary' : 'inherit'}
                onClick={() => {
                  setMathTypesSelected(prev =>
                    prev.includes(type.value)
                      ? prev.filter(val => val !== type.value)
                      : [...prev, type.value]
                  );
                }}
                aria-pressed={isSelected}
                sx={{ fontWeight: 'bold', minWidth: 120 }}
              >
                {type.label}
              </Button>
              {/* Operand Range Inputs for Selected Type */}
              {isSelected && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  {/* Addition, Subtraction show min/max */}
                  {type.value !== 'multiplication' && type.value !== 'division' && (
                    <>
                      <Typography fontSize={12} color="text.secondary">Min</Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={typeof operandRanges[type.value]?.min === 'number' ? operandRanges[type.value].min : 0}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setOperandRanges(ranges => ({
                            ...ranges,
                            [type.value]: { ...ranges[type.value], min: isNaN(val) ? 0 : val }
                          }));
                        }}
                        inputProps={{
                          min: -999,
                          max: 999
                        }}
                        sx={{ width: 70 }}
                        InputProps={{ style: { color: '#222' } }}
                      />
                      <Typography fontSize={12}>to</Typography>
                      <Typography fontSize={12} color="text.secondary">Max</Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={typeof operandRanges[type.value]?.max === 'number' ? operandRanges[type.value].max : 0}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setOperandRanges(ranges => ({
                            ...ranges,
                            [type.value]: { ...ranges[type.value], max: isNaN(val) ? 0 : val }
                          }));
                        }}
                        inputProps={{
                          min: -999,
                          max: 999
                        }}
                        sx={{ width: 70 }}
                        InputProps={{ style: { color: '#222' } }}
                      />
                    </>
                  )}
                  {/* Division: Multi-select divisors */}
                  {type.value === 'division' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, color: '#444', marginBottom: 2 }}>Divisors:</span>
                      {/* All Button */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        <button
                          type="button"
                          style={{
                            padding: '4px 14px',
                            background: divisionTables.length === 11 ? '#4f8cff' : '#e0e7ef',
                            color: divisionTables.length === 11 ? '#fff' : '#333',
                            border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold',
                            outline: divisionTables.length === 11 ? '2px solid #1a5fd0' : 'none',
                            fontSize: 12
                          }}
                          onClick={() => {
                            if (divisionTables.length === 11) {
                              setDivisionTables([]);
                            } else {
                              setDivisionTables([2,3,4,5,6,7,8,9,10,11,12]);
                            }
                          }}
                          aria-pressed={divisionTables.length === 11}
                        >
                          All
                        </button>
                      </div>
                      {/* Divisor Buttons in 3-4 Rows */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 4 }}>
                        {[2,3,4,5,6,7,8,9,10,11,12].map(n => {
                          const selected = divisionTables.includes(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              style={{
                                padding: '4px 10px',
                                margin: 0,
                                background: selected ? '#4f8cff' : '#e0e7ef',
                                color: selected ? '#fff' : '#333',
                                border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal',
                                outline: selected ? '2px solid #1a5fd0' : 'none',
                                fontSize: 12
                              }}
                              onClick={() => {
                                setDivisionTables(prev =>
                                  prev.includes(n)
                                    ? prev.filter(val => val !== n)
                                    : [...prev, n]
                                );
                              }}
                              aria-pressed={selected}
                            >
                              {n}s
                            </button>
                          );
                        })}
                      </div>
                      {divisionTables.length === 0 && (
                        <span style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Select at least one divisor</span>
                      )}
                    </div>
                  )}
                  {/* Multiplication: Multi-select tables */}
                  {type.value === 'multiplication' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, color: '#444', marginBottom: 2 }}>Tables:</span>
                      {/* All Button */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        <button
                          type="button"
                          style={{
                            padding: '4px 14px',
                            background: multiplicationTables.length === 11 ? '#4f8cff' : '#e0e7ef',
                            color: multiplicationTables.length === 11 ? '#fff' : '#333',
                            border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold',
                            outline: multiplicationTables.length === 11 ? '2px solid #1a5fd0' : 'none',
                            fontSize: 12
                          }}
                          onClick={() => {
                            if (multiplicationTables.length === 11) {
                              setMultiplicationTables([]);
                            } else {
                              setMultiplicationTables([2,3,4,5,6,7,8,9,10,11,12]);
                            }
                          }}
                          aria-pressed={multiplicationTables.length === 11}
                        >
                          All
                        </button>
                      </div>
                      {/* Table Buttons in 3-4 Rows */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 4 }}>
                        {[2,3,4,5,6,7,8,9,10,11,12].map(n => {
                          const selected = multiplicationTables.includes(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              style={{
                                padding: '4px 10px',
                                margin: 0,
                                background: selected ? '#4f8cff' : '#e0e7ef',
                                color: selected ? '#fff' : '#333',
                                border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal',
                                outline: selected ? '2px solid #1a5fd0' : 'none',
                                fontSize: 12
                              }}
                              onClick={() => {
                                setMultiplicationTables(prev =>
                                  prev.includes(n)
                                    ? prev.filter(val => val !== n)
                                    : [...prev, n]
                                );
                              }}
                              aria-pressed={selected}
                            >
                              {n}s
                            </button>
                          );
                        })}
                      </div>
                      {multiplicationTables.length === 0 && (
                        <span style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Select at least one table</span>
                      )}
                    </div>
                  )}
                </Stack>
              )}
            </Stack>
          );
        })}
      </Stack>
      <>
        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          (You can select more than one)
        </div>
      </>
    </Stack>
  );
}
