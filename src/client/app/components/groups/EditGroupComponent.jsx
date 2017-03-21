/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import React from 'react';
import { Link } from 'react-router';

export default class EditGroupComponent extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const boxStyle = {
			marginLeft: '10%',
			marginRight: '10%',
			// todo: testing hack
			border: '1px solid red'
		};

		const titleStyle = {
			justifyContent: 'center',
			alignItems: 'center',
			textAlign: 'center'
		};
		// The back button right now just links back to the group page. Ideally we can create a back button component.
		const backButton = {
			float: 'right'
		};

		// todo: remove this absurd testing hack
		// I'm reusing this from the other class until it can pass props
		const meters = [
			{ name: 'one' },
			{ name: 'two' },
			{ name: 'three' }
		];

		return (
			<div>
				<div style={titleStyle}>
					<h1>Edit Group Pane</h1>
				</div>

				<div style={boxStyle}>
					<p>This will either be the page for editing a group or made into an overlay component.
						Not worth the time to switch this into a Redux component, so leaving as is.</p>
					<Link style={backButton} to="/group">
						<button className="btn btn-default">Back to Groups</button>
					</Link>
				</div>
			</div>

		);
	}
}
