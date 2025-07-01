/* Simple warning component for modal close confirmation */
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
 * 
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