/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
// import { selectBaseHelpUrl } from '../redux/slices/adminSlice';
import { useContext } from 'react';
import { ThemeContext } from '../../../context/themeContext';

/**
 * A component that allows users to select which theme (light or dark mode) the page should be displayed in.
 * @returns Theme selector component (used in the header navbar)
 */
export default function ThemeSelectorComponent() {
	const {theme, toggleTheme } = useContext(ThemeContext);

	// const version = useAppSelector(selectOEDVersion);
	// const baseHelpUrl = useAppSelector(selectBaseHelpUrl);
	// const helpUrl = baseHelpUrl + version;

	return (
		<>
			<UncontrolledDropdown direction='start'>
				<DropdownToggle nav caret>
					<FormattedMessage id='theme' />
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem
						onClick={() => toggleTheme('light')}
						disabled={theme === 'light'}>
						Light Mode
					</DropdownItem>
					<DropdownItem
						onClick={() => toggleTheme('dark')}
						disabled={theme === 'dark'}>
						Dark Mode
					</DropdownItem>
					<DropdownItem divider />
					{/* <DropdownItem
						href={helpUrl + '/language.html'}>
						<FormattedMessage id="help" />
					</DropdownItem> */}
				</DropdownMenu>
			</UncontrolledDropdown>
		</>
	);
}