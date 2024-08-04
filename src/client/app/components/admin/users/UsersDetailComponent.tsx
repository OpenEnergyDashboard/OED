/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { stableEmptyUsers, userApi } from '../../../redux/api/userApi';
import translate from '../../../utils/translate';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';
import CreateUserModalComponent from './CreateUserModalComponent';
import UserViewComponent from './UserViewComponent';
import { Col, Row } from 'reactstrap';

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%',
	tooltipUsersView: 'help.admin.users'
};

/**
 * Component which shows user details
 * @returns User Detail element
 */
export default function UserDetailComponent() {
	const { data: users = stableEmptyUsers } = userApi.useGetUsersQuery();

	return (
		<div>
			<TooltipHelpComponent page='users' />
			<div className='container-fluid px-5'>
				<h2 className='text-center'>
					{translate('users')}
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users' helpTextId={tooltipStyle.tooltipUsersView} />
					</div>
				</h2>
				<div className='edit-btn'>
					<CreateUserModalComponent />
				</div>
				<div className='card-container'>
					<Row className='justify-content-center'>
						{// display users and sort by username alphabetically
							[...users]
								.sort((a, b) => a.username.localeCompare(b.username))
								.map(user => (
									<Col key={user.username} className="d-flex justify-content-center mb-3">
										<UserViewComponent
											key={user.username}
											user={user}
										/>
									</Col>
								))
						}
					</Row>
				</div>
			</div>
		</div>
	);
}
