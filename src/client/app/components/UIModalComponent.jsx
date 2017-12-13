/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Modal, Button } from 'react-bootstrap';
import UIOptionsContainer from '../containers/UIOptionsContainer';

export default class UIModalComponent extends React.Component {

	constructor(props) {
		super(props);
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
		this.state = { showModal: false };
	}

	openModal() {
		this.setState({ showModal: true });
	}

	closeModal() {
		this.setState({ showModal: false });
	}

	render() {
		const inlineStyle = {
			display: 'inline',
			paddingLeft: '5px'
		};
		return (
			<div style={inlineStyle}>
				<Button bsStyle="default" onClick={this.openModal}><FormattedMessage
					id="options"
					defaultMessage="Options"
				/></Button>
				<Modal show={this.state.showModal} onHide={this.closeModal}>
					<Modal.Header closeButton>
						<Modal.Title><FormattedMessage
							id="options"
							defaultMessage="Options"
						/></Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<UIOptionsContainer />
					</Modal.Body>
				</Modal>
			</div>
		);
	}
}
