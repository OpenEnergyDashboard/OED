/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState, useEffect } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import MenuModalComponent from './MenuModalComponent';
import getPage from '../utils/getPage';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import TooltipHelpContainer from '../containers/TooltipHelpContainer';
import { UserRole } from '../types/items';
import { hasPermissions, isRoleAdmin } from '../utils/hasPermissions';
import { flipLogOutState } from '../actions/unsavedWarning';
import { deleteToken } from '../utils/token';
import { clearCurrentUser } from '../actions/currentUser';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';

export default function HeaderButtonsComponent(args: { showCollapsedMenuButton: boolean, isModal: boolean }) {
	const dispatch = useDispatch();

	// Tracks modal or not so helps works as desired.
	const dataFor = args.isModal ? 'all-modal' : 'all';
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
		// The should ones tell if see but not selectable.
		shouldHomeButtonDisabled: true,
		shouldAdminButtonDisabled: true,
		shouldGroupsButtonDisabled: true,
		shouldMetersButtonDisabled: true,
		shouldMapsButtonDisabled: true,
		shouldCSVButtonDisabled: true,
		shouldUnitsButtonDisabled: true,
		shouldConversionsButtonDisabled: true,
		// Controls if the options are shown on the right side for some pages.
		showOptions: false
	};

	// Local state for rendering.
	const [state, setState] = useState(defaultState);
	// Information on the current user.
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	// Tracks unsaved changes.
	const unsavedChangesState = useSelector((state: State) => state.unsavedWarning.hasUnsavedChanges);

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
			shouldConversionsButtonDisabled: currentPage === 'conversions',
			showOptions: currentPage === ''
		}));
	}, [currentPage]);

	// This updates which items are hidden based on the login status.
	useEffect(() => {
		// True if you are an admin.
		let loggedInAsAdmin: boolean;
		// What role you have or null if not logged in.
		// We can get the admin state from the role but separate the two.
		let role: UserRole | null;
		if (currentUser !== null) {
			// There is a current user so gets its information
			loggedInAsAdmin = isRoleAdmin(currentUser.role);
			role = currentUser.role;
		} else {
			// You are not logged in.
			loggedInAsAdmin = false;
			role = null;
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
		setState(prevState => ({
			...prevState,
			adminViewableLinkStyle: currentAdminViewableLinkStyle,
			csvViewableLinkStyle: currentCsvViewableLinkStyle,
			loginLinkStyle: currentLoginLinkStyle,
			logoutLinkStyle: currentLogoutLinkStyle
		}));
	}, [currentUser]);

	// Style for dropdown
	const dropAlign: React.CSSProperties = {
		right: 0,
		margin: 0
	};

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

	// TODO: There is an issue where the modal is appearing above the dropdown menu since using the
	// css property, display:, will cause an error that prevents the menu from displaying properly.
	// TODO: There is an issue where the question modal will only appear once after clicking on it.
	// It also cuts off part of the help text box.

	return (
		<div>
			<div className="d-lg-none">
				{args.showCollapsedMenuButton ? (
					<MenuModalComponent
						showOptions={state.showOptions}
						showCollapsedMenuButton={false}
					/>
				) : null}
			</div>
			<div className={args.showCollapsedMenuButton ? 'd-none d-lg-block' : ''}>
				{/* TODO I have tried to move this below the Dropdown, put it in a div, etc.
				This can get it so you can click it many times but it places the popup help
				so parts get cut off. So far I have not figured this out. */}
				<TooltipHelpContainer page={dataFor} />
				<TooltipMarkerComponent page={dataFor} helpTextId="help.home.header" />
				<Dropdown style={dropAlign} align='end'>
					<Dropdown.Toggle variant="outline-dark">Menu</Dropdown.Toggle>
					<Dropdown.Menu style={dropAlign} align='end'>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldAdminButtonDisabled}
							as={Link} to='/admin'>
							<FormattedMessage id='admin.panel' />
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldConversionsButtonDisabled}
							as={Link} to='/conversions'>
							<FormattedMessage id='conversions' />
						</Dropdown.Item>
						<Dropdown.Item
							style={state.csvViewableLinkStyle}
							disabled={state.shouldCSVButtonDisabled}
							as={Link} to='/csv'>
							<FormattedMessage id='csv' />
						</Dropdown.Item>
						<Dropdown.Item
							disabled={state.shouldGroupsButtonDisabled}
							as={Link} to='/groups'>
							<FormattedMessage id='groups' />
						</Dropdown.Item>
						<Dropdown.Item
							disabled={state.shouldHomeButtonDisabled}
							as={Link} to='/'>
							<FormattedMessage id='home' />
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldMapsButtonDisabled}
							as={Link} to='/maps'>
							<FormattedMessage id='maps' />
						</Dropdown.Item>
						<Dropdown.Item
							disabled={state.shouldMetersButtonDisabled}
							as={Link} to='meters'>
							<FormattedMessage id='meters' />
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldUnitsButtonDisabled}
							as={Link} to='/units'>
							<FormattedMessage id='units' />
						</Dropdown.Item>
						<Dropdown.Divider />
						<Dropdown.Item
							style={state.loginLinkStyle}
							as={Link} to='/login'>
							<FormattedMessage id='log.in' />
						</Dropdown.Item>
						<Dropdown.Item
							style={state.logoutLinkStyle}
							onClick={handleLogOut}>
							<FormattedMessage id='log.out' />
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
			</div>
		</div>
	);
}