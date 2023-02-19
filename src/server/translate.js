const { defineMessage, createIntl, createIntlCache } = require('@formatjs/intl')

const { getConnection } = require('./db')
const Preferences = require('./models/Preferences');
const { localeData } = require('./translations/data');

let defaultLanguage = null;
;(async () => {
	const conn = getConnection();
	const preferences = await Preferences.get(conn);
	defaultLanguage = preferences.defaultLanguage
})()


/**
 * @param {string} messageID Identifier for a message
 * @param {Record<string, unknown>} values Used to fill placeholders in message
 * @returns {string} Translated string
 */
exports.translate = function translate(messageID, values) {
	let lang = defaultLanguage || 'en'

	const cache = createIntlCache();
	const intl = createIntl({
		locale: lang,
		messages: localeData[lang]
	}, cache);

	return intl.formatMessage(defineMessage(
		{ id: messageID },
	), values);
}
