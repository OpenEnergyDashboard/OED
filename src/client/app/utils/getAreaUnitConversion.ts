/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export enum AreaUnitType {
	feet = 'feet',
	meters = 'meters',
	none = 'none'
}

/**
 * Gets the conversion between two area units
 * NOTE: See earlier version of this function for a way to support more units
 * @param {AreaUnitType} fromUnit unit to convert FROM
 * @param {AreaUnitType} toUnit unit to convert TO
 * @returns {number} conversion multiplier, or zero if conversion to none
 */
export function getAreaUnitConversion(fromUnit: AreaUnitType, toUnit: AreaUnitType): number {
	if (fromUnit === toUnit) {
		return 1;
	}
	if (fromUnit === AreaUnitType.feet && toUnit === AreaUnitType.meters) {
		return 0.092903;
	}
	if (fromUnit === AreaUnitType.meters && toUnit === AreaUnitType.feet) {
		return 10.7639;
	}
	return 0;
}