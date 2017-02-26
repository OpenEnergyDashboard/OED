/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//Box classes for displaying child meters and groups
import React from 'react';

export default function ChildMetersBox(props) {


	const boxStyle = {
		display: "inline-block",
		width: "200px",
		alignSelf: "left",
		marginLeft: "10%",
		marginRight: "10%",
		//todo: testing hack
		border: "1px solid black"
	};
	const listStyle = {
		textAlign: "left"
	};

	const meters = props.meters.map((meter) =>
		<li>{meter.name}</li>
	);



	return (
		<div style={boxStyle}>
			<h3>Child Meters:</h3>
			<ul style={listStyle}>{meters}</ul>
		</div>
	);

}
