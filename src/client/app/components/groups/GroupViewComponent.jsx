/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Link } from 'react-router';
import ChildMeterBoxContainer from '../../containers/groups/ChildMeterBoxContainer';
import ChildGroupBoxContainer from '../../containers/groups/ChildGroupBoxContainer';


export default class GroupViewComponent extends React.Component {

	constructor(props) {
		super(props);
	}


	componentWillMount() {
		this.props.fetchGroupChildren(this.props.id);
	}

	// todo: Have edit button render something to edit the group
	// todo: Look into switching to a table cell display to handle many groups showing
	render() {
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


		return (
			<div style={this.groupStyle}>
				<h2> Group name: {this.props.name} </h2>
				<ChildMeterBoxContainer parentID={this.props.id} />
				<ChildGroupBoxContainer parentID={this.props.id} />
				<Link style={this.buttonStyle} to="/editGroup">
					<button className="btn btn-default">Edit Group</button>
				</Link>
			</div>
		);
	}
}
