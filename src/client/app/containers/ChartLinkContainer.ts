/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { State } from '../types/redux/state';


/* Passes the current redux state of the chart link text, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the updated link text */
function mapStateToProps(state: State) {
	const chartType = state.graph.chartToRender;
	// Determine the beginning of the URL to add arguments to.
	// This is the current URL.
	const winLocHref = window.location.href;
	// See if graph? is in URL. We add that when it comes in as a chartlink.
	// Want to remove so we can start without the current arguments.
	let startOfParams = winLocHref.indexOf('graph?');
	// It is -1 if not there. In that case use the full length string.
	startOfParams = startOfParams === -1 ? winLocHref.length : startOfParams;
	// Grab the start of URL to what was just determined.
	const baseURL = winLocHref.substring(0, startOfParams);
	// Add graph? since we want to route to graph and have a ? before any arguments.
	let linkText = `${baseURL}graph?`;
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
			// no code for this case
			// under construction;
			// linkText += `&displayRange=${state.graph.timeInterval.toString().split('_')}`;
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
	const unitID = state.graph.selectedUnit;
	linkText += `&unitID=${unitID.toString()}`;
	linkText += `&rate=${state.graph.lineGraphRate.label.toString()},${state.graph.lineGraphRate.rate.toString()}`;
	return {
		linkText,
		chartType
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps)(ChartLinkComponent);
