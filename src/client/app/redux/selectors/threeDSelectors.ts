import { createSelector } from '@reduxjs/toolkit';
import { selectMeterInfo } from '../../redux/api/metersApi';
import { selectGroupInfo } from '../../redux/api/groupsApi';
import { RootState } from '../../store'
import { MeterOrGroup } from '../../types/redux/graph'
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { roundTimeIntervalForFetch } from '../../utils/dateRangeCompatibility';
import { ThreeDReadingApiParams } from '../api/readingsApi'
import { selectGraphUnitID, selectGraphTimeInterval } from '../selectors/uiSelectors'

// Common Fine Grained selectors
const selectThreeDMeterOrGroupID = (state: RootState) => state.graph.threeD.meterOrGroupID;
const selectThreeDMeterOrGroup = (state: RootState) => state.graph.threeD.meterOrGroup;
export const selectThreeDReadingInterval = (state: RootState) => state.graph.threeD.readingInterval;

// Memoized Selectors
export const selectThreeDComponentInfo = createSelector(
	[selectThreeDMeterOrGroupID, selectThreeDMeterOrGroup, selectMeterInfo, selectGroupInfo],
	(id, meterOrGroup, { data: meterData }, { data: groupData }) => {
		//Default Values
		let meterOrGroupName = 'Unselected Meter or Group'
		let isAreaCompatible = true;

		if (id) {
			// Get Meter or Group's info
			if (meterOrGroup === MeterOrGroup.meters && meterData) {
				const meterInfo = meterData[id]
				meterOrGroupName = meterInfo.identifier;
				isAreaCompatible = meterInfo.area !== 0 && meterInfo.areaUnit !== AreaUnitType.none;
			} else if (meterOrGroup === MeterOrGroup.meters && groupData) {
				const groupInfo = groupData[id];
				meterOrGroupName = groupInfo.name;
				isAreaCompatible = groupInfo.area !== 0 && groupInfo.areaUnit !== AreaUnitType.none;
			}

		}
		return {
			meterOrGroupID: id,
			// meterOrGroup: meterOrGroup,
			meterOrGroupName: meterOrGroupName,
			isAreaCompatible: isAreaCompatible
		}
	}

)

export const selectThreeDQueryArgs = createSelector(
	selectThreeDMeterOrGroupID,
	selectGraphTimeInterval,
	selectGraphUnitID,
	selectThreeDReadingInterval,
	selectThreeDMeterOrGroup,
	(id, timeInterval, unitID, readingInterval, meterOrGroup) => {
		return {
			meterID: id,
			timeInterval: roundTimeIntervalForFetch(timeInterval).toString(),
			unitID: unitID,
			readingInterval: readingInterval,
			meterOrGroup: meterOrGroup
		} as ThreeDReadingApiParams
	}
)

export const selectThreeDSkip = createSelector(
	selectThreeDMeterOrGroupID,
	selectGraphTimeInterval,
	(id, interval) => !id || !interval.getIsBounded()
)