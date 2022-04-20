/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import MenuModalComponent from './MenuModalComponent';
import { hasToken } from '../utils/token';
import getPage from '../utils/getPage';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import TooltipHelpContainerAlternative from '../containers/TooltipHelpContainerAlternative';
import { UserRole } from '../types/items';
import { hasPermissions } from '../utils/hasPermissions';
import { FlipLogOutStateAction } from '../types/redux/unsavedWarning';

interface HeaderButtonsProps {
	showCollapsedMenuButton: boolean;
	loggedInAsAdmin: boolean;
	role: UserRole | null;
	hasUnsavedChanges: boolean;
	handleLogOut: () => any;
	flipLogOutState(): FlipLogOutStateAction;
}

/**
 * React component that controls the buttons in the Header
 */
export default class HeaderButtonsComponent extends React.Component<HeaderButtonsProps, {}> {
	constructor(props: HeaderButtonsProps) {
		super(props);
		this.handleLogOut = this.handleLogOut.bind(this);
	}

	public render() {
		const role = this.props.role;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		const showOptions = getPage() === '';
		const renderLoginButton = !hasToken();
		const renderHomeButton = getPage() !== '';
		const renderAdminButton = loggedInAsAdmin && getPage() !== 'admin';
		const renderGroupsButton = getPage() !== 'groups';
		const renderMetersButton = getPage() !== 'meters';
		const renderMapsButton = loggedInAsAdmin && getPage() !== 'maps';
		const renderCSVButton = role && hasPermissions(role, UserRole.CSV) && getPage() !== 'csv';
		const renderLogoutButton = hasToken();

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
		const csvLinkStyle: React.CSSProperties = {
			display: renderCSVButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const groupsLinkStyle: React.CSSProperties = {
			display: renderGroupsButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const metersLinkStyle: React.CSSProperties = {
			display: renderMetersButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const mapsLinkStyle: React.CSSProperties = {
			display: renderMapsButton ? 'inline' : 'none',
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
					<TooltipHelpContainerAlternative page='all' />
					<TooltipMarkerComponent page='all' helpTextId='help.home.header' />
					<Link style={adminLinkStyle} to='/admin'><Button outline><FormattedMessage id='admin.panel'/></Button></Link>
					<Link style={groupsLinkStyle} to='/groups'><Button outline><FormattedMessage id='groups' /></Button></Link>
					<Link style={metersLinkStyle} to='/meters'><Button outline><FormattedMessage id='meters' /></Button></Link>
					<Link style={mapsLinkStyle} to='/maps'><Button outline><FormattedMessage id='maps' /></Button></Link>
					<Link style={csvLinkStyle} to='/csv'><Button outline><FormattedMessage id='csv'/></Button></Link>
					<Link style={homeLinkStyle} to='/'><Button outline><FormattedMessage id='home'/></Button></Link>
					<Link style={loginLinkStyle} to='/login'><Button outline><FormattedMessage id='log.in'/></Button></Link>
					<Link style={logoutButtonStyle} to='/'><Button outline onClick={this.handleLogOut}><FormattedMessage id='log.out'/></Button></Link>
					<Link style={metersLinkStyle} to='/conversions'><Button outline><FormattedMessage id='conversions'/></Button></Link>
				</div>
			</div>
		);
	}

	private handleLogOut() {
		if (this.props.hasUnsavedChanges) {
			this.props.flipLogOutState();
		} else {
			// Normally log out if there are no unsaved changes
			this.props.handleLogOut();
			this.forceUpdate();
		}
	}
}
