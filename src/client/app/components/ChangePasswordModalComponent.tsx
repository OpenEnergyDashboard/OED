/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, ModalFooter, Row } from 'reactstrap';
import { userApi } from '../redux/api/userApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectCurrentUserProfile } from '../redux/slices/currentUserSlice';
import { User } from '../types/items';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { useTranslate } from '../redux/componentHooks';

interface ChangePasswordModalComponentProps {
	handleClose: () => void;
}

/**
 * Defines the change password modal form for the current logged-in user
 * @param props props for the component
 * @returns Change password element
 */
export default function ChangePasswordModalComponent(props: ChangePasswordModalComponentProps) {
	const translate = useTranslate();

	// If there are no changes, then save is disabled
	const [canSave, setCanSave] = useState(false);

	// Get current logged in user
	const currentUser = useAppSelector(selectCurrentUserProfile) as User;

	// State for password fields
	const [passwordDetails, setPasswordDetails] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
		passwordMatch: false,
		passwordLength: false
	});

	// User API
	const [submitPasswordChange] = userApi.useChangePasswordMutation();

	// Check if passwords match and if password length is at least 8
	useEffect(() => {
		// If any character is added in either field, it will
		// actively update the passwordModified boolean value
		// when any change is made.
		const passwordModified = passwordDetails.currentPassword.length > 0 ||
			passwordDetails.newPassword.length > 0 ||
			passwordDetails.confirmPassword.length > 0;

		setPasswordDetails(prevDetails => ({
			...prevDetails,
			passwordMatch: (passwordDetails.newPassword === passwordDetails.confirmPassword),
			passwordLength: passwordDetails.newPassword.length > 7 || passwordDetails.newPassword.length === 0
		}));

		// Update if we can save
		setCanSave(passwordModified &&
			passwordDetails.currentPassword.length > 0 &&
			passwordDetails.newPassword === passwordDetails.confirmPassword &&
			passwordDetails.newPassword.length > 7);
	}, [passwordDetails.currentPassword, passwordDetails.newPassword, passwordDetails.confirmPassword]);

	// Check if form is valid
	const isFormValid = () => {
		return passwordDetails.currentPassword.length > 0 &&
			passwordDetails.passwordMatch &&
			passwordDetails.passwordLength &&
			passwordDetails.newPassword.length > 0;
	};

	// Handler for password input changes
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPasswordDetails(prevDetails => ({
			...prevDetails,
			[e.target.name]: e.target.value
		}));
	};

	// Reset password fields
	const resetPasswordFields = () => {
		setPasswordDetails({
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
			passwordMatch: true,
			passwordLength: true
		});
	};

	// Handle close modal
	const handleCloseModal = () => {
		resetPasswordFields();
		props.handleClose();
	};

	// Handle save changes
	const handleSaveChanges = async () => {
		// Close modal
		props.handleClose();

		// Submit password change to API
		submitPasswordChange({
			currentPassword: passwordDetails.currentPassword,
			newPassword: passwordDetails.newPassword
		})
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('password.successfully.changed'));
				resetPasswordFields();
			})
			.catch(error =>{
				showErrorNotification(translate('password.failed.to.change') + error.data);
			});
	};

	return (
		<>
			<div>
				<Container>
					<Row>
						<Col>
							<FormGroup>
								<Label>
									{translate('username')}
								</Label>
								<Input
									type='text'
									value={currentUser.username}
									disabled
								/>
							</FormGroup>
						</Col>
					</Row>
					<Row>
						<Col>
							<FormGroup>
								<Label for='currentPassword'>
									{translate('current.password')}
								</Label>
								<Input
									id='currentPassword'
									name='currentPassword'
									type='password'
									placeholder={translate('current.password.enter')}
									value={passwordDetails.currentPassword}
									onChange={handlePasswordChange}
									required
								/>
							</FormGroup>
						</Col>
					</Row>
					<Row xs='1' lg='2'>
						<Col>
							<FormGroup>
								<Label for='newPassword'>
									{translate('password')}
								</Label>
								<Input
									id='newPassword'
									name='newPassword'
									type='password'
									placeholder={translate('password.new.enter')}
									value={passwordDetails.newPassword}
									onChange={handlePasswordChange}
									invalid={!passwordDetails.passwordLength}
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
									placeholder={translate('password.confirm.enter')}
									value={passwordDetails.confirmPassword}
									onChange={handlePasswordChange}
									invalid={!passwordDetails.passwordMatch}
								/>
								<FormFeedback>
									{translate('user.password.mismatch')}
								</FormFeedback>
							</FormGroup>
						</Col>
					</Row>
				</Container>
			</div>
			<ModalFooter>
				<Button color='secondary' onClick={handleCloseModal}>
					{translate('cancel')}
				</Button>
				<Button color='primary' onClick={handleSaveChanges} disabled={!isFormValid() || !canSave}>
					{translate('save.all')}
				</Button>
			</ModalFooter>
		</>
	);
}
