/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import '../styles/tooltip.css';
import translate from '../utils/translate';
import { useAppSelector } from '../redux/reduxHooks';
import { selectOEDVersion } from '../redux/api/versionApi';
import { selectBaseHelpUrl } from '../redux/slices/adminSlice';

interface TooltipHelpProps {
	page: string; // Specifies which page the tip is in.
}

/**
 * @param props // Specifies which page the tip is in.
 * @returns ToolTipHelpComponent
 */
export default function TooltipHelpComponent(props: TooltipHelpProps) {

	/**
	 * @returns JSX to create the help icons with links
	 */


	const version = useAppSelector(selectOEDVersion);
	const baseHelpUrl = useAppSelector(selectBaseHelpUrl);
	const helpUrl = baseHelpUrl + version;

	const helpLinks: Record<string, Record<string, string>> = {
		'help.admin.conversioncreate': { link: `${helpUrl}/adminConversionCreating.html` },
		'help.admin.conversionedit': { link: `${helpUrl}/adminConversionEditing.html` },
		'help.admin.conversionview': { link: `${helpUrl}/adminConversionViewing.html` },
		'help.admin.groupcreate': { link: `${helpUrl}/adminGroupCreating.html` },
		'help.admin.groupedit': { link: `${helpUrl}/adminGroupEditing.html` },
		'help.admin.groupview': { link: `${helpUrl}/adminGroupViewing.html` },
		'help.admin.header': { link: `${helpUrl}/adminPreferences.html` },
		'help.admin.mapview': { link: `${helpUrl}/adminMapViewing.html` },
		'help.admin.metercreate': { link: `${helpUrl}/adminMeterCreating.html` },
		'help.admin.meteredit': { link: `${helpUrl}/adminMeterEditing.html` },
		'help.admin.meterview': { link: `${helpUrl}/adminMeterViewing.html` },
		'help.admin.unitcreate': { link: `${helpUrl}/adminUnitCreating.html` },
		'help.admin.unitedit': { link: `${helpUrl}/adminUnitEditing.html` },
		'help.admin.unitview': { link: `${helpUrl}/adminUnitViewing.html` },
		'help.admin.user': { link: `${helpUrl}/adminUser.html` },
		'help.csv.header': { link: `${helpUrl}/adminDataAcquisition.html` },
		'help.home.area.normalize': { link: `${helpUrl}/areaNormalization.html` },
		'help.home.bar.custom.slider.tip': { link: `${helpUrl}/barGraphic.html#usage` },
		'help.home.bar.interval.tip': { link: `${helpUrl}/barGraphic.html#usage` },
		'help.home.bar.stacking.tip': { link: `${helpUrl}/barGraphic.html#barStacking` },
		'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
		'help.home.chart.redraw.restore': { link: `${helpUrl}/lineGraphic.html#redrawRestore` },
		'help.home.chart.select': { link: `${helpUrl}/graphType.html` },
		'help.home.compare.interval.tip': { link: `${helpUrl}/compareGraphic.html#usage` },
		'help.home.compare.sort.tip': { link: `${helpUrl}/compareGraphic.html#usage` },
		'help.home.error.bar': { link: `${helpUrl}/errorBar.html#usage` },
		'help.home.export.graph.data': { link: `${helpUrl}/export.html` },
		'help.home.history': { link: `${helpUrl}/history.html` },
		'help.home.map.interval.tip': { link: `${helpUrl}/mapGraphic.html#usage` },
		'help.home.navigation': { link: '' },
		'help.home.select.dateRange': { link: `${helpUrl}/dateRange.html` },
		'help.home.select.groups': { link: `${helpUrl}/graphingGroups.html` },
		'help.home.select.maps': { link: `${helpUrl}/mapGraphic.html` },
		'help.home.select.meters': { link: `${helpUrl}/graphingMeters.html` },
		'help.home.select.rates': { link: `${helpUrl}/graphingRates.html` },
		'help.home.select.units': { link: `${helpUrl}/graphingUnits.html` },
		'help.home.readings.per.day': { link: `${helpUrl}/readingsPerDay.html` },
		'help.home.toggle.chart.link': { link: `${helpUrl}/chartLink.html` },
		'help.groups.groupdetails': { link: `${helpUrl}/groupViewing.html#groupDetails` },
		'help.groups.groupview': { link: `${helpUrl}/groupViewing.html` },
		'help.meters.meterview': { link: `${helpUrl}/meterViewing.html` }
	};

	return (
		<div style={divStyle}>
			<ReactTooltip
				className='tip'
				id={`${props.page}`}
				event='click'
				clickable
				effect='solid'
				globalEventOff='click'
				getContent={dataTip => {
					if (dataTip === null) {
						return;
					}
					// Create links
					const values = helpLinks[dataTip] || {}; // This is in case the help tip does not have any links.
					const links: Record<string, JSX.Element> = {};
					Object.keys(values).forEach(key => {
						const link = values[key];
						links[key] = version ? (<a target='_blank' rel='noopener noreferrer' href={link}>
							{translate('here')}
						</a>
						) : <>...</>;
						// TODO: Provide default link when there are issues fetching version number
					});
					return (
						<div style={{ maxWidth: '300px' }}>
							<FormattedMessage
								id={dataTip}
								values={links}
							/>
						</div>
					);
				}}
			/>

		</div>
	);
}
const divStyle = {
	display: 'inline-block'
};
