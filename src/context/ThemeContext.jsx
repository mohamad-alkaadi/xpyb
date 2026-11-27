import { createContext, useContext, useEffect, useState } from 'react';
import { readStoredTheme, storeTheme } from '../lib/theme/theme.js';

const ThemeContext = createContext(null);

/**
 * Reads the theme context.
 * @returns {{theme: 'dark'|'light', setTheme: Function}} App shell theme and its setter.
 */
export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    storeTheme(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
