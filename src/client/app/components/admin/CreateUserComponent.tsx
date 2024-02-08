/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Alert, Button, Input } from 'reactstrap';
import { userApi } from '../../redux/api/userApi';
import { NewUser, UserRole } from '../../types/items';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { useNavigate } from 'react-router-dom';


/**
 * Component that defines the form to create a new user
 * @returns Create User Page
 */
export default function CreateUserComponent() {
	const [email, setEmail] = React.useState<string>('');
	const [password, setPassword] = React.useState<string>('');
	const [confirmPassword, setConfirmPassword] = React.useState<string>('');
	const [passwordMatch, setPasswordMatch] = React.useState<boolean>(true);
	const [role, setRole] = React.useState<UserRole>(UserRole.ADMIN);
	const [createUser] = userApi.useCreateUserMutation();
	const nav = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password == confirmPassword) {
			setPasswordMatch(true)
			const newUser: NewUser = { email, role, password }
			createUser(newUser)
				.unwrap()
				.then(() => {
					showSuccessNotification(translate('users.successfully.create.user'))
					nav('/users')

				})
				.catch(() => {
					showErrorNotification(translate('users.failed.to.create.user'));
				})
		} else {
			setPasswordMatch(false)
		}

	}
	return (
		<div>
			<div className='container-fluid'>
				<h1 style={titleStyle}> <FormattedMessage id='create.user' /> </h1>
				<div style={tableStyle}>
					<form onSubmit={handleSubmit}>
						<div style={formInputStyle}>
							<label> <FormattedMessage id='email' /> </label><br />
							<Input type='email' onChange={({ target }) => setEmail(target.value)} required value={email} />
						</div>
						{!passwordMatch && <Alert color='danger'>Error: Passwords Do Not Match</Alert>}
						<div style={formInputStyle}>
							<label> <FormattedMessage id='password' /> </label><br />
							<Input type='password' onChange={({ target }) => setPassword(target.value)} required value={password} />
						</div>
						<div style={formInputStyle}>
							<label> <FormattedMessage id='password.confirm' /> </label><br />
							<Input type='password' onChange={({ target }) => setConfirmPassword(target.value)} required value={confirmPassword} />
						</div>
						<div style={formInputStyle}>
							<label> <FormattedMessage id='role' /> </label><br />
							<Input type='select' onChange={({ target }) => setRole(target.value as UserRole)} value={role}>
								{Object.entries(UserRole).map(([role, val]) => (
									<option value={val} key={val}> {role} </option>
								))}
							</Input>
						</div>
						<div>
							<Button> <FormattedMessage id='submit.new.user' /> </Button>
						</div>
					</form>
				</div>
			</div>
		</div>

	)
}
const formInputStyle: React.CSSProperties = {
	paddingBottom: '5px'
};
const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tableStyle: React.CSSProperties = {
	marginLeft: '25%',
	marginRight: '25%',
	width: '50%'
};