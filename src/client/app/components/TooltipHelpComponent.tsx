/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import '../styles/tooltip.css';
import translate from '../utils/translate';

interface TooltipHelpProps {
	page: string; // Specifies which page the tip is in.
	version: string;
	fetchVersionIfNeeded(): Promise<any>;
}

// Normal/live URL for OED help pages
// Exported to HeaderButtonsComponent and LanguageSelectorComponent
export const BASE_URL = 'https://openenergydashboard.github.io/help/'
// Debug URL where need to put own GitHub ID before .github.io.
// This works if you have a fork of the web pages and setup your GitHub account to serve them up.
// export const BASE_URL = `https://xxx.github.io/OpenEnergyDashboard.github.io/help/`;

export default class TooltipHelpComponent extends React.Component<TooltipHelpProps> {
	constructor(props: TooltipHelpProps) {
		super(props);
		this.props.fetchVersionIfNeeded();
	}

	/**
	 * @returns JSX to create the help icons with links
	 */
	public render() {
		const divStyle = {
			display: 'inline-block'
		};

		const version = this.props.version

		const HELP_URL = BASE_URL + version;

		const helpLinks: Record<string, Record<string, string>> = {
			'help.admin.conversioncreate': { link: `${HELP_URL}/adminConversionCreating.html` },
			'help.admin.conversionedit': { link: `${HELP_URL}/adminConversionEditing.html` },
			'help.admin.conversionview': { link: `${HELP_URL}/adminConversionViewing.html` },
			'help.admin.groupcreate': { link: `${HELP_URL}/adminGroupCreating.html` },
			'help.admin.groupedit': { link: `${HELP_URL}/adminGroupEditing.html` },
			'help.admin.groupview': { link: `${HELP_URL}/adminGroupViewing.html` },
			'help.admin.header': { link: `${HELP_URL}/adminPreferences.html` },
			'help.admin.mapview': { link: `${HELP_URL}/adminMap.html` },
			'help.admin.metercreate': { link: `${HELP_URL}/adminMeterCreating.html` },
			'help.admin.meteredit': { link: `${HELP_URL}/adminMeterEditing.html` },
			'help.admin.meterview': { link: `${HELP_URL}/adminMeterViewing.html` },
			'help.admin.unitcreate': { link: `${HELP_URL}/adminUnitCreating.html` },
			'help.admin.unitedit': { link: `${HELP_URL}/adminUnitEditing.html` },
			'help.admin.unitview': { link: `${HELP_URL}/adminUnitViewing.html` },
			'help.admin.user': { link: `${HELP_URL}/adminUser.html` },
			'help.csv.header': { link: `${HELP_URL}/adminDataAcquisition.html` },
			'help.home.area.normalize': { link: `${HELP_URL}/areaNormalization.html` },
			'help.home.bar.custom.slider.tip': { link: `${HELP_URL}/barGraphic.html#usage` },
			'help.home.bar.interval.tip': { link: `${HELP_URL}/barGraphic.html#usage` },
			'help.home.bar.stacking.tip': { link: `${HELP_URL}/barGraphic.html#barStacking` },
			'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
			'help.home.chart.redraw.restore': { link: `${HELP_URL}/lineGraphic.html#redrawRestore` },
			'help.home.chart.select': { link: `${HELP_URL}/graphType.html` },
			'help.home.compare.interval.tip': { link: `${HELP_URL}/compareGraphic.html#usage` },
			'help.home.compare.sort.tip': { link: `${HELP_URL}/compareGraphic.html#usage` },
			'help.home.error.bar': { link: `${HELP_URL}/errorBar.html#usage` },
			'help.home.export.graph.data': { link: `${HELP_URL}/export.html` },
			'help.home.hide.or.show.options': { link: `${HELP_URL}/hideOptions.html` },
			'help.home.map.interval.tip': { link: `${HELP_URL}/mapGraphic.html#usage` },
			'help.home.select.groups': { link: `${HELP_URL}/graphingGroups.html` },
			'help.home.select.maps': { link: `${HELP_URL}/mapGraphic.html` },
			'help.home.select.meters': { link: `${HELP_URL}/graphingMeters.html` },
			'help.home.select.rates': { link: `${BASE_URL}/graphingRates.html` },
			'help.home.select.units': { link: `${HELP_URL}/graphingUnits.html` },
			'help.home.toggle.chart.link': { link: `${HELP_URL}/chartLink.html` },
			'help.groups.groupdetails': { link: `${HELP_URL}/groupDetails.html` },
			'help.groups.groupview': { link: `${HELP_URL}/groupViewing.html` },
			'help.maps.mapview': { link: `${HELP_URL}/mapGraphic.html` },
			'help.meters.meterview': { link: `${HELP_URL}/meterViewing.html` }
		};

		return (
			<div style={divStyle}>
				<ReactTooltip
					className='tip'
					id={`${this.props.page}`}
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
							<div style={{ width: '300px' }}>
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
}
