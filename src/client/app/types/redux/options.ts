/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from './actions';
import { LanguageTypes } from './i18n';

export interface UpdateSelectedLanguageAction {
	type: ActionType.UpdateSelectedLanguage;
	selectedLanguage: LanguageTypes;
}

export interface ToggleShowMenuAction {
	type: ActionType.ToggleShowMenu;
}

export type OptionsAction =
	| UpdateSelectedLanguageAction
	| ToggleShowMenuAction

export interface OptionsState {
	selectedLanguage: LanguageTypes;
	showMenu: boolean;
}