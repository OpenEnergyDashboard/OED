/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Utility to get/ set help text plotlyLayout
 * @param helpText 3D data to be formatted
 * @param fontSize current application state
 * @returns plotly layout object.
 */
export function setHelpLayout(helpText: string = 'Help Text Goes Here', fontSize: number = 28) {
	return {
		'xaxis': {
			'visible': false
		},
		'yaxis': {
			'visible': false
		},
		'annotations': [
			{
				'text': helpText,
				'xref': 'paper',
				'yref': 'paper',
				'showarrow': false,
				'font': { 'size': fontSize }
			}
		]
	};
}

