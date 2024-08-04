/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal,
	ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { userApi } from '../../../redux/api/userApi';
import { User, UserRole, userDefaults } from '../../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import translate from '../../../utils/translate';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';
import { tooltipBaseStyle } from '../../../styles/modalStyle';

/**
 * Defines the create user modal form
 * @returns CreateUserModal component
 */
export default function CreateUserModal() {

	// create user form state and use the defaults
	const [userDetails, setUserDetails] = useState(userDefaults);

	// user api
	const [createUser] = userApi.useCreateUserMutation();
	const userRoleIsSelected = userDetails.role !== UserRole.INVALID;

	// check if passwords match
	useEffect(() => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			passwordMatch: (userDetails.password === userDetails.confirmPassword),
			passwordLength: userDetails.password.length > 7
		}));
	}, [userDetails.password, userDetails.confirmPassword]);

	// check if form is valid
	const isFormValid = () => {
		return userDetails.username &&
			userDetails.passwordMatch &&
			userDetails.passwordLength &&
			userDetails.role !== 'invalid' &&
			userDetails.username.length > 2;
	};

	// Handlers for each type of input change
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			[e.target.name]: e.target.value
		}));
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			role: e.target.value as UserRole
		}));
	};

	// Methods to reset form fields
	const resetForm = () => {
		setUserDetails(userDefaults);
	};

	const resetPasswordFields = () => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			password: '',
			confirmPassword: ''
		}));
	};
	// End of reset form methods

	// Modal show/close
	const [showModal, setShowModal] = useState(false);

	const handleShowModal = () => setShowModal(true);

	const handleCloseModal = () => {
		resetPasswordFields();
		setShowModal(false);
	};
	// End Modal show/close

	const handleSubmit = async () => {
		const newUser: User = { username: userDetails.username, role: userDetails.role, password: userDetails.password, note: userDetails.note };
		createUser(newUser)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.create.user') + userDetails.username);
				resetForm();
				handleCloseModal();
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.create.user') + userDetails.username + ' ' + error.data.message);
				resetPasswordFields();
			});
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		// Only an admin can create a meter.
		tooltipUsersView: 'help.admin.users'
	};

	return (
		<>
			<Button color='secondary' onClick={handleShowModal}>
				{translate('create.user')}
			</Button>
			<Modal isOpen={showModal} toggle={handleCloseModal} size='lg'>
				<ModalHeader>
					{translate('create.user')}
					<TooltipHelpComponent page='users-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users-create'
							helpTextId={tooltipStyle.tooltipUsersView}
						/>
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='username'>
										{translate('username')}
									</Label>
									<Input
										id='username'
										name='username'
										type='text'
										value={userDetails.username}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.username || userDetails.username.length < 3}
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='role'>
										{translate('user.role')}
									</Label>
									<Input
										id='role'
										name='role'
										type='select'
										value={userDetails.role}
										onChange={handleRoleChange}
										invalid={!userRoleIsSelected}
									>
										<option value={UserRole.INVALID} key={UserRole.INVALID} hidden disabled>
											{translate('user.role.select')}
										</option>
										{
											Object.entries(UserRole)
												.filter(([role]) => role !== 'INVALID')
												.map(([role, value]) => (
													<option value={value} key={value}>
														{role}
													</option>
												))
										}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for='password'>
										{translate('password')}
									</Label>
									<Input
										id='password'
										name='password'
										type='password'
										value={userDetails.password}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.passwordLength}
									/>
									<FormFeedback>
										{translate('user.password.length')}
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='confirmPassword'>
										{translate('password.confirm')}
									</Label>
									<Input
										id='confirmPassword'
										name='confirmPassword'
										type='password'
										value={userDetails.confirmPassword}
										onChange={e => handleStringChange(e)}
										invalid={!userDetails.passwordMatch}
									/>
									<FormFeedback>
										{translate('user.password.mismatch')}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row>
							<Col>
								<FormGroup>
									<Label for='note'>
										{translate('note')}
									</Label>
									<Input
										id='note'
										name='note'
										type='textarea'
										value={userDetails.note}
										onChange={e => handleStringChange(e)}
									/>
									<FormFeedback>
										{translate('error.required')}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' onClick={handleCloseModal}>
						{translate('cancel')}
					</Button>
					<Button color='primary' onClick={handleSubmit} disabled={!isFormValid()}>
						{translate('create.user')}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
