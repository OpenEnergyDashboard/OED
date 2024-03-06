/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MeterOrGroup } from '../../types/redux/graph';
import { GroupData } from '../../types/redux/groups';
import { MeterData } from '../../types/redux/meters';
import { UnitData } from '../../types/redux/units';
import { AreaUnitType, getAreaUnitConversion } from '../../utils/getAreaUnitConversion';

export const selectScalingFromEntity = (entity: MeterData | GroupData, areaUnit: AreaUnitType, areaNormalization: boolean, rateScaling: number) => {
	const entityArea = entity.area;
	// We either don't care about area, or we do in which case there needs to be a nonzero area.
	// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
	const areaScaling = areaNormalization ? entityArea * getAreaUnitConversion(entity.areaUnit, areaUnit) : 1;
	// Divide areaScaling into the rate so have complete scaling factor for readings.
	return rateScaling / areaScaling;
};

export const selectAreaScalingFromEntity = (entity: MeterData | GroupData, areaUnit: AreaUnitType, areaNormalization: boolean) => {
	// We either don't care about area, or we do in which case there needs to be a nonzero area.
	// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
	return areaNormalization ? entity.area * getAreaUnitConversion(entity.areaUnit, areaUnit) : 1;
};
// Determines if meter or group base on objet distinct properties of each
export const selectMeterOrGroupFromEntity = (entity: MeterData | GroupData) => {
	return 'meterType' in entity ? MeterOrGroup.meters : 'childMeters' in entity ? MeterOrGroup.groups : undefined;
};

export const selectDefaultGraphicUnitFromEntity = (entity: MeterData | GroupData) => {
	return 'defaultGraphicUnit' in entity ? entity.defaultGraphicUnit : undefined;
};
// fallback to name if no identifier
export const selectNameFromEntity = (entity: MeterData | GroupData | UnitData) => {
	if (entity && 'identifier' in entity && entity.identifier) {
		return entity.identifier;
	} else if (entity && 'name' in entity && entity.name) {
		return entity.name;
	} else {
		// Users May Possibly receive data for meters with neither identifier, or name so empty.
		return '';
	}
};
