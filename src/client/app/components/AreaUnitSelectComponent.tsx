/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { changeSelectedAreaUnit, updateSelectedAreaUnit, updateSelectedGroups, updateSelectedMeters, updateSelectedUnit } from '../actions/graph';
import { areaUnitsCompatibleWithMeters, metersInGroup } from '../utils/determineCompatibleUnits';
import { SelectOption } from '../types/items';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { DisplayableType, UnitData, UnitType } from '../types/redux/units';
import { getSelectOptionsByItem } from './ChartDataSelectComponent';
import MultiSelectComponent from './MultiSelectComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * A component which allows the user to select the unit to be used for area normalization.
 */
export default function AreaUnitSelectComponent() {
	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};
	const labelStyle: React.CSSProperties = {
		fontWeight: 'bold',
		margin: 0
	};
	const messages = defineMessages({
		selectAreaUnit: { id: 'select.unit' },
		helpSelectGroups: { id: 'help.home.select.groups' },
		helpSelectMeters: { id: 'help.home.select.meters' }
	});

	const intl = useIntl();

	const dataProps = useSelector((state: State) => {
		const sortedAreaUnits = getAreaUnitCompatibilityForDropdown(state);

		// You can only select one unit so variable name is singular.
		// This does not need to be an array but we make it one for now so works similarly to meters & groups.
		// TODO Might want to make it work as a single item.
		const selectedAreaUnit: SelectOption[] = [];
		[state.graph.selectedAreaUnit].forEach(areaUnitID => {
			if (areaUnitID !== -99) {
				// Only use if valid/selected unit which means it is not -99.
				selectedAreaUnit.push({
					// Units use the identifier to display.
					label: state.graph.selectedAreaUnit ? state.units.units[state.graph.selectedAreaUnit].identifier : '',
					value: areaUnitID,
					isDisabled: false
				} as SelectOption);
			}
		});

		// push a dummy item as a divider.
		const firstDisabledAreaUnit: number = sortedAreaUnits.findIndex(item => item.isDisabled);
		if (firstDisabledAreaUnit != -1) {
			sortedAreaUnits.splice(firstDisabledAreaUnit, 0, {
				value: 0,
				label: '----- Incompatible Units -----',
				isDisabled: true
			} as SelectOption
			);
		}

		return {
			sortedAreaUnits,
			selectedAreaUnit
		}
	});

	// Must specify type if using ThunkDispatch
	const dispatch: Dispatch = useDispatch();

	return (
		<div>
			<p style={labelStyle}>
				<FormattedMessage id='units.area' />:
			</p>
			<div style={divBottomPadding}>
				<MultiSelectComponent
					options={dataProps.sortedAreaUnits}
					selectedOptions={dataProps.selectedAreaUnit}
					placeholder={intl.formatMessage(messages.selectAreaUnit)}
					// copied from chartDataSelect units code
					onValuesChange={(newSelectedAreaUnitOptions: SelectOption[]) => {
						// TODO I don't quite understand why the component results in an array of size 2 when updating state
						// For now I have hardcoded a fix that allows units to be selected over other units without clicking the x button
						if (newSelectedAreaUnitOptions.length === 0) {
							// Update the selected meters and groups to empty to avoid graphing errors
							// The update selected meters/groups functions are essentially the same as the change functions
							// However, they do not attempt to graph.
							dispatch(updateSelectedGroups([]));
							dispatch(updateSelectedMeters([]));
							dispatch(updateSelectedUnit(-99));
							dispatch(updateSelectedAreaUnit(-99));
						}
						else if (newSelectedAreaUnitOptions.length === 1) { dispatch(changeSelectedAreaUnit(newSelectedAreaUnitOptions[0].value)); }
						else if (newSelectedAreaUnitOptions.length > 1) { dispatch(changeSelectedAreaUnit(newSelectedAreaUnitOptions[1].value)); }
						// This should not happen
						else { dispatch(changeSelectedAreaUnit(-99)); }
					}}
				/>
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.units' />
			</div>
		</div>
	)
}

/**
 * Filters all units that are of type meter or displayable type none from the redux state, as well as admin only units if the user is not an admin.
 * @param {State} state - current redux state
 * @returns {UnitData[]} an array of UnitData
 */
function getVisibleAreaUnit(state: State) {
	let visibleAreaUnits;
	if (state.currentUser.profile?.role === 'admin') {
		// User is an admin, allow all units to be seen
		visibleAreaUnits = _.filter(state.units.units, (o: UnitData) => {
			return o.typeOfUnit == UnitType.area && o.displayable != DisplayableType.none;
		});
	}
	else {
		// User is not an admin, do not allow for admin units to be seen
		visibleAreaUnits = _.filter(state.units.units, (o: UnitData) => {
			return o.typeOfUnit == UnitType.area && o.displayable == DisplayableType.all;
		});
	}
	return visibleAreaUnits;
}

/**
 * Determines the compatibility of units in the redux state for display in dropdown
 * @param {State} state - current redux state
 * @returns {SelectOption[]} an array of SelectOption
 */
function getAreaUnitCompatibilityForDropdown(state: State) {

	// Holds all units that are compatible with selected meters/groups
	const compatibleAreaUnits = new Set<number>();
	// Holds all units that are not compatible with selected meters/groups
	const incompatibleAreaUnits = new Set<number>();

	// Holds all selected meters, including those retrieved from groups
	const allSelectedMeters = new Set<number>();

	// Get for all meters
	state.graph.selectedMeters.forEach(meter => {
		allSelectedMeters.add(meter);
	});
	// Get for all groups
	state.graph.selectedGroups.forEach(group => {
		// Get for all deep meters in group
		metersInGroup(group).forEach(meter => {
			allSelectedMeters.add(meter);
		});
	});

	if (allSelectedMeters.size == 0) {
		// No meters/groups are selected. This includes the case where the selectedUnit is -99.
		// Every unit is okay/compatible in this case so skip the work needed below.
		// Filter the units to be displayed by user status and displayable type
		getVisibleAreaUnit(state).forEach(unit => {
			compatibleAreaUnits.add(unit.id);
		});
	} else {
		// Some meter or group is selected
		// Retrieve set of units compatible with list of selected meters and/or groups
		const areaUnits = areaUnitsCompatibleWithMeters(allSelectedMeters);

		// Loop over all units (they must be of type area - case 1)
		getVisibleAreaUnit(state).forEach(o => {
			// Control displayable ones (case 2)
			if (areaUnits.has(o.id)) {
				// Should show as compatible (case 3)
				compatibleAreaUnits.add(o.id);
			} else {
				// Should show as incompatible (case 4)
				incompatibleAreaUnits.add(o.id);
			}
		});
	}
	// Ready to display unit. Put selectable ones before non-selectable ones.
	const finalUnits = getSelectOptionsByItem(compatibleAreaUnits, incompatibleAreaUnits, state.units);
	return finalUnits;
}
