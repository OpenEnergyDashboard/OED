/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import axios from 'axios';
import { browserHistory } from 'react-router';
import HeaderComponent from './HeaderComponent';

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
			browserHistory.push('/admin');
		})
		.catch(console.error);
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
				<HeaderComponent renderLoginButton={false} />
				<form style={formStyle} onSubmit={this.handleSubmit}>
					<div className="input-group">
						<span className="input-group-addon"><i className="glyphicon glyphicon-user" /></span>
						<input type="text" className="form-control" placeholder="Email" value={this.state.email} onChange={this.handleEmailChange} />
					</div>
					<div className="input-group">
						<span className="input-group-addon"><i className="glyphicon glyphicon-lock" /></span>
						<input type="password" className="form-control" placeholder="Password" value={this.state.password} onChange={this.handlePasswordChange} />
					</div>
					<input style={buttonStyle} className="btn btn-default" type="submit" value="Login" />
				</form>
			</div>
		);
	}
}
