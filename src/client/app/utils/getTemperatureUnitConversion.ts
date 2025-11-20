/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export enum TemperatureUnitType {
	celcius = 'celcius',
	fahrenheit = 'fahrenheit'
}

/**
 * Gets the conversion between two temperature units
 * @param fromUnit unit to convert FROM
 * @param toUnit unit to convert TO
 * @returns conversion multiplier, or zero if conversion to none
 */
export function getTemperatureUnitConversion(fromUnit: TemperatureUnitType, toUnit: TemperatureUnitType): number {
	if (fromUnit === toUnit) {
		return 1;
	}
	if (fromUnit === TemperatureUnitType.celcius && toUnit === TemperatureUnitType.fahrenheit) {
		return 1.8; // NOTE: when used must add 32 using conditional
	}
	if (fromUnit === TemperatureUnitType.fahrenheit && toUnit === TemperatureUnitType.celcius) {
		return 1 / 1.8; // NOTE: when used must subtract 32 using conditional
	}
	return 0;
}