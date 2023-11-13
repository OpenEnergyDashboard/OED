import { createSelector } from '@reduxjs/toolkit';
import * as _ from 'lodash';
import { selectGroupDataById } from '../api/groupsApi';
import { selectMeterDataById } from '../api/metersApi';
import { selectUnitDataById } from '../api/unitsApi';
import { DisplayableType, UnitType } from '../../types/redux/units';
import { selectIsAdmin } from '../../reducers/currentUser';


export const selectVisibleMetersAndGroups = createSelector(
	selectMeterDataById,
	selectGroupDataById,
	selectIsAdmin,
	(meterDataByID, groupDataById, isAdmin) => {
		// Holds all meters visible to the user
		const meters = new Set<number>();
		const groups = new Set<number>();
		Object.values(meterDataByID)
			.forEach(meter => {
				if (isAdmin || meter.displayable) {
					meters.add(meter.id);
				}
			});
		Object.values(groupDataById)
			.forEach(group => {
				if (isAdmin || group.displayable) {
					groups.add(group.id);
				}
			});
		return { meters, groups }
	}
);

/**
 * Filters all units that are of type meter or displayable type none from the redux state, as well as admin only units if the user is not an admin.
 * @param state - current redux state
 * @returns an array of UnitData
 */
export const selectVisibleUnitOrSuffixState = createSelector(
	selectUnitDataById,
	selectIsAdmin,
	(unitDataById, isAdmin) => {
		const visibleUnitsOrSuffixes = _.filter(unitDataById, data =>
			(data.typeOfUnit == UnitType.unit || data.typeOfUnit == UnitType.suffix)
			&&
			(isAdmin
				? data.displayable != DisplayableType.none
				: data.displayable == DisplayableType.all)
		);
		return visibleUnitsOrSuffixes;
	}
)