/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { ChartTypes } from '../types/redux/graph';
import { RootState } from '../store';
import { selectChartToRender, selectGraphState } from '../reducers/graph';

/**
 * Passes the current redux state of the chart link text, and turns it into props for the React
 * component, which is what will be visible on the page. Makes it possible to access
 * your reducer state objects from within your React components.
 *
 * Returns the updated link text
 */
function mapStateToProps(state: RootState) {
	const current = selectGraphState(state)
	const chartType = selectChartToRender(state);
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
	if (current.selectedMeters.length > 0) {
		linkText += `meterIDs=${current.selectedMeters.toString()}&`;
	}
	if (current.selectedGroups.length > 0) {
		linkText += `groupIDs=${current.selectedGroups.toString()}&`;
	}
	linkText += `chartType=${current.chartToRender}`;
	// weeklyLink = linkText + '&serverRange=7dfp'; // dfp: days from present;
	linkText += `&serverRange=${current.queryTimeInterval.toString()}`;
	switch (chartType) {
		case ChartTypes.bar:
			linkText += `&barDuration=${current.barDuration.asDays()}`;
			linkText += `&barStacking=${current.barStacking}`;
			break;
		case ChartTypes.line:
			// no code for this case
			// under construction;
			// linkText += `&displayRange=${current.queryTimeInterval.toString().split('_')}`;
			break;
		case ChartTypes.compare:
			linkText += `&comparePeriod=${current.comparePeriod}`;
			linkText += `&compareSortingOrder=${current.compareSortingOrder}`;
			break;
		case ChartTypes.map:
			linkText += `&mapID=${state.maps.selectedMap.toString()}`;
			break;
		case ChartTypes.threeD:
			linkText += `&meterOrGroup=${current.threeD.meterOrGroup}`;
			linkText += `&meterOrGroupID=${current.threeD.meterOrGroupID}`;
			linkText += `&readingInterval=${current.threeD.readingInterval}`;
			break;
		default:
			break;
	}
	const unitID = current.selectedUnit;
	linkText += `&unitID=${unitID.toString()}`;
	linkText += `&rate=${current.lineGraphRate.label.toString()},${current.lineGraphRate.rate.toString()}`;
	linkText += `&areaUnit=${current.selectedAreaUnit}&areaNormalization=${current.areaNormalization}`;
	linkText += `&minMax=${current.showMinMax}`;
	return {
		linkText,
		chartType
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps)(ChartLinkComponent);
