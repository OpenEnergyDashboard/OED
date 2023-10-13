/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { GPSPoint } from './calibration';
import { UnitData, DisplayableType, UnitRepresentType, UnitType, UnitDataById } from '../types/redux/units';
import translate from './translate';
import * as _ from 'lodash';

// Notifies user of msg.
// TODO isValidGPSInput uses alert so continue that. Maybe all should be changed but this impacts other parts of the code.
// Note this causes the modal to close but the state is not reset.
// Use a function so can easily change how it works.
/**
 * Causes a window popup with msg
 * @param msg message to display
 */
export function notifyUser(msg: string) {
	window.alert(msg);
}

/**
 * get string value from GPSPoint or null.
 * @param gps GPS point to get value from and can be null
 * @returns to represent the GPS value or empty string if null
 */
export function getGPSString(gps: GPSPoint | null) {
	if (gps === null) {
		//  if gps is null return empty string value
		return '';
	}
	else if (typeof gps === 'object') {
		// if gps is an object parse GPSPoint and return string value
		const json = JSON.stringify({ gps });
		const obj = JSON.parse(json);
		return `${obj.gps.latitude}, ${obj.gps.longitude}`;
	}
	else {
		// Assume it is a string that was input.
		return gps
	}
}

/**
 * Checks if the input is null and returns empty string if that is the case. Otherwise return input.
 * This is needed because React does not want values to be of type null for display and null is the
 * state for some of DB values. This only should change what is displayed and not the state or props.
 * @param item item to check if null and convert to empty string
 * @returns item if not null or empty string
 */
export function nullToEmptyString(item: any) {
	if (item === null) {
		return '';
	} else {
		return item;
	}
}

/**
 * Calculates the set of all possible graphic units for a meter/group.
 * This is any unit that is of type unit or suffix.
 * @param units candidate graphic units
 * @returns The set of all possible graphic units for a meter/group
 */
export function potentialGraphicUnits(units: UnitDataById) {
	// Set of possible graphic units
	let possibleGraphicUnits = new Set<UnitData>();

	// The default graphic unit can be any unit of type unit or suffix.
	Object.values(units).forEach(unit => {
		if (unit.typeOfUnit == UnitType.unit || unit.typeOfUnit == UnitType.suffix) {
			possibleGraphicUnits.add(unit);
		}
	});
	// Put in alphabetical order.
	possibleGraphicUnits = new Set(_.sortBy(Array.from(possibleGraphicUnits), unit => unit.identifier.toLowerCase(), 'asc'));
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	possibleGraphicUnits.add(noUnitTranslated());
	return possibleGraphicUnits;
}

// A non-unit
export const NoUnit: UnitData = {
	// Only needs the id and identifier, others are dummy values.
	id: -99,
	name: '',
	identifier: 'no unit',
	unitRepresent: UnitRepresentType.quantity,
	secInRate: 99,
	typeOfUnit: UnitType.unit,
	unitIndex: -99,
	suffix: '',
	displayable: DisplayableType.none,
	preferredDisplay: false,
	note: ''
}

/**
 * The enum is fine if don't want translation but this is dynamic so translation works.
 * @returns a unit to represent no unit with translated identifier
 */
export function noUnitTranslated(): UnitData {
	// Untranslated no unit.
	const unit = NoUnit;
	// Make the identifier be translated.
	unit.identifier = translate('unit.none');
	return unit;
}
