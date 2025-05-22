import React from 'react';
import styled from '@emotion/styled';
// Theme is now handled by ThemeContext
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const HeaderContainer = styled('header')({
  height: '60px',
  backgroundColor: '#1E1E1E',
  borderBottom: '1px solid #333333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px'
});

const Logo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

const LogoImage = styled('img')({
  height: '32px',
  width: 'auto'
});

const LogoText = styled('h1')({
  fontSize: '24px',
  fontWeight: 300,
  color: '#FFFFFF',
  margin: 0
});


const Header = ({ selectedModel, onModelChange, models = [] }) => {
  // Theme is now handled by ThemeContext
  
  return (
    <HeaderContainer>
      <Logo>
        <LogoImage src="/images/brain-computer.svg" alt="Sephia Logo" />
        <LogoText>Sephia</LogoText>
      </Logo>
      <Box sx={{ minWidth: 200, ml: 'auto', mr: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="model-select-label">Model</InputLabel>
          <Select
            labelId="model-select-label"
            value={selectedModel}
            label="Model"
            onChange={onModelChange}
            sx={{
              '& .MuiSelect-select': {
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: '#1E1E1E',
                color: '#FFFFFF',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#333333',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF643D',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF643D',
              },
              '& .MuiSvgIcon-root': {
                color: '#FFFFFF',
              },
            }}
          >
            {models.map((model) => (
              <MenuItem key={model.name} value={model.name} disabled={model.disabled}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{model.name}</span>
                  <span style={{ opacity: 0.7, fontSize: '0.8em' }}>{model.size}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </HeaderContainer>
  );
};

export default Header;