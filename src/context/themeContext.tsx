/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
import * as React from 'react';
import { createContext, useState, useEffect } from 'react';

export type ThemeContextContent = {
    theme: string,
    toggleTheme: Function
}

//ThemeContext is what's passed around in the application (it holds the set theme and a way to toggle the theme)
export const ThemeContext = createContext<ThemeContextContent>({ theme : 'light', toggleTheme : () => {} });

//ThemeProvider uses React's useState() to get/set the theme values (using local storage) and uses React's useEffect()
//to watch for when the selected theme changes so that it can update the theme on the DOM.
export const ThemeProvider = ({children} : any) => {
    const [theme, setTheme] = useState('light');

    //Runs when the app first loads to get the user's theme (if it has been set already)
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    //Runs each time the theme changes, updates the saved theme in local storage and updates the theme styling for the DOM
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
    }, [theme]);

    //The function made available to other components; this updates the saved theme depending on what the user has selected
    const toggleTheme = (theme: string) => {
        setTheme(theme);
    }

    return (
        <div>
            <ThemeContext.Provider value={{theme, toggleTheme}}>
              {children}
            </ThemeContext.Provider>
        </div>
    )
}