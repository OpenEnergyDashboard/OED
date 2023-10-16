/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { UserRole } from '../../types/items';
import { Alert, Button, Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';

interface CreateUserFormProps {
	email: string;
	password: string;
	confirmPassword: string;
	doPasswordsMatch: boolean;
	role: UserRole;
	submittedOnce: boolean;
	handleEmailChange: (val: string) => void;
	handlePasswordChange: (val: string) => void;
	handleConfirmPasswordChange: (val: string) => void;
	handleRoleChange: (val: UserRole) => void;
	submitNewUser: () => void;
}

/**
 * Component that defines the form to create a new user
 * @param props defined above
 * @returns Create User element
 */
export default function CreateUserFormComponent(props: CreateUserFormProps) {

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}
	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tableStyle: React.CSSProperties = {
		marginLeft: '25%',
		marginRight: '25%',
		width: '50%'
	};

	return (
		<div className='container-fluid'>
			<h1 style={titleStyle}> <FormattedMessage id='create.user'/> </h1>
			<div style={tableStyle}>
				<form onSubmit={e => { e.preventDefault(); props.submitNewUser(); }}>
					<div style={formInputStyle}>
						<label> <FormattedMessage id='email'/> </label><br />
						<Input type='email' onChange={({ target }) => props.handleEmailChange(target.value)} required value={props.email} />
					</div>
					{props.submittedOnce && !props.doPasswordsMatch  && <Alert color='danger'>
						Error: Passwords Do Not Match
					</Alert>}
					<div style={formInputStyle}>
						<label> <FormattedMessage id='password'/> </label><br />
						<Input type='password' onChange={({ target }) => props.handlePasswordChange(target.value)} required value={props.password} />
					</div>
					<div style={formInputStyle}>
						<label> <FormattedMessage id='password.confirm'/> </label><br />
						<Input type='password' onChange={({ target }) => props.handleConfirmPasswordChange(target.value)} required value={props.confirmPassword} />
					</div>
					<div style={formInputStyle}>
						<label> <FormattedMessage id='role'/> </label><br />
						<Input type='select' onChange={({ target }) => props.handleRoleChange(target.value as UserRole)} value={props.role}>
							{Object.entries(UserRole).map(([role, val]) => (
								<option value={val} key={val}> {role} </option>
							))}
						</Input>
					</div>
					<div>
						<Button> <FormattedMessage id='submit.new.user'/> </Button>
					</div>
				</form>
			</div>
		</div>
	)
}