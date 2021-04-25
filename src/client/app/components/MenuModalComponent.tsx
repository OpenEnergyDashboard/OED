/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import HeaderButtonsContainer from '../containers/HeaderButtonsContainer';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';

interface MenuModalProps {
	showOptions: boolean;
	showCollapsedMenuButton: boolean;
}

interface MenuModalState {
	showModal: boolean;
}

export default class MenuModalComponent extends React.Component<MenuModalProps, MenuModalState> {

	public state: MenuModalState;

	constructor(props: MenuModalProps) {
		super(props);
		this.toggle = this.toggle.bind(this);
		this.state = { showModal: false };
	}

	public render(): React.ReactNode {
		const inlineStyle: React.CSSProperties = {
			display: 'inline',
			paddingLeft: '5px'
		};
		const marginBottomStyle: React.CSSProperties = {
			marginBottom: '15px'
		};
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		return (
			<div style={inlineStyle}>
				<Button outline onClick={this.toggle}>
					<FormattedMessage id='menu'/>
				</Button>
				<Modal isOpen={this.state.showModal} toggle={this.toggle} onOpened={ReactTooltip.rebuild}>
					<ModalHeader toggle={this.toggle}>
						<FormattedMessage id='options' />
					</ModalHeader>
					<ModalBody>
						<div style={marginBottomStyle}>
							<p style={labelStyle}>
								<FormattedMessage id='navigation' />:
							</p>
							<HeaderButtonsContainer  showCollapsedMenuButton={false} />
						</div>
						{ this.props.showOptions &&
							<UIOptionsContainer />
						}
					</ModalBody>
				</Modal>
			</div>
		);
	}

	private toggle() {
		this.setState({ showModal: !this.state.showModal });
	}
}
