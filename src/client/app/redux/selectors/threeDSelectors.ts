import { createSelector } from '@reduxjs/toolkit';
import {
	selectThreeDMeterOrGroup, selectThreeDMeterOrGroupID
} from '../slices/graphSlice';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { MeterOrGroup } from '../../types/redux/graph';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { selectMeterDataById } from '../../redux/api/metersApi';


// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	selectThreeDMeterOrGroupID,
	selectThreeDMeterOrGroup,
	selectMeterDataById,
	selectGroupDataById,
	(id, meterOrGroup, meterDataById, groupDataById) => {
		//Default Values
		let meterOrGroupName = 'Unselected Meter or Group'
		let isAreaCompatible = true;

		if (id) {
			// Get Meter or Group's info
			if (meterOrGroup === MeterOrGroup.meters && meterDataById) {
				const meterInfo = meterDataById[id]
				meterOrGroupName = meterInfo.identifier;
				isAreaCompatible = meterInfo.area !== 0 && meterInfo.areaUnit !== AreaUnitType.none;
			} else if (meterOrGroup === MeterOrGroup.groups && groupDataById) {
				const groupInfo = groupDataById[id];
				meterOrGroupName = groupInfo.name;
				isAreaCompatible = groupInfo.area !== 0 && groupInfo.areaUnit !== AreaUnitType.none;
			}

		}
		return {
			meterOrGroupID: id,
			meterOrGroup: meterOrGroup,
			meterOrGroupName: meterOrGroupName,
			isAreaCompatible: isAreaCompatible
		}
	}

)
