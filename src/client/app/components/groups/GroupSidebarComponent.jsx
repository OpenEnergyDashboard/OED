/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Button } from 'reactstrap';

export default class GroupSidebarComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
		this.handleCreateGroup = this.handleCreateGroup.bind(this);
	}

	componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
	}

	handleGroupSelect(e) {
		e.preventDefault();
		const options = e.target.options;
		const selectedGroups = [];
		// We can't map here because this is a collection of DOM elements, not an array.
		for (let i = 0; i < options.length; i++) {
			if (options[i].selected) {
				selectedGroups.push(parseInt(options[i].value));
			}
		}
		this.props.selectGroups(selectedGroups);
	}

	handleCreateGroup() {
		this.props.changeDisplayModeToCreate();
	}

	render() {
		const labelStyle = {
			fontWeight: 'bold',
			margin: '0px'
		};
		return (
			<div className="form-group">
				<p style={labelStyle}>View groups:</p>
				<select multiple className="form-control" id="groupList" size="8" onChange={this.handleGroupSelect}>
					{this.props.groups.map(group =>
						<option key={group.id} value={group.id}>{group.name}</option>
					)}
				</select>
				<br />
				<Button outline onClick={this.handleCreateGroup}>Create new group</Button>
			</div>
		);
	}
}
