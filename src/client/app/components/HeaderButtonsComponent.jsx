/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Link } from 'react-router';
import { Button } from 'reactstrap';
import MenuModalComponent from './MenuModalComponent';
import { hasToken } from '../utils/token';

/**
 * React component that controls the buttons in the Header
 */
export default class HeaderButtonsComponent extends React.Component {
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
		let showUIOptions = false;
		let renderLoginButton = false;
		let renderAdminButton = false;
		let renderGroupsButton = false;
		const renderLogoutButton = hasToken();

		switch (page) {
			case '': // home page
				showUIOptions = true;
				if (renderLogoutButton) {
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
		const loginLinkStyle = {
			display: renderLoginButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const adminLinkStyle = {
			display: renderAdminButton ? 'inline' : 'none'
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
			<div>
				<div className="d-lg-none">
					{(this.props.renderOptionsButton) ?
						<MenuModalComponent
							showUIOptions={showUIOptions}
							renderOptionsButton={false}
						/> : null
					}
				</div>
				<div className={this.props.renderOptionsButton ? 'd-none d-lg-block' : ''}>
					<Link style={loginLinkStyle} to="/login"><Button outline>Log In</Button></Link>
					<Link style={adminLinkStyle} to="/admin"><Button outline>Admin panel</Button></Link>
					<Link style={groupsLinkStyle} to="/groups"><Button outline>Groups</Button></Link>
					<Link style={logoutButtonStyle} to="/"><Button outline onClick={this.handleLogOut}>Log Out</Button></Link>
				</div>
			</div>
		);
	}
}
