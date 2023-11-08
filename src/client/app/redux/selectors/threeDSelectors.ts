import { createSelector } from '@reduxjs/toolkit';
import { selectMeterDataById } from '../../redux/api/metersApi';
import {
	selectGraphUnitID,
	selectQueryTimeInterval,
	selectThreeDMeterOrGroup, selectThreeDMeterOrGroupID,
	selectThreeDReadingInterval
} from '../../reducers/graph';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { MeterOrGroup } from '../../types/redux/graph';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { ThreeDReadingApiArgs } from './dataSelectors';


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

export const selectThreeDQueryArgs = createSelector(
	selectThreeDMeterOrGroupID,
	selectQueryTimeInterval,
	selectGraphUnitID,
	selectThreeDReadingInterval,
	selectThreeDMeterOrGroup,
	(id, timeInterval, unitID, readingInterval, meterOrGroup) => {
		return {
			id: id,
			timeInterval: roundTimeIntervalForFetch(timeInterval).toString(),
			unitID: unitID,
			readingInterval: readingInterval,
			meterOrGroup: meterOrGroup
		} as ThreeDReadingApiArgs
	}
)

export const selectThreeDSkip = createSelector(
	selectThreeDMeterOrGroupID,
	selectQueryTimeInterval,
	(id, interval) => !id || !interval.getIsBounded()
)