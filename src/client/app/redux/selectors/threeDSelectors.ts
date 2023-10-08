import { createSelector } from '@reduxjs/toolkit';
import { graphSlice } from '../../reducers/graph';
import { groupsSlice } from '../../reducers/groups';
import { metersSlice } from '../../reducers/meters';
import { MeterOrGroup } from '../../types/redux/graph';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { ThreeDReadingApiParams } from '../api/readingsApi';

// Common Fine Grained selectors
const { threeDMeterOrGroup, threeDMeterOrGroupID, threeDReadingInterval } = graphSlice.selectors;
const { graphTimeInterval, graphUnitID } = graphSlice.selectors;
const { meterState } = metersSlice.selectors;
const { groupState } = groupsSlice.selectors;

// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	[threeDMeterOrGroupID, threeDMeterOrGroup, meterState, groupState],
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
	threeDMeterOrGroupID,
	graphTimeInterval,
	graphUnitID,
	threeDReadingInterval,
	threeDMeterOrGroup,
	(id, timeInterval, unitID, readingInterval, meterOrGroup) => {
		return {
			meterOrGroupID: id,
			timeInterval: roundTimeIntervalForFetch(timeInterval).toString(),
			unitID: unitID,
			readingInterval: readingInterval,
			meterOrGroup: meterOrGroup
		} as ThreeDReadingApiParams
	}
)

export const selectThreeDSkip = createSelector(
	threeDMeterOrGroupID,
	graphTimeInterval,
	(id, interval) => !id || !interval.getIsBounded()
)