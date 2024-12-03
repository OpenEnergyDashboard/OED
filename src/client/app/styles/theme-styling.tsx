/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * This file is used to define theme styling for imported components.
 */

import { useContext } from 'react';
import { ThemeContext } from '../../../context/themeContext';

/**
 * Custom styling for react-select component to support light and dark mode.
 * @returns react-select style object
 */
export function getSelectStyles() {
	const { theme } = useContext(ThemeContext);

	const textColor = theme === 'dark' ? '#6c757d' : 'black';
	const menuBorderColor = theme === 'dark' ? '1px solid #424649' : '1px solid #d9d9d9';
	const backgroundColor = theme === 'dark' ? '#212529' : '#ffffff';
	const selectedBackgroundColor = theme === 'dark' ? '#495057' : '#4c9aff';
	const hoverBackgroundColor = theme === 'dark' ? '#6c757d' : '#b2d4ff';

	const selectStyles = {
		// The initial select view
		control: (baseStyles: any) => ({
			...baseStyles,
			backgroundColor: backgroundColor
		}),
		// The single value first shown in the select view
		singleValue: (baseStyles: any) => ({
			...baseStyles,
			color: textColor,
			backgroundColor: backgroundColor
		}),
		// The drop down menu select options
		menu: (baseStyles: any) => ({
			...baseStyles,
			backgroundColor: backgroundColor,
			border: menuBorderColor,
			marginTop: 0
		}),
		// Styling for each option in the drop down
		option: (baseStyles: any, {isFocused, isSelected}: any) => ({
			...baseStyles,
			backgroundColor: isSelected ? selectedBackgroundColor : (isFocused ? hoverBackgroundColor : backgroundColor)
		})
	};
	return selectStyles;
}
