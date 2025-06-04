/* eslint-disable no-mixed-spaces-and-tabs */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { Button } from 'reactstrap';
import '../../../styles/card-page.css';
import { User } from '../../../types/items';
import { useTranslate } from '../../../redux/componentHooks';
import EditUserModalComponent from './EditUserModalComponent';

interface UserViewComponentProps {
	user: User;
}

/**
 * Component which shows the user card
 * @param props props for the component
 * @returns User card element
 */
export default function UserViewComponent(props: UserViewComponentProps) {
	const translate = useTranslate();
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
				{props.user.username}
			</div>
			<div className="item-container p-2">
				<b>
					{translate('user.role')}
				</b>
				{props.user.role}
			</div>
			<div className="item-container p-2">
				<b>
					{translate('note')}
				</b>
				{props.user.note.slice(0, 29)}
			</div>
			<div className="edit-btn mt-auto">
				<Button color='secondary' onClick={handleShow}>
					{translate('edit.user')}
				</Button>
				<EditUserModalComponent
					show={showEditModal}
					user={props.user}
					handleShow={handleShow}
					handleClose={handleClose}
				/>
			</div>
		</div>
	);
}