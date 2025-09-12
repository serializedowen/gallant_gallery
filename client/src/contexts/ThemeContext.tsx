import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export type ThemeMode = 'light' | 'dark';

export interface CustomTheme {
  mode: ThemeMode;
  primaryColor: string;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  primaryColor: string;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const predefinedColors = {
  blue: '#1976d2',
  purple: '#9c27b0',
  green: '#388e3c',
  orange: '#f57c00',
  red: '#d32f2f',
  teal: '#00796b',
  indigo: '#3f51b5',
  pink: '#e91e63',
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('gallant-gallery-theme-mode');
    return (saved as ThemeMode) || 'dark';
  });

  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    const saved = localStorage.getItem('gallant-gallery-primary-color');
    return saved || predefinedColors.blue;
  });

  useEffect(() => {
    localStorage.setItem('gallant-gallery-theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('gallant-gallery-primary-color', primaryColor);
  }, [primaryColor]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const theme = createTheme({
    palette: {
      mode: themeMode as PaletteMode,
      primary: {
        main: primaryColor,
      },
      ...(themeMode === 'dark' && {
        background: {
          default: '#0a0a0a',
          paper: '#141414',
        },
      }),
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: themeMode === 'dark' ? '#1e1e1e' : primaryColor,
          },
        },
      },
    },
  });

  const contextValue: ThemeContextType = {
    themeMode,
    primaryColor,
    toggleTheme,
    setPrimaryColor,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export { predefinedColors };
