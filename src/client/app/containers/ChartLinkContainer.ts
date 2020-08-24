/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { State } from '../types/redux/state';

function mapStateToProps(state: State) {
	let linkText = `${window.location.href}graph?`;
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
		case 'compare':
			linkText += `&comparePeriod=${state.graph.comparePeriod}`;
			linkText += `&compareSortingOrder=${state.graph.compareSortingOrder}`;
			break;
		case 'map':
			linkText += `&mapID=${state.maps.selectedMap.toString()}`;
			break;
		default:
			break;
	}

	return {
		linkText
	};
}

export default connect(mapStateToProps)(ChartLinkComponent);
