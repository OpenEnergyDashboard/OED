/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Server-side translation utilities for internationalization.
 *
 * These functions enables the display of messages in the user's selected language if supported by OED.
 * It extracts the language preference from HTTP headers and provides translation lookup functionality.
 * The default language will be English if no valid language is provided or it is not supported.
 * It mirrors the React system used on the front-end code.
 */

const ServerTranslationData = require('./data');
const { log } = require('../log');

/**
 * Supported languages.
 * This needs to be kept in sync with the enum in src/client/app/types/redux/i18n.ts.
 */
const LANGUAGES = Object.freeze({
	en: 'en',
	fr: 'fr',
	es: 'es'
});

/**
 * Extract language from request headers.
 * Reads Accept-Language header and returns best match from supported languages.
 * Will default to English if header information missing or not an OED supported language.
 * @param {object} req - Express request object
 * @returns {string} Language code ('en', 'fr', or 'es')
 */
function getLanguageFromRequest(req) {
	// Default when the client sends no Accept-Language header.
	let lang = LANGUAGES.en;
	const acceptLanguage = req.headers['accept-language'];
	if (!acceptLanguage) {
		return lang;
	}

	// Entries are in preference order (e.g. "fr-FR,fr;q=0.9,en;q=0.8"); strip quality values.
	const parsedLanguages = acceptLanguage.split(',').map(lang => {
		const parts = lang.split(';');
		// Get just 'fr' from 'fr-FR'
		const code = parts[0].trim().split('-')[0];
		return code;
	});

	// User has a language preference only if it maps to a code OED supports, default to English.
	const code = parsedLanguages.find(code => code in LANGUAGES);
	return code ?? lang;
}

/**
 * Translate a message key to the specified language.
 *
 * The function loads text from ServerTranslationData, replaces {placeholder} tokens
 * using the values map, and falls back to English when the requested language is
 * unsupported or the key is missing for that language.
 * A warning is logged in those cases, and the key is returned only if English has
 * no string for the key.
 *
 * Example usage:
 *   const lang = getLanguageFromRequest(req);
 *   translate('csv.upload.meters.success', {}, lang);
 *   translate('csv.upload.meters.error.gps.invalid', { meterName, gps, error: message }, lang);
 *
 * @param {string} key - Translation key (e.g., 'csv.upload.error.no.file')
 * @param {object} - Values for {placeholder} segments in the translation string
 * @param {string} - Language code ('en', 'fr', or 'es') with 'en' as default
 * @returns {string} Translated string or key if not found in English either
 */
function translate(key, values = {}, lang = LANGUAGES.en) {
	let lookupLang = lang;
	if (!(lang in ServerTranslationData)) {
		log.warn(`Language ${lang} not supported.`);
		// Default to English when language is not supported.
		lookupLang = LANGUAGES.en;
	}

	let translation = ServerTranslationData[lookupLang][key];
	if (!translation && lookupLang !== LANGUAGES.en) {
		// Key not found in requested language; try English before giving up.
		log.warn(`Translation key not found: ${key} for language: ${lang}`);
		translation = ServerTranslationData[LANGUAGES.en][key];
	}

	if (!translation) {
		return key;
	}

	// Replace variable placeholders in the ServerTranslationData
	return translation.replace(/\{(\w+)\}/g, (match, varName) => {
		// Check if values has the property varName
		return Object.hasOwn(values, varName) ? values[varName] : match;
	});
}

module.exports = { translate, getLanguageFromRequest, LANGUAGES };
