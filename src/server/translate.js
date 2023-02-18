const { defineMessage, createIntl, createIntlCache } = require('@formatjs/intl')
const { localeData } = require('./translations/data');

/**
 * @param {string} messageID Identifier for a message
 * @param {Record<string, unknown>} values Used to fill placeholders in message
 * @returns {string} Translated string
 */
exports.translate = function translate(messageID, values) {
	// TODO: set default language
	let lang = 'en';

	const cache = createIntlCache();
	const intl = createIntl({
		locale: lang,
		messages: localeData[lang]
	}, cache);

	return intl.formatMessage(defineMessage(
		{ id: messageID },
	), values);
}
