import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme] = useState({
    colors: {
      primaryBg: '#1E1E1E',
      secondaryBg: '#252525',
      accent: '#FF643D',
      primaryText: '#FFFFFF',
      secondaryText: '#F0F0F0',
      tertiaryText: '#AAAAAA',
      border: '#333333',
    },
    typography: {
      header: {
        size: '24px',
        weight: 300,
      },
      sectionTitle: {
        size: '18px',
        weight: 500,
      },
      regularText: {
        size: '16px',
        weight: 400,
      },
      secondaryInfo: {
        size: '13px',
        weight: 300,
        color: '#888888',
      },
    },
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px',
      xlarge: '32px',
    },
    borderRadius: {
      small: '4px',
      medium: '8px',
      large: '12px',
    },
  });

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};