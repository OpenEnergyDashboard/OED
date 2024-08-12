/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../TooltipHelpComponent';
import * as React from 'react';
import CreateVisualUnitMapModalComponent from './CreateVisualUnitModalMapComponent';

/**
 * Defines the units page card view
 * @returns Units page element
 */
export default function VisualUnitDetailComponent() {

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	// const tooltipStyle = {
	// 	display: 'inline-block',
	// 	fontSize: '50%',
	// 	// For now, only an admin can see the unit page.
	// 	tooltipVisualUnitView: 'help.admin.unitview'
	// };

	return (
		<div>
			<TooltipHelpComponent page='visual-unit' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='visual-unit' />
					{/* <div style={tooltipStyle}>
							<TooltipMarkerComponent page='visual-unit' helpTextId={tooltipStyle.tooltipVisualUnitView} />
						</div> */}
				</h2>
			</div>

			<div style={titleStyle}>
				<CreateVisualUnitMapModalComponent/>
			</div>
		</div>
	);
}