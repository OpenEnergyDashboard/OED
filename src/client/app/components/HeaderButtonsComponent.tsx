/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';
import { DropdownItem, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalHeader, Nav, NavLink, Navbar, UncontrolledDropdown } from 'reactstrap';
import TooltipHelpComponent from '../components/TooltipHelpComponent';
import { clearGraphHistory } from '../redux/actions/extraActions';
import { authApi } from '../redux/api/authApi';
import { selectOEDVersion } from '../redux/api/versionApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectHelpUrl } from '../redux/slices/adminSlice';
import { selectOptionsVisibility, toggleOptionsVisibility } from '../redux/slices/appStateSlice';
import { selectHasRolePermissions, selectIsAdmin, selectIsLoggedIn } from '../redux/slices/currentUserSlice';
import { UserRole } from '../types/items';
import { useTranslate } from '../redux/componentHooks';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import LoginComponent from './LoginComponent';

/**
 * React Component that defines the header buttons at the top of a page
 * @returns Header buttons element
 */
export default function HeaderButtonsComponent() {
	const translate = useTranslate();
	const [logout] = authApi.useLogoutMutation();
	const dispatch = useAppDispatch();
	// Get the current page so know which one should not be shown in menu.
	const { pathname } = useLocation();

	// OED version is needed for help redirect
	const version = useAppSelector(selectOEDVersion);
	const helpUrl = useAppSelector(selectHelpUrl);
	// options help
	const optionsHelp = helpUrl + '/optionsMenu/';

	const loggedInAsAdmin = useAppSelector(selectIsAdmin);
	const loggedIn = useAppSelector(selectIsLoggedIn);
	const csvPermission = useAppSelector(state => selectHasRolePermissions(state, UserRole.CSV));
	// whether to collapse options when on graphs page
	const optionsVisibility = useAppSelector(selectOptionsVisibility);
	// This is the state model for rendering this page.
	const defaultState = {
		// All these values should update before user interacts with them so hide everything until the useEffects
		// set to what is desired.
		// The styles control if an item is seen at all.
		adminViewableLinkStyle: { display: 'none' } as React.CSSProperties,
		csvViewableLinkStyle: { display: 'none' } as React.CSSProperties,
		loginLinkStyle: { display: 'none' } as React.CSSProperties,
		logoutLinkStyle: { display: 'none' } as React.CSSProperties,
		showOptionsStyle: { display: 'none' } as React.CSSProperties,
		// The should ones tell if see but not selectable.
		shouldHomeButtonDisabled: true,
		shouldAdminButtonDisabled: true,
		shouldUsersButtonDisabled: true,
		shouldGroupsButtonDisabled: true,
		shouldMetersButtonDisabled: true,
		shouldMapsButtonDisabled: true,
		shouldCSVMetersButtonDisabled: true,
		shouldCSVReadingsButtonDisabled: true,
		shouldUnitsButtonDisabled: true,
		shouldConversionsButtonDisabled: true,
		shouldVisualUnitMapButtonDisabled: true,
		// Translated menu title that depend on whether logged in.
		menuTitle: '',
		// link to help page for page choices. Should not see default but use general help URL.
		pageChoicesHelp: helpUrl
	};

	// Local state for rendering.
	const [state, setState] = useState(defaultState);
	// Tracks unsaved changes.
	// TODO Re-implement AFTER RTK Migration
	// hard-coded for the time being. Rework w/admin pages
	const unsavedChangesState = false;


	// Must update in case the version was not set when the page was loaded.
	useEffect(() => {
		setState(prevState => ({
			...prevState,
			pageChoicesHelp: helpUrl
		}));
	}, [version]);

	// This updates which page is disabled because it is the one you are on.
	useEffect(() => {
		setState(prevState => ({
			...prevState,
			shouldHomeButtonDisabled: pathname === '/',
			shouldAdminButtonDisabled: pathname === '/admin',
			shouldUsersButtonDisabled: pathname === '/users',
			shouldGroupsButtonDisabled: pathname === '/groups',
			shouldMetersButtonDisabled: pathname === '/meters',
			shouldMapsButtonDisabled: pathname === '/maps',
			shouldCSVMetersButtonDisabled: pathname === '/csvMeters',
			shouldCSVReadingsButtonDisabled: pathname === '/csvReadings',
			shouldUnitsButtonDisabled: pathname === '/units',
			shouldConversionsButtonDisabled: pathname === '/conversions',
			shouldVisualUnitMapButtonDisabled: pathname === '/visual-unit'
		}));
	}, [pathname]);

	// This updates which items are hidden based on the login status.
	useEffect(() => {
		// We can get the admin state from the role but separate the two.
		const currentMenuTitle = loggedIn ? translate('page.choice.logout') : translate('page.choice.login');
		const currentAdminViewableLinkStyle = {
			// If an admin then show these items, otherwise hide them.
			// If no role then not logged in so show link to log in.
			display: loggedInAsAdmin ? 'block' : 'none'
		};
		// Similar but need to have CSV permissions.
		const currentCsvViewableLinkStyle: React.CSSProperties = {
			display: csvPermission ? 'block' : 'none'
		};
		// Show login if not and logout if you are.
		const currentLoginLinkStyle = {
			display: !loggedIn ? 'block' : 'none'
		};
		const currentLogoutLinkStyle = {
			display: loggedIn ? 'block' : 'none'
		};
		const currentShowOptionsStyle = {
			display: pathname === '/' ? 'block' : 'none'
		};
		// Admin help or regular user page
		const neededPage = loggedInAsAdmin ? '/adminPageChoices/' : '/pageChoices/';
		const currentPageChoicesHelp = helpUrl + neededPage;

		setState(prevState => ({
			...prevState,
			adminViewableLinkStyle: currentAdminViewableLinkStyle,
			csvViewableLinkStyle: currentCsvViewableLinkStyle,
			loginLinkStyle: currentLoginLinkStyle,
			logoutLinkStyle: currentLogoutLinkStyle,
			menuTitle: currentMenuTitle,
			pageChoicesHelp: currentPageChoicesHelp,
			showOptionsStyle: currentShowOptionsStyle
		}));
	}, [pathname, helpUrl, loggedIn, csvPermission, loggedInAsAdmin]);

	// Handle actions on logout.
	const handleLogOut = () => {
		if (unsavedChangesState) {
			// Unsaved changes so deal with them and then it takes care of logout.
			// TODO Re-implement AFTER RTK Migration
			// dispatch(unsavedWarningSlice.actions.flipLogOutState());
		} else {
			logout();
		}
	};
	// Handle modal visibility
	const [showModal, setShowModal] = useState<boolean>(false);

	const handleClose = () => {
		setShowModal(false);
	};

	const handleShow = () => {
		setShowModal(true);
	};

	return (
		<div>
			<Navbar expand>
				<TooltipHelpComponent page={'all'} />
				<TooltipMarkerComponent page='all' helpTextId='help.home.navigation' />
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
								style={state.adminViewableLinkStyle}
								disabled={state.shouldCSVMetersButtonDisabled}
								tag={Link}
								to="/csvMeters">
								<FormattedMessage id='csvMeters' />
							</DropdownItem>
							<DropdownItem
								style={state.csvViewableLinkStyle}
								disabled={state.shouldCSVReadingsButtonDisabled}
								tag={Link}
								to="/csvReadings">
								<FormattedMessage id='csvReadings' />
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
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldVisualUnitMapButtonDisabled}
								tag={Link}
								to="/visual-unit">
								<FormattedMessage id='visual.unit' />
							</DropdownItem>
							<DropdownItem divider style={state.adminViewableLinkStyle} />
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldAdminButtonDisabled}
								tag={Link}
								to="/admin">
								<FormattedMessage id='admin.settings' />
							</DropdownItem>
							<DropdownItem
								style={state.adminViewableLinkStyle}
								disabled={state.shouldUsersButtonDisabled}
								tag={Link}
								to="/users">
								<FormattedMessage id='users' />
							</DropdownItem>
							<DropdownItem divider />
							<DropdownItem
								href={state.pageChoicesHelp}>
								<FormattedMessage id="help" />
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
								className='d-none d-lg-block'
								onClick={() => dispatch(toggleOptionsVisibility())}>
								<FormattedMessage id={optionsVisibility ? 'hide.options' : 'show.options'} />
							</DropdownItem>
							<DropdownItem
								style={state.showOptionsStyle}
								className='d-none d-lg-block'
								onClick={() => dispatch(clearGraphHistory())}>
								<FormattedMessage id={'clear.graph.history'} />
							</DropdownItem>
							<DropdownItem divider />
							<DropdownItem
								style={state.loginLinkStyle}
								onClick={handleShow}>
								<FormattedMessage id='log.in' />
							</DropdownItem>
							<DropdownItem
								style={state.logoutLinkStyle}
								onClick={handleLogOut}>
								<FormattedMessage id='log.out' />
							</DropdownItem>
							<DropdownItem divider />
							<DropdownItem
								href={optionsHelp}>
								<FormattedMessage id="help" />
							</DropdownItem>
						</DropdownMenu>
					</UncontrolledDropdown>
					<NavLink
						href={helpUrl}>
						<FormattedMessage id='help' />
					</NavLink>
				</Nav>
			</Navbar>
			<>
				<Modal isOpen={showModal} toggle={handleClose}>
					<ModalHeader>
						{translate('log.in')}
					</ModalHeader>
					<ModalBody>
						<LoginComponent handleClose={handleClose}/>
					</ModalBody>
				</Modal>
			</>

		</div>
	);
}
