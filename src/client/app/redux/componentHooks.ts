// import * as React from 'react';
import { selectInitComplete, selectSelectedLanguage } from './slices/appStateSlice';
import { selectCurrentUserRole, selectIsAdmin } from './slices/currentUserSlice';
import { useAppSelector } from './reduxHooks';
import localeData, { LocaleDataKey } from '../translations/data';
import { createIntlCache, createIntl, defineMessages } from 'react-intl';



export const useWaitForInit = () => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const userRole = useAppSelector(selectCurrentUserRole);
	const initComplete = useAppSelector(selectInitComplete);
	return { isAdmin, userRole, initComplete }
}

// Overloads to support TS key completions
type TranslateFunction = {
	(messageID: LocaleDataKey): string;
	(messageID: string): string;
}

// usage
// const translate = useTranslate()
// translate('myKey')
export const useTranslate = () => {
	const lang = useAppSelector(selectSelectedLanguage)
	const cache = createIntlCache();
	const messages = localeData[lang];
	const intl = createIntl({ locale: lang, messages }, cache);

	const translate: TranslateFunction = (messageID: LocaleDataKey | string) => {
		return intl.formatMessage(defineMessages({ [messageID]: { id: messageID } })[messageID]);
	}

	return translate
};