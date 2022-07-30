/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
//TODO borrowing the conversion card CSS but shouldn't the modal card css all be in one file?
import '../styles/conversion-card-page.css';
import translate from '../utils/translate';

interface ConfirmActionModalComponentProps {
	// Control this through the parent component to open/close this modal
	show: boolean;
	// Message to display when action button is rendered
	actionConfirmMessage: string;
	// Overrides the default action confirmation text 'yes'
	actionConfirmText?: string;
	// Overrides the default action confirmation text 'no'
	actionRejectText?: string;
	// Any additional props the developer might want to pass in
	optionalProps?: any;
	// passed in to handle closing the modal
	// usually alters the show props to control closing the modal
	handleClose: () => void;
	// Function to execute if action is confirmed
	// Be sure to pass into any additional handleClose functions for hiding parent modals
	// Also be aware that react boostrap does not support nested modals by default
	// A good solution to this is to hide the parent modal when this modal is opened
	actionFunction: () => void;
}

// Updated to hooks
export default function ConfirmActionModalComponent(props: ConfirmActionModalComponentProps) {

	const handleClose = () => {
		props.handleClose();
	}

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}

	const tableStyle: React.CSSProperties = {
		width: '100%'
	};

	return (
		<>
			<Modal show={props.show} onHide={props.handleClose}>
				<Modal.Header>
					<Modal.Title>
						<FormattedMessage id="confirm.action" />
					</Modal.Title>
				</Modal.Header>
				{/* when any of the conversion are changed call one of the functions. */}
				<Modal.Body className="show-grid">
					<div id="container">
						<div id="modalChild">
							{/* Modal content */}
							<div className="container-fluid">
								<div style={tableStyle}>
									{/* SourceId input*/}
									<div style={formInputStyle}>
										<p>{props.actionConfirmMessage}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal.Body>
				<Modal.Footer>
					{/* Do not execute the actionFunction and instead close the action confirm modal */}
					<Button variant="secondary" onClick={handleClose}>
						{/* Render the action reject text if it was passed, or else 'no' */}
						{props.actionRejectText ? props.actionRejectText : translate('no')}
					</Button>
					{/* Execute the action function and close the action confirm modal */}
					<Button variant="secondary" onClick={props.actionFunction}>
						{props.actionConfirmText ? props.actionConfirmText : translate('yes')}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}