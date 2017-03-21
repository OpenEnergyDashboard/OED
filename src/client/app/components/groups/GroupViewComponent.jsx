/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Link } from 'react-router';
import axios from 'axios';


export default class GroupViewComponent extends React.Component {

	constructor(props) {
		super(props);
		this.name = props.name;
		// Right now this just links, ideally it will put the edit component up as an overlay
		this.buttonStyle = {
			marginTop: '10px',
			marginLeft: '10px'
		};

		this.groupStyle = {
			marginLeft: '2%',
			marginRight: '2%',
			marginTop: '2%',
			marginBottom: '2%',
			// todo: testing hack
			border: '1px solid red',
			display: 'tableCell'
		};

		this.state = {
			groups: [],
			meters: [],
		};

		this.selBox = {
			marginLeft: '5%',
			marginRight: '5%',
			border: '1px solid blue',
			width: '40%',
			display: 'inline-block'
		};

		this.labelStyle = {
			textDecoration: 'underline'
		};

		this.handleMeterSelect = this.handleMeterSelect.bind(this);
	}

	handleMeterSelect(e) {
		e.preventDefault();
		const options = e.target.options;
		const selectedMeters = [];
		// We can't map here because this is a collection of DOM elements, not an array.
		for (let i = 0; i < options.length; i++) {
			if (options[i].selected) {
				selectedMeters.push(parseInt(options[i].value));
			}
		}
		this.props.selectMeters(selectedMeters);
	}

	/**
	 * TODO: This just loads meters in place of working groups until those work
	 */
	componentWillMount() {
		this.props.fetchMetersDataIfNeeded();
		this.props.fetchGroupsDataIfNeeded();
	}
	/* Switch this in for groups) {
		axios.get('/api/groups/children/1')
			.then(res => {
				this.setState({ groups: res.data.groups });
				this.setState({ meters: res.data.meters });
			});
	}
*/ // todo: Have edit button render something to edit the group
	// todo: Look into switching to a table cell display to handle many groups showing
	render() {
		return (
			<div style={this.groupStyle}>
				<h2>Group Name: {this.name}</h2>
				<div style={this.selBox}>
					<p style={this.labelStyle}>Child Meters:</p>
					<select multiple className="form-control" id="meterList" size="8" onClick={this.handleMeterSelect}>
						{this.props.meters.map(meter =>
							<option key={meter.id} value={meter.id}>{meter.name}</option>
						)}
					</select>
				</div>
				{/* Removing this for now until groups is fully set up
				 <div style={this.selBox}>
				 <p style={this.labelStyle}>Child Groups:</p>
				 <select multiple className="form-control" id="meterList" size="8" onClick={this.handleMeterSelect}>
				 {this.props.groups.map(group =>
				 <option key={group.id} value={group.id}>{group.name}</option>
				 )}
				 </select>
				 </div>
				 */
				}				<Link style={this.buttonStyle} to="/editGroup">
					<button className="btn btn-default">Edit Group</button>
				</Link>
			</div>
		);
	}
}
