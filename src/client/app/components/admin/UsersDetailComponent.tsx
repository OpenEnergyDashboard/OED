/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { User } from '../../types/items';
import { Table, Button } from 'reactstrap';
import CreateUserLinkButtonComponent from './users/CreateUserLinkButtonComponent';

interface UserDisplayComponentProps {
	users: User[];
}

export default function UserDetailComponent(props: UserDisplayComponentProps) {
	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tableStyle: React.CSSProperties = {
		marginLeft: '10%',
		marginRight: '10%'
	};

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
								<tr>
									<td>{user.email}</td>
									<td>{user.role}</td>
									<td><Button>Disable User</Button></td>
								</tr>
							))}
						</tbody>
					</Table>
					<CreateUserLinkButtonComponent />
				</div>
			</div>
		</div>
	)
}