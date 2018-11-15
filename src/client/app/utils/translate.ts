/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import store from '../index';
import { addLocaleData, IntlProvider, defineMessages } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as fr from 'react-intl/locale-data/fr';
import * as localeData from '../translations/data.json';

addLocaleData([...en, ...fr]);

const enum AsTranslated {}
export type TranslatedString = string & AsTranslated;

export function getDefaultLanguage(): string {
	const state: any = store.getState();
	return state.admin.defaultLanguage;
}

export default function translate(messageID: string): TranslatedString {
	const lang = getDefaultLanguage();

	let messages;
	if (lang === 'fr') {
		messages = (localeData as any).fr;
	} else {
		messages = (localeData as any).en;
	}
	const { intl } = new IntlProvider({ locale: lang, messages }, {}).getChildContext();
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID }})[messageID]) as TranslatedString;
}
