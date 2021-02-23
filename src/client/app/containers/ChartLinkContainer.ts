/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { State } from '../types/redux/state';

function mapStateToProps(state: State) {
	const chartType = state.graph.chartToRender;
	let linkText = `${window.location.href}graph?`;
	// let weeklyLink = ''; // reflects graph 7 days from present, with user selected meters and groups;
	if (state.graph.selectedMeters.length > 0) {
		linkText += `meterIDs=${state.graph.selectedMeters.toString()}&`;
	}
	if (state.graph.selectedGroups.length > 0) {
		linkText += `groupIDs=${state.graph.selectedGroups.toString()}&`;
	}
	linkText += `chartType=${state.graph.chartToRender}`;
	// weeklyLink = linkText + '&serverRange=7dfp'; // dfp: days from present;
	linkText += `&serverRange=${state.graph.timeInterval.toString()}`;
	switch (chartType) {
		case 'bar':
			linkText += `&barDuration=${state.graph.barDuration.asDays()}`;
			linkText += `&barStacking=${state.graph.barStacking}`;
			break;
		case 'line':
			linkText += `&serverRange=${state.graph.timeInterval.toString()}`;
			// under construction;
			const root: any = document.getElementById('root');
			// linkText += `&displayRange=${state.graph.timeInterval.toString().split('_')}`;
			break;
		case 'compare':
			linkText += `&comparePeriod=${state.graph.comparePeriod}`;
			linkText += `&compareSortingOrder=${state.graph.compareSortingOrder}`;
			break;
		default:
			break;
	}

	return {
		linkText,
		chartType
	};
}

export default connect(mapStateToProps)(ChartLinkComponent);
