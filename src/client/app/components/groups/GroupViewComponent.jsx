/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Button } from 'react-bootstrap';
import ChildMeterBoxContainer from '../../containers/groups/ChildMeterBoxContainer';
import ChildGroupBoxContainer from '../../containers/groups/ChildGroupBoxContainer';

export default class GroupViewComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = { showModal: false };
		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
	}

	componentWillMount() {
		this.props.fetchGroupChildren(this.props.id);
	}

	close() {
		this.setState({ showModal: false });
	}

	open() {
		this.setState({ showModal: true });
	}

	// TODO: Have edit button render something to edit the group
	render() {
		const nameStyle = {
			textAlign: 'center'
		};
		return (
			<div>
				<h2 style={nameStyle}>{this.props.name}</h2>
				<div className="row">
					<div className="col-xs-6">
						<ChildMeterBoxContainer parentID={this.props.id} />
					</div>
					<div className="col-xs-6">
						<ChildGroupBoxContainer parentID={this.props.id} />
					</div>
				</div>
				<Button bsStyle="default" onClick={this.open}>Edit Group</Button>
			</div>
		);
	}
}
