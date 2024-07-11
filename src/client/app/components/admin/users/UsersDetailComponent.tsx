/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { stableEmptyUsers, userApi } from '../../../redux/api/userApi';
import { User } from '../../../types/items';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';
import CreateUserModalComponent from './CreateUserModalComponent';
import UserViewComponent from './UserViewComponent';

/**
 * Component which shows user details
 * @returns User Detail element
 */
export default function UserDetailComponent() {
	const { data: users = stableEmptyUsers, refetch } = userApi.useGetUsersQuery(undefined);
	const [localUsers, setLocalUsers] = React.useState<User[]>([]);

	React.useEffect(() => { setLocalUsers(users); }, [users]);

	const handleUserUpdate = (updatedUser: User) => {
		setLocalUsers(prevUsers =>
			prevUsers.map(user => (user.email === updatedUser.email ? updatedUser : user))
		);
		refetch(); // Re-fetch users to get the updated data from the server
	};

	return (
		<div>
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
				<div className='card-container'>
					{// display users and sort by email alphabetically
						[...localUsers]
							.sort((a, b) => a.email.localeCompare(b.email))
							.map(user => (
								<UserViewComponent
									key={user.email}
									user={user}
									localUsers={localUsers}
									onUserUpdate={handleUserUpdate}
								/>
							))}
				</div>
			</div>
		</div>
	);
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};