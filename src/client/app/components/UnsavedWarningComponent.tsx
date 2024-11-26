/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MutationTrigger } from '@reduxjs/toolkit/dist/query/react/buildHooks';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useBlocker } from 'react-router-dom';
// TODO migrate ReactRouter v6 & hooks
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { LocaleDataKey } from '../translations/data';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { useTranslate } from '../redux/componentHooks';

export interface UnsavedWarningProps {
	changes: any;
	hasUnsavedChanges: boolean;
	successMessage: LocaleDataKey;
	failureMessage: LocaleDataKey;
	submitChanges: MutationTrigger<any>;
}

/**
 * @param props unsavedChanges props
 * @returns Component that prompts before navigating away from current page
 */
export function UnsavedWarningComponent(props: UnsavedWarningProps) {
	const translate = useTranslate();
	const { hasUnsavedChanges, submitChanges, changes } = props;
	const blocker = useBlocker(hasUnsavedChanges);
	const handleSubmit = async () => {
		submitChanges(changes)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('unsaved.success'));
				if (blocker.state === 'blocked') {
					blocker.proceed();
				}
			})
			.catch(() => {
				showErrorNotification(translate('unsaved.failure'));
				if (blocker.state === 'blocked') {
					blocker.proceed();
				}
			});
	};
	React.useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (blocker.state === 'blocked') {
				e.preventDefault();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges, blocker]);

	return (

		<Modal isOpen={blocker.state === 'blocked'} toggle={blocker.reset}>
			<ModalBody><FormattedMessage id='unsaved.warning' /></ModalBody>
			<ModalFooter>
				<Button color='secondary' outline onClick={blocker.reset}>
					<FormattedMessage id='cancel' />
				</Button>
				<Button color='danger' onClick={blocker.proceed}>
					<FormattedMessage id='leave' />
				</Button>
				<Button color='success' onClick={handleSubmit}>
					<FormattedMessage id='save.all' />
				</Button>
			</ModalFooter>
		</Modal>
	);
}
