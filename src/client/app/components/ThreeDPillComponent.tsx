/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { changeMeterOrGroupInfo } from '../actions/graph';
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
	const handlePillClick = (meterOrGroupID: number, meterOrGroup: 'meters' | 'groups') => dispatch(changeMeterOrGroupInfo(meterOrGroupID, meterOrGroup));
	const populatePills = (meterOrGroupList: number[], meterOrGroup: 'meters' | 'groups') => {
		return meterOrGroupList.map(meterOrGroupID => {
			const meterOrGroupName = meterOrGroup === 'meters' ?
				meters.byMeterID[meterOrGroupID].identifier : groups.byGroupID[meterOrGroupID].name;
			const selectedMeterOrGroupID = threeDState.meterOrGroupInfo.meterOrGroupID;
			const meterOrGroupSelected = threeDState.meterOrGroupInfo.meterOrGroup === 'meters';
			const isMeterOrGroup = meterOrGroup === 'meters';
			const colorToRender = (meterOrGroupID === selectedMeterOrGroupID && meterOrGroupSelected === isMeterOrGroup) ? 'primary' : 'secondary';

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
						{populatePills(selectedMeters, 'meters')}
					</div>
				</div>
			}
			{selectedGroups.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>Groups</p>
					<div style={pills} >
						{populatePills(selectedGroups, 'groups')}
					</div>
				</div>
			}
		</div >
	)
}
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