/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';

interface ManageUserLinkButtonComponentProps {
	style?: React.CSSProperties;
}

/**
 * Component which creates a button link to the manage users page
 * @param {ManageUserLinkButtonComponentProps} props defined above
 * @returns {Element} Manage user button component
 */
export default function ManageUsersLinkButtonComponent(props: ManageUserLinkButtonComponentProps) {
	const inlineButtonStyle: React.CSSProperties = {
		display: 'inline',
		paddingLeft: '5px'
	}

	return (
		<Link style={{ ...inlineButtonStyle, ...props.style }} to='/users' >
			<Button outline><FormattedMessage id='users'/> </Button></Link>
	)
}