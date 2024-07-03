import * as React from 'react';
import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { User, UserRole } from '../../types/items';
import { userApi } from '../../redux/api/userApi';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditUserModalComponentProps {
	show: boolean;
	user: User;
	handleShow: () => void;
	handleClose: () => void;
}

/**
 * Defines the edit user modal form
 * @param props props for component
 * @returns EditUserModalComponent
 */
export default function EditUserModalComponent(props: EditUserModalComponentProps) {
	const [submitEditedUser] = userApi.useEditUsersMutation();

	const [state, setState] = useState<User>({ ...props.user });
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [passwordMatch, setPasswordMatch] = useState<boolean>(true);

	useEffect(() => {
		setState({ ...props.user });
	}, [props.user]);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setConfirmPassword(e.target.value);
		setPasswordMatch(e.target.value === password);
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, role: e.target.value as UserRole });
	};

	const handleSaveChanges = () => {
		const updatedUser = password && confirmPassword && passwordMatch ? { ...state, password } : state;

		submitEditedUser([updatedUser])
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('users.successfully.edit.users'));
				props.handleClose();
			})
			.catch(() => {
				showErrorNotification(translate('users.failed.to.edit.users'));
			});
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%'
	};

	return (
		<>
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
										value={state.email}
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
										value={state.role}
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
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSaveChanges} disabled={!passwordMatch}>
						<FormattedMessage id="save.changes" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
