/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from "react";
import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from "react-router-dom";
import { Button } from "reactstrap";
import { FormattedMessage } from "react-intl";
import MenuModalComponent from "./MenuModalComponent";
import getPage from "../utils/getPage";
import TooltipMarkerComponent from "./TooltipMarkerComponent";
import TooltipHelpContainer from "../containers/TooltipHelpContainer";
import { UserRole } from "../types/items";
import { isRoleAdmin } from "../utils/hasPermissions";
import { hasPermissions } from "../utils/hasPermissions";
import { flipLogOutState } from "../actions/unsavedWarning";
import { deleteToken } from "../utils/token";
import { clearCurrentUser } from "../actions/currentUser";
import { State } from "../types/redux/state";
import { useSelector } from "react-redux";

export default function HeaderButtonsComponent(args: {showCollapsedMenuButton: boolean, isModal: boolean}) {
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	let loggedInAsAdmin = false;
	let role: UserRole | null = null;
	if (currentUser !== null) {
		loggedInAsAdmin = isRoleAdmin(currentUser.role);
		role = currentUser.role;
	}
	const showOptions = getPage() === "";
	const renderLoginButton = role === null;
	const renderLogoutButton = role !== null;
	const shouldHomeButtonDisabled = getPage() === "";
	const shouldAdminButtonDisabled = getPage() === "admin";
	const shouldGroupsButtonDisabled = getPage() === "groups";
	const shouldMetersButtonDisabled = getPage() === "meters";
	const shouldMapsButtonDisabled = getPage() === "maps";
	const shouldCSVButtonDisabled = getPage() === "csv";
	const renderCSVButton = Boolean(role && hasPermissions(role, UserRole.CSV));
	const shouldUnitsButtonDisabled = getPage() === "units";
	const shouldConversionsButtonDisabled = getPage() === "conversions";
	const dataFor = args.isModal ? "all-modal" : "all";


	const linkStyle: React.CSSProperties = {
		display: "inline",
		paddingLeft: "5px",
	};
	const loginLinkStyle: React.CSSProperties = {
		display: renderLoginButton ? "inline" : "none",
		paddingLeft: "5px",
	};
	const logoutLinkStyle: React.CSSProperties = {
		display: renderLogoutButton ? "inline" : "none",
		paddingLeft: "5px",
	};
	/*const adminViewableLinkStyle: React.CSSProperties = {
		display: loggedInAsAdmin ? "block" : "none",
	};
	const csvLinkStyle: React.CSSProperties = {
		display: renderCSVButton ? "block" : "none",
	};*/


	const handleLogOut = () => {
		if (useSelector((state: State) => state.unsavedWarning.hasUnsavedChanges))
			flipLogOutState();
		else {
			deleteToken();
			clearCurrentUser();
		}
	};

	return (
		<div>
			<div className="d-lg-none">
				{args.showCollapsedMenuButton ? (
					<MenuModalComponent
						showOptions={showOptions}
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
							disabled = {shouldHomeButtonDisabled} 
							onClick={() => {window.location.href = "/";}}>
							<FormattedMessage id="home" />
						</Dropdown.Item>
						<Dropdown.Item 
							//style={adminViewableLinkStyle} 
							disabled = {shouldAdminButtonDisabled}
							onClick={() => {window.location.href = "/admin";}}>
							<FormattedMessage id="admin.panel" />
						</Dropdown.Item>
						<Dropdown.Item
							//style={adminViewableLinkStyle}
							disabled = {shouldConversionsButtonDisabled}
							onClick={() => {window.location.href = "/conversions";}}>
							<FormattedMessage id="conversions" />
						</Dropdown.Item>
						<Dropdown.Item
							//style={csvLinkStyle}
							disabled={shouldCSVButtonDisabled}
							onClick={() => {window.location.href = "/csv";}}>
							<FormattedMessage id="csv" />
						</Dropdown.Item>
						<Dropdown.Item
							disabled={shouldGroupsButtonDisabled}
							onClick={() => {window.location.href = "/groups";}}>
							<FormattedMessage id="groups" />
						</Dropdown.Item>
						<Dropdown.Item
							//style={adminViewableLinkStyle}
							disabled={shouldMapsButtonDisabled}
							onClick={() => {window.location.href = "/maps";}}>
							<FormattedMessage id="maps" />
						</Dropdown.Item>
						<Dropdown.Item
							disabled={shouldMetersButtonDisabled}
							onClick={() => {window.location.href = "/meters";}}>
							<FormattedMessage id="meters" />
						</Dropdown.Item>
						<Dropdown.Item
							//style={adminViewableLinkStyle}
							disabled={shouldUnitsButtonDisabled}
							onClick={() => {window.location.href = "/units";}}>
							<FormattedMessage id="units" />
						</Dropdown.Item>
					</Dropdown.Menu>
				</Dropdown>
				<Link style={loginLinkStyle} to="/login">
					<Button outline>
						<FormattedMessage id="log.in" />
					</Button>
				</Link>
				<Link style={logoutLinkStyle} to="/">
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
// /home/nicolax/Desktop/OED/src/client/app/components/ChartSelectComponent.tsx