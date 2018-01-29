/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import UIOptionsContainer from '../containers/UIOptionsContainer';

export default class UIModalComponent extends React.Component {

	constructor(props) {
		super(props);
		this.toggle = this.toggle.bind(this);
		this.state = { showModal: false };
	}

	toggle() {
		this.setState({ showModal: !this.state.showModal });
	}

	render() {
		const inlineStyle = {
			display: 'inline',
			paddingLeft: '5px'
		};
		return (
			<div style={inlineStyle}>
				<Button outline onClick={this.toggle}>Options</Button>
				<Modal isOpen={this.state.showModal} toggle={this.toggle}>
					<ModalHeader>Options</ModalHeader>
					<ModalBody>
						<UIOptionsContainer />
					</ModalBody>
				</Modal>
			</div>
		);
	}
}
