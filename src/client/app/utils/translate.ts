/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { defineMessages, createIntl, createIntlCache } from 'react-intl';
import localeData from '../translations/data';
import store from '../index';

// TODO This used to be multiple types of:
// const enum AsTranslated {}
// export type TranslatedString = string & AsTranslated;
// but that started to cause problems and string was found to be okay.
// If this works then maybe we remove TranslatedString and just use string?
export type TranslatedString = string;

/**
 * Translate a message
 * @param messageID identifier for a message
 * @returns get translated string from original string
 */
export default function translate(messageID: string): TranslatedString {

	// TODO BANDAID FIX
	// Application wasn't loading due to store.getState() returning undefined after adding call to translation in GraphicRateMenuComponent
	// My guess is that the call to store.getState() was too early as the store hadn't finished loading completely
	// For now, set the default language to english and any component subscribed to the language state should properly re-render if the language changes
	let lang = 'en';
	if (store)
	{
		lang = store.getState().options.selectedLanguage;
	}
	/*
	const state: any = store.getState();
	const lang = state.options.selectedLanguage;
	*/

	const messages = (localeData as any)[lang];
	const cache = createIntlCache();
	const intl = createIntl({ locale: lang, messages }, cache);
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID }})[messageID]) as TranslatedString;
}
