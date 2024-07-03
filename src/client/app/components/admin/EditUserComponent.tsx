import * as React from 'react';
import { useState } from 'react';
import { Button, Col, Container, Row, Table } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { userApi } from '../../redux/api/userApi';
import EditUserModalComponent from './EditUserModalComponent';
import { User } from '../../types/items';
import translate from '../../utils/translate';

/**
 * Component that defines the form to edit a user
 * @returns Edit User Component
 */
export default function EditUserComponent() {
	const { data: users = [] } = userApi.useGetUsersQuery(undefined);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [showModal, setShowModal] = useState<boolean>(false);

	const handleEditClick = (user: User) => {
		setSelectedUser(user);
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedUser(null);
	};

	return (
		<Container>
			<Row>
				<Col>
					<h2><FormattedMessage id="edit.users" /></h2>
					<Table striped>
						<thead>
							<tr>
								<th><FormattedMessage id="email" /></th>
								<th><FormattedMessage id="role" /></th>
								<th><FormattedMessage id="actions" /></th>
							</tr>
						</thead>
						<tbody>
							{users.map(user => (
								<tr key={user.email}>
									<td>{user.email}</td>
									<td>{translate(`UserRole.${user.role}`)}</td>
									<td>
										<Button color="primary" onClick={() => handleEditClick(user)}>
											<FormattedMessage id="edit" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</Col>
			</Row>
			{selectedUser && (
				<EditUserModalComponent
					show={showModal}
					user={selectedUser}
					handleShow={() => setShowModal(true)}
					handleClose={handleCloseModal}
				/>
			)}
		</Container>
	);
}
