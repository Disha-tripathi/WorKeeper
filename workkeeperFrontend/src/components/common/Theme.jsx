// ThemeContext.js
import React, { createContext, useState, useEffect , useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkTheme, setDarkTheme] = useState(() => {
    // Check local storage for saved preference
    const savedTheme = localStorage.getItem('theme');
    // Default to light theme if no preference saved
    return savedTheme ? savedTheme === 'dark' : false;
  });

  const toggleTheme = () => {
    setDarkTheme(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

useEffect(() => {
  // Only use system preference if no preference is saved
  if (!localStorage.getItem('theme')) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      setDarkTheme(e.matches);
    };
    
    // Set initial value
    setDarkTheme(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }
}, []);

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);