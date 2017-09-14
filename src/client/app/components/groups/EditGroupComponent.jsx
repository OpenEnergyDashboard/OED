/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This component is the main page of the edit group page.
import React from 'react';
import { Modal, Button } from 'react-bootstrap';


export default class EditGroupComponent extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const titleStyle = {
			justifyContent: 'center',
			alignItems: 'center',
			textAlign: 'center'
		};

		return (
			<div>
				<div style={titleStyle}>
					<h1>Edit Group</h1>
				</div>

				<div className="static-modal">
					<Modal show={this.state.showModal} onHide={this.close}>
						<Modal.Header closeButton>
							<Modal.Title>Modal title</Modal.Title>
						</Modal.Header>

						<Modal.Body>
							Placeholder text
						</Modal.Body>

						<Modal.Footer>
							<Button onClick={this.close}>Close</Button>
						</Modal.Footer>

					</Modal>
				</div>
			</div>
		);
	}
}

