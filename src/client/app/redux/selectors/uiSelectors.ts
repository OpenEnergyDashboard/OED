/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RootState } from '../../store';
import { UnitRepresentType } from '../../types/redux/units'
import { metersInGroup, unitsCompatibleWithMeters } from '../../utils/determineCompatibleUnits';
import { getSelectOptionsByItem } from '../../components/ChartDataSelectComponent'


import { createSelector } from '@reduxjs/toolkit';

export const selectSelectedMeters = (state: RootState) => state.graph.selectedMeters;
export const selectSelectedGroups = (state: RootState) => state.graph.selectedGroups;
export const selectCurrentUser = (state: RootState) => state.currentUser;
export const selectGraphTimeInterval = (state: RootState) => state.graph.timeInterval;
export const selectGraphUnitID = (state: RootState) => state.graph.selectedUnit;
export const selectGraphAreaNormalization = (state: RootState) => state.graph.areaNormalization;
export const selectMeterState = (state: RootState) => state.meters;
export const selectGroupState = (state: RootState) => state.groups;
export const selectUnitState = (state: RootState) => state.units;

export const selectVisibleMetersAndGroups = createSelector(
	[selectMeterState, selectGroupState, selectCurrentUser],
	(meterState, groupState, currentUser) => {
		// Holds all meters visible to the user
		const visibleMeters = new Set<number>();
		const visibleGroups = new Set<number>();

		// Get all the meters that this user can see.
		if (currentUser.profile?.role === 'admin') {
			// Can see all meters
			Object.values(meterState.byMeterID).forEach(meter => {
				visibleMeters.add(meter.id);
			});
			Object.values(groupState.byGroupID).forEach(group => {
				visibleGroups.add(group.id);
			});
		}
		else {
			// Regular user or not logged in so only add displayable meters
			Object.values(meterState.byMeterID).forEach(meter => {
				if (meter.displayable) {
					visibleMeters.add(meter.id);
				}
			});
			Object.values(groupState.byGroupID).forEach(group => {
				if (group.displayable) {
					visibleGroups.add(group.id);
				}
			});
		}
		return { meters: visibleMeters, groups: visibleGroups }
	}
);

export const selectMetersAndGroupsCompatibility = createSelector(
	[selectVisibleMetersAndGroups, selectMeterState, selectGroupState, selectUnitState, selectGraphUnitID, selectGraphAreaNormalization],
	(visible, meterState, groupState, unitState, graphUnitID, graphAreaNorm) => {
		// meters and groups that can graph
		const compatibleMeters = new Set<number>();
		const compatibleGroups = new Set<number>();

		// meters and groups that cannot graph.
		const incompatibleMeters = new Set<number>();
		const incompatibleGroups = new Set<number>();

		if (graphUnitID === -99) {
			// No unit is selected then no meter/group should be selected.
			// In this case, every meter is valid (provided it has a default graphic unit)
			// If the meter/group has a default graphic unit set then it can graph, otherwise it cannot.
			visible.meters.forEach(meterId => {
				const meterGraphingUnit = meterState.byMeterID[meterId].defaultGraphicUnit;
				if (meterGraphingUnit === -99) {
					//Default graphic unit is not set
					incompatibleMeters.add(meterId);
				}
				else {
					//Default graphic unit is set
					if (graphAreaNorm && unitState.units[meterGraphingUnit] && unitState.units[meterGraphingUnit].unitRepresent === UnitRepresentType.raw) {
						// area normalization is enabled and meter type is raw
						incompatibleMeters.add(meterId);
					} else {
						compatibleMeters.add(meterId);
					}
				}
			});
			visible.groups.forEach(groupId => {
				const groupGraphingUnit = groupState.byGroupID[groupId].defaultGraphicUnit;
				if (groupGraphingUnit === -99) {
					//Default graphic unit is not set
					incompatibleGroups.add(groupId);
				}
				else {
					//Default graphic unit is set
					if (graphAreaNorm && unitState.units[groupGraphingUnit] &&
						unitState.units[groupGraphingUnit].unitRepresent === UnitRepresentType.raw) {
						// area normalization is enabled and meter type is raw
						incompatibleGroups.add(groupId);
					} else {
						compatibleGroups.add(groupId);
					}
				}
			});
		} else {
			// A unit is selected
			// For each meter get all of its compatible units
			// Then, check if the selected unit exists in that set of compatible units
			visible.meters.forEach(meterId => {
				// Get the set of units compatible with the current meter
				const compatibleUnits = unitsCompatibleWithMeters(new Set<number>([meterId]));
				if (compatibleUnits.has(graphUnitID)) {
					// The selected unit is part of the set of compatible units with this meter
					compatibleMeters.add(meterId);
				}
				else {
					// The selected unit is not part of the compatible units set for this meter
					incompatibleMeters.add(meterId);
				}
			});
			visible.groups.forEach(groupId => {
				// Get the set of units compatible with the current group (through its deepMeters attribute)
				// TODO If a meter in a group is not visible to this user then it is not in Redux state and this fails.
				const compatibleUnits = unitsCompatibleWithMeters(metersInGroup(groupId));
				if (compatibleUnits.has(graphUnitID)) {
					// The selected unit is part of the set of compatible units with this group
					compatibleGroups.add(groupId);
				}
				else {
					// The selected unit is not part of the compatible units set for this group
					incompatibleGroups.add(groupId);
				}
			});
		}
		const finalMeters = getSelectOptionsByItem(compatibleMeters, incompatibleMeters, meterState);
		const finalGroups = getSelectOptionsByItem(compatibleGroups, incompatibleGroups, groupState);
		return { finalMeters, finalGroups }
	}
)

