/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { changeMeterOrGroupInfo } from '../actions/graph';
import { MeterOrGroup, MeterOrGroupPill } from '../types/redux/graph';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';

/**
 * A component used in the threeD graphics to select a single meter from the currently selected meters and groups.
 * @returns List of selected groups and meters as reactstrap Pills Badges
 */
export default function ThreeDPillComponent() {
	const dispatch: Dispatch = useDispatch();
	const metersState = useSelector((state: State) => state.meters);
	const groupsState = useSelector((state: State) => state.groups);
	const threeDState = useSelector((state: State) => state.graph.threeD);
	const graphState = useSelector((state: State) => state.graph);

	const meterPillData = graphState.selectedMeters.map(meterID => {
		const area = metersState.byMeterID[meterID].area;
		const areaUnit = metersState.byMeterID[meterID].areaUnit;
		const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
		const isDisabled = !isAreaCompatible && graphState.areaNormalization

		return { meterOrGroupID: meterID, isDisabled: isDisabled, meterOrGroup: MeterOrGroup.meters } as MeterOrGroupPill
	})

	const groupPillData = graphState.selectedGroups.map(groupID => {
		const area = groupsState.byGroupID[groupID].area;
		const areaUnit = groupsState.byGroupID[groupID].areaUnit;
		const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
		const isDisabled = !isAreaCompatible && graphState.areaNormalization
		return { meterOrGroupID: groupID, isDisabled: isDisabled, meterOrGroup: MeterOrGroup.groups } as MeterOrGroupPill
	})

	// When a Pill Badge is clicked update threeD state to indicate new meter or group to render.
	const handlePillClick = (pillData: MeterOrGroupPill) => dispatch(changeMeterOrGroupInfo(pillData.meterOrGroupID, pillData.meterOrGroup));

	// Method Generates Reactstrap Pill Badges for selected meters or groups
	const populatePills = (meterOrGroupPillData: MeterOrGroupPill[]) => {
		return meterOrGroupPillData.map(pillData => {
			// retrieve data from appropriate state slice .meters or .group
			const meterOrGroupName = pillData.meterOrGroup === MeterOrGroup.meters ?
				metersState.byMeterID[pillData.meterOrGroupID].identifier
				:
				groupsState.byGroupID[pillData.meterOrGroupID].name;

			// Get Selected ID from state
			const selectedMeterOrGroupID = threeDState.meterOrGroupID;

			// meterOrGroup value in state
			const selectedMeterOrGroup = threeDState.meterOrGroup;

			// Determines if the current pill is the one being generated, and sets its color accordingly
			// meters and groups can share id's so check for both: id match, and meter or group label match
			const isCurrentlySelected = (pillData.meterOrGroupID === selectedMeterOrGroupID) && (selectedMeterOrGroup === pillData.meterOrGroup);

			//  highlight currently Selected  as primary
			const colorToRender = isCurrentlySelected ? 'primary' : 'secondary';
			return (
				<Badge
					key={`${pillData.meterOrGroup}:${pillData.meterOrGroupID}`}
					pill
					// Change colors for selected metersOrGroups that are incompatible, except for the currently selected.
					color={pillData.isDisabled && !isCurrentlySelected ? 'dark' : colorToRender}
					style={pill}
					onClick={() => handlePillClick(pillData)}
				>{meterOrGroupName}</Badge>
			)
		});
	}

	return (
		<div style={pillContainer}>
			{meterPillData.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>{translate('meters')}</p>
					<div style={pills}>
						{populatePills(meterPillData)}
					</div>
				</div>
			}

			{groupPillData.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>{translate('groups')}</p>
					<div style={pills} >
						{populatePills(groupPillData)}
					</div>
				</div>
			}
		</div >
	)
}

// TODO Styling for the component, may need to be converted into .css files
// TODO ISSUE when many meters selected they are cut off.
const pillContainer: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between',
	margin: '0px',
	padding: '0px',
	minHeight: '100px',
	maxHeight: '200px'
}

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
}

const pills: React.CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'left',
	maxHeight: '100%',
	margin: '0px',
	padding: '0px'
}

const pill: React.CSSProperties = {
	margin: '2px',
	userSelect: 'none',
	cursor: 'pointer'
}
