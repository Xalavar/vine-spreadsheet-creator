import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // TODO: Need to update this in case local storage dont exist; preferably use the useState from main component
    const [theme, setTheme] = useState(JSON.parse(localStorage.getItem('VSE_settings')).webTheme);

    const toggleTheme = () => {
        console.log('changing theme')
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
