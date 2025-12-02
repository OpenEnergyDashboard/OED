/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import { selectOEDVersion } from '../redux/api/versionApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectHelpUrl } from '../redux/slices/adminSlice';
import '../styles/tooltip.css';
import { useTranslate } from '../redux/componentHooks';

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
	const translate = useTranslate();

	const version = useAppSelector(selectOEDVersion);
	const helpUrl = useAppSelector(selectHelpUrl);

	const helpLinks: Record<string, Record<string, string>> = {
		'help.admin.conversioncreate': { link: `${helpUrl}/adminConversionCreating/` },
		'help.admin.conversionedit': { link: `${helpUrl}/adminConversionEditing/` },
		'help.admin.conversionview': { link: `${helpUrl}/adminConversionViewing/` },
		'help.admin.groupcreate': { link: `${helpUrl}/adminGroupCreating/` },
		'help.admin.groupedit': { link: `${helpUrl}/adminGroupEditing/` },
		'help.admin.groupview': { link: `${helpUrl}/adminGroupViewing/` },
		'help.admin.header': { link: `${helpUrl}/adminPreferences/` },
		'help.admin.mapview': { link: `${helpUrl}/adminMapViewing/` },
		'help.admin.metercreate': { link: `${helpUrl}/adminMeterCreating/` },
		'help.admin.meteredit': { link: `${helpUrl}/adminMeterEditing/` },
		'help.admin.meterview': { link: `${helpUrl}/adminMeterViewing/` },
		'help.admin.unitcreate': { link: `${helpUrl}/adminUnitCreating/` },
		'help.admin.unitedit': { link: `${helpUrl}/adminUnitEditing/` },
		'help.admin.unitview': { link: `${helpUrl}/adminUnitViewing/` },
		'help.admin.users': { link: `${helpUrl}/adminUser/` },
		'help.csv.meters': { link: `${helpUrl}/adminMetersImport/` },
		'help.csv.readings': { link: `${helpUrl}/adminReadingsImport/` },
		'help.home.area.normalize': { link: `${helpUrl}/areaNormalization/` },
		'help.home.bar.days.tip': { link: `${helpUrl}/barGraphic/#usage` },
		'help.home.bar.interval.tip': { link: `${helpUrl}/barGraphic/#usage` },
		'help.home.bar.stacking.tip': { link: `${helpUrl}/barGraphic/#barStacking` },
		'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
		'help.home.chart.redraw.restore': { link: `${helpUrl}/lineGraphic/#redrawRestore` },
		'help.home.chart.select': { link: `${helpUrl}/graphType/` },
		'help.home.compare.period.tip': { link: `${helpUrl}/compareGraphic/#usage` },
		'help.home.compare.sort.tip': { link: `${helpUrl}/compareGraphic/#usage` },
		'help.home.error.bar': { link: `${helpUrl}/errorBar/#usage` },
		'help.home.export.graph.data': { link: `${helpUrl}/export/` },
		'help.home.history': { link: `${helpUrl}/history/` },
		'help.home.map.interval.tip': { link: `${helpUrl}/mapGraphic/#usage` },
		'help.home.navigation': { link: '' },
		'help.home.select.dateRange': { link: `${helpUrl}/dateRange/` },
		'help.home.select.groups': { link: `${helpUrl}/graphingGroups/` },
		'help.home.select.maps': { link: `${helpUrl}/mapGraphic/` },
		'help.home.select.meters': { link: `${helpUrl}/graphingMeters/` },
		'help.home.select.rates': { link: `${helpUrl}/graphingRates/` },
		'help.home.select.units': { link: `${helpUrl}/graphingUnits/` },
		'help.home.readings.per.day': { link: `${helpUrl}/readingsPerDay/` },
		'help.home.toggle.chart.link': { link: `${helpUrl}/chartLink/` },
		'help.groups.groupdetails': { link: `${helpUrl}/groupViewing/#groupDetails` },
		'help.groups.groupview': { link: `${helpUrl}/groupViewing/` },
		'help.meters.meterview': { link: `${helpUrl}/meterViewing/` },
		'help.admin.unitconversionvisuals': { link: `${helpUrl}/adminUnitVisual/` }
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
