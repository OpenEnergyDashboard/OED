/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
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
	const { data: users = stableEmptyUsers } = userApi.useGetUsersQuery(undefined);
	const [localUsersChanges, setLocalUsersChanges] = React.useState<User[]>([]);

	React.useEffect(() => { setLocalUsersChanges(users); }, [users]);
	// React.useEffect(() => { setHasChanges(!_.isEqual(users, localUsersChanges)); }, [localUsersChanges, users]);

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
						[...localUsersChanges]
							.sort((a, b) => a.email.localeCompare(b.email))
							.map(user => (
								<UserViewComponent
									key={user.email}
									user={user}
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