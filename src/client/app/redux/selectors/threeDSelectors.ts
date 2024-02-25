/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import {
	selectThreeDMeterOrGroup, selectThreeDMeterOrGroupID
} from '../slices/graphSlice';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { MeterOrGroup } from '../../types/redux/graph';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectNameFromEntity } from './entitySelectors';


// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	selectThreeDMeterOrGroupID,
	selectThreeDMeterOrGroup,
	selectMeterDataById,
	selectGroupDataById,
	(id, meterOrGroup, meterDataById, groupDataById) => {
		// Default Values
		let meterOrGroupName = 'Unselected Meter or Group';
		let isAreaCompatible = true;

		if (id && meterDataById[id]) {
			const entity = meterOrGroup === MeterOrGroup.meters ? meterDataById[id] : groupDataById[id];
			meterOrGroupName = selectNameFromEntity(entity);
			// Get Meter or Group's info
			if (meterOrGroup === MeterOrGroup.meters && entity) {
				isAreaCompatible = entity.area !== 0 && entity.areaUnit !== AreaUnitType.none;
			} else if (meterOrGroup === MeterOrGroup.groups && entity) {
				meterOrGroupName = entity.name;
				isAreaCompatible = entity.area !== 0 && entity.areaUnit !== AreaUnitType.none;
			}
		}
		return {
			meterOrGroupID: id,
			meterOrGroup: meterOrGroup,
			meterOrGroupName: meterOrGroupName,
			isAreaCompatible: isAreaCompatible
		};
	}
);
