/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * Server-side translation utilities for CSV upload internationalization
 * 
 * This module enables the CSV upload pipeline to display messages in the user's selected language (English, French, or Spanish)
 * by extracting the language preference from HTTP headers and providing translation lookup functionality
 * 
 * Created to fix internationalization bug where CSV upload messages always appeared in English
 */

/**
 * Enum of supported languages.
 * This enum needs to be kept in sync with the enum in src/client/app/types/redux/i18n.ts
 * @enum {string}
 */
const LANGUAGES = Object.freeze({
	en: 'en',
	fr: 'fr',
	es: 'es'
})
const ServerTranslationData = require('./data');
const { log } = require('../log');

/**
 * Extract language from request headers
 * Reads Accept-Language header and returns best match from supported languages
 * @param {object} req - Express request object
 * @returns {string} Language code ('en', 'fr', or 'es')
 */
function getLanguageFromRequest(req) {
	let lang = LANGUAGES.en;
	const acceptLanguage = req.headers['accept-language'];
	if (!acceptLanguage) {
		return lang;
	}

	const parsedLanguages = acceptLanguage.split(',').map(lang => {
		const parts = lang.split(';');
		// Get just 'fr' from 'fr-FR'
		const code = parts[0].trim().split('-')[0];
		return code;
	});

	const code = parsedLanguages.find(code => code in LANGUAGES);
	return code ?? lang;
}

/**
 * Translate a key to the specified language
 * @param {string} key - Translation key (e.g., 'csv.upload.error.no.file')
 * @param {string} lang - Language code (default: 'en')
 * @returns {string} Translated string or key if not found
 */
function translate(key, values = {}, lang = LANGUAGES.en) {
	if (!(lang in ServerTranslationData)) {
		log.warn(`Language ${lang} not supported.`);
		return key;
	}
	
	const translation = ServerTranslationData[lang][key];
	if (!translation) {
		log.warn(`Translation key not found: ${key} for language: ${lang}`);
		return key;
	}

	// Replace variable placeholders in the ServerTranslationData
    return translation.replace(/\{(\w+)\}/g, (match, varName) => {
		// Check if values has the property varName
        return Object.hasOwn(values, varName) ? values[varName] : match;
    });
}

module.exports = { translate, getLanguageFromRequest, LANGUAGES };