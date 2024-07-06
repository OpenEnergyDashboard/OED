import * as React from 'react';
import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { User, UserRole } from '../../../types/items';
import { userApi } from '../../../redux/api/userApi';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import translate from '../../../utils/translate';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import TooltipMarkerComponent from '../../TooltipMarkerComponent';
import ConfirmActionModalComponent from '../../ConfirmActionModalComponent';
import { useAppSelector } from '../../../redux/reduxHooks';
import { selectCurrentUserProfile } from '../../../redux/slices/currentUserSlice';

interface EditUserModalComponentProps {
	show: boolean;
	user: User;
	handleShow: () => void;
	handleClose: () => void;
	localUsers: User[]; // New prop for localUsers
}

/**
 * Defines the edit user modal form
 * @param props props for the component
 * @returns User edit element
 */
export default function EditUserModalComponent(props: EditUserModalComponentProps) {
	const [submitUserEdits] = userApi.useEditUsersMutation();
	const [submitDeleteUser] = userApi.useDeleteUsersMutation();
	const [userState, setUserState] = useState<User>({ ...props.user });
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [passwordMatch, setPasswordMatch] = useState<boolean>(true);
	const currentUserProfile = useAppSelector(selectCurrentUserProfile) as User | null;
	const [disableDelete, setDisableDelete] = useState<boolean>(false);
	const { localUsers } = props;

	useEffect(() => {
		setUserState({ ...props.user });
	}, [props.user]);

	useEffect(() => {
		setDisableDelete(false);
		if (currentUserProfile) {
			if (props.user.email === currentUserProfile.email) {
				setDisableDelete(true);
			}
		}
	}, [currentUserProfile]);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserState({ ...userState, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setConfirmPassword(e.target.value);
		setPasswordMatch(e.target.value === password);
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserState({ ...userState, role: e.target.value as UserRole });
	};

	const handleSaveChanges = async () => {
		// props.handleClose();
		// must submit a user change as an array of users because API was coded that way
		//  we should rewrite the api at some point as user changes are no longer done as a group
		// const userArray: User[] = [{ ...userState }];
		// submitUserEdits(userArray)
		// 	.unwrap()
		// 	.then(() => {
		// 		showSuccessNotification(translate('users.successfully.edit.users'));
		// 	})
		// 	.catch(() => {
		// 		showErrorNotification(translate('users.failed.to.edit.users'));
		// 	});
		props.handleClose();
		const updatedUsers: User[] = localUsers.map(user => user.email === userState.email ? userState : user);
		submitUserEdits(updatedUsers)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.edit.users'));
			})
			.catch(() => {
				showErrorNotification(translate('users.failed.to.edit.users'));
			});
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

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('user.confirm.delete') + props.user.email + '?';
	const deleteConfirmText = translate('delete.user');
	const deleteRejectText = translate('cancel');

	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};

	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};

	const handleDeleteUser = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		// Delete the conversion using the state object, it should only require the source and destination ids set
		deleteUser(userState.email);
	};
	/* End Confirm Delete Modal */

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%'
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteUser}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<Modal isOpen={props.show} toggle={props.handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="edit.user" />
					<TooltipHelpComponent page='users-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='users-edit' helpTextId='help.admin.useredit' />
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="email"><FormattedMessage id="email" /></Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={userState.email}
										onChange={handleStringChange}
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="role"><FormattedMessage id="role" /></Label>
									<Input
										id="role"
										name="role"
										type="select"
										value={userState.role}
										onChange={handleRoleChange}
									>
										{Object.entries(UserRole).map(([role, val]) => (
											<option value={val} key={val}>{role}</option>
										))}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								<FormGroup>
									<Label for="password"><FormattedMessage id="password" /></Label>
									<Input
										id="password"
										name="password"
										type="password"
										value={password}
										onChange={handlePasswordChange}
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="confirmPassword"><FormattedMessage id="password.confirm" /></Label>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={handleConfirmPasswordChange}
										invalid={!passwordMatch}
									/>
									<FormFeedback><FormattedMessage id="user.password.mismatch" /></FormFeedback>
								</FormGroup>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='danger' onClick={handleDeleteConfirmationModalOpen} disabled={disableDelete}>
						<FormattedMessage id="delete.user" />
					</Button>
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSaveChanges} disabled={!passwordMatch}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
