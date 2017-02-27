/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Link } from 'react-router';

import ChildMeterBox from './ChildMeterBoxComponent';
import ChildGroupBox from './ChildGroupBoxComponent';
// import EditGroupComponent from './EditGroupComponent';


export default function GroupViewComponent(props) {
	// Right now this just links, ideally it will put the edit component up as an overlay
	const buttonStyle = {
		marginTop: '10px',
		marginLeft: '10px'
	};

	const boxStyle = {
		marginLeft: '10%',
		marginRight: '10%',
		// todo: testing hack
		border: '1px solid red'
	};

	// todo: remove this absurd testing hack
	// I'm reusing this to do the same thing with groups
	const meters = [
		{ name: 'one' },
		{ name: 'two' },
		{ name: 'three' }
	];


	return (
		<div style={boxStyle}>
			<h2>Group Name: {props.name}</h2>
			<ChildMeterBox meters={meters} />
			<ChildGroupBox groups={meters} />
			<Link style={buttonStyle} to="/editGroup">
				<button className="btn btn-default">Edit Group</button>
			</Link>
		</div>
	);
}
