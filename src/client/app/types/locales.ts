/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-expect-error Suppress TypeScript declaration file not found error
import esLocale from 'plotly.js/lib/locales/es'
// @ts-expect-error Suppress TypeScript declaration file not found error
import frLocale from 'plotly.js/lib/locales/fr'

export default class Locales {
	static es = esLocale;
	static fr = frLocale;
}
