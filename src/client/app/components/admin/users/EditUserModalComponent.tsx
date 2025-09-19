/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { userApi } from '../../../redux/api/userApi';
import { useAppSelector } from '../../../redux/reduxHooks';
import { selectCurrentUserProfile } from '../../../redux/slices/currentUserSlice';
import { User, UserRole, userDefaults } from '../../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import { useTranslate } from '../../../redux/componentHooks';
import ConfirmActionModalComponent from '../../ConfirmActionModalComponent';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';
import { tooltipBaseStyle } from '../../../styles/modalStyle';
import { SimpleUnsavedWarningComponent } from '../../SimpleUnsavedWarningComponent';

interface EditUserModalComponentProps {
	show: boolean;
	user: User;
	handleShow: () => void;
	handleClose: () => void;
}

/**
 * Defines the edit user modal form
 * @param props props for the component
 * @returns User edit element
 */
export default function EditUserModalComponent(props: EditUserModalComponentProps) {
	const translate = useTranslate();

	// boolean that updates if any change is made to user modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
	// If there are no changes, then save is disabled
	const [canSave, setCanSave] = useState(false);
	// When opening the edit page, the password is not filled in for security reasons.
	// Therefore, this boolean value is used to keep track if there are any changes
	// made to either the password field or the confirm password field.
	const [passwordModified, setPasswordModified] = useState(false);

	// displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedWarning(true);
		}
		else {
			// Proceed to close the modal
			props.handleClose();
		}
	};

	// get current logged in user
	const currentLoggedInUser = useAppSelector(selectCurrentUserProfile) as User;

	// user edit form state and use the defaults plus the user's data
	const [userDetails, setUserDetails] = useState({
		...userDefaults,
		...props.user,
		// if editing current logged in user, do not allow user to delete their own account
		disableDelete: props.user.username === currentLoggedInUser.username
	});

	// Store the details of the currently selected user
	// This variable is used to reset back to the initial user details.
	// Otherwise, the unsaved changes will remain when reopening the
	// edit page.
	const initialUserDetails = {
		...userDefaults,
		...props.user
	};

	// user apis
	const [submitUserEdits] = userApi.useEditUserMutation();
	const [submitDeleteUser] = userApi.useDeleteUsersMutation();

	// check if passwords match and if password length is at least 8
	useEffect(() => {
		// If any character is added in either field, it will count as password
		// being modified. This will actively update the passwordModified
		// boolean value when any change is made.
		const passwordFieldChanged = userDetails.password.length > 0 || userDetails.confirmPassword.length > 0;
		setPasswordModified(passwordFieldChanged);

		setUserDetails(prevDetails => ({
			...prevDetails,
			passwordMatch: (userDetails.password === userDetails.confirmPassword),
			passwordLength: userDetails.password.length > 7 || userDetails.password.length === 0
		}));
	}, [userDetails.password, userDetails.confirmPassword]);

	// check if form is valid
	const isFormValid = () => {
		return userDetails.username &&
			userDetails.passwordMatch &&
			userDetails.passwordLength &&
			userDetails.role &&
			userDetails.username.length > 2;
	};

	// Handlers for each type of input change
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserDetails(prevDetails => ({
			...prevDetails, [e.target.name]: e.target.value
		}));
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newRole = e.target.value as UserRole;
		setUserDetails(prevDetails => ({
			...prevDetails,
			role: newRole
		}));
	};

	// Methods to reset password fields
	const resetPasswordFields = () => {
		setUserDetails(prevDetails => ({
			...prevDetails,
			password: '',
			confirmPassword: ''
		}));
	};

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('user.delete.confirm') + props.user.username + '?';
	const deleteConfirmText = translate('delete.user');
	const deleteRejectText = translate('cancel');

	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShowModal();
	};

	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleCloseModal();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};

	const handleDeleteUser = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		// Delete the user using the username
		deleteUser(userDetails.username);
	};
	/* End Confirm Delete Modal */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateConversionModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit conversions will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setUserDetails(initialUserDetails);
	};


	// Modal show/close
	const handleShowModal = () => {
		props.handleShow();
	};

	const handleCloseModal = () => {
		// Clear all unsaved changes
		resetState();
		resetPasswordFields();
		props.handleClose();
	};
	// End Modal show/close

	const handleSaveChanges = async () => {
		// close modal
		props.handleClose();
		// set needed user details into a user and send to backend
		const editedUser: User = {
			id: userDetails.id, username: userDetails.username, role: userDetails.role,
			password: userDetails.password, note: userDetails.note
		};
		submitUserEdits(editedUser)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.edit.user') + props.user.username);
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.edit.user') + props.user.username + ' ' + error.data.message);
			});
		resetPasswordFields();
	};

	const deleteUser = (username: string) => {
		submitDeleteUser(username)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.delete.user') + props.user.username);
			})
			.catch(error => {
				showErrorNotification(translate('users.failed.to.delete.user') + props.user.username + ' ' + error.data.message);
			});
	};

	// Checks if edit made.
	// References the original implementation in EditUnitModalComponent.tsx
	useEffect(() => {
		// Compare the local changes to the default values
		const editMade =
			initialUserDetails.username !== userDetails.username
			|| initialUserDetails.note !== userDetails.note
			|| initialUserDetails.role !== userDetails.role
			|| passwordModified;
		// Automatically checks for unsaved changes and addresses the issue
		// of having to manually set the setHasUnsavedChanges
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
		// If editsMade, then canSave is true (saving is enabled)
		setCanSave(editMade);
	}, [userDetails, passwordModified, initialUserDetails]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipUsersView: 'help.admin.users'
	};

	return (
		<>
			{/* Unsaved Warning Component */}
			{showUnsavedWarning && (
				<SimpleUnsavedWarningComponent
					isOpen={showUnsavedWarning}
					onDiscard={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleCloseModal();
						resetState();
					}}
					onConfirm={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleSaveChanges();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave || !isFormValid()}
				/>
			)}
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteUser}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={props.show} toggle={handleToggle} size='lg'>
				<ModalHeader>
					{translate('edit.user')}
					<TooltipHelpComponent page='users-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users-edit'
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
										onChange={handleStringChange}
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
										required
									>
										{Object.entries(UserRole)
											.filter(([role]) => role !== 'INVALID')
											.map(([role, value]) => (
												<option value={value} key={value}>
													{role}
												</option>
											))}
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
										placeholder={translate('user.password.edit')}
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
										onChange={handleStringChange}
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
					{userDetails.disableDelete ? (
						<div className='text-danger px-3' >
							{translate('delete.self')}
						</div>
					) : null}
					<Button color='danger' onClick={handleDeleteConfirmationModalOpen} disabled={userDetails.disableDelete}>
						{translate('delete.user')}
					</Button>
					<Button color='secondary' onClick={handleCloseModal}>
						{translate('cancel')}
					</Button>
					<Button color='primary' onClick={handleSaveChanges} disabled={!isFormValid() || !canSave}>
						{translate('save.all')}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
