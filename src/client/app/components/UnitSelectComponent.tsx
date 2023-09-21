/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select, { ActionMeta } from 'react-select';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectUnitSelectData } from '../redux/selectors/uiSelectors';
import { SelectOption } from '../types/items';
// import TooltipMarkerComponent from './TooltipMarkerComponent';
// import { FormattedMessage } from 'react-intl';
import { graphSlice } from '../reducers/graph';

/**
 * @returns A React-Select component for UI Options Panel
 */
export default function UnitSelectComponent() {
	const dispatch = useAppDispatch();
	const unitSelectOptions = useAppSelector(state => selectUnitSelectData(state));
	const selectedUnitID = useAppSelector(state => state.graph.selectedUnit);
	const unitsByID = useAppSelector(state => state.units.units);
	let selectedUnitOption: SelectOption | null = null;

	// Only use if valid/selected unit which means it is not -99.
	if (selectedUnitID !== -99) {
		selectedUnitOption = {
			// Units use the identifier to display.
			label: selectedUnitID ? unitsByID[selectedUnitID].identifier : '',
			value: selectedUnitID,
			isDisabled: false
		} as SelectOption;
	}
	const onChange = (newValue: SelectOption, actionMeta: ActionMeta<SelectOption>) => {
		console.log('newValue', newValue, 'actionMeta', actionMeta);
		if (newValue) {
			// New value selected Update
			dispatch(graphSlice.actions.updateSelectedUnit(newValue.value))
		} else {
			// Select cleared, therefore, clear meters and groups.
			dispatch(graphSlice.actions.updateSelectedGroups([]));
			dispatch(graphSlice.actions.updateSelectedMeters([]));
			dispatch(graphSlice.actions.updateSelectedUnit(-99));
		}
	}

	return (
		<>
			{/* <p style={labelStyle}>
				<FormattedMessage id='units' />:
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.units' />
			</p> */}
			<Select
				value={selectedUnitOption}
				options={unitSelectOptions}
				onChange={onChange}
				isClearable={true}
			/>
		</>
	)
}

{/* <MultiSelectComponent
options={dataProps.sortedUnits}
selectedOptions={dataProps.selectedUnit}
placeholder={intl.formatMessage(messages.selectUnit)}
onValuesChange={(newSelectedUnitOptions: SelectOption[]) => {
	// TODO I don't quite understand why the component results in an array of size 2 when updating state
	// For now I have hardcoded a fix that allows units to be selected over other units without clicking the x button
	if (newSelectedUnitOptions.length === 0) {
		// Update the selected meters and groups to empty to avoid graphing errors
		// The update selected meters/groups functions are essentially the same as the change functions
		// However, they do not attempt to graph.
		dispatch(graphSlice.actions.updateSelectedGroups([]));
		dispatch(graphSlice.actions.updateSelectedMeters([]));
		dispatch(graphSlice.actions.updateSelectedUnit(-99));
		// Sync threeD state.
		dispatch(changeMeterOrGroupInfo(null));
	}
	else if (newSelectedUnitOptions.length === 1) { dispatch(changeSelectedUnit(newSelectedUnitOptions[0].value)); }
	else if (newSelectedUnitOptions.length > 1) { dispatch(changeSelectedUnit(newSelectedUnitOptions[1].value)); }
	// This should not happen
	else { dispatch(changeSelectedUnit(-99)); }
}}
/> */}

// const labelStyle: React.CSSProperties = {
// 	fontWeight: 'bold',
// 	margin: 0
// };