/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { selectSelectedLanguage, updateSelectedLanguage } from '../redux/slices/appStateSlice';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { LanguageTypes } from '../types/redux/i18n';
import { selectHelpUrl } from '../redux/slices/adminSlice';

/**
 * A component that allows users to select which language the page should be displayed in.
 * @returns Language selector element for navbar
 */
export default function LanguageSelectorComponent() {
	const dispatch = useAppDispatch();

	const selectedLanguage = useAppSelector(selectSelectedLanguage);
	const helpUrl = useAppSelector(selectHelpUrl);

	return (
		<>
			<UncontrolledDropdown direction='start'>
				<DropdownToggle nav caret>
					<FormattedMessage id='language' />
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem
						onClick={() => dispatch(updateSelectedLanguage(LanguageTypes.en))}
						disabled={selectedLanguage === LanguageTypes.en}>
						English
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch(updateSelectedLanguage(LanguageTypes.fr))}
						disabled={selectedLanguage === LanguageTypes.fr}>
						Français
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch(updateSelectedLanguage(LanguageTypes.es))}
						disabled={selectedLanguage === LanguageTypes.es}>
						Español
					</DropdownItem>
					<DropdownItem divider />
					<DropdownItem
						href={helpUrl + '/language/'}>
						<FormattedMessage id="help" />
					</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</>
	);
}
