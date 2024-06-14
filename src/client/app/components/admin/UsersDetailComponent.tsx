/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { stableEmptyUsers, userApi } from '../../redux/api/userApi';
import { User, UserRole } from '../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { UnsavedWarningComponent } from '../UnsavedWarningComponent';
import CreateUserModalComponent from './CreateUserModalComponent';
import UserViewComponent from './UserViewComponent';


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
	React.useEffect(() => { setHasChanges(!_.isEqual(users, localUsersChanges)); }, [localUsersChanges, users]);
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
				<div className="edit-btn">
					<CreateUserModalComponent />
				</div>
				<div style={cardStyle} className='card-container'>
					{localUsersChanges.map(user => (
						<UserViewComponent
							key={user.email}
							user={user}
							editUser={editUser}
							deleteUser={deleteUser}
						/>
					))}
				</div>
				<div style={buttonsStyle}>
					<Button
						color='success'
						disabled={_.isEqual(users, localUsersChanges)}
						onClick={submitChanges}
					>
						<FormattedMessage id='save.role.changes' />
					</Button>
				</div>
			</div>
		</div>
	);
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};


const cardStyle: React.CSSProperties = {
	margin: '.625rem',
	padding: '.625rem'
};

const buttonsStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'space-between'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};