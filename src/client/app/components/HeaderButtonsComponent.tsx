/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import getPage from '../utils/getPage';
import translate from '../utils/translate';
import { UserRole } from '../types/items';
import { hasPermissions, isRoleAdmin } from '../utils/hasPermissions';
import { flipLogOutState } from '../actions/unsavedWarning';
import { deleteToken } from '../utils/token';
import { clearCurrentUser } from '../actions/currentUser';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar, Nav, NavLink, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import { toggleOptionsVisibility } from '../actions/graph';

/**
 * React Component that defines the header buttons at the top of a page
 * @returns Header buttons element
 */
export default function HeaderButtonsComponent() {
	const dispatch = useDispatch();

	// Get the current page so know which one should not be shown in menu.
	const currentPage = getPage();

	// This is the state model for rendering this page.
	const defaultState = {
		// All these values should update before user interacts with them so hide everything until the useEffects
		// set to what is desired.
		// The styles control if an item is seen at all.
		adminViewableLinkStyle: {
			display: 'none'
		} as React.CSSProperties,
		csvViewableLinkStyle: {
			display: 'none'
		} as React.CSSProperties,
		loginLinkStyle: {
			display: 'none'
		} as React.CSSProperties,
		logoutLinkStyle: {
			display: 'none'
		} as React.CSSProperties,
		showOptionsStyle: {
			display: 'none'
		} as React.CSSProperties,
		// The should ones tell if see but not selectable.
		shouldHomeButtonDisabled: true,
		shouldAdminButtonDisabled: true,
		shouldGroupsButtonDisabled: true,
		shouldMetersButtonDisabled: true,
		shouldMapsButtonDisabled: true,
		shouldCSVButtonDisabled: true,
		shouldUnitsButtonDisabled: true,
		shouldConversionsButtonDisabled: true,
		// Translated menu title that depend on whether logged in.
		menuTitle: ''
	};

	// Local state for rendering.
	const [state, setState] = useState(defaultState);
	// Information on the current user.
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	// Tracks unsaved changes.
	const unsavedChangesState = useSelector((state: State) => state.unsavedWarning.hasUnsavedChanges);
	// whether to collapse options when on graphs page
	const optionsVisibility = useSelector((state: State) => state.graph.optionsVisibility);
	// OED version is needed for help redirect
	const version = useSelector((state: State) => state.version.version);

	// This updates which page is disabled because it is the one you are on.
	useEffect(() => {
		setState(prevState => ({
			...prevState,
			shouldHomeButtonDisabled: currentPage === '',
			shouldAdminButtonDisabled: currentPage === 'admin',
			shouldGroupsButtonDisabled: currentPage === 'groups',
			shouldMetersButtonDisabled: currentPage === 'meters',
			shouldMapsButtonDisabled: currentPage === 'maps',
			shouldCSVButtonDisabled: currentPage === 'csv',
			shouldUnitsButtonDisabled: currentPage === 'units',
			shouldConversionsButtonDisabled: currentPage === 'conversions'
		}));
	}, [currentPage]);

	// This updates which items are hidden based on the login status.
	useEffect(() => {
		// True if you are an admin.
		let loggedInAsAdmin: boolean;
		// What role you have or null if not logged in.
		// We can get the admin state from the role but separate the two.
		let role: UserRole | null;
		let currentMenuTitle: string;
		if (currentUser !== null) {
			// There is a current user so gets its information
			loggedInAsAdmin = isRoleAdmin(currentUser.role);
			role = currentUser.role;
			// The menu title has logout.
			currentMenuTitle = translate('page.choice.logout');
		} else {
			// You are not logged in.
			loggedInAsAdmin = false;
			role = null;
			// The menu title has login.
			currentMenuTitle = translate('page.choice.login');
		}
		// If you have a role then check if it is CSV.
		const renderCSVButton = Boolean(role && hasPermissions(role, UserRole.CSV));
		// If no role then not logged in so show link to log in.
		const renderLoginButton = role === null;
		// If an admin then show these items, otherwise hide them.
		const currentAdminViewableLinkStyle = {
			display: loggedInAsAdmin ? 'block' : 'none'
		};
		// Similar but need to have CSV permissions.
		const currentCsvViewableLinkStyle: React.CSSProperties = {
			display: renderCSVButton ? 'block' : 'none'
		};
		// Show login if not and logout if you are.
		const currentLoginLinkStyle = {
			display: renderLoginButton ? 'block' : 'none'
		};
		const currentLogoutLinkStyle = {
			display: !renderLoginButton ? 'block' : 'none'
		};
		const currentShowOptionsStyle = {
			display: currentPage === '' ? 'block' : 'none'
		}
		setState(prevState => ({
			...prevState,
			adminViewableLinkStyle: currentAdminViewableLinkStyle,
			csvViewableLinkStyle: currentCsvViewableLinkStyle,
			loginLinkStyle: currentLoginLinkStyle,
			logoutLinkStyle: currentLogoutLinkStyle,
			menuTitle: currentMenuTitle,
			showOptionsStyle: currentShowOptionsStyle
		}));
	}, [currentUser]);

	// Handle actions on logout.
	const handleLogOut = () => {
		if (unsavedChangesState) {
			// Unsaved changes so deal with them and then it takes care of logout.
			dispatch(flipLogOutState());
		} else {
			// Remove token so has no role.
			deleteToken();
			// Clean up state since lost your role.
			dispatch(clearCurrentUser());
		}
	};

	return (
		<div>
			<Navbar expand>
				<Nav navbar>
					<NavLink
						disabled={state.shouldHomeButtonDisabled}
						tag={Link}
						to="/">
						<FormattedMessage id='graph' />
					</NavLink>
					<UncontrolledDropdown nav inNavbar>
						<DropdownToggle nav caret>
							<FormattedMessage id='header.pages' />
						</DropdownToggle>
						<DropdownMenu>
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldConversionsButtonDisabled}
								tag={Link}
								to="/conversions">
								<FormattedMessage id='conversions' />
							</DropdownItem>
							<DropdownItem
								style={state.csvViewableLinkStyle}
								disabled={state.shouldCSVButtonDisabled}
								tag={Link}
								to="/csv">
								<FormattedMessage id='csv' />
							</DropdownItem>
							<DropdownItem
								disabled={state.shouldGroupsButtonDisabled}
								tag={Link}
								to="/groups">
								<FormattedMessage id='groups' />
							</DropdownItem>
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldMapsButtonDisabled}
								tag={Link}
								to="/maps">
								<FormattedMessage id='maps' />
							</DropdownItem>
							<DropdownItem
								disabled={state.shouldMetersButtonDisabled}
								tag={Link}
								to="/meters">
								<FormattedMessage id='meters' />
							</DropdownItem>
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldUnitsButtonDisabled}
								tag={Link}
								to="/units">
								<FormattedMessage id='units' />
							</DropdownItem>
							<DropdownItem divider style={state.adminViewableLinkStyle} />
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldAdminButtonDisabled}
								tag={Link}
								to="/admin">
								<FormattedMessage id='admin.panel' />
							</DropdownItem>
						</DropdownMenu>
					</UncontrolledDropdown>
					<UncontrolledDropdown nav inNavbar>
						<DropdownToggle nav caret>
							<FormattedMessage id='header.options' />
						</DropdownToggle>
						<DropdownMenu>
							<LanguageSelectorComponent />
							<DropdownItem
								style={state.showOptionsStyle}
								onClick={() => dispatch(toggleOptionsVisibility())}>
								<FormattedMessage id={optionsVisibility ? 'hide.options' : 'show.options'} />
							</DropdownItem>
							<DropdownItem divider />
							<DropdownItem
								style={state.loginLinkStyle}
								tag={Link}
								to='/login'>
								<FormattedMessage id='log.in' />
							</DropdownItem>
							<DropdownItem
								style={state.logoutLinkStyle}
								tag={Link}
								to='/'
								onClick={handleLogOut}>
								<FormattedMessage id='log.out' />
							</DropdownItem>
						</DropdownMenu>
					</UncontrolledDropdown>
					<NavLink
						href={'https://openenergydashboard.github.io/help/' + version}>
						<FormattedMessage id='help' />
					</NavLink>
				</Nav>
			</Navbar>
		</div>
	);
}