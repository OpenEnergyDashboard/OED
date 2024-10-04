/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import SpinnerComponent from '../SpinnerComponent';
import { useTranslate } from '../../redux/componentHooks';

/**
 * @returns A simple loading spinner used to indicate that the startup init sequence is in progress
 */
export default function InitializingComponent() {
	const translate = useTranslate();
	return (
		<div style={{
			width: '100%', height: '100%',
			display: 'flex', flexDirection: 'column',
			alignContent: 'center', alignItems: 'center'
		}}>
			<p>
				{translate('initializing')}
			</p>
			<SpinnerComponent loading width={50} height={50} />
		</div>

	);
}
