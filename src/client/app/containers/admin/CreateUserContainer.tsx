/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';
import CreateUserComponent from '../../components/admin/CreateUserComponent';
import { UserRole } from '../../types/items';
import { usersApi } from '../../utils/api';
import { browserHistory } from '../../utils/history';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';

export default class CreateUserFormContainer extends React.Component<{}, {}>{
	constructor(props: {}) {
		super(props);
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(this);
		this.handleRoleChange = this.handleRoleChange.bind(this);
		this.submitNewUser = this.submitNewUser.bind(this);
	}

	state = {
		email: '',
		password: '',
		confirmPassword: '',
		role: UserRole.ADMIN,
		submittedOnce: false
	}

	private handleEmailChange = (newEmail: string) => {
		this.setState({ email: newEmail })
	}
	private handlePasswordChange = (newPassword: string) => {
		this.setState({ password: newPassword })
	}
	private handleConfirmPasswordChange = (newConfirmPassword: string) => {
		this.setState({ confirmPassword: newConfirmPassword })
	}
	private handleRoleChange = (newRole: UserRole) => {
		this.setState({ role: newRole })
	}
	private submitNewUser = async () => {
		this.setState({ submittedOnce: true })
		if (this.state.password === this.state.confirmPassword) {
			try {
				await usersApi.createUser({
					email: this.state.email,
					password: this.state.password,
					role: this.state.role
				});
				showSuccessNotification(translate('users.successfully.create.user'))
				browserHistory.push('/users');
			} catch (error) {
				showErrorNotification(translate('users.failed.to.create.user'));
			}
		}
	}
	public render() {
		return (
			<div>
				<HeaderContainer />
				<CreateUserComponent
					email={this.state.email}
					password={this.state.password}
					confirmPassword={this.state.confirmPassword}
					doPasswordsMatch={this.state.password === this.state.confirmPassword}
					role={this.state.role}
					submittedOnce={this.state.submittedOnce}
					handleEmailChange={this.handleEmailChange}
					handlePasswordChange={this.handlePasswordChange}
					handleConfirmPasswordChange={this.handleConfirmPasswordChange}
					handleRoleChange={this.handleRoleChange}
					submitNewUser={this.submitNewUser}
				/>
				<FooterContainer />
			</div>
		)
	}
}