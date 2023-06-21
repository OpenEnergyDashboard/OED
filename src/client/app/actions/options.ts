/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ActionType } from '../types/redux/actions';
import { LanguageTypes } from '../types/redux/i18n';
import * as t from '../types/redux/options';

export function updateSelectedLanguage(selectedLanguage: LanguageTypes): t.UpdateSelectedLanguageAction {
	return {type: ActionType.UpdateSelectedLanguage, selectedLanguage };
}
