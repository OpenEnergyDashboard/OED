/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LineGraphRate } from 'types/redux/graph';
import { UnitData, UnitRepresentType } from '../types/redux/units';
import translate from './translate';
import { AreaUnitType } from './getAreaUnitConversion';

// Has functions for use with graphics

/**
 * Returns the y-axis label for a line graph and whether the rate needs scaling
 * @param selectUnitState The unit state for the selected unit for graphing
 * @param currentSelectedRate The current selected rate
 * @param areaNormalization Whether area normalization is enabled
 * @param selectedAreaUnit The currently selected area unit to normalize to
 * @returns y-axis label and boolean of whether rate needs to be scaled (true if does)
 */
export function lineUnitLabel(selectUnitState: UnitData, currentSelectedRate: LineGraphRate, areaNormalization: boolean,
	selectedAreaUnit: AreaUnitType): { unitLabel: string, needsRateScaling: boolean } {
	let unitLabel: string = '';
	let needsRateScaling = false;
	// Quantity and flow units have different unit labels.
	// Look up the type of unit if it is for quantity/flow/raw and decide what to do.
	// Bar graphics are always quantities.
	if (selectUnitState.identifier === 'kWh' || selectUnitState.identifier === 'kW') {
		// This is a special case. kWh has a general meaning and the flow equivalent is kW.
		// A kW is a Joule/sec. While it is possible to convert to another rate, OED is not
		// going to allow that. If you want that then the site should add Joule as a unit.
		// Note the rate is per second which is unusual and not the normal OED of per hour.
		// Thus, OED will show kW and not allow other rates. To make it consistent, kWh cannot
		// be shown in another rate. Thus, there is no need to scale.
		// TODO This isn't a general solution. For example, Wh or W would not be fixed.
		// The y-axis label is the kW.
		unitLabel = 'kW';
	} else if (selectUnitState.unitRepresent == UnitRepresentType.raw) {
		// A raw unit just uses the identifier.
		// The y-axis label is the same as the identifier.
		unitLabel = selectUnitState.identifier;
	} else if (selectUnitState.unitRepresent === UnitRepresentType.quantity || selectUnitState.unitRepresent === UnitRepresentType.flow) {
		// If it is a quantity or flow unit then it is a rate so indicate by dividing by the time interval
		// which is always one hour for OED.
		unitLabel = selectUnitState.identifier + ' / ' + translate(currentSelectedRate.label);
		// Rate scaling is needed
		needsRateScaling = true;
	}
	if (areaNormalization) {
		unitLabel += ' / ' + translate(`AreaUnitType.${selectedAreaUnit}`);
	}
	return { unitLabel, needsRateScaling };
}

/**
 * Returns the y-axis label for a bar graph
 * @param selectUnitState The unit state for the selected unit for graphing
 * @param areaNormalization Whether or not area normalization is enabled
 * @param selectedAreaUnit The currently selected area unit
 * @returns y-axis label
 */
export function barUnitLabel(selectUnitState: UnitData, areaNormalization: boolean, selectedAreaUnit: AreaUnitType): string {
	let unitLabel: string = '';
	// Quantity and flow units have different unit labels.
	// Look up the type of unit if it is for quantity/flow (should not be raw) and decide what to do.
	// Bar graphics are always quantities.
	if (selectUnitState.unitRepresent === UnitRepresentType.quantity) {
		// If it is a quantity unit then that is the unit you are graphing.
		unitLabel = selectUnitState.identifier;
	} else if (selectUnitState.unitRepresent === UnitRepresentType.flow) {
		// If it is a flow meter then you need to multiply by time to get the quantity unit.
		// The quantity/time for flow has varying time so label by multiplying by time.
		// To make sure it is clear, also indicate it is a quantity.
		// Note this should not be used for raw data.
		// It might not be usual to take a flow and make it into a quantity so this label is a little different to
		// catch people's attention. If sites/users don't like OED doing this then we can eliminate flow for these types
		// of graphics as we are doing for rate.
		unitLabel = selectUnitState.identifier + ' * time ≡ quantity';
	}
	if (areaNormalization) {
		unitLabel += ' / ' + translate(`AreaUnitType.${selectedAreaUnit}`);
	}
	return unitLabel;
}
