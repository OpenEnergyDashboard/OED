/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import translate from '../../utils/translate';

interface SidebarProps {
	onSelectPreference: (preference: string) => void,
	selectedPreference: string;
}

/**
 * Admin navigation side bar
 * @param props Props for side bar
 * @returns Admin navigation side bar
 */
export default function AdminSideBar(props: SidebarProps): React.JSX.Element {
	return (
		<div className='col-3 border-end m-0 p-0'>
			<div className="list-group">
				<button
					type="button"
					className={`${props.selectedPreference === 'graph' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('graph')}
				>
					{translate('graph')}
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'meter' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('meter')}
				>
					{translate('meter')}
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'users' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('users')}
				>
					{translate('users')}
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'misc' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('misc')}
				>
					{translate('misc')}
				</button>
			</div>

		</div>
	);
}
