import React, { createContext } from 'react';

// Dark theme definition - simplified and focused on dark theme only
const darkTheme = {
  name: 'dark',
  colors: {
    primaryBg: '#1E1E1E',
    secondaryBg: '#252525',
    accent: '#FF643D',
    primaryText: '#FFFFFF',
    secondaryText: '#F0F0F0',
    tertiaryText: '#AAAAAA',
    border: '#333333',
    errorColor: '#d32f2f',
    successColor: '#4caf50',
    warningColor: '#ff9800',
    infoColor: '#2196f3',
    disabled: '#666666',
    disabledText: '#666666',
    accentHover: '#E55A36',
    buttonText: '#FFFFFF'
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    header: { size: '24px', weight: '300' },
    sectionTitle: { size: '18px', weight: '500' },
    regularText: { size: '16px' },
    secondaryInfo: { size: '13px' },
    fontSize: {
      small: '0.8rem',
      medium: '1rem',
      large: '1.2rem',
      xlarge: '1.5rem',
      xxlarge: '2rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    }
  },
  spacing: {
    xsmall: '4px',
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
    xxlarge: '48px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.2)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.2)',
    large: '0 10px 20px rgba(0, 0, 0, 0.2)'
  },
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  zIndex: {
    modal: 1000,
    dropdown: 100,
    tooltip: 200,
    header: 50,
    footer: 50,
  },
  hoverOpacity: 0.8,
  focusRing: '0 0 0 2px rgba(255, 100, 61, 0.5)'
};

// Create the theme context
export const ThemeContext = createContext(darkTheme);

// Custom hook to use the theme
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    console.warn('useTheme must be used within a ThemeProvider');
    return darkTheme;
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Set the theme attribute on the HTML element
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.backgroundColor = darkTheme.colors.primaryBg;
    document.documentElement.style.color = darkTheme.colors.primaryText;
  }, []);

  return (
    <ThemeContext.Provider value={darkTheme}>
      {children}
    </ThemeContext.Provider>
  );
};