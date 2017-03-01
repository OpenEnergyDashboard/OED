/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Link } from 'react-router';
import axios from 'axios';

import ChildMeterBox from './ChildMeterBoxComponent';
import ChildGroupBox from './ChildGroupBoxComponent';


export default class GroupViewComponent extends React.Component {

	constructor(props) {
		super(props);
		this.name = props.name;
		// Right now this just links, ideally it will put the edit component up as an overlay
		this.buttonStyle = {
			marginTop: '10px',
			marginLeft: '10px'
		};

		this.boxStyle = {
			marginLeft: '10%',
			marginRight: '10%',
			// todo: testing hack
			border: '1px solid red'
		};

		this.state = {
			groups: [],
			meters: [],
		};
	}

	componentDidMount() {
		axios.get('/api/groups/children/1')
			.then(res => {
				this.setState({ groups: res.data.groups });
				this.setState({ meters: res.data.meters });
			});
	}

	render() {
		return (
			<div style={this.boxStyle}>
				<h2>Group Name: {this.name}</h2>
				<ChildMeterBox meters={this.state.meters} />
				<ChildGroupBox groups={this.state.groups} />
				<Link style={this.buttonStyle} to="/editGroup">
					<button className="btn btn-default">Edit Group</button>
				</Link>
			</div>
		);
	}
}
