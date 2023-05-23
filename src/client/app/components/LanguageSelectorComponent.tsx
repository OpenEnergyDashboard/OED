/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { LanguageTypes } from '../types/redux/i18n';
import { FormattedMessage } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { updateDefaultLanguage } from '../actions/admin';
import { State } from '../types/redux/state';
import TooltipHelpContainer from '../containers/TooltipHelpContainer';

/**
 * A component that allows users to select which language the page should be displayed in.
 */
export default function LanguageSelectorComponent() {
	const dispatch = useDispatch();

	const selectedLanguage = useSelector((state: State) => state.admin.defaultLanguage);

	return (
		<div>
			<UncontrolledDropdown direction='end'>
				<DropdownToggle nav caret>
					<FormattedMessage id='language' />
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem
						onClick={() => dispatch(updateDefaultLanguage(LanguageTypes.en))}
						disabled={selectedLanguage === LanguageTypes.en}>
						English
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch(updateDefaultLanguage(LanguageTypes.fr))}
						disabled={selectedLanguage === LanguageTypes.fr}>
						Français
					</DropdownItem>
					<DropdownItem
						onClick={() => dispatch(updateDefaultLanguage(LanguageTypes.es))}
						disabled={selectedLanguage === LanguageTypes.es}>
						Español
					</DropdownItem>
					<DropdownItem divider />
					<TooltipHelpContainer page='home' />
					<TooltipMarkerComponent page='home' helpTextId='help.home.language' />
				</DropdownMenu>
			</UncontrolledDropdown>
		</div>
	);
}