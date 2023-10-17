import { createSelector } from '@reduxjs/toolkit';
import {
	selectGraphUnitID,
	selectQueryTimeInterval,
	selectThreeDMeterOrGroup, selectThreeDMeterOrGroupID,
	selectThreeDReadingInterval
} from '../../reducers/graph';
import { selectGroupState } from '../../reducers/groups';
import { selectMeterState } from '../../reducers/meters';
import { MeterOrGroup } from '../../types/redux/graph';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { ThreeDReadingApiArgs } from './dataSelectors';


// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	[selectThreeDMeterOrGroupID, selectThreeDMeterOrGroup, selectMeterState, selectGroupState],
	(id, meterOrGroup, meterData, groupData) => {
		//Default Values
		let meterOrGroupName = 'Unselected Meter or Group'
		let isAreaCompatible = true;

		if (id) {
			// Get Meter or Group's info
			if (meterOrGroup === MeterOrGroup.meters && meterData) {
				const meterInfo = meterData.byMeterID[id]
				meterOrGroupName = meterInfo.identifier;
				isAreaCompatible = meterInfo.area !== 0 && meterInfo.areaUnit !== AreaUnitType.none;
			} else if (meterOrGroup === MeterOrGroup.groups && groupData) {
				const groupInfo = groupData.byGroupID[id];
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