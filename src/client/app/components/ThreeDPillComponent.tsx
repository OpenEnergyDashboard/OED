/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { changeMeterOrGroupInfo } from '../actions/graph';
import { MeterOrGroup } from '../types/redux/graph';
import { getMeterCompatibilityForDropdown, getGroupCompatibilityForDropdown } from './ChartDataSelectComponent';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { SelectOption } from 'types/items';

/**
 * A component used in the threeD graphics to select a single meter from the
 * currently selected meters and groups.
 * @returns List of selected groups and meters as reactstrap Badges.pills
 */
export default function ThreeDPillComponent() {
	const meters = useSelector((state: State) => state.meters);
	const groups = useSelector((state: State) => state.groups);
	const threeDState = useSelector((state: State) => state.graph.threeD);

	// TODO code nearly duplicates ChartDataSelectComponents useSelect. Better approach needed.
	const [compatibleMeters, compatibleGroups] = useSelector((state: State) => {
		const compatibleMeters = getMeterCompatibilityForDropdown(state)
			// Filter SelectedMeters from compatible
			.filter(meter => state.graph.selectedMeters.includes(meter.value))
			.map(selectOption => {
				const area = state.meters.byMeterID[selectOption.value].area;
				const areaUnit = state.meters.byMeterID[selectOption.value].areaUnit;
				const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
				if (state.graph.areaNormalization && !isAreaCompatible) {
					selectOption.isDisabled = true;
				} else {
					selectOption.isDisabled = false;
				}
				return selectOption;
			});
		const compatibleGroups = getGroupCompatibilityForDropdown(state)
			.filter(group => state.graph.selectedGroups.includes(group.value))
			.map(selectOption => {
				const area = state.groups.byGroupID[selectOption.value].area;
				const areaUnit = state.groups.byGroupID[selectOption.value].areaUnit;
				const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
				if (state.graph.areaNormalization && !isAreaCompatible) {
					selectOption.isDisabled = true;
				} else {
					selectOption.isDisabled = false;
				}
				return selectOption;
			});

		// Returns values as selectOptions to mimic MultiSelect Values.
		return [compatibleMeters, compatibleGroups];
	});

	const dispatch: Dispatch = useDispatch();

	// When a Pill Badge is clicked update threeD state to indicate new meter or group to render.
	const handlePillClick = (meterOrGroupID: number, meterOrGroup: MeterOrGroup) => dispatch(changeMeterOrGroupInfo(meterOrGroupID, meterOrGroup));

	// Method Generates Reactstrap Pill Badges for selected meters or groups
	const populatePills = (meterOrGroupList: SelectOption[], meterOrGroup: MeterOrGroup) => {
		return meterOrGroupList.map(meterOrGroupID => {
			// Depending on passed meterOrGroup parameter, retrieve and validate data from appropriate state slice .meters .group
			const meterOrGroupName = meterOrGroup === 'meters' ? meters.byMeterID[meterOrGroupID.value].identifier : groups.byGroupID[meterOrGroupID.value].name;
			const selectedMeterOrGroupID = threeDState.meterOrGroupID;
			const meterOrGroupSelected = threeDState.meterOrGroup === MeterOrGroup.meters;
			const isMeterOrGroup = meterOrGroup === MeterOrGroup.meters;
			// Determines if the current pill is the one being generated, and sets its color accordingly
			const isCurrentlySelected = (meterOrGroupID.value === selectedMeterOrGroupID) && (meterOrGroupSelected === isMeterOrGroup);
			const colorToRender = isCurrentlySelected ? 'primary' : 'secondary';
			return (
				<Badge
					key={`${meterOrGroup}:${meterOrGroupID.value}`}
					pill
					// Change colors for selected metersOrGroups that are incompatible, except for the currently selected.
					color={meterOrGroupID.isDisabled && !isCurrentlySelected ? 'dark' : colorToRender}
					style={pill}
					onClick={() => handlePillClick(meterOrGroupID.value, meterOrGroup)}
				>{meterOrGroupName}</Badge>
			)
		});
	}

	return (
		<div style={pillContainer}>
			{compatibleMeters.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>Meters</p>
					<div style={pills}>
						{populatePills(compatibleMeters, MeterOrGroup.meters)}
					</div>
				</div>
			}

			{compatibleGroups.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>Groups</p>
					<div style={pills} >
						{populatePills(compatibleGroups, MeterOrGroup.groups)}
					</div>
				</div>
			}
		</div >
	)
}

// Styling for the component, may need to be converted into .css files in the future.
const pillContainer: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	margin: '0px',
	padding: '0px',
	minHeight: '100px',
	maxHeight: '200px'

};
const pillBoxLabel: React.CSSProperties = {
	alignItems: 'start',
	textAlign: 'left',
	margin: '0px',
	padding: '0px'
}
const pillBox: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'left',
	width: '45%',
	maxHeight: '100%',
	maxWidth: '45%',
	margin: '0px',
	padding: '0px'
};
const pills: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'left',
	maxHeight: '100%',
	margin: '0px',
	padding: '0px'
};
const pill: React.CSSProperties = {
	margin: '2px',
	userSelect: 'none',
	cursor: 'pointer'
}