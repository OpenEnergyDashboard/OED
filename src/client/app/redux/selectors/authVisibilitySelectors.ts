/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { filter } from 'lodash';
import { selectIsAdmin } from '../slices/currentUserSlice';
import { selectAllMeters } from '../../redux/api/metersApi';
import { DisplayableType, UnitType } from '../../types/redux/units';
import { selectAllGroups } from '../api/groupsApi';
import { selectUnitDataById } from '../api/unitsApi';


export const selectVisibleMetersAndGroups = createSelector(
	selectAllMeters,
	selectAllGroups,
	selectIsAdmin,
	(meterDataByID, groupDataById, isAdmin) => {
		// Holds all meters visible to the user
		const meters = new Set<number>();
		const groups = new Set<number>();
		meterDataByID.forEach(meter => {
			if (isAdmin || meter.displayable) {
				meters.add(meter.id);
			}
		});
		groupDataById.forEach(group => {
			if (isAdmin || group.displayable) {
				groups.add(group.id);
			}
		});
		return { meters, groups };
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
		const visibleUnitsOrSuffixes = filter(unitDataById, data =>
			(data.typeOfUnit == UnitType.unit || data.typeOfUnit == UnitType.suffix)
			&&
			(isAdmin
				? data.displayable != DisplayableType.none
				: data.displayable == DisplayableType.all)
		);
		return visibleUnitsOrSuffixes;
	}
);