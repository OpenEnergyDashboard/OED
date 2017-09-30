/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { DATA_TYPE_GROUP, groupsFilterReduce } from '../../utils/Datasources';

export default class GroupBoxComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
	}

	handleGroupSelect(selection) {
		const selectedGroups = selection.reduce(groupsFilterReduce, []);
		this.props.selectGroups(selectedGroups);
	}

	render() {
		const labelStyle = {
			textDecoration: 'underline'
		};
		const selectOptions = this.props.groups.map(group => (
			{
				label: group.name,
				type: DATA_TYPE_GROUP,
				value: group.id,
			}
		));

		return (
			<div>
				<div className="form-group">
					<p style={labelStyle}>Select groups:</p>
					<MultiSelectComponent options={selectOptions} placeholder="Select groups" onValuesChange={this.handleGroupSelect} />
				</div>
			</div>
		);
	}
}
