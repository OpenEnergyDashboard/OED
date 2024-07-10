/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable */

import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";

// This file used to be a json file, but had issues with importing, so we declared the json variable in a js file instead.
const LocaleTranslationData = {
	"en": en,
	"es": es,
	"fr": fr
};

// Infer for completions on translate()
export default LocaleTranslationData as typeof LocaleTranslationData;
export type TranslationKey = keyof typeof LocaleTranslationData
export type LocaleDataKey =
	 keyof typeof LocaleTranslationData['en'] |
	 keyof typeof LocaleTranslationData['es'] |
	 keyof typeof LocaleTranslationData['fr']
