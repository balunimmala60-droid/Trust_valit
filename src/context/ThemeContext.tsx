import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isBW: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'bw',
  setTheme: () => {},
  toggleTheme: () => {},
  isBW: true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<AppTheme>('blue');

  const setTheme = () => {};
  const toggleTheme = () => {};

  useEffect(() => {
    document.documentElement.classList.remove('theme-bw', 'theme-original');
    document.documentElement.classList.add('theme-blue');
    document.body.style.backgroundColor = '#070f26';
    document.body.style.color = '#f0f6fc';
    try {
      localStorage.setItem('trustvault_theme', 'blue');
    } catch (e) {
      // ignore
    }
  }, []);

  const isBW = false;

  return (
    <ThemeContext.Provider value={{ theme: 'blue', setTheme, toggleTheme, isBW: false }}>
      {children}
    </ThemeContext.Provider>
  );
};



export const useTheme = () => useContext(ThemeContext);
