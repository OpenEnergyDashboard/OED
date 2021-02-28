/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import { User, UserRole } from '../../types/items';
import UserDetailComponent from '../../components/admin/UsersDetailComponent';
import HeaderContainer from '../HeaderContainer';
import FooterComponent from '../../components/FooterComponent';
import { usersApi } from '../../utils/api';

interface UsersDisplayContainerProps {
	fetchUsers: () => User[];
}

interface UsersDisplayContainerState {
	users: User[],
	history: User[][]
}

export default class UsersDetailContainer extends React.Component<UsersDisplayContainerProps, UsersDisplayContainerState> {
	constructor(props: UsersDisplayContainerProps) {
		super(props);
		this.editUser = this.editUser.bind(this);
		this.fetchUsers = this.fetchUsers.bind(this);
	}

	state: UsersDisplayContainerState = {
		users: [],
		history: []
	}

	async componentDidMount() {
		const users = await this.fetchUsers();
		this.setState({ users, history: [_.cloneDeep<User[]>(users)] });
	}

	private async fetchUsers() {
		return await usersApi.getUsers();
	}

	private async editUser(email: string, newRole: UserRole) {
		const newUsers = _.cloneDeep<User[]>(this.state.users);
		const user = newUsers.find(user => user.email === email);
		if (user !== undefined) {
			user.role = newRole;
			this.setState(prevState => ({
				users: newUsers,
				history: [...prevState.history, newUsers]
			}));
			console.log("edit user");
		}
	}

	public render() {
		return (
			<div>
				<HeaderContainer />
				<UserDetailComponent
					edited={!_.isEqual(this.state.users, this.state.history[0])}
					editUser={this.editUser}
					users={this.state.users} />
				<FooterComponent />
			</div>
		)
	}
}