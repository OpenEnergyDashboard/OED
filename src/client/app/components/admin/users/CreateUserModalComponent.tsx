/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal,
	ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { userApi } from '../../../redux/api/userApi';
import { User, UserRole } from '../../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import translate from '../../../utils/translate';

/**
 * Defines the create user modal form
 * @returns CreateUserModal component
 */
export default function CreateUserModal() {

	// user default values
	const userDefaults = {
		username: '',
		password: '',
		confirmPassword: '',
		role: UserRole['Select Role'],
		note: '',
		passwordMatch: true
	};

	// user api
	const [createUser] = userApi.useCreateUserMutation();

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// create user form state
	const [userDetails, setUserDetails] = useState(userDefaults);

	const handleShowModal = () => setShowModal(true);
	const handleCloseModal = () => {
		setShowModal(false);
		resetForm();
	};

	// Handlers for each type of input change
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			[e.target.name]: e.target.value
		}));
	};

	const handleRoleChange = (newRole: UserRole) => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			role: newRole
		}));
	};

	const resetForm = () => {
		setUserDetails(userDefaults);
	};

	const handleSubmit = async () => {
		const userRole: UserRole = UserRole[userDetails.role as unknown as keyof typeof UserRole];
		const newUser: User = { username: userDetails.username, role: userRole, password: userDetails.password, note: userDetails.note };
		createUser(newUser)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.create.user'));
				handleCloseModal();
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.create.user') + userDetails.username + ' ' + error.data.message);
			});
		resetForm();
	};

	const isFormValid = userDetails.username && userDetails.password && (userDetails.confirmPassword === userDetails.password) && userDetails.role;

	return (
		<>
			<Button color="secondary" onClick={handleShowModal}>
				{translate('create.user')}
			</Button>
			<Modal isOpen={showModal} toggle={handleCloseModal} size="lg">
				<ModalHeader>
					{translate('create.user')}
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="username">
										{translate('username')}
									</Label>
									<Input
										id="username"
										name="username"
										type="text"
										value={userDetails.username}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.username}
										required
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="role">
										{translate('role')}
									</Label>
									<Input
										id="role"
										name="role"
										type="select"
										value={userDetails.role}
										onChange={e => handleRoleChange(e.target.value as UserRole)}
										invalid={!userDetails.role}
										required
									>
										<option value="">Select Role</option>
										{Object.entries(UserRole).map(([role, val]) => (
											<option value={role} key={role}>
												{val}
											</option>
										))}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="password">
										{translate('password')}
									</Label>
									<Input
										id="password"
										name="password"
										type="password"
										value={userDetails.password}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.password}
										required
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="confirmPassword">
										{translate('password.confirm')}
									</Label>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										value={userDetails.confirmPassword}
										onChange={e => handleStringChange(e)}
										invalid={userDetails.confirmPassword !== userDetails.password && userDetails.confirmPassword !== ''}
										required
									/>
									<FormFeedback>
										<FormattedMessage id="user.password.mismatch" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row>
							<Col>
								<FormGroup>
									<Label for="note">
										{translate('note')}
									</Label>
									<Input
										id="note"
										name="note"
										type="textarea"
										value={userDetails.note}
										onChange={e => handleStringChange(e)}
									/>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={handleCloseModal}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSubmit} disabled={!isFormValid}>
						<FormattedMessage id="create.user" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
