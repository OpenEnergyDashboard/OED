/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { User, UserRole } from '../../types/items';
import { Button, Input, Table } from 'reactstrap';
import CreateUserLinkButtonComponent from './users/CreateUserLinkButtonComponent';

interface UserDisplayComponentProps {
	users: User[];
	deleteUser: (email: string) => Promise<void>;
	edited: boolean;
	editUser: (email: string, newRole: UserRole) => void;
	submitUserEdits: () => Promise<void>;
}

export default function UserDetailComponent(props: UserDisplayComponentProps) {
	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tableStyle: React.CSSProperties = {
		marginLeft: '10%',
		marginRight: '10%'
	};

	const buttonsStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between'
	}

	return (
		<div>
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					Users
				</h2>
				<div style={tableStyle}>
					<Table striped bordered hover>
						<thead>
							<tr>
								<th> Email </th>
								<th> Role </th>
								<th> Action </th>
							</tr>
						</thead>
						<tbody>
							{props.users.map(user => (
								<tr key={user.email}>
									<td>{user.email}</td>
									<td>
										<Input type='select' value={user.role} onChange={({ target }) => props.editUser(user.email, target.value as UserRole)}>
											{Object.entries(UserRole).map(([role, val]) => (
												<option value={val} key={role}> {role} </option>
											))}
										</Input>
									</td>
									<td><Button color='danger' onClick={() => { props.deleteUser(user.email); }}>Delete User</Button></td>
								</tr>
							))}
						</tbody>
					</Table>
					<div style={buttonsStyle}>
						<CreateUserLinkButtonComponent />
						<Button color='success' disabled={!props.edited} onClick={props.submitUserEdits}> Save role changes </Button>
					</div>
				</div>
			</div>
		</div>
	)
}