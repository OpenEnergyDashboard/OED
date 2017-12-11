/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import LogoComponent from './LogoComponent';
import UIModalComponent from './UIModalComponent';
import getToken from '../utils/getToken';

/**
 * React component that controls the header strip at the top of all pages
 * @param props The props passed down by the parent component
 * @return JSX to create the header strip
 */
export default function HeaderComponent(props) {
	const title = props.title ? props.title : 'Open Energy Dashboard';
	const titleStyle = {
		display: 'inline-block'
	};
	const divRightStyle = {
		float: 'right',
		marginTop: '5px',
		marginRight: '20px'
	};
	const loginLinkStyle = {
		// Displays the login button link only if the user is not logged in or is explicitly told to render
		display: (getToken() || props.renderLoginButton === false) ? 'none' : 'inline',
		paddingLeft: '5px'
	};
	const adminLinkStyle = {
		// Displays the admin button link only if the user is logged in (auth token exists)
		display: getToken() ? 'inline' : 'none',
		paddingLeft: '5px'
	};
	const groupsLinkStyle = {
		// Displays the groups button link only if the user is logged in (auth token exists) or explicitly told to render
		display: (getToken() && props.renderGroupsButton) ? 'inline' : 'none',
		paddingLeft: '5px'
	};
	return (
		<div className="container-fluid">
			<div className="col-xs-4">
				<Link to="/"><LogoComponent url="./app/images/logo.png" /></Link>
			</div>
			<div className="col-xs-4 text-center">
				<h1 style={titleStyle}>{title}</h1>
			</div>
			<div style={divRightStyle}>
				<div className="visible-sm visible-xs">
					{(props.renderOptionsButton) ? <UIModalComponent /> : null}
				</div>
				<Link style={loginLinkStyle} to="/login"><Button bsStyle="default"><FormattedMessage
					id="login"
					defaultMessage="Log in"
				/></Button></Link>
				<Link style={adminLinkStyle} to="/admin"><Button bsStyle="default"><FormattedMessage
					id="admin.panel"
					defaultMessage="Admin panel"
				/></Button></Link>
				<Link style={groupsLinkStyle} to="/groups"><Button bsStyle="default"><FormattedMessage
					id="groups"
					defaultMessage="Groups"
				/></Button></Link>
			</div>
		</div>
	);
}
