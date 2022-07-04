/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { User, UserRole } from '../../types/items';
import { Button, Input, Table } from 'reactstrap';
import CreateUserLinkButtonComponent from './users/CreateUserLinkButtonComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index'

interface UserDisplayComponentProps {
	users: User[];
	deleteUser: (email: string) => Promise<void>;
	edited: boolean;
	editUser: (email: string, newRole: UserRole) => void;
	submitUserEdits: () => Promise<void>;
}

export default function UserDetailComponent(props: UserDisplayComponentProps) {
	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tableStyle: React.CSSProperties = {
		marginLeft: '10%',
		marginRight: '10%'
	};

	const buttonsStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between'
	}

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%'
	};

	const removeUnsavedChangesFunction = (callback: () => void) => {
		// This function is called to reset all the inputs to the initial state
		// Do not need to do anything since unsaved changes will be removed after leaving this page
		callback();
	}

	const submitUnsavedChangesFunction = (successCallback: () => void, failureCallback: () => void) => {
		// This function is called to submit the unsaved changes
		props.submitUserEdits().then(successCallback, failureCallback);
	}

	const addUnsavedChanges = () => {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(removeUnsavedChangesFunction, submitUnsavedChangesFunction));
	}

	const clearUnsavedChanges = () => {
		// Notify that there are no unsaved changes
		store.dispatch(removeUnsavedChanges());
	}

	return (
		<div>
			<UnsavedWarningContainer />
			<TooltipHelpContainer page='users' />
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='users'/>
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users' helpTextId='help.admin.user' />
					</div>
				</h2>
				<div style={tableStyle}>
					<Table striped bordered hover>
						<thead>
							<tr>
								<th> <FormattedMessage id='email'/> </th>
								<th> <FormattedMessage id='role'/> </th>
								<th> <FormattedMessage id='action'/> </th>
							</tr>
						</thead>
						<tbody>
							{props.users.map(user => (
								<tr key={user.email}>
									<td>{user.email}</td>
									<td>
										<Input
											type='select'
											value={user.role}
											onChange={({ target }) => {
												props.editUser(user.email, target.value as UserRole);
												addUnsavedChanges();
											}}
										>
											{Object.entries(UserRole).map(([role, val]) => (
												<option value={val} key={role}> {role} </option>
											))}
										</Input>
									</td>
									<td>
										<Button color='danger' onClick={() => { props.deleteUser(user.email); }}>
											<FormattedMessage id='delete.user'/>
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
					<div style={buttonsStyle}>
						<CreateUserLinkButtonComponent />
						<Button
							color='success'
							disabled={!props.edited}
							onClick={() => {
								props.submitUserEdits();
								clearUnsavedChanges();
							}}
						>
							<FormattedMessage id='save.role.changes'/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}