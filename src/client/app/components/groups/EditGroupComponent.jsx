/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//This component is the main page of the edit group page.
import React from 'react';
import ListBox from './ListBoxComponent';
import {Link} from 'react-router';

export default class EditGroupComponent extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {

		const titleStyle = {
			justifyContent: "center",
			alignItems: "center",
			textAlign: "center"
		};
		//The back button right now just links back to the group page. Ideally we can create a back button component.
		const backButton = {
			float: "right"
		};

		return (
			<div>
				<div style={titleStyle}>
					<h1>Edit Group Pane</h1>
				</div>

				<div>
					<Link style={backButton} to="/group">
						<button className="btn btn-default">Back to Groups</button>
					</Link>
				</div>
			</div>

		);
	}
}
