import store from '../index';
import { addLocaleData, IntlProvider, defineMessages } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as fr from 'react-intl/locale-data/fr';
import * as localeData from '../translations/locales/data.json';

export default function translate(messageID: string): string {
	addLocaleData([...en, ...fr]);
	const state: any = store.getState();
	const lang = state.admin.defaultLanguage;

	let messages;
	if (lang === 'fr') {
		messages = (localeData as any).fr;
	} else {
		messages = (localeData as any).en;
	}
	const { intl } = new IntlProvider({ locale: lang, messages }, {}).getChildContext();
	return intl.formatMessage(defineMessages({ [messageID]: { id: messageID }})[messageID]);
}
