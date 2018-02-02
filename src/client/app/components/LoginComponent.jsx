/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import axios from 'axios';
import { browserHistory } from 'react-router';
import { Input, Button, InputGroup, Form } from 'reactstrap';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import { showErrorNotification } from '../utils/notifications';


export default class LoginComponent extends React.Component {
	/**
	 * Initializes the component's state to include email (email users use to login) and password (corresponding to their email)
	 * Binds the functions to 'this' LoginComponent
	 */
	constructor(props) {
		super(props);
		this.state = { email: '', password: '' };
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	/**
	 * Sets the email state whenever the user changes the email input field
	 * @param e The event fired
	 */
	handleEmailChange(e) {
		this.setState({ email: e.target.value });
	}

	/**
	 * Sets the password state whenever the user changes the password input field
	 * @param e The event fired
	 */
	handlePasswordChange(e) {
		this.setState({ password: e.target.value });
	}

	/**
	 * Makes a GET request to the login api whenever the user click the submit button, then clears the state
	 * If the request is successful, the JWT auth token is stored in local storage and the app routes to the admin page
	 * @param e The event fired
	 */
	handleSubmit(e) {
		e.preventDefault();
		axios.post('/api/login/', {
			email: this.state.email,
			password: this.state.password
		})
		.then(response => {
			localStorage.setItem('token', response.data.token);
			browserHistory.push('/');
		})
		.catch(err => {
			if (err.response.status === 401) {
				showErrorNotification('Invalid email/password combination');
			} else {
				// If there was a problem other than a lack of authorization, the user can't fix it.
				// Log it to the console for developer use.
				console.error(err); // eslint-disable-line no-console
			}
			this.inputEmail.focus();
		});
		this.setState({ email: '', password: '' });
	}

	/**
	 * @return JSX to create the login panel
	 */
	render() {
		const formStyle = {
			maxWidth: '500px',
			margin: 'auto',
			width: '50%'
		};
		const buttonStyle = {
			marginTop: '10px'
		};
		return (
			<div>
				<HeaderContainer />
				<Form style={formStyle}>
					<InputGroup>
						<Input
							type="text"
							placeholder="Email"
							innerRef={c => { this.inputEmail = c; }}
							value={this.state.email}
							onChange={this.handleEmailChange}
						/>
					</InputGroup>
					<InputGroup>
						<Input
							type="password"
							placeholder="Password"
							value={this.state.password}
							onChange={this.handlePasswordChange}
						/>
					</InputGroup>
					<Button outline style={buttonStyle} type="submit" onClick={this.handleSubmit}>Submit</Button>
				</Form>
				<FooterComponent />
			</div>
		);
	}
}
