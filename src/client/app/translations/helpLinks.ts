/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const BASE_URL = 'https://openenergydashboard.org';

const links: Record<string, Record<string, string>> = {
	'help.home.chart.plotly.controls': { link: 'https://plotly.com/chart-studio-help/getting-to-know-the-plotly-modebar/' },
	'help.home.chart.redraw.restore': { link: `${BASE_URL}/help/graphing` },
	'help.home.chart.select': { link: `${BASE_URL}/help/graphs` },
	'help.home.export.graph.data': { link: `${BASE_URL}/help/general#export` },
	'help.home.header': {
		link0: `${BASE_URL}/help/metersAndGroups`,
		link1: `${BASE_URL}/help/admins`
	},
	'help.home.hide.or.show.options': { link: `${BASE_URL}/help/general#hideOptions` },
	'help.home.select.groups': { link: `${BASE_URL}/help/metersAndGroups` },
	'help.home.select.meters': { link: `${BASE_URL}/help/metersAndGroups` },
	'help.home.toggle.chart.link': { link: `${BASE_URL}/help/general#chartlink` }
};

export default links;
