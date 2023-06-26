/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';

interface CreateUserLinkButtonComponentProps {
	style?: React.CSSProperties;
}

/**
 * Component which links a button to the create user form
 * @param props defined above
 * @returns Create User button element
 */
export default function CreateUserLinkButtonComponent(props: CreateUserLinkButtonComponentProps) {
	const inlineButtonStyle: React.CSSProperties = {
		display: 'inline',
		paddingLeft: '5px'
	}

	return (
		<Link style={{ ...inlineButtonStyle, ...props.style }} to='/users/new'>
			<Button color='primary' outline> <FormattedMessage id='create.user'/> </Button></Link>
	)
}