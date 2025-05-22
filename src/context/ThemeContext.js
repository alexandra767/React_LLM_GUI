import React, { createContext, useState, useContext, useEffect } from 'react';

export const ThemeContext = createContext();

// Theme definitions
const THEMES = {
  dark: {
    name: 'dark',
    colors: {
      primaryBg: '#1E1E1E',
      secondaryBg: '#252525',
      accent: '#FF643D',
      primaryText: '#FFFFFF',
      secondaryText: '#F0F0F0',
      tertiaryText: '#AAAAAA',
      border: '#333333',
    },
  },
  light: {
    name: 'light',
    colors: {
      primaryBg: '#FFFFFF',
      secondaryBg: '#F5F5F5',
      accent: '#FF643D',
      primaryText: '#333333',
      secondaryText: '#555555',
      tertiaryText: '#777777',
      border: '#DDDDDD',
    },
  },
};

// Shared theme properties
const sharedTheme = {
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
  // Define spacing as a function that takes a factor and returns a spacing value
  // This matches Material-UI's spacing function signature
  spacing: (factor) => {
    const spacingValues = [0, 4, 8, 16, 24, 32, 40, 48, 56, 64];
    return `${spacingValues[factor] || factor * 8}px`;
  },
  // Keep the spacing object for reference if needed
  spacingValues: {
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
  palette: {
    action: {
      hover: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#888888',
    },
  },
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('dark');
  
  // Load saved theme from localStorage on initial load
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('sephia_theme');
      if (savedTheme && THEMES[savedTheme]) {
        setThemeName(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
    }
  }, []);
  
  // Save theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sephia_theme', themeName);
      // Apply theme to document for CSS variables
      document.documentElement.setAttribute('data-theme', themeName);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  }, [themeName]);
  
  const toggleTheme = () => {
    setThemeName(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  const theme = {
    ...THEMES[themeName],
    ...sharedTheme,
    toggleTheme,
    themeName,
  };
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};