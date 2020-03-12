/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { State } from '../types/redux/state';
import { TimeInterval } from '../../../common/TimeInterval';
import moment = require('moment');
import DashboardComponent from 'components/DashboardComponent';

function mapStateToProps(state: State) {
	let linkText = `${window.location.href}graph?`;
	let weeklyLink = ''; //reflects graph 5 days from present, with user selected meters and groups;
	if (state.graph.selectedMeters.length > 0) {
		linkText += `meterIDs=${state.graph.selectedMeters.toString()}&`;
	}
	if (state.graph.selectedGroups.length > 0) {
		linkText += `groupIDs=${state.graph.selectedGroups.toString()}&`;
	}
	linkText += `chartType=${state.graph.chartToRender}`;
	switch (state.graph.chartToRender) {
		case 'bar':
			linkText += `&barDuration=${state.graph.barDuration.asDays()}`;
			linkText += `&barStacking=${state.graph.barStacking}`;
			break;
		case 'line':
			weeklyLink = linkText + `&serverRange=7dfp`; //dfp: days from present;
			linkText += `&serverRange=${state.graph.timeInterval.toString()}`;
			break;
		case 'compare':
			linkText += `&comparePeriod=${state.graph.comparePeriod}`;
			linkText += `&compareSortingOrder=${state.graph.compareSortingOrder}`;
			break;
		default:
			break;
	}

	return {
		linkText, weeklyLink,
	};
}

export default connect(mapStateToProps)(ChartLinkComponent);
