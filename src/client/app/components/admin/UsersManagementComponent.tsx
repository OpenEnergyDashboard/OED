/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router';
import { Button } from 'reactstrap';

export default function UsersManagementComponent() {
	const inlineButtonStyle: React.CSSProperties = {
		display: 'inline',
		paddingLeft: '5px'
	}

	return (
		<div>
			<Link style={inlineButtonStyle} to='/users/new'><Button outline> Create a User </Button></Link>
			<Link style={inlineButtonStyle} to='/users' ><Button outline> View Users </Button></Link>
		</div>
	)
}