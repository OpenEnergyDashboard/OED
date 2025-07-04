/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';

interface SimpleUnsavedWarningProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	onDiscard: () => void;
}

/**
 * Currently used for pages besides Admin Settings (PreferencesComponent.tsx)
 * @param props simpleUnsavedChanges props
 * @returns Component that prompts before navigating away from current page
 */
export function SimpleUnsavedWarningComponent(props: SimpleUnsavedWarningProps) {
	return (
		<Modal isOpen={props.isOpen} toggle={props.onCancel}>
			<ModalBody>
				<FormattedMessage id='unsaved.warning' />
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' outline onClick={props.onCancel}>
					<FormattedMessage id='cancel' />
				</Button>
				<Button color='danger' onClick={props.onDiscard}>
					<FormattedMessage id='leave' />
				</Button>
				<Button color='success' onClick={props.onConfirm}>
					<FormattedMessage id='save.all' />
				</Button>
			</ModalFooter>
		</Modal>
	);
}