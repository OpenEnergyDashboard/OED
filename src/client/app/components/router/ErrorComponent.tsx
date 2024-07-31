/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'reactstrap';
import AppLayout from '../../components/AppLayout';
import translate from '../../utils/translate';

/**
 * @returns A error page that then returns to main dashboard page.
 */
export default function ErrorComponent() {
	const nav = useNavigate();
	const refreshPage = () => {
		nav('/');
		window.location.reload();
	};
	return (
		<AppLayout>
			{/* Pass div as child prop to AppLayout */}
			<div style={{
				width: '100%', height: '100%',
				display: 'flex', flexDirection: 'column',
				alignContent: 'center', alignItems: 'center'
			}}>
				{/* TODO make a good looking error page. This is a placeholder for now. */}
				<p>
					{translate('error.unknown')}
				</p>
				<Button
					color='primary'
					onClick={() => nav('/')}
				>
					{translate('return.dashboard')}
				</Button>
				<p>
					{translate('page.user.refresh.directions')}
				</p>
				<Button
					color='primary'
					onClick={refreshPage}
				>
					{translate('page.restart.button')}
				</Button>
			</div>
		</AppLayout>

	);
}
