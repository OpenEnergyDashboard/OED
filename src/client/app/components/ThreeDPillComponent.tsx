/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useSelector } from 'react-redux';
import { Badge } from 'reactstrap';
import { State } from '../types/redux/state';
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
	const handleBadgeClick = (arg1: any) => {
		alert(arg1);
	};
	const populateMeterPills = (meterList: number[]) => {
		return meterList.map(meterID => (
			<Badge pill color='primary' style={pill}
				onClick={() => handleBadgeClick(`${meters.byMeterID[meterID].identifier}`)}
			>
				{`${meters.byMeterID[meterID].identifier}`}
			</Badge>
		));
	}
	const populateGroupPills = (groupList: number[]) => {
		return groupList.map(groupID => (
			<Badge pill color='primary' style={pill}
				onClick={() => handleBadgeClick(`${groups.byGroupID[groupID].name}`)}
			>
				{`${groups.byGroupID[groupID].name}`}
			</Badge>
		));
	}
	console.log(selectedMeters);
	console.log(populateMeterPills(selectedMeters));
	console.log(selectedGroups);
	console.log(populateGroupPills(selectedGroups));
	return (
		<div style={pillContainer}>
			<div style={pillBox}>
				<p style={pillBoxLabel}>Meters</p>
				<div style={pills}>
					{populateMeterPills(selectedMeters)}
				</div>
			</div>
			<div style={pillBox}>
				<p style={pillBoxLabel}>Groups</p>
				<div style={pills} >
					{populateGroupPills(selectedGroups)}
				</div>
			</div>
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
	margin: '2px'
}