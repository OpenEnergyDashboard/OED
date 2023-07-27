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
/**
 * A component used in the threeD graphics to select a single meter from the
 * currently selected meters and groups.
 * @returns List of selected groups and meters as reactstrap Badges.pills
 */
export default function ThreeDPillComponent() {
	const meters = useSelector((state: State) => state.meters);
	const groups = useSelector((state: State) => state.groups);
	const selectedMeters = useSelector((state: State) => state.graph.selectedMeters);
	const selectedGroups = useSelector((state: State) => state.graph.selectedGroups);
	const threeDState = useSelector((state: State) => state.graph.threeD);
	const dispatch: Dispatch = useDispatch();

	// When a Pill Badge is clicked update threeD state to indicate new meter or group to render.
	const handlePillClick = (meterOrGroupID: number, meterOrGroup: MeterOrGroup) => dispatch(changeMeterOrGroupInfo(meterOrGroupID, meterOrGroup));

	// Method Generates Reactstrap Pill Badges for selected meters or groups
	const populatePills = (meterOrGroupList: number[], meterOrGroup: MeterOrGroup) => {
		return meterOrGroupList.map(meterOrGroupID => {
			// Depending on passed meterOrGroup parameter, retrieve and validate data from appropriate state slice .meters .group
			const meterOrGroupName = meterOrGroup === 'meters' ? meters.byMeterID[meterOrGroupID].identifier : groups.byGroupID[meterOrGroupID].name;
			const selectedMeterOrGroupID = threeDState.meterOrGroupID;
			const meterOrGroupSelected = threeDState.meterOrGroup === MeterOrGroup.meters;
			const isMeterOrGroup = meterOrGroup === MeterOrGroup.meters;
			// Determines if the current pill is the one being generated, and sets its color accordingly
			const colorToRender = (meterOrGroupID === selectedMeterOrGroupID) && (meterOrGroupSelected === isMeterOrGroup) ? 'primary' : 'secondary';

			return (
				<Badge onClick={() => handlePillClick(meterOrGroupID, meterOrGroup)}
					pill color={colorToRender} style={pill} key={`${meterOrGroup}:${meterOrGroupID}`}
				>
					{meterOrGroupName}
				</Badge>
			)
		});
	}

	return (
		<div style={pillContainer}>
			{selectedMeters.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>Meters</p>
					<div style={pills}>
						{populatePills(selectedMeters, MeterOrGroup.meters)}
					</div>
				</div>
			}

			{selectedGroups.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>Groups</p>
					<div style={pills} >
						{populatePills(selectedGroups, MeterOrGroup.groups)}
					</div>
				</div>
			}
		</div >
	)
}

// Styling for the component, may need to be converted into .css files in the future.
const pillContainer: React.CSSProperties = {
	display: 'flex', justifyContent: 'space-between', margin: '0px', padding: '0px', minHeight: '100px', maxHeight: '200px'
};
const pillBoxLabel: React.CSSProperties = {
	alignItems: 'start', textAlign: 'left', margin: '0px', padding: '0px'
}
const pillBox: React.CSSProperties = {
	display: 'flex', flexDirection: 'column', justifyContent: 'left',
	width: '45%', maxHeight: '100%', maxWidth: '45%', overflow: 'scroll', margin: '0px', padding: '0px'
};
const pills: React.CSSProperties = {
	display: 'flex', flexWrap: 'wrap', justifyContent: 'left', maxHeight: '100%', overflow: 'scroll', margin: '0px', padding: '0px'
};
const pill: React.CSSProperties = {
	margin: '2px', userSelect: 'none', cursor: 'pointer'
}