/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import MenuModalComponent from './MenuModalComponent';
import { hasToken } from '../utils/token';
import getPage from '../utils/getPage';

interface HeaderButtonsProps {
	showCollapsedMenuButton: boolean;
}

/**
 * React component that controls the buttons in the Header
 */
export default class HeaderButtonsComponent extends React.Component<HeaderButtonsProps, {}> {
	constructor(props: HeaderButtonsProps) {
		super(props);
		this.handleLogOut = this.handleLogOut.bind(this);
	}
	
	/*
	 * @returns HTML code to render components for header button.
	 * TODO: confirm this.
	 */
	public render() {
		let showOptions = false;
		let renderLoginButton = false;
		let renderHomeButton = true;
		let renderAdminButton = false;
		let renderGroupsButton = true;
		const renderLogoutButton = hasToken();

		switch (getPage()) {
			case '': // home page
				renderHomeButton = false;
				showOptions = true;
				if (renderLogoutButton) {
					renderAdminButton = true;
				} else {
					renderLoginButton = true;
				}
				break;
			case 'groups':
				renderAdminButton = true;
				renderGroupsButton = false;
				break;
			case 'login':
				break;
			default: // Unknown page, routes to 404, show nothing
				break;

		}
		const loginLinkStyle: React.CSSProperties = {
			display: renderLoginButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const homeLinkStyle: React.CSSProperties = {
			display: renderHomeButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const adminLinkStyle: React.CSSProperties = {
			display: renderAdminButton ? 'inline' : 'none'
		};
		const groupsLinkStyle: React.CSSProperties = {
			display: renderGroupsButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const logoutButtonStyle: React.CSSProperties = {
			display: renderLogoutButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};

		return (
			<div>
				<div className='d-lg-none'>
					{(this.props.showCollapsedMenuButton) ?
						<MenuModalComponent
							showOptions={showOptions}
							showCollapsedMenuButton={false}
						/> : null
					}
				</div>
				<div className={this.props.showCollapsedMenuButton ? 'd-none d-lg-block' : ''}>
					<Link style={adminLinkStyle} to='/admin'><Button outline><FormattedMessage id='admin.panel'/></Button></Link>
					<Link style={groupsLinkStyle} to='/groups'><Button outline><FormattedMessage id='groups' /></Button></Link>
					<Link style={loginLinkStyle} to='/login'><Button outline><FormattedMessage id='log.in'/></Button></Link>
					<Link style={homeLinkStyle} to='/'><Button outline><FormattedMessage id='home'/></Button></Link>
					<Link style={logoutButtonStyle} to='/'><Button outline onClick={this.handleLogOut}><FormattedMessage id='log.out'/></Button></Link>
				</div>
			</div>
		);
	}

	private handleLogOut() {
		localStorage.removeItem('token');
		this.forceUpdate();
	}
}
