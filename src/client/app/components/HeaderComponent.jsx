/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import LogoComponent from './LogoComponent';
import UIModalComponent from './UIModalComponent';
import getToken from '../utils/getToken';

/**
 * React component that controls the header strip at the top of all pages
 * @param props The props passed down by the parent component
 * @return JSX to create the header strip
 */
export default class HeaderComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleLogOut = this.handleLogOut.bind(this);
	}

	handleLogOut() {
		localStorage.removeItem('token');
		this.forceUpdate();
	}

	render() {
		const urlArr = window.location.href.split('/');
		const page = urlArr[urlArr.length - 1];
		let renderOptionsButton = false;
		let renderLoginButton = false;
		let renderAdminButton = false;
		let renderGroupsButton = false;
		const renderLogoutButton = !!getToken();

		switch (page) {
			case '': // home page
				renderOptionsButton = true;
				if (getToken()) {
					renderAdminButton = true;
					renderGroupsButton = true;
				} else {
					renderLoginButton = true;
				}
				break;
			case 'groups':
				renderAdminButton = true;
				break;
			case 'admin':
				renderGroupsButton = true;
				break;
			case 'login':
				break;
			default: // Unknown page, routes to 404, show nothing
				break;

		}

		const titleStyle = {
			display: 'inline-block'
		};
		const divStyle = {
			paddingBottom: '5px'
		};
		const divRightStyle = {
			float: 'right',
			marginTop: '5px',
			display: 'flex'
		};
		const loginLinkStyle = {
			display: renderLoginButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const adminLinkStyle = {
			display: renderAdminButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const groupsLinkStyle = {
			display: renderGroupsButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const logoutButtonStyle = {
			display: renderLogoutButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};

		return (
			<div className="container-fluid" style={divStyle}>
				<div className="col-xs-4">
					<Link to="/"><LogoComponent url="./app/images/logo.png" /></Link>
				</div>
				<div className="col-xs-4 text-center">
					<h1 style={titleStyle}>{this.props.title}</h1>
				</div>
				<div style={divRightStyle}>
					<div className="visible-sm visible-xs">
						{(renderOptionsButton) ? <UIModalComponent /> : null}
					</div>
					<Link style={loginLinkStyle} to="/login"><Button bsStyle="default">Log In</Button></Link>
					<Link style={adminLinkStyle} to="/admin"><Button bsStyle="default">Admin panel</Button></Link>
					<Link style={groupsLinkStyle} to="/groups"><Button bsStyle="default">Groups</Button></Link>
					<Link style={logoutButtonStyle} to="/"><Button bsStyle="default" onClick={this.handleLogOut}>Log Out</Button></Link>
				</div>
			</div>
		);
	}
}
