/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	unstable_BlockerFunction as BlockerFunction,
	unstable_useBlocker as useBlocker
} from 'react-router-dom-v5-compat';
// TODO migrate ReactRouter v6 & hooks
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { userApi } from '../redux/api/userApi'
import { MutationTrigger } from '@reduxjs/toolkit/dist/query/react/buildHooks';
export interface UnsavedWarningProps {
	hasUnsavedChanges: boolean | BlockerFunction;
	changes: any;
	submitChanges: MutationTrigger<
		typeof userApi.endpoints.editUsers.Types.MutationDefinition |
		typeof userApi.endpoints.createUser.Types.MutationDefinition
	>;
}

/**
 * @param props unsavedChanges Boolean
 * @returns Component that prompts before navigating away from current page
 */
export function UnsavedWarningComponentWIP(props: UnsavedWarningProps) {
	const { hasUnsavedChanges, submitChanges, changes } = props
	const blocker = useBlocker(hasUnsavedChanges);

	console.log(props)

	return (

		<Modal isOpen={blocker.state === 'blocked'} toggle={blocker.reset}>
			{/* <Modal isOpen={hasUnsavedChanges && blocker.state === 'blocked'} toggle={blocker.reset}> */}
			<ModalBody><FormattedMessage id='unsaved.warning' /></ModalBody>
			<ModalFooter>
				<Button color='secondary' outline onClick={blocker.reset}>
					<FormattedMessage id='cancel' />
				</Button>
				<Button color='danger' onClick={blocker.proceed}>
					<FormattedMessage id='leave' />
				</Button>
				<Button color='success' onClick={() => {
					submitChanges(changes)
					blocker.proceed
				}}>
					<FormattedMessage id='save.all' />
				</Button>
			</ModalFooter>
		</Modal>
	)
}
