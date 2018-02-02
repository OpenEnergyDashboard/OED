/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import HeaderButtonsComponent from './HeaderButtonsComponent';

export default class MenuModalComponent extends React.Component {

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
		const marginBottomStyle = {
			marginBottom: '15px'
		};
		const labelStyle = {
			fontWeight: 'bold',
			margin: 0
		};
		return (
			<div style={inlineStyle}>
				<Button outline onClick={this.toggle}>Menu</Button>
				<Modal isOpen={this.state.showModal} toggle={this.toggle}>
					<ModalHeader toggle={this.toggle}>Options</ModalHeader>
					<ModalBody>
						<div style={marginBottomStyle}>
							<p style={labelStyle}>Navigation:</p>
							<HeaderButtonsComponent renderOptionsButton={false} />
						</div>
						{ this.props.showUIOptions &&
							<UIOptionsContainer />
						}
					</ModalBody>
				</Modal>
			</div>
		);
	}
}
