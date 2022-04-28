/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { updateSelectedMeter } from '../actions/admin';
import MeterDropdownComponent from '../components/MeterDropDownComponent';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { unitsCompatibleWithMeters } from '../utils/determineCompatibleUnits';
import { SelectOption } from '../types/items';
import Meter from '/home/ubermensch/OED/src/server/models/Meter';

/**
 * @param {State} state
 */
function mapStateToProps(state: State) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name')
	};
}
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateSelectedMeter: (meterID: number) => dispatch(updateSelectedMeter(meterID))
	};
}

export function getvisibleMeters(state: State) {
	const visibleMeters = new Set<Meter>();

	if (state.currentUser.profile?.role == 'admin') {
		// Can see all meters that don't have null for unit
		visibleMeters.forEach(meter => { meter.id = Meter.getUnitNotNull })
	}
	else {
		// regular user or not logged in so only displayable ones
		visibleMeters.forEach(meter => { meter.id = Meter.getDisplayable })
	}
	// meters that can graph
	const compatibleMeters = new Set<number>();
	// meters that cannot graph.
	const incompatibleMeters = new Set<number>();
	// {M} means turn M into a set.
	const M = new Set<number>();

	if (state.graph.selectedUnit == -99) {
		// If there is no graphic unit then no meters/groups are displayed and you can display all meters.
		//  Also, if not admin, then meters not displayable are not viewable.
		// admin can see all except if unit is null (not included in ones gotten above). 
		visibleMeters.forEach(meter => {
			compatibleMeters.add(meter.displayable);
		})
	}
	// If displayable is false then only admin.
	else {
		state.graph.selectedMeters.forEach(meter => {//for each visibleMeters M 
			M.add(meter)
			const newUnits = unitsCompatibleWithMeters(M)
			if (newUnits.has(state.meters.byMeterID[meter].defaultGraphicUnit))//graphicUnit is in units
			{
				// The compatible units of the meter have graphic unit so can graph (case 1)
				compatibleMeters.add(meter);
			}
			else {
				// Case 2
				incompatibleMeters.add(meter);
			}
		})
	}
	//Ready to display meters in menu. Note you display the identifier and not the id.
	//For each compatibleUnit C add name C.identifier to meter menu in alphabetically sorted order in regular font for case 1
	//ForAdd each incompatibleUnit I add name I.identifier to meter menu in alphabetically sorted order as grayed out and not selectable for case 2
	const finalMeter: SelectOption[] = [];
	visibleMeters.forEach(meter => {
		if (compatibleMeters.has(meter.unitId)) {
			finalMeter.push({
				label: state.meters.byMeterID[meter.identifier].name,
				value: meter.name,
				isDisabled: false
			} as SelectOption)
		} else if (incompatibleMeters.has(meter.unitId)) {
			finalMeter.push({
				label: state.groups.byGroupID[meter.identifier].name,
				value: meter.name,
				isDisabled: true
			} as SelectOption)
		}
	})

	return _.sortBy(_.values(finalMeter), 'label');
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterDropdownComponent);
