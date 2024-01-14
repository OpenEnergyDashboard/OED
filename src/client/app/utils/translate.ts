/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineMessages, createIntl, createIntlCache } from 'react-intl';
import { LocaleDataKey, TranslationKey } from '../translations/data';
import localeData from '../translations/data';
import { store } from '../store';

// Function overloads to add TS Completions support
function translate(messageID: LocaleDataKey): string;
function translate(messageID: string): string;
/**
 * Translate a message with given parameter as translation Key.
 * @param messageID identifier for a message
 * @returns get translated string given a key
 */
function translate(messageID: LocaleDataKey | string): string {

	// TODO BANDAID FIX
	// Application wasn't loading due to store.getState() returning undefined after adding call to translation in GraphicRateMenuComponent
	// My guess is that the call to store.getState() was too early as the store hadn't finished loading completely
	// For now, set the default language to english and any component subscribed to the language state should properly re-render if the language changes
	let lang: TranslationKey = 'en';
	if (store) {
		// TODO Its a bad practice to import store anywhere other than index.tsx
		// migrate to useTranslate() from componentHooks.ts
		lang = store.getState().appState.selectedLanguage;
	}
	/*
	const state: any = store.getState();
	const lang = state.options.selectedLanguage;
	*/

	const messages = (localeData)[lang];
	const cache = createIntlCache();
	const intl = createIntl({ locale: lang, messages }, cache);
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID } })[messageID]);
}

export default translate