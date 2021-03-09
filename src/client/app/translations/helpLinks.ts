/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Normal/live URL for OED
const BASE_URL = 'https://openenergydashboard.github.io';
// Debug URL where need to put own GitHub ID before .github.io.
// This works if you have a fork of the web pages and setup your GitHub
// account to serve them up.
//  const BASE_URL = 'https://xxx.github.io/OpenEnergyDashboard.github.io';

const links: Record<string, Record<string, string>> = {
	'help.admin.groupview': { link: `${BASE_URL}/help/adminGroupViewing.html`},
	'help.admin.header': { link: `${BASE_URL}/help/adminPreferences.html`},
	'help.admin.mapview': { link: `${BASE_URL}/help/adminMap.html`},
	'help.admin.meterview': { link: `${BASE_URL}/help/adminMeterViewing.html`},
	'help.home.bar.custom.slider.tip': { link: `${BASE_URL}/help/barGraphic.html#usage`},
	'help.home.bar.interval.tip': { link: `${BASE_URL}/help/barGraphic.html#usage`},
	'help.home.bar.stacking.tip': { link: `${BASE_URL}/help/barGraphic.html#barStacking`},
	'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
	'help.home.chart.redraw.restore': { link: `${BASE_URL}/help/lineGraphic.html#redrawRestore` },
	'help.home.chart.select': { link: `${BASE_URL}/help/graphType.html` },
	'help.home.compare.interval.tip': { link: `${BASE_URL}/help/compareGraphic.html#usage`},
	'help.home.compare.sort.tip': { link: `${BASE_URL}/help/compareGraphic.html#usage`},
	'help.home.export.graph.data': { link: `${BASE_URL}/help/export.html` },
	'help.home.header': {
		link0: `${BASE_URL}/help/pageChoices.html`,
		link1: `${BASE_URL}/help/meterViewing.html`,
		link2: `${BASE_URL}/help/groupViewing.html`,
		link3: `${BASE_URL}/help/mapGraphic.html`,
		link4: `${BASE_URL}/help/admin.html`
	},
	'help.home.hide.or.show.options': { link: `${BASE_URL}/help/hideOptions.html` },
	'help.home.select.groups': { link: `${BASE_URL}/help/graphingGroups.html` },
	'help.home.select.maps': { link: `${BASE_URL}/help/mapGraphic.html` },
	'help.home.select.meters': { link: `${BASE_URL}/help/graphingMeters.html` },
	'help.home.toggle.chart.link': { link: `${BASE_URL}/help/chartLink.html` },
	'help.groups.groupview': { link: `${BASE_URL}/help/groupViewing.html`},
	'help.maps.mapview': { link: `${BASE_URL}/help/mapGraphic.html`},
	'help.meters.meterview': { link: `${BASE_URL}/help/meterViewing.html`}
};

export default links;
