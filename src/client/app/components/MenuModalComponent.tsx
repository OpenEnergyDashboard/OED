/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import { Button, Modal, ModalBody, ModalHeader } from 'reactstrap';
import HeaderButtonsComponent from './HeaderButtonsComponent';
import UIOptionsComponent from './UIOptionsComponent';
import { useLocation } from 'react-router-dom';

/**
 * React component to define the collapsed menu modal
 * @returns Modal element
 */
export default function MenuModalComponent() {
	const [showModal, setShowModal] = useState(false);
	const toggleModal = () => { setShowModal(!showModal); };
	const { pathname } = useLocation();

	const inlineStyle: React.CSSProperties = {
		display: 'inline',
		paddingLeft: '5px'
	};

	return (
		<div style={inlineStyle}>
			<Button color='secondary' outline onClick={toggleModal}>
				<FormattedMessage id='menu' />
			</Button>
			<Modal isOpen={showModal} toggle={toggleModal} onOpened={ReactTooltip.rebuild} onClick={() => ReactTooltip.hide()}>
				<ModalHeader tag={customModalHeader} style={{ padding: '0.25rem 1rem' }} />
				<ModalBody>
					{/* Only render graph options if on the graph page */}
					{pathname === '/' &&
						<UIOptionsComponent />
					}
				</ModalBody>
			</Modal>
		</div >
	);
}

const customModalHeader = () => {
	return (
		<div style={{
			width: '100%',
			display: 'flex', flexDirection: 'row',
			justifyContent: 'space-between', alignItems: 'center'
		}}>
			<h5>
				<FormattedMessage id='menu' />
			</h5>
			<h6>
				<HeaderButtonsComponent />
			</h6>
		</div>);
};