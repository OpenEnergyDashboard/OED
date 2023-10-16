/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { browserHistory } from '../utils/history';
import { injectIntl, FormattedMessage, WrappedComponentProps } from 'react-intl';
import { Input, Button, Form, Label, FormGroup } from 'reactstrap';
import FooterContainer from '../containers/FooterContainer';
import { showErrorNotification } from '../utils/notifications';
import { verificationApi } from '../utils/api';
import translate from '../utils/translate';
import { User } from '../types/items';
import HeaderComponent from './HeaderComponent';

interface LoginState {
	email: string;
	password: string;
}

interface LoginProps {
	saveCurrentUser(profile: User): any;
}

type LoginPropsWithIntl = LoginProps & WrappedComponentProps;

class LoginComponent extends React.Component<LoginPropsWithIntl, LoginState> {
	private inputEmail: HTMLInputElement | HTMLTextAreaElement | null;

	constructor(props: LoginPropsWithIntl) {
		super(props);
		this.state = { email: '', password: '' };
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.saveCurrentUser = this.saveCurrentUser.bind(this);
	}

	/**
	 * @returns JSX to create the login panel
	 */
	public render() {
		const formStyle = {
			maxWidth: '500px',
			margin: 'auto',
			width: '50%'
		};

		return (
			<div>
				<HeaderComponent />
				<Form style={formStyle}>
					<FormGroup>
						<Label for='email'>{translate('email')}</Label>
						<Input
							id='email'
							type='text'
							autoComplete='email'
							innerRef={c => { this.inputEmail = c; }}
							value={this.state.email}
							onChange={this.handleEmailChange}
						/>
					</FormGroup>
					<FormGroup>
						<Label for='password'>{translate('password')}</Label>
						<Input
							id='password'
							type='password'
							autoComplete='current-password'
							value={this.state.password}
							onChange={this.handlePasswordChange}
						/>
					</FormGroup>
					<Button
						outline
						type='submit'
						onClick={this.handleSubmit}
						disabled={this.state.email.length === 0 || this.state.password.length === 0}
					>
						<FormattedMessage id='submit' />
					</Button>
				</Form>
				<FooterContainer />
			</div>
		);
	}

	/**
	 * Sets the email state whenever the user changes the email input field
	 * @param e The event fired
	 */
	private handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ email: e.target.value });
	}

	/**
	 * Sets the password state whenever the user changes the password input field
	 * @param e The event fired
	 */
	private handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ password: e.target.value });
	}

	private saveCurrentUser(profile: User) {
		this.props.saveCurrentUser(profile);
	}

	/**
	 * Makes a GET request to the login api whenever the user click the submit button, then clears the state
	 * If the request is successful, the JWT auth token is stored in local storage and the app routes to the admin page
	 * @param e The event fired
	 */
	private handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		(async () => {
			try {
				const loginResponse = await verificationApi.login(this.state.email, this.state.password);
				localStorage.setItem('token', loginResponse.token);
				this.saveCurrentUser({ email: loginResponse.email, role: loginResponse.role });
				browserHistory.push('/');
			} catch (err) {
				if (err.response && err.response.status === 401) {
					showErrorNotification(translate('invalid.email.password'));
				} else {
					// If there was a problem other than a lack of authorization, the user can't fix it.
					// This is an irrecoverable state, so just throw an error and let the user know something went wrong
					showErrorNotification(translate('failed.logging.in'));
					throw err;
				}
				if (this.inputEmail !== null) {
					this.inputEmail.focus();
				}
			}
		})();
		this.setState({ email: '', password: '' });
	}
}

export default injectIntl(LoginComponent);