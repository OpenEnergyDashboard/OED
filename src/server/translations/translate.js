/**
 * Server-side translation utilities for CSV upload internationalization
 * 
 * This module enables the CSV upload pipeline to display messages in the user's selected language (English, French, or Spanish)
 * by extracting the language preference from HTTP headers and providing translation lookup functionality
 * 
 * Created to fix internationalization bug where CSV upload messages always appeared in English
 */

const ServerTranslationData = require('./data');
const { log } = require('../log');

/**
 * Extract language from request headers
 * Reads Accept-Language header and returns best match from supported languages
 * @param {object} req - Express request object
 * @returns {string} Language code ('en', 'fr', or 'es')
 */
function getLanguageFromRequest(req) {
	const acceptLanguage = req.headers['accept-language'];
	
	if (!acceptLanguage) {
		return 'en';
	}
	
	// Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
	const languages = acceptLanguage.split(',').map(lang => {
		const parts = lang.split(';');
		const code = parts[0].trim().split('-')[0]; // Get just 'fr' from 'fr-FR'
		return code;
	});
	
	// Find first supported language
	for (const lang of languages) {
		if (ServerTranslationData[lang]) {
			return lang;
		}
	}
	
	return 'en'; // Default to English
}

/**
 * Translate a key to the specified language
 * @param {string} key - Translation key (e.g., 'csv.upload.error.no.file')
 * @param {string} lang - Language code (default: 'en')
 * @returns {string} Translated string or key if not found
 */
function translate(key, lang = 'en') {
	const translation = ServerTranslationData[lang]?.[key];
	if (!translation) {
		log.warn(`Translation key not found: ${key} for language: ${lang}`);
		return key;
	}
	return translation;
}

module.exports = { translate, getLanguageFromRequest };