/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { defineMessages, createIntl, createIntlCache } from 'react-intl';
import localeData from '../translations/data';

const enum AsTranslated {}
export type TranslatedString = string & AsTranslated;

export default function translate(messageID: string): TranslatedString {
	const state: any = store.getState();
	const lang = state.admin.defaultLanguage;

	const messages = (localeData as any)[lang];
	const cache = createIntlCache();
	const intl = createIntl({ locale: lang, messages }, cache);
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID }})[messageID]) as TranslatedString;
}
