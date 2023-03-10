/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export enum AreaUnitType {
	feet = 'feet',
	meters = 'meters',
	kilometers = 'kilometers',
	miles = 'miles',
	none = 'none'
}

const areaUnitConversions: {[key: string]: number} = {
	// TODO possibly make this list automatically generated
	// from unit to unit
	'metersfeet': 10.7639,
	'kilometersmeters': 1000000,
	'milesmeters': 2590000,
	'milesfeet': 27880000,
	'kilometersfeet': 10760000,
	'mileskilometers': 2.58999
};

/**
 * Gets the conversion between two area units
 * @param {AreaUnitType} fromUnit unit to convert FROM
 * @param {AreaUnitType} toUnit unit to convert TO
 * @returns {number} conversion multiplier
 */
export default function getAreaUnitConversion(fromUnit: AreaUnitType, toUnit: AreaUnitType): number {
	let conversion = areaUnitConversions[fromUnit + toUnit];
	if(conversion == null) {
		// if it's null, try the other way
		conversion = 1 / areaUnitConversions[fromUnit + toUnit];
	}
	if(conversion == null) {
		// if it's still null, then the conversion doesn't exist.
		// this should never happen
		return 0;
	}
	return conversion;
}