/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { addLocaleData, IntlProvider, defineMessages } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as fr from 'react-intl/locale-data/fr';
import * as es from 'react-intl/locale-data/es';
import * as localeData from '../translations/data.json';

addLocaleData([...en, ...fr, ...es]);

const enum AsTranslated {}
export type TranslatedString = string & AsTranslated;

export default function translate(messageID: string): TranslatedString {
	const state: any = store.getState();
	const lang = state.admin.defaultLanguage;

	let messages;
	if (lang === 'fr') {
		messages = (localeData as any).fr;
	} else if (lang === 'es') {
		messages = (localeData as any).es;
	} else {
		messages = (localeData as any).en;
	}
	const { intl } = new IntlProvider({ locale: lang, messages }, {}).getChildContext();
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID }})[messageID]) as TranslatedString;
}
