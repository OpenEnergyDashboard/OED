/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../TooltipHelpComponent';
import * as React from 'react';
import { CreateVisualUnitComponent } from './CreateVisualUnitComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { selectCik } from '../../redux/api/conversionsApi';
import { selectConversionsDetails } from '../../redux/api/conversionsApi';
import { useAppSelector } from '../../redux/reduxHooks';

/**
 * Defines the units and conversion graphics view.
 * @returns Units visual graphics page element
 */
export default function VisualUnitDetailComponent() {
	/* Get conversion data from redux */
	const conversionData = useAppSelector(selectConversionsDetails);
	const cikData = useAppSelector(selectCik);



	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// For now, only an admin can see the unit visualization page.
		tooltipVisualUnitView: 'help.admin.unitconversionvisuals'
	};

	return (
		<div>
			<TooltipHelpComponent page='visual-unit' />

			<div className='container-fluid'>
				<h1 style={titleStyle}>
					<FormattedMessage id='units.conversion.page.title' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='visual-unit' helpTextId={tooltipStyle.tooltipVisualUnitView} />
					</div>
				</h1>

				<h2 style={titleStyle}>
					<FormattedMessage id='visual.input.units.graphic' />
				</h2>

				<div style={titleStyle}>
					<CreateVisualUnitComponent conversions={conversionData}/>
				</div>

				<h2 style={titleStyle}>
					<FormattedMessage id='visual.analyzed.units.graphic' />
				</h2>

				<div style={titleStyle}>
					<CreateVisualUnitComponent conversions={cikData} isCik/>
				</div>
			</div>
		</div>
	);
}
