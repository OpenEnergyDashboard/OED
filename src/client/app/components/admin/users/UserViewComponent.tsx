// /* eslint-disable no-mixed-spaces-and-tabs */
// /* This Source Code Form is subject to the terms of the Mozilla Public
//  * License, v. 2.0. If a copy of the MPL was not distributed with this
//  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { User } from '../../../types/items';
import '../../../styles/card-page.css';
import EditUserModalComponent from './EditUserModalComponent';

interface UserViewComponentProps {
	user: User;
	localUsers: User[];
	onUserUpdate: (updatedUser: User) => void;
}

const UserViewComponent: React.FC<UserViewComponentProps> = ({ user, localUsers, onUserUpdate }) => {
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	return (
		<div className="card">
			<div className="identifier-container">
				{user.email}
			</div>
			<div className="item-container p-2">
				<b><FormattedMessage id="role" />: </b>
				{user.role}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.user" />
				</Button>
				<EditUserModalComponent
					show={showEditModal}
					user={user}
					localUsers={localUsers}
					handleShow={handleShow}
					handleClose={handleClose}
					onUserUpdate={onUserUpdate} // Pass update
				/>
			</div>
		</div>
	);
};

export default UserViewComponent;
