/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { LanguageTypes } from '../types/redux/i18n';
import { FormattedMessage } from 'react-intl';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../types/redux/state';
import { updateSelectedLanguage } from '../actions/options';

/**
 * A component that allows users to select which language the page should be displayed in.
 */
export default function LanguageSelectorComponent() {
	const dispatch = useDispatch();

	const selectedLanguage = useSelector((state: State) => state.options.selectedLanguage);
	const version = useSelector((state: State) => state.version.version);

	return (
		<div>
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
						href={'https://openenergydashboard.github.io/help/' + version + '/language.html'}>
						<FormattedMessage id="help" />
					</DropdownItem>
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);
}