/* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LanguageTypes } from '../types/redux/i18n';
import * as moment from 'moment';
import { optionsSlice } from '../reducers/options';

export function updateSelectedLanguage(selectedLanguage: LanguageTypes) {
	moment.locale(selectedLanguage);
	return optionsSlice.actions.updateSelectedLanguage(selectedLanguage);
}
