/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


//Color list with darker hues towards end of array ligher hues towards beginning of array
const graphColors = [
	'#99a3a4', '#cd6155', '#af7ac5', '#5499c7', '#48c9b0', '#52be80', '#f4d03f', '#eb984e',
	'#34495e', '#e74c3c', '#8e44ad', '#3498db',	'#16a085', '#2ecc71', '#f39c12', '#d35400',
	'#707b7c', '#a93226', '#884ea0', '#2471a3', '#17a589', '#229954', '#d4ac0d', '#ca6f1e',
	'#283747', '#b03a2e', '#6c3483', '#2874a6', '#117a65', '#239b56', '#b9770e', '#a04000',
	'#515a5a', '#7b241c', '#633974', '#1a5276', '#117864', '#196f3d', '#9a7d0a', '#935116', 
	'#1b2631', '#78281f', '#4a235a', '#1b4f72', '#0b5345', '#186a3b', '#7e5109', '#6e2c00'
]

const graphColorsReversed = graphColors.reverse();

/**
 * Selects a color from the graphColor array based based on the type of data to be graphed. Coupled with the above color list, the function will select
 * darker hues for groups and ligher hues for meters.
 * @param colorID, the number of the specific meter; additionally how many meters have already been colored
 * @param type, either 'meter' or 'group' depending on the type of the data to be graphed
 */ 
export default function getGraphColor (colorID: number, type: string): string {
	if (type === 'meter') {
		return graphColors[(colorID - 1) % graphColors.length]
	}
	if (type === 'group') {
		return graphColorsReversed[(colorID - 1) % graphColorsReversed.length]
	}
	else {
		throw('Invalid arguments: expected second argument either \'meter\' or \'group\'')
	}
}