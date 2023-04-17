/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from "react";
import { useState, useEffect } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { FormattedMessage } from "react-intl";
import MenuModalComponent from "./MenuModalComponent";
import getPage from "../utils/getPage";
import TooltipMarkerComponent from "./TooltipMarkerComponent";
import TooltipHelpContainer from "../containers/TooltipHelpContainer";
import { UserRole } from "../types/items";
import { hasPermissions, isRoleAdmin } from "../utils/hasPermissions";
import { flipLogOutState } from "../actions/unsavedWarning";
import { deleteToken } from "../utils/token";
import { clearCurrentUser } from "../actions/currentUser";
import { State } from "../types/redux/state";
import { useDispatch, useSelector } from 'react-redux';

export default function HeaderButtonsComponent(args: { showCollapsedMenuButton: boolean, isModal: boolean }) {
	const dispatch = useDispatch();

	// Tracks modal or not so helps works as desired.
	const dataFor = args.isModal ? "all-modal" : "all";
	// Get the current page so know which one should not be shown in menu.
	const currentPage = getPage();

	// This is the state model for rendering this page.
	const defaultState = {
		// All these values should update before user interacts with them so hide everything until the useEffects
		// set to what is desired.
		// The styles control if an item is seen at all.
		adminViewableLinkStyle: {
			display: "none"
		} as React.CSSProperties,
		csvViewableLinkStyle: {
			display: "none"
		} as React.CSSProperties,
		loginLinkStyle: {
			display: "none"
		} as React.CSSProperties,
		logoutLinkStyle: {
			display: "none"
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
			shouldHomeButtonDisabled: currentPage === "",
			shouldAdminButtonDisabled: currentPage === "admin",
			shouldGroupsButtonDisabled: currentPage === "groups",
			shouldMetersButtonDisabled: currentPage === "meters",
			shouldMapsButtonDisabled: currentPage === "maps",
			shouldCSVButtonDisabled: currentPage === "csv",
			shouldUnitsButtonDisabled: currentPage === "units",
			shouldConversionsButtonDisabled: currentPage === "conversions",
			showOptions: currentPage === ""
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
			display: loggedInAsAdmin ? "block" : "none",
		};
		// Similar but need to have CSV permissions.
		const currentCsvViewableLinkStyle: React.CSSProperties = {
			display: renderCSVButton ? "block" : "none",
		};
		// Show login if not and logout if you are.
		const currentLoginLinkStyle = {
			display: renderLoginButton ? "inline" : "none",
			paddingLeft: "5px",
		};
		const currentLogoutLinkStyle = {
			display: !renderLoginButton ? "inline" : "none",
			paddingLeft: "5px",
		};
		setState(prevState => ({
			...prevState,
			adminViewableLinkStyle: currentAdminViewableLinkStyle,
			csvViewableLinkStyle: currentCsvViewableLinkStyle,
			loginLinkStyle: currentLoginLinkStyle,
			logoutLinkStyle: currentLogoutLinkStyle
		}));
	}, [currentUser]);

	// Style for drowdown.
	const linkStyle: React.CSSProperties = {
		display: "inline",
		paddingLeft: "5px",
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

	// TODO See the last item for ways tried and issues with the current way.
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
			<div className={args.showCollapsedMenuButton ? "d-none d-lg-block" : ""}>
				<TooltipHelpContainer page={dataFor} />
				<TooltipMarkerComponent page={dataFor} helpTextId="help.home.header" />
				<Dropdown style={linkStyle}>
					<Dropdown.Toggle variant="outline-dark">Menu</Dropdown.Toggle>
					<Dropdown.Menu>
						<Dropdown.Item
							disabled={state.shouldHomeButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/'>
								<Button outline>
									<FormattedMessage id='home' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldAdminButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/admin'>
								<Button outline>
									<FormattedMessage id='admin.panel' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldConversionsButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/conversions'>
								<Button outline>
									<FormattedMessage id='conversions' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							style={state.csvViewableLinkStyle}
							disabled={state.shouldCSVButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/csv'>
								<Button outline>
									<FormattedMessage id='csv' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							disabled={state.shouldGroupsButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/groups'>
								<Button outline>
									<FormattedMessage id='groups' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldMapsButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/maps'>
								<Button outline>
									<FormattedMessage id='maps' />
								</Button>
							</Link>
						</Dropdown.Item>
						<Dropdown.Item
							disabled={state.shouldMetersButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/meters'>
								<Button outline>
									<FormattedMessage id='meters' />
								</Button>
							</Link>
						</Dropdown.Item>
						{/* TODO This is not perfect. Using the link or button causes a console error about nesting <a>.
						Thankfully it only shows up the first time you touch the menu.
						There also seems to be a need to have an empty onClick since it is required by the component.
						However, these do work. Of the two, I prefer the button rather than a link due to the look but
						the link is cleaner.
						Note I also tried a Navbar but I could not get the Nav.Link to work for to be recognized reasons.
						I view this as a hack to get this to work as the original way of making the onClick() to a
						window.location.href did not work due to issue #817. If that is resolved then we may be able to
						simply do the href way. */}
						<Dropdown.Item
							style={state.adminViewableLinkStyle}
							disabled={state.shouldUnitsButtonDisabled}
							onClick={() => { }}>
							<Link
								to='/units'>
								<Button outline>
									<FormattedMessage id='units' />
								</Button>
							</Link>
							{/* <Link
								to='/units'>
								<FormattedMessage id='units' />
							</Link> */}
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<Link style={state.loginLinkStyle} to="/login">
					<Button outline>
						<FormattedMessage id="log.in" />
					</Button>
				</Link>
				<Link style={state.logoutLinkStyle} to="/">
					<Button outline onClick={handleLogOut}>
						<FormattedMessage id="log.out" />
					</Button>
				</Link>
			</div>
		</div>
	);
}


// hooks are easier since everything gets put into a single file
// makes maintaining the code easier
// don't have to mess around with props, so you couldn't access state and you would have to access the state from a container
// OED is converting everything to react hooks, since OED is older than react hooks
// 	home/nicolax/Desktop/OED/src/client/app/components/ChartSelectComponent.tsx