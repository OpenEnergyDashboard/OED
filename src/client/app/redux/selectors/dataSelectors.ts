import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { RootState } from '../../store';
import { GroupDefinition } from '../../types/redux/groups';
import { MeterData } from '../../types/redux/meters';
import { selectIsLoggedInAsAdmin } from './authSelectors';


export const selectMeterDataByID = (state: RootState) => state.meters.byMeterID;
export const selectGroupDataByID = (state: RootState) => state.groups.byGroupID;
export const selectUnitDataById = (state: RootState) => state.units.units;

export const selectMeterState = (state: RootState) => state.meters;
export const selectGroupState = (state: RootState) => state.groups;
export const selectUnitState = (state: RootState) => state.units;
export const selectMapState = (state: RootState) => state.maps;

export const selectVisibleMetersGroupsDataByID = createSelector(
	selectMeterDataByID,
	selectGroupDataByID,
	selectIsLoggedInAsAdmin,
	(meterDataByID, groupDataByID, isAdmin) => {
		let visibleMeters;
		let visibleGroups;
		if (isAdmin) {
			visibleMeters = meterDataByID
			visibleGroups = groupDataByID;
		} else {
			visibleMeters = _.filter(meterDataByID, (meter: MeterData) => {
				return meter.displayable === true
			});
			visibleGroups = _.filter(groupDataByID, (group: GroupDefinition) => {
				return group.displayable === true
			});
		}

		return { visibleMeters, visibleGroups }
	}
)