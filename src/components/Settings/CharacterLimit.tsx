import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, Slider, FormControl, FormHelperText } from '@mui/material';
import { Settings } from '@mui/icons-material';

interface CharacterLimitProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const CharacterLimit: React.FC<CharacterLimitProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value);
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    setLocalValue(val);
    setInputValue(val.toString());
    onChange(val);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = event.target.value;
    setInputValue(inputVal);
    
    const numVal = parseInt(inputVal, 10);
    if (!isNaN(numVal) && numVal >= 10 && numVal <= 50) {
      setLocalValue(numVal);
      onChange(numVal);
    }
  };

  const handleInputBlur = () => {
    const numVal = parseInt(inputValue, 10);
    if (isNaN(numVal) || numVal < 10 || numVal > 50) {
      setInputValue(localValue.toString());
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Character Limit
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Maximum characters per subtitle line. This helps ensure subtitles are readable and don't overflow.
      </Typography>

      <FormControl disabled={disabled}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            label="Characters"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            type="number"
            inputProps={{ min: 10, max: 50, step: 1 }}
            disabled={disabled}
            sx={{ minWidth: 120 }}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            characters per line
          </Typography>
        </Box>

        <Box sx={{ px: 1 }}>
          <Slider
            value={localValue}
            onChange={handleSliderChange}
            min={10}
            max={50}
            step={1}
            marks={[
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 30, label: '30' },
              { value: 40, label: '40' },
              { value: 50, label: '50' },
            ]}
            valueLabelDisplay="on"
            disabled={disabled}
            aria-labelledby="character-limit-slider"
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                backgroundColor: 'primary.main',
              },
              '& .MuiSlider-track': {
                backgroundColor: 'primary.main',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'divider',
              },
            }}
          />
        </Box>

        <FormHelperText>
          {localValue <= 20 && 'Very short lines - good for mobile viewing'}
          {localValue > 20 && localValue <= 35 && 'Optimal length - balanced readability'}
          {localValue > 35 && localValue <= 45 && 'Long lines - more text per subtitle'}
          {localValue > 45 && 'Very long lines - may be hard to read'}
        </FormHelperText>
      </FormControl>
    </Box>
  );
};