/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router';
import { Button } from 'reactstrap';

interface CreateUserLinkButtonComponentProps {
	style?: React.CSSProperties;
}

export default function CreateUserLinkButtonComponent(props: CreateUserLinkButtonComponentProps) {
	const inlineButtonStyle: React.CSSProperties = {
		display: 'inline',
		paddingLeft: '5px'
	}

	return (
		<Link style={{ ...inlineButtonStyle, ...props.style }} to='/users/new'><Button color='primary' outline> Create a User </Button></Link>
	)
}