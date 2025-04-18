import React from 'react';
import PropTypes from 'prop-types';

const mathTypes = [
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
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontWeight: 'bold' }}>Math Type(s):</label>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {mathTypes.map(type => {
          const isSelected = mathTypesSelected.includes(type.value);
          return (
            <div key={type.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                style={{
                  padding: '8px 16px',
                  background: isSelected ? '#4f8cff' : '#e0e7ef',
                  color: isSelected ? '#fff' : '#333',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
                  outline: isSelected ? '2px solid #1a5fd0' : 'none',
                }}
                onClick={() => {
                  setMathTypesSelected(prev =>
                    prev.includes(type.value)
                      ? prev.filter(val => val !== type.value)
                      : [...prev, type.value]
                  );
                }}
                aria-pressed={isSelected}
              >
                {type.label}
              </button>
              {/* Operand Range Inputs for Selected Type */}
              {isSelected && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Addition, Subtraction show min/max */}
                  {type.value !== 'multiplication' && type.value !== 'division' && (
                    <>
                      <label style={{ fontSize: 12, color: '#444' }}>Min
                        <input
                          type="number"
                          value={operandRanges[type.value]?.min ?? ''}
                          style={{ marginLeft: 4, width: 50 }}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setOperandRanges(ranges => ({
                              ...ranges,
                              [type.value]: { ...ranges[type.value], min: isNaN(val) ? '' : val }
                            }));
                          }}
                          min={-999}
                          max={999}
                        />
                      </label>
                      <span style={{ fontSize: 12 }}>to</span>
                      <label style={{ fontSize: 12, color: '#444' }}>Max
                        <input
                          type="number"
                          value={operandRanges[type.value]?.max ?? ''}
                          style={{ marginLeft: 4, width: 50 }}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setOperandRanges(ranges => ({
                              ...ranges,
                              [type.value]: { ...ranges[type.value], max: isNaN(val) ? '' : val }
                            }));
                          }}
                          min={-999}
                          max={999}
                        />
                      </label>
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
                </div>
              )}  
            </div>
          );
        })}
      </div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
        (You can select more than one)
      </div>
    </div>
  );
}

MathTypeSelector.propTypes = {
  mathTypesSelected: PropTypes.arrayOf(PropTypes.string).isRequired,
  setMathTypesSelected: PropTypes.func.isRequired,
  operandRanges: PropTypes.object.isRequired,
  setOperandRanges: PropTypes.func.isRequired,
  multiplicationTables: PropTypes.arrayOf(PropTypes.number).isRequired,
  setMultiplicationTables: PropTypes.func.isRequired,
  divisionTables: PropTypes.arrayOf(PropTypes.number).isRequired,
  setDivisionTables: PropTypes.func.isRequired,
};
