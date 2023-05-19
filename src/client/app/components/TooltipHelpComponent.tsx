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
export default class TooltipHelpComponent extends React.Component<TooltipHelpProps> {
	constructor(props: TooltipHelpProps) {
		super(props);
		this.props.fetchVersionIfNeeded();
	}

	/**
	 * @return JSX to create the help icons with links
	 */
	public render() {
		const divStyle = {
			display: 'inline-block'
		};

		const version = this.props.version

		// Normal/live URL for OED
		const BASE_URL = `https://openenergydashboard.github.io/help/${version}`;
		// Debug URL where need to put own GitHub ID before .github.io.
		// This works if you have a fork of the web pages and setup your GitHub
		// account to serve them up.
		// const BASE_URL = `https://xxx.github.io/OpenEnergyDashboard.github.io/help/${version}`;

		const helpLinks: Record<string, Record<string, string>> = {
			'help.admin.conversioncreate': { link: `${BASE_URL}/adminConversionCreating.html` },
			'help.admin.conversionedit': { link: `${BASE_URL}/adminConversionEditing.html` },
			'help.admin.conversionview': { link: `${BASE_URL}/adminConversionViewing.html` },
			'help.admin.groupcreate': { link: `${BASE_URL}/adminGroupCreating.html` },
			'help.admin.groupedit': { link: `${BASE_URL}/adminGroupEditing.html` },
			'help.admin.groupview': { link: `${BASE_URL}/adminGroupViewing.html` },
			'help.admin.header': { link: `${BASE_URL}/adminPreferences.html` },
			'help.admin.mapview': { link: `${BASE_URL}/adminMap.html` },
			'help.admin.metercreate': { link: `${BASE_URL}/adminMeterCreating.html` },
			'help.admin.meteredit': { link: `${BASE_URL}/adminMeterEditing.html` },
			'help.admin.meterview': { link: `${BASE_URL}/adminMeterViewing.html` },
			'help.admin.unitcreate': { link: `${BASE_URL}/adminUnitCreating.html` },
			'help.admin.unitedit': { link: `${BASE_URL}/adminUnitEditing.html` },
			'help.admin.unitview': { link: `${BASE_URL}/adminUnitViewing.html` },
			'help.admin.user': { link: `${BASE_URL}/adminUser.html` },
			'help.csv.header': { link: `${BASE_URL}/adminDataAcquisition.html` },
			'help.home.area.normalize': { link: `${BASE_URL}/areaNormalization.html` },
			'help.home.bar.custom.slider.tip': { link: `${BASE_URL}/barGraphic.html#usage` },
			'help.home.bar.interval.tip': { link: `${BASE_URL}/barGraphic.html#usage` },
			'help.home.bar.stacking.tip': { link: `${BASE_URL}/barGraphic.html#barStacking` },
			'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
			'help.home.chart.redraw.restore': { link: `${BASE_URL}/lineGraphic.html#redrawRestore` },
			'help.home.chart.select': { link: `${BASE_URL}/graphType.html` },
			'help.home.compare.interval.tip': { link: `${BASE_URL}/compareGraphic.html#usage` },
			'help.home.compare.sort.tip': { link: `${BASE_URL}/compareGraphic.html#usage` },
			'help.home.export.graph.data': { link: `${BASE_URL}/export.html` },
			'help.home.header': {
				link0: `${BASE_URL}/pageChoices.html`,
				link1: `${BASE_URL}/meterViewing.html`,
				link2: `${BASE_URL}/groupViewing.html`,
				link3: `${BASE_URL}/mapGraphic.html`,
				link4: `${BASE_URL}/admin.html`
			},
			'help.home.hide.or.show.options': { link: `${BASE_URL}/hideOptions.html` },
			'help.home.language': { link: `${BASE_URL}/language.html` },
			'help.home.map.interval.tip': { link: `${BASE_URL}/mapGraphic.html#usage` },
			'help.home.select.groups': { link: `${BASE_URL}/graphingGroups.html` },
			'help.home.select.maps': { link: `${BASE_URL}/mapGraphic.html` },
			'help.home.select.meters': { link: `${BASE_URL}/graphingMeters.html` },
			'help.home.select.units': { link: `${BASE_URL}/graphingUnits.html` },
			'help.home.toggle.chart.link': { link: `${BASE_URL}/chartLink.html` },
			'help.groups.groupdetails': { link: `${BASE_URL}/groupDetails.html` },
			'help.groups.groupview': { link: `${BASE_URL}/groupViewing.html` },
			'help.maps.mapview': { link: `${BASE_URL}/mapGraphic.html` },
			'help.meters.meterview': { link: `${BASE_URL}/meterViewing.html` }
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
