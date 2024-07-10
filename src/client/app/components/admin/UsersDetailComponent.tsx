/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { isEqual } from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Input, Table } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { stableEmptyUsers, userApi } from '../../redux/api/userApi';
import { User, UserRole } from '../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { UnsavedWarningComponent } from '../UnsavedWarningComponent';
import CreateUserLinkButtonComponent from './users/CreateUserLinkButtonComponent';


/**
 * Component which shows user details
 * @returns User Detail element
 */
export default function UserDetailComponent() {
	const { data: users = stableEmptyUsers } = userApi.useGetUsersQuery(undefined);
	const [submitUserEdits] = userApi.useEditUsersMutation();
	const [submitDeleteUser] = userApi.useDeleteUsersMutation();
	const [localUsersChanges, setLocalUsersChanges] = React.useState<User[]>([]);
	const [hasChanges, setHasChanges] = React.useState<boolean>(false);

	React.useEffect(() => { setLocalUsersChanges(users); }, [users]);
	React.useEffect(() => { setHasChanges(!isEqual(users, localUsersChanges)); }, [localUsersChanges, users]);
	const submitChanges = async () => {
		submitUserEdits(localUsersChanges)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.edit.users'));
			})
			.catch(() => {
				showErrorNotification(translate('users.failed.to.edit.users'));
			});
	};

	const editUser = (e: React.ChangeEvent<HTMLInputElement>, targetUser: User) => {
		// copy user, and update role
		const updatedUser: User = { ...targetUser, role: e.target.value as UserRole };
		// make new list from existing local user state
		const updatedList = localUsersChanges.map(user => (user.email === targetUser.email) ? updatedUser : user);
		setLocalUsersChanges(updatedList);
	};

	const deleteUser = (email: string) => {
		submitDeleteUser(email)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.delete.user'));
			})
			.catch(() => {
				showErrorNotification(translate('users.failed.to.delete.user'));
			});
	};


	return (
		<div>
			<UnsavedWarningComponent
				hasUnsavedChanges={hasChanges}
				changes={localUsersChanges}
				submitChanges={submitUserEdits}
				successMessage='users.successfully.edit.users'
				failureMessage='failed.to.submit.changes'
			/>
			<TooltipHelpComponent page='users' />
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='users' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users' helpTextId='help.admin.user' />
					</div>
				</h2>
				<div style={tableStyle}>
					<Table striped bordered hover>
						<thead>
							<tr>
								<th> <FormattedMessage id='email' /> </th>
								<th> <FormattedMessage id='role' /> </th>
								<th> <FormattedMessage id='action' /> </th>
							</tr>
						</thead>
						<tbody>
							{localUsersChanges.map(user => (
								<tr key={user.email}>
									<td>{user.email}</td>
									<td>
										<Input
											type='select'
											value={user.role}
											onChange={e => editUser(e, user)}
										>
											{Object.entries(UserRole).map(([role, val]) => (
												<option value={val} key={role}> {role} </option>
											))}
										</Input>
									</td>
									<td>
										<Button color='danger' onClick={() => { deleteUser(user.email); }}>
											<FormattedMessage id='delete.user' />
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
							disabled={isEqual(users, localUsersChanges)}
							onClick={submitChanges}
						>
							<FormattedMessage id='save.role.changes' />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

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
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};
