/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Box classes for displaying child meters and groups
import React from 'react';

export default class ChildGroupBox extends React.Component {

	constructor(props) {
		super(props);
	}


	render() {
		const boxStyle = {
			display: 'inline-block',
			width: '200px',
			alignSelf: 'right',
			marginLeft: '40%',
			marginRight: '10%',
			// todo: testing hack
			border: '1px solid purple'
		};
		const listStyle = {
			textAlign: 'left'
		};

		const groups = this.props.groups.map(group =>
			(<li>{group.name}</li>)
		);


		return (
			<div style={boxStyle}>
				<h3>Child Groups:</h3>
				<ul style={listStyle}>{groups}</ul>
			</div>
		);
	}
}
