/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import { LanguageTypes } from '../types/redux/i18n';
import { OptionsAction, OptionsState } from '../types/redux/options';

const defaultState: OptionsState = {
	selectedLanguage: LanguageTypes.en,
	showMenu: true
};

export default function options(state = defaultState, action: OptionsAction) {
	switch (action.type) {
		case ActionType.UpdateSelectedLanguage:
			return {
				...state,
				selectedLanguage: action.selectedLanguage
			};
		case ActionType.ToggleShowMenu:
			return {
				...state,
				showMenu: !state.showMenu
			};
		default:
			return state;
	}
}