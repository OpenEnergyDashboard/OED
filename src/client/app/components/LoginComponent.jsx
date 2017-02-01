import React from 'react';
import axios from 'axios';

export default class LoginComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = { email: '', password: '' };

		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleEmailChange(e) {
		this.setState({ email: e.target.value });
	}

	handlePasswordChange(e) {
		this.setState({ password: e.target.value });
	}

	handleSubmit(e) {
		e.preventDefault();
		axios.post('/api/login/', {
			email: this.state.email,
			password: this.state.password
		})
		.then(response => {
			console.log(response);
		})
		.catch(error => {
			console.log(error);
		});
	}

	render() {
		const formStyle = {
			maxWidth: '200px',
			float: 'right',
			marginRight: '75px'
		};
		return (
			<form style={formStyle} onSubmit={this.handleSubmit}>
				<div className="input-group">
					<span className="input-group-addon"><i className="glyphicon glyphicon-user" /></span>
					<input type="text" className="form-control" placeholder="Email" value={this.state.value} onChange={this.handleEmailChange} />
				</div>
				<div className="input-group">
					<span className="input-group-addon"><i className="glyphicon glyphicon-lock" /></span>
					<input type="password" className="form-control" placeholder="Password" value={this.state.value} onChange={this.handlePasswordChange} />
				</div>
				<input className="btn btn-default" type="submit" value="Login" />
			</form>
		);
	}
}
