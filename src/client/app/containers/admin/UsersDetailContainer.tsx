/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { User } from '../../types/items';
import UserDetailComponent from '../../components/admin/UsersDetailComponent';
import HeaderContainer from '../HeaderContainer';
import FooterComponent from '../../components/FooterComponent';
import { usersApi } from '../../utils/api';
import { Link } from 'react-router';
import { Button } from 'reactstrap';

const users: User[] = [{ email: 'davin@example.com', role: 'csv' }, { email: 'babu@example.com', role: 'obvius' }, { email: 'bibi@example.com', role: 'admin' }]

interface UsersDisplayContainerProps {
	fetchUsers: () => User[];
}

interface UsersDisplayContainerState {
	users: User[]
}

export default class UsersDetailContainer extends React.Component<UsersDisplayContainerProps, UsersDisplayContainerState> {
	constructor(props: UsersDisplayContainerProps) {
		super(props);
		this.fetchUsers = this.fetchUsers.bind(this);
	}

	state = {
		users: []
	}

	async componentDidMount() {
		const users = await this.fetchUsers();
		this.setState({ users: users });
	}

	private async fetchUsers() {
		return await usersApi.getUsers();
	}

	public render() {
		return (
			<div>
				<HeaderContainer />
				<UserDetailComponent users={this.state.users} />
				<FooterComponent />
			</div>
		)
	}
}