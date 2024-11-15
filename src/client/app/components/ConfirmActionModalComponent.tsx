/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import '../styles/modal.css';
import { useTranslate } from '../redux/componentHooks';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

interface ConfirmActionModalComponentProps {
	// Control this through the parent component to open/close this modal
	show: boolean;
	actionTitle?: string;
	// Message to display when action button is rendered
	actionConfirmMessage: string;
	// Overrides the default action confirmation text 'yes'
	actionConfirmText?: string;
	// Overrides the default action confirmation text 'no'
	actionRejectText?: string;
	// passed in to handle closing the modal
	// usually alters the show props to control closing the modal
	handleClose: () => void;
	// Function to execute if action is confirmed
	// Be sure to pass into any additional handleClose functions for hiding parent modals
	// Also be aware that react bootstrap does not support nested modals by default
	// A good solution to this is to hide the parent modal when this modal is opened
	actionFunction: () => void;
}

// TODO This is a function that deals with confirm/reject that may be useful in other places.
/**
 * This is a modal component that can be used to confirm/reject any action by executing the actionFunction or handleClose passed in.
 * @param props The props for the component
 * @param props.show Boolean to handle showing/hiding the modal.
 * @param props.actionTitle (Optional) The title of the modal.
 * @param props.actionConfirmMessage The message that will display in the center when the modal opens.
 * @param props.actionConfirmText (Optional) The text of the action confirmation button.
 * @param props.actionRejectText (Optional) The text of the action rejection button.
 * @param props.handleClose The function that executes when clicking the action rejection button. Usually used for closing the modal.
 * @param props.actionFunction The function that is executed when clicking the action confirmation button.
 * @returns A modal component that executes the actionFunction on confirmation and handleClose on rejection.
 */
export default function ConfirmActionModalComponent(props: ConfirmActionModalComponentProps) {
	const translate = useTranslate();
	const handleClose = () => {
		props.handleClose();
	};

	return (
		<>
			<Modal isOpen={props.show} onClosed={props.handleClose} backdrop='static' centered>
				<ModalHeader>
					{props.actionTitle ? props.actionTitle : translate('confirm.action')}
				</ModalHeader>
				{/* Passed message is already translated */}
				<ModalBody>{props.actionConfirmMessage}</ModalBody>
				<ModalFooter>
					{/* Do not execute the actionFunction and instead close the action confirm modal */}
					<Button color='secondary' onClick={handleClose}>
						{/* Render the action reject text if it was passed, or else 'no' */}
						{props.actionRejectText ? props.actionRejectText : translate('no')}
					</Button>
					{/* Execute the action function and close the action confirm modal */}
					<Button color='primary' onClick={props.actionFunction}>
						{props.actionConfirmText ? props.actionConfirmText : translate('yes')}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}