/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import { User, UserRole } from '../../types/items';
import UserDetailComponent from '../../components/admin/UsersDetailComponent';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';
import { usersApi } from '../../utils/api';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';

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
		this.deleteUser = this.deleteUser.bind(this);
		this.editUser = this.editUser.bind(this);
		this.fetchUsers = this.fetchUsers.bind(this);
		this.submitUserEdits = this.submitUserEdits.bind(this);
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

	private editUser(email: string, newRole: UserRole) {
		const newUsers = _.cloneDeep<User[]>(this.state.users);
		const targetUser = newUsers.find(user => user.email === email);
		if (targetUser !== undefined) {
			targetUser.role = newRole;
			this.setState(prevState => ({
				users: newUsers,
				history: [...prevState.history, newUsers]
			}));
		}
	}

	private async submitUserEdits() {
		try {
			await usersApi.editUsers(this.state.users);
			showSuccessNotification(translate('users.successfully.edit.users'));
			this.setState(currentState => ({
				history: [_.cloneDeep<User[]>(currentState.users)]
			}));
		} catch (error) {
			showErrorNotification(translate('users.failed.to.edit.users'));
		}
	}

	private async deleteUser(email: string) {
		try {
			await usersApi.deleteUser(email);
			const users = await this.fetchUsers();
			this.setState({ users });
			showSuccessNotification(translate('users.successfully.delete.user'));
		} catch (error) {
			showErrorNotification(translate('users.failed.to.delete.user'));
		}
	}

	public render() {
		return (
			<div>
				<HeaderContainer />
				<UserDetailComponent
					deleteUser={this.deleteUser}
					edited={!_.isEqual(this.state.users, this.state.history[0])}
					editUser={this.editUser}
					users={this.state.users}
					submitUserEdits={this.submitUserEdits}
				/>
				<FooterContainer />
			</div>
		)
	}
}