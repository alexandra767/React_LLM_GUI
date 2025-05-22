import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const HeaderContainer = styled.header`
  height: 60px;
  background-color: ${props => props.theme.colors.primaryBg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.large};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
`;

const LogoImage = styled.img`
  height: 32px;
  width: auto;
`;

const LogoText = styled.h1`
  font-size: ${props => props.theme.typography.header.size};
  font-weight: ${props => props.theme.typography.header.weight};
  color: ${props => props.theme.colors.primaryText};
`;


const Header = ({ selectedModel, onModelChange, models = [] }) => {
  const { theme } = useTheme();
  
  return (
    <HeaderContainer theme={theme}>
      <Logo theme={theme}>
        <LogoImage src="/images/brain-computer.svg" alt="Sephia Logo" />
        <LogoText theme={theme}>Sephia</LogoText>
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
                backgroundColor: theme.colors.primaryBg,
                color: theme.colors.primaryText,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.colors.border,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.colors.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.colors.primary,
              },
              '& .MuiSvgIcon-root': {
                color: theme.colors.primaryText,
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