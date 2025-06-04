/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { authApi } from '../redux/api/authApi';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';
import { useTranslate } from '../redux/componentHooks';


interface LoginProp {
	handleClose: () => void;
}

/**
 * @param handleClose Function to close modal after login
 * @param handleClose.handleClose Needed by ESLint see above
 * @returns The login page for users or admins.
 */
export default function LoginComponent({ handleClose }: LoginProp) {
	const translate = useTranslate();
	// Local State
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	// Html Element Reference used for focus()
	const inputRef = useRef<HTMLInputElement>(null);

	// Grab the derived loginMutation from the API
	// The naming of the returned objects is arbitrary
	// Equivalent Auto-Derived Method
	const [login] = authApi.endpoints.login.useMutation(); // authApi.useLoginMutation()

	const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		await login({ username: username, password: password })
			.unwrap()
			.then(() => {
				// No error, success!
				showSuccessNotification(translate('login.success'));
				handleClose();
			})
			.catch(() => {
				// Error on login Mutation
				inputRef.current?.focus();
				showErrorNotification(translate('login.failed'));
			});
	};

	return (
		<div>
			<Form style={formStyle}>
				<FormGroup>
					<Label for='username'>{translate('username')}</Label>
					<Input
						id='username'
						type='text'
						autoComplete='username'
						value={username}
						onChange={e => setUsername(e.target.value)}
					/>
				</FormGroup>
				<FormGroup>
					<Label for='password'>{translate('password')}</Label>
					<Input
						id='password'
						type='password'
						autoComplete='current-password'
						value={password}
						onChange={e => setPassword(e.target.value)}
						innerRef={inputRef}
					/>
				</FormGroup>
				<div className='row'>
					<div className='col'>
						<Button
							outline
							type='submit'
							onClick={handleSubmit}
							disabled={!username.length || !password.length}
						>
							<FormattedMessage id='submit' />
						</Button>
					</div>
					<div className='col'>
						<Button
							outline
							type='button'
							onClick={handleClose}
						>
							<FormattedMessage id='close' />
						</Button>
					</div>
				</div>


			</Form>
		</div>
	);
}

const formStyle = {
	maxWidth: '500px',
	margin: 'auto',
	width: '50%'
};
