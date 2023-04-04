/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from "react";
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
	const adminViewableLinkStyle: React.CSSProperties = {
		display: loggedInAsAdmin ? "inline" : "none",
		paddingLeft: "5px",
	};
	const csvLinkStyle: React.CSSProperties = {
		display: renderCSVButton ? "inline" : "none",
		paddingLeft: "5px",
	};

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
				{args['showCollapsedMenuButton'] ? (
					<MenuModalComponent
						showOptions={showOptions}
						showCollapsedMenuButton={false}
					/>
				) : null}
			</div>
			<div className={args.showCollapsedMenuButton ? "d-none d-lg-block" : ""}>
				<TooltipHelpContainer page={dataFor} />
				<TooltipMarkerComponent page={dataFor} helpTextId="help.home.header" />
				<Link style={adminViewableLinkStyle} to="/admin">
					<Button disabled={shouldAdminButtonDisabled} outline>
						<FormattedMessage id="admin.panel" />
					</Button>
				</Link>
				<Link style={adminViewableLinkStyle} to="/conversions">
					<Button disabled={shouldConversionsButtonDisabled} outline>
						<FormattedMessage id="conversions" />
					</Button>
				</Link>
				<Link style={csvLinkStyle} to="/csv">
					<Button disabled={shouldCSVButtonDisabled} outline>
						<FormattedMessage id="csv" />
					</Button>
				</Link>
				<Link style={linkStyle} to="/groups">
					<Button disabled={shouldGroupsButtonDisabled} outline>
						<FormattedMessage id="groups" />
					</Button>
				</Link>
				<Link style={linkStyle} to="/">
					<Button disabled={shouldHomeButtonDisabled} outline>
						<FormattedMessage id="home" />
					</Button>
				</Link>
				<Link style={adminViewableLinkStyle} to="/maps">
					<Button disabled={shouldMapsButtonDisabled} outline>
						<FormattedMessage id="maps" />
					</Button>
				</Link>
				<Link style={linkStyle} to="/meters">
					<Button disabled={shouldMetersButtonDisabled} outline>
						<FormattedMessage id="meters" />
					</Button>
				</Link>
				<Link style={adminViewableLinkStyle} to="/units">
					<Button disabled={shouldUnitsButtonDisabled} outline>
						<FormattedMessage id="units" />
					</Button>
				</Link>
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
