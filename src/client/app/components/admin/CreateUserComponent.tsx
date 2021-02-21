/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { UserRole } from '../../types/items';
import { Button } from 'reactstrap';

interface CreateUserFormProps {
	email: string;
	password: string;
	confirmPassword: string;
	role: UserRole;
	doPasswordsMatch: boolean;
	handleEmailChange: (val: string) => void;
	handlePasswordChange: (val: string) => void;
	handleConfirmPasswordChange: (val: string) => void;
	handleRoleChange: (val: UserRole) => void;
	submitNewUser: () => void;
}

export default function CreateUserFormComponent(props: CreateUserFormProps) {
	const errorStyle: React.CSSProperties = {
		border: '2px solid red',
		color: 'red',
		width: '50%'
	}

	const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}
	return (
		<div>
			<form onSubmit={e => { e.preventDefault(); props.submitNewUser(); }}>
				<div style={formInputStyle}>
					<label> Email </label><br />
					<input type='email' onChange={({ target }) => props.handleEmailChange(target.value)} required value={props.email} />
				</div>
				{!props.doPasswordsMatch && <div style={errorStyle}>
					Error: Passwords Do Not Match
			</div>}
				<div style={formInputStyle}>
					<label> Password </label><br />
					<input type='password' onChange={({ target }) => props.handlePasswordChange(target.value)} required value={props.password} />
				</div>
				<div style={formInputStyle}>
					<label> Confirm password </label><br />
					<input type='password' onChange={({ target }) => props.handleConfirmPasswordChange(target.value)} required value={props.confirmPassword} />
				</div>
				<div style={formInputStyle}>
					<label> Role </label><br />
					<select onChange={({ target }) => props.handleRoleChange(target.value)} value={props.role}>
						{Object.entries(UserRole).map(([role, val]) => (
							<option value={val}> {role} </option>
						))}
					</select>
				</div>
				<div>
					<Button> Submit new user </Button>
				</div>
			</form>
		</div>
	)
}