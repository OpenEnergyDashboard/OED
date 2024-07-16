import * as React from 'react';
import { useState } from 'react';
import { Alert, Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { UserRole } from '../../../types/items';
import { userApi } from '../../../redux/api/userApi';
import { User } from '../../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import translate from '../../../utils/translate';
import { useAppSelector } from '../../../redux/reduxHooks';
import { selectDefaultCreateMeterValues } from '../../../redux/selectors/adminSelectors';

/**
 * Defines the create user modal form
 * @returns CreateUserModal component
 */
export default function CreateUserModal() {
	// Memo'd memoized selector
	const defaultValues = useAppSelector(selectDefaultCreateMeterValues);

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// Handlers for each type of input change
	const [userDetails, setUserDetails] = useState(defaultValues);
	const [createUser] = userApi.useCreateUserMutation();

	const handleShowModal = () => setShowModal(true);
	const handleCloseModal = () => {
		setShowModal(false);
		resetForm();
	};

	const resetForm = () => {
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setRole('');
		setPasswordMatch(true);
		setNote('');
	};

	const handleSubmit = async () => {
		if (password === confirmPassword) {
			setPasswordMatch(true);
			const userRole: UserRole = UserRole[role as keyof typeof UserRole];
			const newUser: User = { email, role: userRole, password, note };
			createUser(newUser)
				.unwrap()
				.then(() => {
					showSuccessNotification(translate('users.successfully.create.user'));
					handleCloseModal();
				})
				.catch(() => {
					showErrorNotification(translate('users.failed.to.create.user'));
				});
		} else {
			setPasswordMatch(false);
		}
	};

	const isFormValid = email && password && confirmPassword === password && role;

	return (
		<>
			<Button color="secondary" onClick={handleShowModal}>
				<FormattedMessage id="create.user" />
			</Button>
			<Modal isOpen={showModal} toggle={handleCloseModal} size="lg">
				<ModalHeader>
					<FormattedMessage id="create.user" />
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row>
							<Col>
								<FormGroup>
									<Label for="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={email}
										onChange={e => setEmail(e.target.value)}
										invalid={!email}
										required
									/>
								</FormGroup>
							</Col>
						</Row>
						{!passwordMatch && (
							<Row>
								<Col>
									<Alert color="danger">{translate('user.password.mismatch')}</Alert>
								</Col>
							</Row>
						)}
						<Row>
							<Col>
								<FormGroup>
									<Label for="password">Password</Label>
									<Input
										id="password"
										name="password"
										type="password"
										value={password}
										onChange={e => setPassword(e.target.value)}
										invalid={!password}
										required
									/>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										invalid={confirmPassword !== password && confirmPassword !== ''}
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
									<Label for="role">Role</Label>
									<Input
										id="role"
										name="role"
										type="select"
										value={role}
										onChange={e => setRole(e.target.value)}
										invalid={!role}
										required
									>
										<option value="">Select Role</option>
										{Object.entries(UserRole).map(([role, val]) => (
											<option value={role} key={val}>
												{role}
											</option>
										))}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row>
							<Col>
								<FormGroup>
									<Label for="note">Note</Label>
									<Input
										id="note"
										name="note"
										type="textarea"
										value={note}
										onChange={e => setNote(e.target.value)}
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