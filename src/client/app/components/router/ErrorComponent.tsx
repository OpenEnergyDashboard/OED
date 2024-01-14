/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'reactstrap';
import AppLayout from '../../components/AppLayout';

/**
 * @returns A simple loading spinner used to indicate that the startup init sequence is in progress
 */
export default function ErrorComponent() {
	const nav = useNavigate();
	return (
		<AppLayout>
			<div style={{
				width: '100%', height: '100%',
				display: 'flex', flexDirection: 'column',
				alignContent: 'center', alignItems: 'center'
			}}>
				{/* TODO make a good looking error page. This is a placeholder for now. */}
				<p>
					Oops! An error has occurred.
				</p>
				<Button color='primary'
					onClick={() => nav('/')}>
					Return To Dashboard
				</Button>
			</div>
		</AppLayout>

	)
}
