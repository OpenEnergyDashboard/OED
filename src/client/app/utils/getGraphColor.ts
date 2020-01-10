/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


 const​ ​ colors​ = [
	'#000000'​ , ​ '#ff66cc'​ , ​ '#66ccff'​ , ​ '#644f7a'​ , ​ '#53a122'​ , ​ '#a4e46b'​ ,
	'#f69454'​ ,  '#24978d'​ ,  '#05445c'​ , ​ '#9f2405'​ , ​ '#853475'​ , ​ '#fbc4a7'​ ,
	'#ffb467'​ , ​ '#583b39'​ , ​ '#f0dfc5'​ ,  '#85695d'​ ,  '#9a9a9a'​ , ​ '#999999'​ ,
	'#cc00ff'​ , ​ '#cccccc'​ , ​ '#ccccff'​ , ​ '#cc6600'​ , ​ '#ff0000'​ ,  '#ff6600'​ ,
	'#ff99ff'​ , ​ '#99ffcc'​ , ​ '#cc00cc'​ , ​ '#996633'​ , ​ '#cc6633'​ , ​ '#0000cc'​ ,
	'#0000ff'​ ,  '#006600'​ ,  '#009900'​ , ​ '#009966'​ , ​ '#782570'​ , ​ '#aca0b6'​ ,
	'#0422bd'​ , ​ '#a94523'​ , ​ '#133337'​ ,  '#008080'
	];

/**
 * Generates a hash from a label, then selects color based on the hash
 * Based on: https://stackoverflow.com/a/20156012/5116950
 * @param {String} label Graph label to hash
 * @returns {String} Hex color code
 */
export default function getGraphColor(label: string): string {
	let hash = 0;
	if (label.length !== 0) {
		for (let i = 0; i < label.length; i++) {
			hash = label.charCodeAt(i) + ((hash << 5) - hash); // tslint:disable-line no-bitwise
			hash &= hash; // tslint:disable-line no-bitwise
		}
		hash = Math.abs(hash);
	}
	return colors[hash % colors.length];
}
