/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LanguageTypes } from '../types/redux/i18n';
import { OptionsState } from '../types/redux/options';
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const defaultState: OptionsState = {
	selectedLanguage: LanguageTypes.en
};

export const optionsSlice = createSlice({
	name: 'options',
	initialState: defaultState,
	reducers: {
		updateSelectedLanguage: (state, action: PayloadAction<LanguageTypes>) => {
			state.selectedLanguage = action.payload
		}
	}
});
