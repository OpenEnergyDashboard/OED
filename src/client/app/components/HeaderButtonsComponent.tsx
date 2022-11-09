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
import TooltipHelpContainer from '../containers/TooltipHelpContainer';
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
export default class HeaderButtonsComponent extends React.Component<HeaderButtonsProps> {
	constructor(props: HeaderButtonsProps) {
		super(props);
		this.handleLogOut = this.handleLogOut.bind(this);
	}

	public render() {
		const role = this.props.role;
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		const showOptions = getPage() === '';
		const renderLoginButton = !hasToken();
		const shouldHomeButtonDisabled = getPage() === '';
		const shouldAdminButtonDisabled = getPage() === 'admin';
		const shouldGroupsButtonDisabled = getPage() === 'groups';
		const shouldMetersButtonDisabled = getPage() === 'meters';
		const shouldMapsButtonDisabled = getPage() === 'maps';
		const shouldCSVButtonDisabled = getPage() === 'csv';
		const renderCSVButton =  Boolean(role && hasPermissions(role, UserRole.CSV));
		const shouldUnitsButtonDisabled = getPage() === 'units';
		const shouldConversionsButtonDisabled = getPage() === 'conversions';

		const linkStyle: React.CSSProperties = {
			display: 'inline',
			paddingLeft: '5px'
		};
		const loginLinkStyle: React.CSSProperties = {
			display: renderLoginButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const adminViewableLinkStyle: React.CSSProperties = {
			display: loggedInAsAdmin ? 'inline' : 'none',
			paddingLeft: '5px'
		};
		const csvLinkStyle: React.CSSProperties = {
			display: renderCSVButton ? 'inline' : 'none',
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
					<TooltipHelpContainer page='all' />
					<TooltipMarkerComponent page='all' helpTextId='help.home.header' />
					<Link
						style={adminViewableLinkStyle}
						to='/admin'>
						<Button disabled={shouldAdminButtonDisabled}
							outline><FormattedMessage id='admin.panel' />
						</Button>
					</Link>
					<Link
						style={adminViewableLinkStyle}
						to='/conversions'>
						<Button disabled={shouldConversionsButtonDisabled}
							outline><FormattedMessage id='conversions' />
						</Button>
					</Link>
					<Link
						style={csvLinkStyle}
						to='/csv'>
						<Button disabled={shouldCSVButtonDisabled}
							outline><FormattedMessage id='csv' />
						</Button>
					</Link>
					<Link
						style={linkStyle}
						to='/groups'>
						<Button disabled={shouldGroupsButtonDisabled}
							outline><FormattedMessage id='groups' />
						</Button>
					</Link>
					<Link
						style={linkStyle}
						to='/'>
						<Button disabled={shouldHomeButtonDisabled}
							outline><FormattedMessage id='home' />
						</Button>
					</Link>
					<Link
						style={adminViewableLinkStyle}
						to='/maps'>
						<Button disabled={shouldMapsButtonDisabled}
							outline><FormattedMessage id='maps' />
						</Button>
					</Link>
					<Link
						style={linkStyle}
						to='/meters'>
						<Button disabled={shouldMetersButtonDisabled}
							outline><FormattedMessage id='meters' />
						</Button>
					</Link>
					<Link
						style={adminViewableLinkStyle}
						to='/units'>
						<Button disabled={shouldUnitsButtonDisabled}
							outline><FormattedMessage id='units' />
						</Button>
					</Link>
					<Link
						style={loginLinkStyle}
						to='/login'>
						<Button outline><FormattedMessage id='log.in' />
						</Button>
					</Link>
					<Link
						style={adminViewableLinkStyle}
						to='/'>
						<Button outline onClick={this.handleLogOut}><FormattedMessage id='log.out' />
						</Button>
					</Link>
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
